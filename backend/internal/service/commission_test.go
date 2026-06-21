package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/service"
	"github.com/ticketon/tap/internal/testutil"
)

func bronzeTariff() *domain.Tariff {
	return &domain.Tariff{
		ID:                 uuid.New(),
		Tier:               domain.TierBronze,
		GmvRate:            5.0,
		BaseRate:           50.0,
		MinOrdersForSilver: 10,
		CPABonus:           500.0,
		UpdatedAt:          time.Now(),
	}
}

func TestCalculate_BasicCommission(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	partner := &domain.Partner{
		ID:     partnerID,
		Email:  "test@example.com",
		Tier:   domain.TierBronze,
		Status: domain.StatusActive,
	}
	partnerRepo.Partners[partnerID] = partner
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff()
	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{PartnerID: partnerID}

	svc := service.NewCommissionService(commRepo, partnerRepo)

	orderID := uuid.New()
	order := &domain.Order{
		ID:          orderID,
		PartnerID:   &partnerID,
		TotalAmount: 10000.0,
		IsNewBuyer:  false,
		Status:      domain.OrderCompleted,
	}

	if err := svc.Calculate(context.Background(), order); err != nil {
		t.Fatalf("Calculate returned error: %v", err)
	}

	if len(commRepo.Commissions) != 1 {
		t.Fatalf("expected 1 commission, got %d", len(commRepo.Commissions))
	}
	c := commRepo.Commissions[0]

	// 10000 * 5% = 500
	expectedCommission := 500.0
	if c.CommissionAmount != expectedCommission {
		t.Errorf("CommissionAmount = %.2f, want %.2f", c.CommissionAmount, expectedCommission)
	}
	if c.CPABonus != 0 {
		t.Errorf("CPABonus should be 0 for non-new buyer, got %.2f", c.CPABonus)
	}
	if c.TotalAmount != expectedCommission {
		t.Errorf("TotalAmount = %.2f, want %.2f", c.TotalAmount, expectedCommission)
	}
	if c.Status != domain.CommissionPending {
		t.Errorf("Status = %s, want pending", c.Status)
	}

	// Pending balance should be credited
	if partnerRepo.Balances[partnerID].PendingAmount != expectedCommission {
		t.Errorf("PendingBalance = %.2f, want %.2f",
			partnerRepo.Balances[partnerID].PendingAmount, expectedCommission)
	}
}

func TestCalculate_NewBuyerCPABonus(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	partnerRepo.Partners[partnerID] = &domain.Partner{ID: partnerID, Tier: domain.TierBronze}
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff() // CPABonus = 500
	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{PartnerID: partnerID}

	svc := service.NewCommissionService(commRepo, partnerRepo)

	order := &domain.Order{
		ID:          uuid.New(),
		PartnerID:   &partnerID,
		TotalAmount: 10000.0,
		IsNewBuyer:  true,
	}

	if err := svc.Calculate(context.Background(), order); err != nil {
		t.Fatalf("Calculate error: %v", err)
	}

	c := commRepo.Commissions[0]
	// commission = 10000 * 5% = 500, CPA = 500, total = 1000
	if c.CPABonus != 500.0 {
		t.Errorf("CPABonus = %.2f, want 500", c.CPABonus)
	}
	if c.TotalAmount != 1000.0 {
		t.Errorf("TotalAmount = %.2f, want 1000", c.TotalAmount)
	}
}

func TestCalculate_EventSpecialRateOverridesTierRate(t *testing.T) {
	partnerID := uuid.New()
	eventID := uuid.New()
	specialRate := 8.0

	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	partnerRepo.Partners[partnerID] = &domain.Partner{ID: partnerID, Tier: domain.TierBronze}
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff() // GmvRate = 5
	commRepo.SpecialRates[eventID] = &specialRate        // special = 8
	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{PartnerID: partnerID}

	svc := service.NewCommissionService(commRepo, partnerRepo)

	order := &domain.Order{
		ID:          uuid.New(),
		PartnerID:   &partnerID,
		EventID:     &eventID,
		TotalAmount: 10000.0,
	}

	if err := svc.Calculate(context.Background(), order); err != nil {
		t.Fatalf("Calculate error: %v", err)
	}

	c := commRepo.Commissions[0]
	// should use special rate 8%: 10000 * 8% = 800
	if c.Rate != 8.0 {
		t.Errorf("Rate = %.2f, want 8.0", c.Rate)
	}
	if c.CommissionAmount != 800.0 {
		t.Errorf("CommissionAmount = %.2f, want 800", c.CommissionAmount)
	}
}

