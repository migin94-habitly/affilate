package service

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/config"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/repository"
)

type TrackingService struct {
	trackingRepo *repository.TrackingRepo
	partnerRepo  *repository.PartnerRepo
	eventRepo    *repository.EventRepo
	commSvc      *CommissionService
	cfg          *config.TrackingConfig
}

func NewTrackingService(
	tr *repository.TrackingRepo,
	pr *repository.PartnerRepo,
	er *repository.EventRepo,
	cs *CommissionService,
	cfg *config.TrackingConfig,
) *TrackingService {
	return &TrackingService{
		trackingRepo: tr,
		partnerRepo:  pr,
		eventRepo:    er,
		commSvc:      cs,
		cfg:          cfg,
	}
}

type GenerateLinkInput struct {
	PartnerID uuid.UUID
	EventID   *uuid.UUID
	Channel   string
}

type GeneratedLink struct {
	ClickID      string `json:"click_id"`
	TrackingURL  string `json:"tracking_url"`
	DestURL      string `json:"destination_url"`
	QRCodeURL    string `json:"qr_code_url"`
}

func (s *TrackingService) GenerateLink(ctx context.Context, input GenerateLinkInput) (*GeneratedLink, error) {
	clickID := fmt.Sprintf("%s-%s", input.PartnerID.String()[:8], uuid.New().String()[:8])

	var destURL string
	var eventID *uuid.UUID

	if input.EventID != nil {
		event, err := s.eventRepo.GetByID(ctx, *input.EventID)
		if err != nil {
			return nil, err
		}
		destURL = event.BaseURL
		eventID = input.EventID
	} else {
		destURL = s.cfg.BaseRedirectURL
	}

	channel := input.Channel
	if channel == "" {
		channel = "web"
	}

	click := &domain.TrackingClick{
		ID:            uuid.New(),
		ClickID:       clickID,
		PartnerID:     input.PartnerID,
		EventID:       eventID,
		Channel:       channel,
		CookieExpires: time.Now().AddDate(0, 0, s.cfg.CookieWindowDays),
	}

	if err := s.trackingRepo.SaveClick(ctx, click); err != nil {
		return nil, err
	}

	trackingURL := fmt.Sprintf("/track/%s", clickID)

	return &GeneratedLink{
		ClickID:     clickID,
		TrackingURL: trackingURL,
		DestURL:     destURL,
		QRCodeURL:   fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=%s", url.QueryEscape(trackingURL)),
	}, nil
}

func (s *TrackingService) RecordClick(ctx context.Context, clickID, ip, userAgent, referrer string) (string, error) {
	click, err := s.trackingRepo.GetClickByID(ctx, clickID)
	if err != nil {
		return s.cfg.BaseRedirectURL, nil
	}

	destURL := s.cfg.BaseRedirectURL
	if click.EventID != nil {
		event, err := s.eventRepo.GetByID(ctx, *click.EventID)
		if err == nil {
			destURL = event.BaseURL
		}
	}

	// Append click_id as fallback for cookieless tracking
	if parsed, err := url.Parse(destURL); err == nil {
		q := parsed.Query()
		q.Set("tap_click", clickID)
		parsed.RawQuery = q.Encode()
		destURL = parsed.String()
	}

	return destURL, nil
}

// OrderWebhookInput represents the webhook payload from Ticketon core
type OrderWebhookInput struct {
	ExternalOrderID string  `json:"order_id"`
	ClickID         *string `json:"click_id,omitempty"`
	EventExternalID string  `json:"event_id"`
	BuyerEmail      string  `json:"buyer_email"`
	IsNewBuyer      bool    `json:"is_new_buyer"`
	TotalAmount     float64 `json:"total_amount"`
	ServiceFee      float64 `json:"service_fee"`
	Currency        string  `json:"currency"`
	Status          string  `json:"status"`
	WebhookSecret   string  `json:"secret"`
}

func (s *TrackingService) ProcessOrderWebhook(ctx context.Context, input OrderWebhookInput, expectedSecret string) error {
	if input.WebhookSecret != expectedSecret {
		return domain.ErrUnauthorized
	}

	// Idempotency check
	existing, _ := s.trackingRepo.GetOrderByExternalID(ctx, input.ExternalOrderID)
	if existing != nil {
		return nil
	}

	var partnerID *uuid.UUID
	var eventID *uuid.UUID

	// Attribution: resolve click_id within cookie window
	if input.ClickID != nil && *input.ClickID != "" {
		click, err := s.trackingRepo.GetActiveClickForPartner(ctx, *input.ClickID)
		if err == nil {
			partnerID = &click.PartnerID
			eventID = click.EventID
		}
	}

	status := domain.OrderStatus(input.Status)
	if status == "" {
		status = domain.OrderCompleted
	}

	order := &domain.Order{
		ID:              uuid.New(),
		ExternalOrderID: input.ExternalOrderID,
		ClickID:         input.ClickID,
		PartnerID:       partnerID,
		EventID:         eventID,
		BuyerEmail:      input.BuyerEmail,
		IsNewBuyer:      input.IsNewBuyer,
		TotalAmount:     input.TotalAmount,
		ServiceFee:      input.ServiceFee,
		Currency:        input.Currency,
		Status:          status,
	}

	if err := s.trackingRepo.SaveOrder(ctx, order); err != nil {
		return err
	}

	// Calculate commission if attributed
	if partnerID != nil && status == domain.OrderCompleted {
		if err := s.commSvc.Calculate(ctx, order); err != nil {
			return err
		}
	}

	return nil
}

func (s *TrackingService) GetStats(ctx context.Context, partnerID uuid.UUID, period string) (*domain.PartnerStats, error) {
	stats, err := s.trackingRepo.GetPartnerStats(ctx, partnerID, period)
	if err != nil {
		return nil, err
	}

	balance, _ := s.partnerRepo.GetBalance(ctx, partnerID)
	if balance != nil {
		stats.PendingAmount = balance.PendingAmount
		stats.AvailableAmount = balance.AvailableAmount
	}

	return stats, nil
}

func (s *TrackingService) GetClickTimeSeries(ctx context.Context, partnerID uuid.UUID, days int) ([]domain.ClickDataPoint, error) {
	rows, err := s.trackingRepo.GetClickStats(ctx, partnerID, days)
	if err != nil {
		return nil, err
	}
	var result []domain.ClickDataPoint
	for _, r := range rows {
		result = append(result, domain.ClickDataPoint{
			Date:   r.Date.Format("2006-01-02"),
			Clicks: r.Clicks,
			Orders: r.Orders,
		})
	}
	return result, nil
}
