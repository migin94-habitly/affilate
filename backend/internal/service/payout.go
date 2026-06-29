package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/config"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/repository"
)

type PayoutService struct {
	payoutRepo  repository.PayoutRepoIface
	partnerRepo repository.PartnerRepoIface
	commRepo    repository.CommissionRepoIface
	cfg         *config.PayoutConfig
}

func NewPayoutService(pr repository.PayoutRepoIface, partner repository.PartnerRepoIface, cr repository.CommissionRepoIface, cfg *config.PayoutConfig) *PayoutService {
	return &PayoutService{payoutRepo: pr, partnerRepo: partner, commRepo: cr, cfg: cfg}
}

type RequestPayoutInput struct {
	PartnerID uuid.UUID
	Amount    float64
}

func (s *PayoutService) RequestPayout(ctx context.Context, input RequestPayoutInput) (*domain.Payout, error) {
	if input.Amount < s.cfg.MinThreshold {
		return nil, domain.ErrBelowMinThreshold
	}

	// First flush approved commissions to available balance
	if err := s.commRepo.FlushToBalance(ctx, input.PartnerID); err != nil {
		return nil, err
	}

	balance, err := s.partnerRepo.GetBalance(ctx, input.PartnerID)
	if err != nil {
		return nil, err
	}

	if balance.AvailableAmount < input.Amount {
		return nil, domain.ErrInsufficientBalance
	}

	kyc, err := s.partnerRepo.GetKYC(ctx, input.PartnerID)
	if err != nil || kyc.Status != "verified" {
		return nil, domain.ErrKYCNotVerified
	}

	payout := &domain.Payout{
		ID:                uuid.New(),
		PartnerID:         input.PartnerID,
		Amount:            input.Amount,
		Currency:          s.cfg.Currency,
		FreedomPayAccount: kyc.FreedomPayAccount,
		Status:            domain.PayoutRequested,
	}

	if err := s.payoutRepo.Create(ctx, payout); err != nil {
		return nil, err
	}

	return payout, nil
}

func (s *PayoutService) GetPartnerPayouts(ctx context.Context, partnerID uuid.UUID, page, perPage int) ([]*domain.Payout, int64, error) {
	return s.payoutRepo.GetByPartner(ctx, partnerID, page, perPage)
}

func (s *PayoutService) GetPartnerBalance(ctx context.Context, partnerID uuid.UUID) (*domain.PartnerBalance, error) {
	if err := s.commRepo.FlushToBalance(ctx, partnerID); err != nil {
		return nil, err
	}
	return s.partnerRepo.GetBalance(ctx, partnerID)
}

func (s *PayoutService) ListAll(ctx context.Context, filter repository.PayoutFilter) ([]*domain.Payout, int64, error) {
	return s.payoutRepo.ListAll(ctx, filter)
}

func (s *PayoutService) ListAllAdmin(ctx context.Context, filter repository.PayoutFilter) ([]*repository.AdminPayoutRow, int64, error) {
	return s.payoutRepo.ListAllAdmin(ctx, filter)
}

func (s *PayoutService) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.PayoutStatus, ref *string) error {
	return s.payoutRepo.UpdateStatus(ctx, id, status, ref)
}

func (s *PayoutService) ExportPending(ctx context.Context) ([]*repository.PayoutExportRow, error) {
	return s.payoutRepo.ExportPending(ctx)
}
