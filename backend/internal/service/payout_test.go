package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/config"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/repository"
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

func TestRequestPayout_ExactMinThreshold_Allowed(t *testing.T) {
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
		AvailableAmount: 5000.0,
	}

	svc := service.NewPayoutService(payoutRepo, partnerRepo, commRepo, newPayoutCfg())

	_, err := svc.RequestPayout(context.Background(), service.RequestPayoutInput{
		PartnerID: partnerID,
		Amount:    5000.0, // exactly at threshold
	})
	if err != nil {
		t.Errorf("exact min threshold should be allowed, got: %v", err)
	}
}

func TestRequestPayout_ZeroAmount_BelowThreshold(t *testing.T) {
	partnerID := uuid.New()
	svc := service.NewPayoutService(
		&testutil.MockPayoutRepo{},
		testutil.NewMockPartnerRepo(),
		testutil.NewMockCommissionRepo(),
		newPayoutCfg(),
	)

	_, err := svc.RequestPayout(context.Background(), service.RequestPayoutInput{
		PartnerID: partnerID,
		Amount:    0,
	})
	if err != domain.ErrBelowMinThreshold {
		t.Errorf("expected ErrBelowMinThreshold for zero amount, got %v", err)
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

func TestRequestPayout_RepoCreateError_Propagates(t *testing.T) {
	partnerID := uuid.New()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo := testutil.NewMockCommissionRepo()
	payoutRepo := &testutil.MockPayoutRepo{CreateErr: domain.ErrNotFound}

	verifiedAt := time.Now()
	partnerRepo.KYCs[partnerID] = &domain.PartnerKYC{
		PartnerID:  partnerID,
		Status:     "verified",
		VerifiedAt: &verifiedAt,
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
	if err == nil {
		t.Error("expected error from payout repo Create, got nil")
	}
}

func TestGetPartnerBalance_FlushError(t *testing.T) {
	partnerID := uuid.New()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo := testutil.NewMockCommissionRepo()
	payoutRepo := &testutil.MockPayoutRepo{}

	commRepo.FlushErr = domain.ErrNotFound // simulate flush failure

	svc := service.NewPayoutService(payoutRepo, partnerRepo, commRepo, newPayoutCfg())

	_, err := svc.GetPartnerBalance(context.Background(), partnerID)
	if err == nil {
		t.Error("GetPartnerBalance should propagate FlushToBalance error")
	}
}

func TestGetPartnerBalance_Success(t *testing.T) {
	partnerID := uuid.New()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo := testutil.NewMockCommissionRepo()
	payoutRepo := &testutil.MockPayoutRepo{}

	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{
		PartnerID:       partnerID,
		AvailableAmount: 7500.0,
		PendingAmount:   500.0,
	}

	svc := service.NewPayoutService(payoutRepo, partnerRepo, commRepo, newPayoutCfg())

	balance, err := svc.GetPartnerBalance(context.Background(), partnerID)
	if err != nil {
		t.Fatalf("GetPartnerBalance error: %v", err)
	}
	if balance.AvailableAmount != 7500.0 {
		t.Errorf("AvailableAmount = %.2f, want 7500", balance.AvailableAmount)
	}
	if balance.PendingAmount != 500.0 {
		t.Errorf("PendingAmount = %.2f, want 500", balance.PendingAmount)
	}
}

func TestGetPartnerPayouts_ReturnsPaged(t *testing.T) {
	partnerID := uuid.New()
	payoutRepo := &testutil.MockPayoutRepo{}
	payoutRepo.Payouts = []*domain.Payout{
		{ID: uuid.New(), PartnerID: partnerID, Amount: 5000, Status: domain.PayoutRequested},
		{ID: uuid.New(), PartnerID: partnerID, Amount: 6000, Status: domain.PayoutPaid},
	}

	svc := service.NewPayoutService(payoutRepo, testutil.NewMockPartnerRepo(), testutil.NewMockCommissionRepo(), newPayoutCfg())
	payouts, total, err := svc.GetPartnerPayouts(context.Background(), partnerID, 1, 10)
	if err != nil {
		t.Fatalf("GetPartnerPayouts error: %v", err)
	}
	if total != 2 {
		t.Errorf("total = %d, want 2", total)
	}
	if len(payouts) != 2 {
		t.Errorf("len(payouts) = %d, want 2", len(payouts))
	}
}

func TestGetPartnerPayouts_EmptyResult(t *testing.T) {
	partnerID := uuid.New()
	payoutRepo := &testutil.MockPayoutRepo{}

	svc := service.NewPayoutService(payoutRepo, testutil.NewMockPartnerRepo(), testutil.NewMockCommissionRepo(), newPayoutCfg())
	payouts, total, err := svc.GetPartnerPayouts(context.Background(), partnerID, 1, 10)
	if err != nil {
		t.Fatalf("GetPartnerPayouts error: %v", err)
	}
	if total != 0 {
		t.Errorf("expected 0 total for empty repo, got %d", total)
	}
	if len(payouts) != 0 {
		t.Errorf("expected 0 payouts, got %d", len(payouts))
	}
}

func TestListAll_ReturnsAll(t *testing.T) {
	payoutRepo := &testutil.MockPayoutRepo{}
	payoutRepo.Payouts = []*domain.Payout{
		{ID: uuid.New(), PartnerID: uuid.New(), Amount: 5000},
		{ID: uuid.New(), PartnerID: uuid.New(), Amount: 8000},
		{ID: uuid.New(), PartnerID: uuid.New(), Amount: 12000},
	}

	svc := service.NewPayoutService(payoutRepo, testutil.NewMockPartnerRepo(), testutil.NewMockCommissionRepo(), newPayoutCfg())
	payouts, total, err := svc.ListAll(context.Background(), repository.PayoutFilter{})
	if err != nil {
		t.Fatalf("ListAll error: %v", err)
	}
	if total != 3 {
		t.Errorf("total = %d, want 3", total)
	}
	if len(payouts) != 3 {
		t.Errorf("len(payouts) = %d, want 3", len(payouts))
	}
}

func TestUpdateStatus_Success(t *testing.T) {
	payoutRepo := &testutil.MockPayoutRepo{}
	payoutID := uuid.New()
	payoutRepo.Payouts = []*domain.Payout{
		{ID: payoutID, Status: domain.PayoutRequested},
	}

	svc := service.NewPayoutService(payoutRepo, testutil.NewMockPartnerRepo(), testutil.NewMockCommissionRepo(), newPayoutCfg())
	err := svc.UpdateStatus(context.Background(), payoutID, domain.PayoutPaid, nil)
	if err != nil {
		t.Fatalf("UpdateStatus error: %v", err)
	}
	if payoutRepo.Payouts[0].Status != domain.PayoutPaid {
		t.Errorf("status = %s, want paid", payoutRepo.Payouts[0].Status)
	}
}

func TestUpdateStatus_NotFound(t *testing.T) {
	payoutRepo := &testutil.MockPayoutRepo{}
	svc := service.NewPayoutService(payoutRepo, testutil.NewMockPartnerRepo(), testutil.NewMockCommissionRepo(), newPayoutCfg())

	err := svc.UpdateStatus(context.Background(), uuid.New(), domain.PayoutPaid, nil)
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound for non-existent payout, got %v", err)
	}
}

func TestExportPending_ReturnsEmpty(t *testing.T) {
	payoutRepo := &testutil.MockPayoutRepo{}
	svc := service.NewPayoutService(payoutRepo, testutil.NewMockPartnerRepo(), testutil.NewMockCommissionRepo(), newPayoutCfg())

	rows, err := svc.ExportPending(context.Background())
	if err != nil {
		t.Fatalf("ExportPending error: %v", err)
	}
	if rows != nil && len(rows) != 0 {
		t.Errorf("expected empty export, got %d rows", len(rows))
	}
}
