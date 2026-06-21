package service_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/config"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/service"
	"github.com/ticketon/tap/internal/testutil"
)

func newTrackingCfg() *config.TrackingConfig {
	return &config.TrackingConfig{
		CookieWindowDays: 30,
		BaseRedirectURL:  "https://ticketon.kz",
		TrackingBaseURL:  "http://tap.ticketon.kz",
	}
}

func newTrackingSvc(
	trackRepo *testutil.MockTrackingRepo,
	partnerRepo *testutil.MockPartnerRepo,
	eventRepo *testutil.MockEventRepo,
	promoRepo *testutil.MockPromoRepo,
	commSvc *testutil.MockCommissionSvc,
) *service.TrackingService {
	return service.NewTrackingService(
		trackRepo, partnerRepo, eventRepo, promoRepo, commSvc, newTrackingCfg(),
	)
}

func TestGenerateLink_NoEvent(t *testing.T) {
	partnerID := uuid.New()
	trackRepo := testutil.NewMockTrackingRepo()
	svc := newTrackingSvc(
		trackRepo,
		testutil.NewMockPartnerRepo(),
		testutil.NewMockEventRepo(),
		testutil.NewMockPromoRepo(),
		&testutil.MockCommissionSvc{},
	)

	result, err := svc.GenerateLink(context.Background(), service.GenerateLinkInput{
		PartnerID: partnerID,
		Channel:   "telegram",
	})
	if err != nil {
		t.Fatalf("GenerateLink error: %v", err)
	}
	if result.ClickID == "" {
		t.Error("ClickID should not be empty")
	}
	if !strings.HasPrefix(result.TrackingURL, "http://tap.ticketon.kz/track/") {
		t.Errorf("TrackingURL = %s, expected prefix http://tap.ticketon.kz/track/", result.TrackingURL)
	}
	if result.DestURL != "https://ticketon.kz" {
		t.Errorf("DestURL = %s, want base redirect URL", result.DestURL)
	}
	if result.QRCodeURL == "" {
		t.Error("QRCodeURL should not be empty")
	}
	if _, ok := trackRepo.Clicks[result.ClickID]; !ok {
		t.Error("click should be saved in repo")
	}
}

func TestGenerateLink_WithEvent(t *testing.T) {
	partnerID := uuid.New()
	eventID := uuid.New()

	eventRepo := testutil.NewMockEventRepo()
	eventRepo.Events[eventID] = &domain.Event{
		ID:      eventID,
		BaseURL: "https://ticketon.kz/event/rock-concert",
	}

	trackRepo := testutil.NewMockTrackingRepo()
	svc := newTrackingSvc(
		trackRepo,
		testutil.NewMockPartnerRepo(),
		eventRepo,
		testutil.NewMockPromoRepo(),
		&testutil.MockCommissionSvc{},
	)

	result, err := svc.GenerateLink(context.Background(), service.GenerateLinkInput{
		PartnerID: partnerID,
		EventID:   &eventID,
		Channel:   "instagram",
	})
	if err != nil {
		t.Fatalf("GenerateLink with event error: %v", err)
	}
	if result.DestURL != "https://ticketon.kz/event/rock-concert" {
		t.Errorf("DestURL = %s, want event URL", result.DestURL)
	}
}

func TestGenerateLink_DefaultChannelWeb(t *testing.T) {
	partnerID := uuid.New()
	trackRepo := testutil.NewMockTrackingRepo()
	svc := newTrackingSvc(
		trackRepo,
		testutil.NewMockPartnerRepo(),
		testutil.NewMockEventRepo(),
		testutil.NewMockPromoRepo(),
		&testutil.MockCommissionSvc{},
	)

	result, err := svc.GenerateLink(context.Background(), service.GenerateLinkInput{
		PartnerID: partnerID,
		Channel:   "", // empty = default to "web"
	})
	if err != nil {
		t.Fatalf("GenerateLink error: %v", err)
	}
	saved := trackRepo.Clicks[result.ClickID]
	if saved.Channel != "web" {
		t.Errorf("default channel = %s, want web", saved.Channel)
	}
}

