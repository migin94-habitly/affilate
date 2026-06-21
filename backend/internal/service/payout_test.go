package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/config"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/service"
	"github.com/ticketon/tap/internal/testutil"
)

func newPayoutCfg() *config.PayoutConfig {
	return &config.PayoutConfig{
		MinThreshold: 5000.0,
		Currency:     "KZT",
	}
}

func TestRequestPayout_Success(t *testing.T) {
	partnerID := uuid.New()

	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo := testutil.NewMockCommissionRepo()
	payoutRepo := &testutil.MockPayoutRepo{}

	// Partner with verified KYC and sufficient balance
	verifiedAt := time.Now()
	partnerRepo.KYCs[partnerID] = &domain.PartnerKYC{
		ID:                uuid.New(),
		PartnerID:         partnerID,
		FreedomPayAccount: "FP-12345",
		Status:            "verified",
		VerifiedAt:        &verifiedAt,
	}
	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{
		PartnerID:       partnerID,
		AvailableAmount: 10000.0,
	}

	svc := service.NewPayoutService(payoutRepo, partnerRepo, commRepo, newPayoutCfg())

	payout, err := svc.RequestPayout(context.Background(), service.RequestPayoutInput{
		PartnerID: partnerID,
		Amount:    6000.0,
	})
	if err != nil {
		t.Fatalf("RequestPayout error: %v", err)
	}
	if payout.Amount != 6000.0 {
		t.Errorf("payout amount = %.2f, want 6000", payout.Amount)
	}
	if payout.Status != domain.PayoutRequested {
		t.Errorf("payout status = %s, want requested", payout.Status)
	}
	if payout.Currency != "KZT" {
		t.Errorf("payout currency = %s, want KZT", payout.Currency)
	}
	if payout.FreedomPayAccount != "FP-12345" {
		t.Errorf("payout account = %s, want FP-12345", payout.FreedomPayAccount)
	}
}

func TestRequestPayout_BelowMinThreshold(t *testing.T) {
	partnerID := uuid.New()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo := testutil.NewMockCommissionRepo()
	payoutRepo := &testutil.MockPayoutRepo{}

	svc := service.NewPayoutService(payoutRepo, partnerRepo, commRepo, newPayoutCfg())

	_, err := svc.RequestPayout(context.Background(), service.RequestPayoutInput{
		PartnerID: partnerID,
		Amount:    100.0, // below 5000 threshold
	})
	if err != domain.ErrBelowMinThreshold {
		t.Errorf("expected ErrBelowMinThreshold, got %v", err)
	}
}

func TestRequestPayout_InsufficientBalance(t *testing.T) {
	partnerID := uuid.New()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo := testutil.NewMockCommissionRepo()
	payoutRepo := &testutil.MockPayoutRepo{}

	verifiedAt := time.Now()
	partnerRepo.KYCs[partnerID] = &domain.PartnerKYC{
		PartnerID:  partnerID,
		Status:     "verified",
		VerifiedAt: &verifiedAt,
	}
	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{
		PartnerID:       partnerID,
		AvailableAmount: 3000.0, // less than requested
	}

	svc := service.NewPayoutService(payoutRepo, partnerRepo, commRepo, newPayoutCfg())

	_, err := svc.RequestPayout(context.Background(), service.RequestPayoutInput{
		PartnerID: partnerID,
		Amount:    5000.0,
	})
	if err != domain.ErrInsufficientBalance {
		t.Errorf("expected ErrInsufficientBalance, got %v", err)
	}
}

func TestRequestPayout_KYCNotVerified(t *testing.T) {
	partnerID := uuid.New()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo := testutil.NewMockCommissionRepo()
	payoutRepo := &testutil.MockPayoutRepo{}

	// KYC pending (not verified)
	partnerRepo.KYCs[partnerID] = &domain.PartnerKYC{
		PartnerID: partnerID,
		Status:    "pending",
	}
	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{
		PartnerID:       partnerID,
		AvailableAmount: 10000.0,
	}

	svc := service.NewPayoutService(payoutRepo, partnerRepo, commRepo, newPayoutCfg())

	_, err := svc.RequestPayout(context.Background(), service.RequestPayoutInput{
		PartnerID: partnerID,
		Amount:    5000.0,
	})
	if err != domain.ErrKYCNotVerified {
		t.Errorf("expected ErrKYCNotVerified, got %v", err)
	}
}

func TestRequestPayout_NoKYC(t *testing.T) {
	partnerID := uuid.New()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo := testutil.NewMockCommissionRepo()
	payoutRepo := &testutil.MockPayoutRepo{}

	// No KYC record at all
	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{
		PartnerID:       partnerID,
		AvailableAmount: 10000.0,
	}

	svc := service.NewPayoutService(payoutRepo, partnerRepo, commRepo, newPayoutCfg())

	_, err := svc.RequestPayout(context.Background(), service.RequestPayoutInput{
		PartnerID: partnerID,
		Amount:    5000.0,
	})
	if err != domain.ErrKYCNotVerified {
		t.Errorf("expected ErrKYCNotVerified for missing KYC, got %v", err)
	}
}
