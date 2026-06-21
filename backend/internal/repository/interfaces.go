package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
)

// PartnerRepoIface covers all PartnerRepo methods used across services.
type PartnerRepoIface interface {
	Create(ctx context.Context, p *domain.Partner) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Partner, error)
	GetByEmail(ctx context.Context, email string) (*domain.Partner, error)
	EnsureBalance(ctx context.Context, partnerID uuid.UUID) error
	GetBalance(ctx context.Context, partnerID uuid.UUID) (*domain.PartnerBalance, error)
	AddToPendingBalance(ctx context.Context, partnerID uuid.UUID, amount float64) error
	CountMonthlyOrders(ctx context.Context, partnerID uuid.UUID) (int, error)
	UpdateTier(ctx context.Context, id uuid.UUID, tier domain.PartnerTier) error
	GetKYC(ctx context.Context, partnerID uuid.UUID) (*domain.PartnerKYC, error)
}

// CommissionRepoIface covers all CommissionRepo methods used across services.
type CommissionRepoIface interface {
	Create(ctx context.Context, c *domain.Commission) error
	GetTariff(ctx context.Context, tier domain.PartnerTier) (*domain.Tariff, error)
	GetAllTariffs(ctx context.Context) ([]*domain.Tariff, error)
	UpdateTariff(ctx context.Context, t *domain.Tariff) error
	GetEventSpecialRate(ctx context.Context, eventID uuid.UUID) (*float64, error)
	ApproveAll(ctx context.Context) (int64, error)
	FlushToBalance(ctx context.Context, partnerID uuid.UUID) error
}

// PayoutRepoIface covers all PayoutRepo methods used by PayoutService.
type PayoutRepoIface interface {
	Create(ctx context.Context, p *domain.Payout) error
	GetByPartner(ctx context.Context, partnerID uuid.UUID, page, perPage int) ([]*domain.Payout, int64, error)
	ListAll(ctx context.Context, filter PayoutFilter) ([]*domain.Payout, int64, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status domain.PayoutStatus, ref *string) error
	ExportPending(ctx context.Context) ([]*PayoutExportRow, error)
}

// TrackingRepoIface covers all TrackingRepo methods used by TrackingService.
type TrackingRepoIface interface {
	SaveClick(ctx context.Context, c *domain.TrackingClick) error
	GetClickByID(ctx context.Context, clickID string) (*domain.TrackingClick, error)
	GetActiveClickForPartner(ctx context.Context, clickID string) (*domain.TrackingClick, error)
	SaveOrder(ctx context.Context, o *domain.Order) error
	GetOrderByExternalID(ctx context.Context, externalID string) (*domain.Order, error)
	GetPartnerStats(ctx context.Context, partnerID uuid.UUID, period string) (*domain.PartnerStats, error)
	GetClickStats(ctx context.Context, partnerID uuid.UUID, days int) ([]ClickStatsRow, error)
}

// EventRepoIface covers EventRepo methods used by TrackingService.
type EventRepoIface interface {
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Event, error)
}

// PromoRepoIface covers PromoRepo methods used by TrackingService.
type PromoRepoIface interface {
	GetByCode(ctx context.Context, code string) (*domain.PromoCode, error)
	IncrementUses(ctx context.Context, code string) error
}

// AdminRepoIface covers AdminRepo methods used by AuthService.
type AdminRepoIface interface {
	GetByEmail(ctx context.Context, email string) (*domain.AdminUser, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.AdminUser, error)
}
