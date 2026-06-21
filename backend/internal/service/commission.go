package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/repository"
)

// DefaultSFPct is the assumed service fee % of GMV used when no per-event value is available.
// Used for guardrail checks and SF% auto-derivation. Must be confirmed with Finance (PRD §14 open Q1).
const DefaultSFPct = 10.0

// RateDecreaseNoticeDays is the mandatory advance notice before a rate decrease takes effect (PRD §5.5 guardrail #3).
const RateDecreaseNoticeDays = 14

type CommissionService struct {
	commRepo    *repository.CommissionRepo
	partnerRepo *repository.PartnerRepo
}

func NewCommissionService(cr *repository.CommissionRepo, pr *repository.PartnerRepo) *CommissionService {
	return &CommissionService{commRepo: cr, partnerRepo: pr}
}

// Calculate computes the commission for an attributed order.
// Commission = order.TotalAmount (GMV) × gmv_rate — PRD §5.3.
// Event-level special_rate (also in GMV%) overrides the tier base rate if set.
func (s *CommissionService) Calculate(ctx context.Context, order *domain.Order) error {
	if order.PartnerID == nil {
		return nil
	}

	partner, err := s.partnerRepo.GetByID(ctx, *order.PartnerID)
	if err != nil {
		return err
	}

	tariff, err := s.commRepo.GetTariff(ctx, partner.Tier)
	if err != nil {
		return err
	}

	gmvRate := tariff.GmvRate

	// Event-level special rate overrides tier rate (also expressed in % of GMV).
	if order.EventID != nil {
		if specialRate, _ := s.commRepo.GetEventSpecialRate(ctx, *order.EventID); specialRate != nil {
			gmvRate = *specialRate
		}
	}

	// Base is the full order value (GMV); commission is GMV × gmv_rate.
	baseAmount := order.TotalAmount
	commissionAmount := baseAmount * gmvRate / 100

	cpaBonus := float64(0)
	if order.IsNewBuyer {
		cpaBonus = tariff.CPABonus
	}

	total := commissionAmount + cpaBonus

	c := &domain.Commission{
		ID:               uuid.New(),
		OrderID:          order.ID,
		PartnerID:        *order.PartnerID,
		Rate:             gmvRate,
		BaseAmount:       baseAmount,
		CommissionAmount: commissionAmount,
		CPABonus:         cpaBonus,
		TotalAmount:      total,
		Status:           domain.CommissionPending,
	}

	if err := s.commRepo.Create(ctx, c); err != nil {
		return err
	}

	return s.partnerRepo.AddToPendingBalance(ctx, *order.PartnerID, total)
}

func (s *CommissionService) GetTariffs(ctx context.Context) ([]*domain.Tariff, error) {
	return s.commRepo.GetAllTariffs(ctx)
}

// TariffUpdateResult is returned by UpdateTariff; it carries a notice when a decrease
// is scheduled rather than applied immediately (PRD §5.5 guardrail #3).
type TariffUpdateResult struct {
	Tariff  *domain.Tariff
	Delayed bool
	Message string
}

// UpdateTariff validates and persists a tariff change with PRD §5.5 guardrails:
//  1. Blocks any rate that would push Ticketon margin negative.
//  2. Increases are applied immediately; decreases are scheduled with advance notice.
//  3. SF% (base_rate) is derived automatically from gmv_rate.
func (s *CommissionService) UpdateTariff(ctx context.Context, newGmvRate float64, sfPct float64, minOrders int, cpaBonus float64, tier domain.PartnerTier, reason string) (*TariffUpdateResult, error) {
	if sfPct <= 0 {
		sfPct = DefaultSFPct
	}

	// Guardrail #1: commission must not exceed service fee (net margin must stay positive).
	if newGmvRate >= sfPct {
		return nil, fmt.Errorf("gmv_rate %.2f%% would exceed service_fee_pct %.2f%%, making Ticketon margin negative", newGmvRate, sfPct)
	}
	if newGmvRate < 0 {
		return nil, fmt.Errorf("gmv_rate cannot be negative")
	}

	current, err := s.commRepo.GetTariff(ctx, tier)
	if err != nil {
		return nil, err
	}

	// Derive internal SF rate automatically (PRD §5.3).
	derivedSFRate := newGmvRate / sfPct * 100

	result := &TariffUpdateResult{}

	if newGmvRate < current.GmvRate {
		// Rate decrease: schedule with mandatory notice (PRD §5.5 guardrail #3).
		effectiveAt := time.Now().AddDate(0, 0, RateDecreaseNoticeDays)
		current.PendingGmvRate = &newGmvRate
		current.RateEffectiveAt = &effectiveAt
		if reason != "" {
			current.RateChangeReason = &reason
		}
		// GmvRate and BaseRate stay at current values until effective_at.
		current.MinOrdersForSilver = minOrders
		current.CPABonus = cpaBonus

		result.Delayed = true
		result.Message = fmt.Sprintf(
			"Rate decrease from %.2f%% to %.2f%% GMV scheduled for %s (%d days notice). Partners will be notified.",
			current.GmvRate, newGmvRate, effectiveAt.Format("2006-01-02"), RateDecreaseNoticeDays,
		)
	} else {
		// Rate increase or no change: apply immediately.
		current.GmvRate = newGmvRate
		current.BaseRate = derivedSFRate
		current.MinOrdersForSilver = minOrders
		current.CPABonus = cpaBonus
		// Clear any previously scheduled decrease.
		current.PendingGmvRate = nil
		current.RateEffectiveAt = nil
		current.RateChangeReason = nil
	}

	if err := s.commRepo.UpdateTariff(ctx, current); err != nil {
		return nil, err
	}

	result.Tariff = current
	return result, nil
}

func (s *CommissionService) ApproveAll(ctx context.Context) (int64, error) {
	return s.commRepo.ApproveAll(ctx)
}

func (s *CommissionService) CheckAndUpgradeTier(ctx context.Context, partnerID uuid.UUID) error {
	partner, err := s.partnerRepo.GetByID(ctx, partnerID)
	if err != nil || partner.Tier != domain.TierBronze {
		return err
	}

	tariff, err := s.commRepo.GetTariff(ctx, domain.TierBronze)
	if err != nil {
		return err
	}

	orderCount, err := s.partnerRepo.CountMonthlyOrders(ctx, partnerID)
	if err != nil {
		return err
	}

	if orderCount >= tariff.MinOrdersForSilver {
		return s.partnerRepo.UpdateTier(ctx, partnerID, domain.TierSilver)
	}
	return nil
}