func TestCalculate_NoPartnerID_Noop(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()
	svc := service.NewCommissionService(commRepo, partnerRepo)

	order := &domain.Order{
		ID:          uuid.New(),
		PartnerID:   nil, // no attribution
		TotalAmount: 5000.0,
	}

	if err := svc.Calculate(context.Background(), order); err != nil {
		t.Fatalf("Calculate with no partnerID should succeed, got: %v", err)
	}
	if len(commRepo.Commissions) != 0 {
		t.Error("no commission should be created when order has no partnerID")
	}
}

func TestUpdateTariff_GuardrailNegativeMargin(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff()

	svc := service.NewCommissionService(commRepo, partnerRepo)

	// SF is 10%; trying to set commission rate to 10% — would make margin 0
	_, err := svc.UpdateTariff(context.Background(), 10.0, 10.0, 10, 500, domain.TierBronze, "")
	if err == nil {
		t.Error("expected error when gmv_rate >= sfPct, got nil")
	}
}

func TestUpdateTariff_GuardrailNegativeRate(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff()

	svc := service.NewCommissionService(commRepo, partnerRepo)

	_, err := svc.UpdateTariff(context.Background(), -1.0, 10.0, 10, 500, domain.TierBronze, "")
	if err == nil {
		t.Error("expected error for negative gmv_rate, got nil")
	}
}

func TestUpdateTariff_IncreaseAppliedImmediately(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff() // current rate = 5%

	svc := service.NewCommissionService(commRepo, partnerRepo)

	// Increase from 5% to 7%
	result, err := svc.UpdateTariff(context.Background(), 7.0, 10.0, 10, 500, domain.TierBronze, "promo season")
	if err != nil {
		t.Fatalf("UpdateTariff increase failed: %v", err)
	}
	if result.Delayed {
		t.Error("increase should not be delayed")
	}
	if result.Tariff.GmvRate != 7.0 {
		t.Errorf("GmvRate = %.2f, want 7.0", result.Tariff.GmvRate)
	}
	if result.Tariff.PendingGmvRate != nil {
		t.Error("PendingGmvRate should be nil after immediate increase")
	}
}

func TestUpdateTariff_DecreaseScheduled(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff() // current rate = 5%

	svc := service.NewCommissionService(commRepo, partnerRepo)

	// Decrease from 5% to 3%
	result, err := svc.UpdateTariff(context.Background(), 3.0, 10.0, 10, 500, domain.TierBronze, "margin restore")
	if err != nil {
		t.Fatalf("UpdateTariff decrease failed: %v", err)
	}
	if !result.Delayed {
		t.Error("decrease should be delayed with advance notice")
	}
	if result.Tariff.PendingGmvRate == nil || *result.Tariff.PendingGmvRate != 3.0 {
		t.Errorf("PendingGmvRate should be 3.0, got %v", result.Tariff.PendingGmvRate)
	}
	// Current rate should remain 5%
	if result.Tariff.GmvRate != 5.0 {
		t.Errorf("GmvRate should stay at 5.0 during notice period, got %.2f", result.Tariff.GmvRate)
	}
	if result.Tariff.RateEffectiveAt == nil {
		t.Error("RateEffectiveAt should be set")
	}
}

func TestCheckAndUpgradeTier_UpgradesToSilver(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	partner := &domain.Partner{ID: partnerID, Tier: domain.TierBronze}
	partnerRepo.Partners[partnerID] = partner
	tariff := bronzeTariff()
	tariff.MinOrdersForSilver = 5
	commRepo.Tariffs[domain.TierBronze] = tariff
	partnerRepo.MonthlyOrdersCount = 10 // above threshold

	svc := service.NewCommissionService(commRepo, partnerRepo)
	if err := svc.CheckAndUpgradeTier(context.Background(), partnerID); err != nil {
		t.Fatalf("CheckAndUpgradeTier error: %v", err)
	}

	if partnerRepo.Partners[partnerID].Tier != domain.TierSilver {
		t.Error("partner should have been upgraded to silver")
	}
}

func TestCheckAndUpgradeTier_NoUpgradeWhenBelowThreshold(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	partnerRepo.Partners[partnerID] = &domain.Partner{ID: partnerID, Tier: domain.TierBronze}
	tariff := bronzeTariff()
	tariff.MinOrdersForSilver = 20
	commRepo.Tariffs[domain.TierBronze] = tariff
	partnerRepo.MonthlyOrdersCount = 5 // below threshold

	svc := service.NewCommissionService(commRepo, partnerRepo)
	if err := svc.CheckAndUpgradeTier(context.Background(), partnerID); err != nil {
		t.Fatalf("CheckAndUpgradeTier error: %v", err)
	}

	if partnerRepo.Partners[partnerID].Tier != domain.TierBronze {
		t.Error("partner should remain bronze when below threshold")
	}
}
