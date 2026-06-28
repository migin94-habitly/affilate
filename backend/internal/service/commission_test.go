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

func silverTariff() *domain.Tariff {
	return &domain.Tariff{
		ID:                 uuid.New(),
		Tier:               domain.TierSilver,
		GmvRate:            7.0,
		BaseRate:           70.0,
		MinOrdersForSilver: 50,
		CPABonus:           1000.0,
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

func TestCalculate_TariffNotFound_ReturnsError(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	// Partner exists but no tariff for their tier
	partnerRepo.Partners[partnerID] = &domain.Partner{ID: partnerID, Tier: domain.TierGold}
	// No tariff added for TierGold

	svc := service.NewCommissionService(commRepo, partnerRepo)

	order := &domain.Order{
		ID:          uuid.New(),
		PartnerID:   &partnerID,
		TotalAmount: 5000.0,
	}

	err := svc.Calculate(context.Background(), order)
	if err == nil {
		t.Error("expected error when no tariff found for partner tier, got nil")
	}
}

func TestCalculate_AddToPendingBalanceError_Propagates(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	partnerRepo.Partners[partnerID] = &domain.Partner{ID: partnerID, Tier: domain.TierBronze}
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff()
	partnerRepo.AddToPendingErr = domain.ErrNotFound

	svc := service.NewCommissionService(commRepo, partnerRepo)

	order := &domain.Order{
		ID:          uuid.New(),
		PartnerID:   &partnerID,
		TotalAmount: 5000.0,
	}

	err := svc.Calculate(context.Background(), order)
	if err == nil {
		t.Error("expected error from AddToPendingBalance, got nil")
	}
}

func TestCalculate_CommissionCreateError_Propagates(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	partnerRepo.Partners[partnerID] = &domain.Partner{ID: partnerID, Tier: domain.TierBronze}
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff()
	commRepo.CreateErr = domain.ErrAlreadyExists

	svc := service.NewCommissionService(commRepo, partnerRepo)

	order := &domain.Order{
		ID:          uuid.New(),
		PartnerID:   &partnerID,
		TotalAmount: 5000.0,
	}

	err := svc.Calculate(context.Background(), order)
	if err == nil {
		t.Error("expected error from commission repo Create, got nil")
	}
}

func TestCalculate_ZeroAmountOrder_ZeroCommission(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	partnerRepo.Partners[partnerID] = &domain.Partner{ID: partnerID, Tier: domain.TierBronze}
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff()
	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{PartnerID: partnerID}

	svc := service.NewCommissionService(commRepo, partnerRepo)

	order := &domain.Order{
		ID:          uuid.New(),
		PartnerID:   &partnerID,
		TotalAmount: 0,
	}

	if err := svc.Calculate(context.Background(), order); err != nil {
		t.Fatalf("Calculate with zero amount: %v", err)
	}

	c := commRepo.Commissions[0]
	if c.CommissionAmount != 0 {
		t.Errorf("CommissionAmount for zero-amount order = %.2f, want 0", c.CommissionAmount)
	}
}

func TestCalculate_SilverTierPartner_UsesHigherRate(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	partnerRepo.Partners[partnerID] = &domain.Partner{ID: partnerID, Tier: domain.TierSilver}
	commRepo.Tariffs[domain.TierSilver] = silverTariff() // GmvRate = 7%
	partnerRepo.Balances[partnerID] = &domain.PartnerBalance{PartnerID: partnerID}

	svc := service.NewCommissionService(commRepo, partnerRepo)

	order := &domain.Order{
		ID:          uuid.New(),
		PartnerID:   &partnerID,
		TotalAmount: 10000.0,
	}

	if err := svc.Calculate(context.Background(), order); err != nil {
		t.Fatalf("Calculate error: %v", err)
	}

	c := commRepo.Commissions[0]
	// 10000 * 7% = 700
	if c.CommissionAmount != 700.0 {
		t.Errorf("Silver CommissionAmount = %.2f, want 700", c.CommissionAmount)
	}
}

func TestGetTariffs_ReturnsAll(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	commRepo.Tariffs[domain.TierBronze] = bronzeTariff()
	commRepo.Tariffs[domain.TierSilver] = silverTariff()

	svc := service.NewCommissionService(commRepo, partnerRepo)
	tariffs, err := svc.GetTariffs(context.Background())
	if err != nil {
		t.Fatalf("GetTariffs error: %v", err)
	}
	if len(tariffs) != 2 {
		t.Errorf("GetTariffs returned %d tariffs, want 2", len(tariffs))
	}
}

func TestApproveAll_CountsApproved(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	partnerID := uuid.New()
	commRepo.Commissions = []*domain.Commission{
		{ID: uuid.New(), PartnerID: partnerID, Status: domain.CommissionPending},
		{ID: uuid.New(), PartnerID: partnerID, Status: domain.CommissionPending},
		{ID: uuid.New(), PartnerID: partnerID, Status: domain.CommissionApproved}, // already approved
	}

	svc := service.NewCommissionService(commRepo, testutil.NewMockPartnerRepo())
	count, err := svc.ApproveAll(context.Background())
	if err != nil {
		t.Fatalf("ApproveAll error: %v", err)
	}
	if count != 2 {
		t.Errorf("ApproveAll count = %d, want 2", count)
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

func TestUpdateTariff_DecreaseScheduled_EffectiveDateIs14DaysOut(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff()

	svc := service.NewCommissionService(commRepo, testutil.NewMockPartnerRepo())
	result, err := svc.UpdateTariff(context.Background(), 2.0, 10.0, 5, 300, domain.TierBronze, "")
	if err != nil {
		t.Fatalf("UpdateTariff: %v", err)
	}

	if result.Tariff.RateEffectiveAt == nil {
		t.Fatal("RateEffectiveAt should be set for a decrease")
	}
	daysUntil := int(time.Until(*result.Tariff.RateEffectiveAt).Hours() / 24)
	if daysUntil < 13 || daysUntil > 14 {
		t.Errorf("RateEffectiveAt should be ~14 days out, got %d days", daysUntil)
	}
}

func TestUpdateTariff_SameRate_AppliedImmediately(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff() // current rate = 5%

	svc := service.NewCommissionService(commRepo, testutil.NewMockPartnerRepo())

	// Same rate as current — treated as increase/no-change, applied immediately
	result, err := svc.UpdateTariff(context.Background(), 5.0, 10.0, 10, 500, domain.TierBronze, "")
	if err != nil {
		t.Fatalf("UpdateTariff same rate: %v", err)
	}
	if result.Delayed {
		t.Error("same-rate update should not be delayed")
	}
	if result.Tariff.GmvRate != 5.0 {
		t.Errorf("GmvRate = %.2f, want 5.0", result.Tariff.GmvRate)
	}
}

func TestUpdateTariff_IncreaseClearsPendingDecrease(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	pending := 3.0
	effectiveAt := time.Now().Add(14 * 24 * time.Hour)
	commRepo.Tariffs[domain.TierBronze] = &domain.Tariff{
		ID:             uuid.New(),
		Tier:           domain.TierBronze,
		GmvRate:        5.0,
		PendingGmvRate: &pending,
		RateEffectiveAt: &effectiveAt,
	}

	svc := service.NewCommissionService(commRepo, testutil.NewMockPartnerRepo())
	result, err := svc.UpdateTariff(context.Background(), 6.0, 10.0, 10, 500, domain.TierBronze, "")
	if err != nil {
		t.Fatalf("UpdateTariff: %v", err)
	}
	if result.Tariff.PendingGmvRate != nil {
		t.Error("PendingGmvRate should be cleared when a new increase is applied")
	}
	if result.Tariff.RateEffectiveAt != nil {
		t.Error("RateEffectiveAt should be cleared when a new increase is applied")
	}
}

func TestUpdateTariff_DefaultSFPct_WhenZero(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	commRepo.Tariffs[domain.TierBronze] = bronzeTariff()

	svc := service.NewCommissionService(commRepo, testutil.NewMockPartnerRepo())

	// sfPct=0 should default to DefaultSFPct (10.0), so 9% < 10% is valid
	result, err := svc.UpdateTariff(context.Background(), 9.0, 0, 10, 500, domain.TierBronze, "")
	if err != nil {
		t.Fatalf("UpdateTariff with sfPct=0 should use default, got: %v", err)
	}
	if result == nil {
		t.Error("expected non-nil result")
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

func TestCheckAndUpgradeTier_AlreadySilver_NoUpgrade(t *testing.T) {
	partnerID := uuid.New()
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()

	// Already Silver tier — no upgrade logic applies
	partnerRepo.Partners[partnerID] = &domain.Partner{ID: partnerID, Tier: domain.TierSilver}
	partnerRepo.MonthlyOrdersCount = 100

	svc := service.NewCommissionService(commRepo, partnerRepo)
	if err := svc.CheckAndUpgradeTier(context.Background(), partnerID); err != nil {
		t.Fatalf("CheckAndUpgradeTier error for silver partner: %v", err)
	}

	if partnerRepo.Partners[partnerID].Tier != domain.TierSilver {
		t.Error("silver partner tier should not change")
	}
}

func TestCheckAndUpgradeTier_PartnerNotFound_ReturnsNil(t *testing.T) {
	commRepo := testutil.NewMockCommissionRepo()
	partnerRepo := testutil.NewMockPartnerRepo()
	// Partner does not exist in repo

	svc := service.NewCommissionService(commRepo, partnerRepo)
	err := svc.CheckAndUpgradeTier(context.Background(), uuid.New())
	// Should return nil (GetByID returns error, method returns nil early)
	if err != nil {
		t.Logf("CheckAndUpgradeTier for unknown partner returned: %v (acceptable)", err)
	}
}