func TestProcessOrderWebhook_WrongSecret(t *testing.T) {
	svc := newTrackingSvc(
		testutil.NewMockTrackingRepo(),
		testutil.NewMockPartnerRepo(),
		testutil.NewMockEventRepo(),
		testutil.NewMockPromoRepo(),
		&testutil.MockCommissionSvc{},
	)

	err := svc.ProcessOrderWebhook(context.Background(), service.OrderWebhookInput{
		ExternalOrderID: "order-1",
		TotalAmount:     1000.0,
		Currency:        "KZT",
		Status:          "completed",
		WebhookSecret:   "wrong-secret",
	}, "correct-secret")
	if err != domain.ErrUnauthorized {
		t.Errorf("expected ErrUnauthorized for wrong secret, got %v", err)
	}
}

func TestProcessOrderWebhook_Idempotent(t *testing.T) {
	trackRepo := testutil.NewMockTrackingRepo()
	commSvc := &testutil.MockCommissionSvc{}
	svc := newTrackingSvc(
		trackRepo,
		testutil.NewMockPartnerRepo(),
		testutil.NewMockEventRepo(),
		testutil.NewMockPromoRepo(),
		commSvc,
	)

	input := service.OrderWebhookInput{
		ExternalOrderID: "order-idempotent",
		TotalAmount:     5000.0,
		Currency:        "KZT",
		Status:          "completed",
		WebhookSecret:   "secret",
	}

	// Process first time
	if err := svc.ProcessOrderWebhook(context.Background(), input, "secret"); err != nil {
		t.Fatalf("first webhook error: %v", err)
	}
	// Process second time with same order ID
	if err := svc.ProcessOrderWebhook(context.Background(), input, "secret"); err != nil {
		t.Fatalf("second (duplicate) webhook should succeed: %v", err)
	}

	// Only one order should be stored
	if len(trackRepo.Orders) != 1 {
		t.Errorf("expected 1 order, got %d (idempotency broken)", len(trackRepo.Orders))
	}
}

func TestProcessOrderWebhook_AttributionViaClickID(t *testing.T) {
	partnerID := uuid.New()
	clickID := "abc12345-xyz98765"

	trackRepo := testutil.NewMockTrackingRepo()
	trackRepo.Clicks[clickID] = &domain.TrackingClick{
		ID:            uuid.New(),
		ClickID:       clickID,
		PartnerID:     partnerID,
		CookieExpires: time.Now().Add(30 * 24 * time.Hour),
	}

	commSvc := &testutil.MockCommissionSvc{}
	svc := newTrackingSvc(
		trackRepo,
		testutil.NewMockPartnerRepo(),
		testutil.NewMockEventRepo(),
		testutil.NewMockPromoRepo(),
		commSvc,
	)

	if err := svc.ProcessOrderWebhook(context.Background(), service.OrderWebhookInput{
		ExternalOrderID: "order-click",
		ClickID:         &clickID,
		TotalAmount:     8000.0,
		Currency:        "KZT",
		Status:          "completed",
		WebhookSecret:   "secret",
	}, "secret"); err != nil {
		t.Fatalf("webhook error: %v", err)
	}

	// Commission should have been calculated
	if len(commSvc.CalledCalculate) != 1 {
		t.Errorf("expected Calculate called once, called %d times", len(commSvc.CalledCalculate))
	}
	if *commSvc.CalledCalculate[0].PartnerID != partnerID {
		t.Error("commission calculated for wrong partner")
	}
}

