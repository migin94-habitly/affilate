package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/repository"
)

type CommissionService struct {
	commRepo    *repository.CommissionRepo
	partnerRepo *repository.PartnerRepo
}

func NewCommissionService(cr *repository.CommissionRepo, pr *repository.PartnerRepo) *CommissionService {
	return &CommissionService{commRepo: cr, partnerRepo: pr}
}

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

	rate := tariff.BaseRate

	// Check for event-specific special rate
	if order.EventID != nil {
		if specialRate, _ := s.commRepo.GetEventSpecialRate(ctx, *order.EventID); specialRate != nil {
			rate = *specialRate
		}
	}

	baseAmount := order.ServiceFee
	commissionAmount := baseAmount * rate / 100

	cpaBonus := float64(0)
	if order.IsNewBuyer {
		cpaBonus = tariff.CPABonus
	}

	total := commissionAmount + cpaBonus

	c := &domain.Commission{
		ID:               uuid.New(),
		OrderID:          order.ID,
		PartnerID:        *order.PartnerID,
		Rate:             rate,
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

func (s *CommissionService) UpdateTariff(ctx context.Context, t *domain.Tariff) error {
	return s.commRepo.UpdateTariff(ctx, t)
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
