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

type CommissionSvcIface interface {
	Calculate(ctx context.Context, order *domain.Order) error
	CheckAndUpgradeTier(ctx context.Context, partnerID uuid.UUID) error
}

type TrackingService struct {
	trackingRepo repository.TrackingRepoIface
	partnerRepo  repository.PartnerRepoIface
	eventRepo    repository.EventRepoIface
	promoRepo    repository.PromoRepoIface
	commSvc      CommissionSvcIface
	cfg          *config.TrackingConfig
}

func NewTrackingService(
	tr repository.TrackingRepoIface,
	pr repository.PartnerRepoIface,
	er repository.EventRepoIface,
	pr2 repository.PromoRepoIface,
	cs CommissionSvcIface,
	cfg *config.TrackingConfig,
) *TrackingService {
	return &TrackingService{
		trackingRepo: tr,
		partnerRepo:  pr,
		eventRepo:    er,
		promoRepo:    pr2,
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

	trackingURL := fmt.Sprintf("%s/track/%s", s.cfg.TrackingBaseURL, clickID)

	return &GeneratedLink{
		ClickID:     clickID,
		TrackingURL: trackingURL,
		DestURL:     destURL,
		QRCodeURL:   fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=%s", url.QueryEscape(trackingURL)),
	}, nil
}

func (s *TrackingService) RecordClick(ctx context.Context, clickID, ip, userAgent, referrer string) (destURL string, cookieExpires time.Time, err error) {
	click, lookupErr := s.trackingRepo.GetClickByID(ctx, clickID)
	if lookupErr != nil {
		return s.cfg.BaseRedirectURL, time.Now().AddDate(0, 0, s.cfg.CookieWindowDays), nil
	}

	destURL = s.cfg.BaseRedirectURL
	if click.EventID != nil {
		event, evErr := s.eventRepo.GetByID(ctx, *click.EventID)
		if evErr == nil {
			destURL = event.BaseURL
		}
	}

	// Append click_id as fallback for cookieless tracking
	if parsed, parseErr := url.Parse(destURL); parseErr == nil {
		q := parsed.Query()
		q.Set("tap_click", clickID)
		parsed.RawQuery = q.Encode()
		destURL = parsed.String()
	}

	return destURL, click.CookieExpires, nil
}

// OrderWebhookInput represents the webhook payload from Ticketon core
type OrderWebhookInput struct {
	ExternalOrderID string  `json:"order_id"`
	ClickID         *string `json:"click_id,omitempty"`
	PromoCode       *string `json:"promo_code,omitempty"`
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

	// Attribution: resolve click_id first, then fall back to promo code
	if input.ClickID != nil && *input.ClickID != "" {
		click, err := s.trackingRepo.GetActiveClickForPartner(ctx, *input.ClickID)
		if err == nil {
			partnerID = &click.PartnerID
			eventID = click.EventID
		}
	}
	if partnerID == nil && input.PromoCode != nil && *input.PromoCode != "" {
		promo, err := s.promoRepo.GetByCode(ctx, *input.PromoCode)
		if err == nil {
			partnerID = &promo.PartnerID
			if promo.EventID != nil {
				eventID = promo.EventID
			}
			_ = s.promoRepo.IncrementUses(ctx, *input.PromoCode)
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

	// Calculate commission and check tier upgrade if attributed
	if partnerID != nil && status == domain.OrderCompleted {
		if err := s.commSvc.Calculate(ctx, order); err != nil {
			return err
		}
		// Non-blocking: tier upgrade failure doesn't block order processing
		_ = s.commSvc.CheckAndUpgradeTier(ctx, *partnerID)
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