func TestProcessOrderWebhook_AttributionViaPromoCode(t *testing.T) {
	partnerID := uuid.New()

	promoRepo := testutil.NewMockPromoRepo()
	promoRepo.Codes["PROMO10"] = &domain.PromoCode{
		ID:        uuid.New(),
		Code:      "PROMO10",
		PartnerID: partnerID,
		IsActive:  true,
	}

	commSvc := &testutil.MockCommissionSvc{}
	svc := newTrackingSvc(
		testutil.NewMockTrackingRepo(),
		testutil.NewMockPartnerRepo(),
		testutil.NewMockEventRepo(),
		promoRepo,
		commSvc,
	)

	promoCode := "PROMO10"
	if err := svc.ProcessOrderWebhook(context.Background(), service.OrderWebhookInput{
		ExternalOrderID: "order-promo",
		PromoCode:       &promoCode,
		TotalAmount:     6000.0,
		Currency:        "KZT",
		Status:          "completed",
		WebhookSecret:   "secret",
	}, "secret"); err != nil {
		t.Fatalf("webhook error: %v", err)
	}

	if len(commSvc.CalledCalculate) != 1 {
		t.Errorf("expected commission calculated, got %d calls", len(commSvc.CalledCalculate))
	}

	// Promo uses count should be incremented
	if promoRepo.Codes["PROMO10"].UsesCount != 1 {
		t.Errorf("promo uses count = %d, want 1", promoRepo.Codes["PROMO10"].UsesCount)
	}
}

func TestProcessOrderWebhook_RefundedOrder_NoCommission(t *testing.T) {
	partnerID := uuid.New()
	clickID := "click-refund"

	trackRepo := testutil.NewMockTrackingRepo()
	trackRepo.Clicks[clickID] = &domain.TrackingClick{
		ClickID:       clickID,
		PartnerID:     partnerID,
		CookieExpires: time.Now().Add(30 * 24 * time.Hour),
	}

	commSvc := &testutil.MockCommissionSvc{}
	svc := newTrackingSvc(
		trackRepo,
		testutil.NewMockPartnerRepo(),
		testutil.NewMockEventRepo(),
		testutil.NewMockPromoRepo(),
		commSvc,
	)

	if err := svc.ProcessOrderWebhook(context.Background(), service.OrderWebhookInput{
		ExternalOrderID: "order-refunded",
		ClickID:         &clickID,
		TotalAmount:     9000.0,
		Status:          "refunded", // refunded — no commission
		WebhookSecret:   "secret",
	}, "secret"); err != nil {
		t.Fatalf("webhook error: %v", err)
	}

	if len(commSvc.CalledCalculate) != 0 {
		t.Error("commission should not be calculated for refunded orders")
	}
}

func TestRecordClick_AppendsClickParam(t *testing.T) {
	clickID := "test-click-123"
	trackRepo := testutil.NewMockTrackingRepo()
	trackRepo.Clicks[clickID] = &domain.TrackingClick{
		ClickID:       clickID,
		CookieExpires: time.Now().Add(24 * time.Hour),
	}

	svc := newTrackingSvc(
		trackRepo,
		testutil.NewMockPartnerRepo(),
		testutil.NewMockEventRepo(),
		testutil.NewMockPromoRepo(),
		&testutil.MockCommissionSvc{},
	)

	destURL, err := svc.RecordClick(context.Background(), clickID, "1.2.3.4", "Mozilla", "")
	if err != nil {
		t.Fatalf("RecordClick error: %v", err)
	}

	if !strings.Contains(destURL, "tap_click="+clickID) {
		t.Errorf("dest URL %q should contain tap_click param", destURL)
	}
}

func TestRecordClick_UnknownClickID_ReturnsBase(t *testing.T) {
	svc := newTrackingSvc(
		testutil.NewMockTrackingRepo(),
		testutil.NewMockPartnerRepo(),
		testutil.NewMockEventRepo(),
		testutil.NewMockPromoRepo(),
		&testutil.MockCommissionSvc{},
	)

	destURL, err := svc.RecordClick(context.Background(), "unknown-click", "", "", "")
	if err != nil {
		t.Fatalf("RecordClick with unknown clickID error: %v", err)
	}
	if destURL != "https://ticketon.kz" {
		t.Errorf("expected base URL for unknown click, got %s", destURL)
	}
}
