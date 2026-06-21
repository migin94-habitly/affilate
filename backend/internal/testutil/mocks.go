// Package testutil provides mock implementations of repository interfaces for unit testing.
package testutil

import (
	"context"

	"github.com/google/uuid"
	"github.com/ticketon/tap/internal/domain"
	"github.com/ticketon/tap/internal/repository"
)

// --- MockPartnerRepo ---

type MockPartnerRepo struct {
	Partners map[uuid.UUID]*domain.Partner
	KYCs     map[uuid.UUID]*domain.PartnerKYC
	Balances map[uuid.UUID]*domain.PartnerBalance
	// Injected errors for testing failure paths
	CreateErr           error
	GetByEmailErr       error
	GetByIDErr          error
	GetBalanceErr       error
	GetKYCErr           error
	AddToPendingErr        error
	MonthlyOrdersCount     int
}

func NewMockPartnerRepo() *MockPartnerRepo {
	return &MockPartnerRepo{
		Partners: make(map[uuid.UUID]*domain.Partner),
		KYCs:     make(map[uuid.UUID]*domain.PartnerKYC),
		Balances: make(map[uuid.UUID]*domain.PartnerBalance),
	}
}

func (m *MockPartnerRepo) Create(_ context.Context, p *domain.Partner) error {
	if m.CreateErr != nil {
		return m.CreateErr
	}
	m.Partners[p.ID] = p
	return nil
}

func (m *MockPartnerRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.Partner, error) {
	if m.GetByIDErr != nil {
		return nil, m.GetByIDErr
	}
	p, ok := m.Partners[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return p, nil
}

func (m *MockPartnerRepo) GetByEmail(_ context.Context, email string) (*domain.Partner, error) {
	if m.GetByEmailErr != nil {
		return nil, m.GetByEmailErr
	}
	for _, p := range m.Partners {
		if p.Email == email {
			return p, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MockPartnerRepo) EnsureBalance(_ context.Context, partnerID uuid.UUID) error {
	if _, ok := m.Balances[partnerID]; !ok {
		m.Balances[partnerID] = &domain.PartnerBalance{PartnerID: partnerID}
	}
	return nil
}

func (m *MockPartnerRepo) GetBalance(_ context.Context, partnerID uuid.UUID) (*domain.PartnerBalance, error) {
	if m.GetBalanceErr != nil {
		return nil, m.GetBalanceErr
	}
	b, ok := m.Balances[partnerID]
	if !ok {
		return &domain.PartnerBalance{PartnerID: partnerID}, nil
	}
	return b, nil
}

func (m *MockPartnerRepo) AddToPendingBalance(_ context.Context, partnerID uuid.UUID, amount float64) error {
	if m.AddToPendingErr != nil {
		return m.AddToPendingErr
	}
	b, ok := m.Balances[partnerID]
	if !ok {
		b = &domain.PartnerBalance{PartnerID: partnerID}
		m.Balances[partnerID] = b
	}
	b.PendingAmount += amount
	return nil
}

func (m *MockPartnerRepo) CountMonthlyOrders(_ context.Context, _ uuid.UUID) (int, error) {
	return m.MonthlyOrdersCount, nil
}

func (m *MockPartnerRepo) UpdateTier(_ context.Context, id uuid.UUID, tier domain.PartnerTier) error {
	if p, ok := m.Partners[id]; ok {
		p.Tier = tier
	}
	return nil
}

func (m *MockPartnerRepo) GetKYC(_ context.Context, partnerID uuid.UUID) (*domain.PartnerKYC, error) {
	if m.GetKYCErr != nil {
		return nil, m.GetKYCErr
	}
	k, ok := m.KYCs[partnerID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return k, nil
}

// --- MockCommissionRepo ---

type MockCommissionRepo struct {
	Tariffs      map[domain.PartnerTier]*domain.Tariff
	Commissions  []*domain.Commission
	SpecialRates map[uuid.UUID]*float64
	CreateErr    error
	UpdateErr    error
	FlushErr     error
}

func NewMockCommissionRepo() *MockCommissionRepo {
	return &MockCommissionRepo{
		Tariffs:      make(map[domain.PartnerTier]*domain.Tariff),
		SpecialRates: make(map[uuid.UUID]*float64),
	}
}

func (m *MockCommissionRepo) Create(_ context.Context, c *domain.Commission) error {
	if m.CreateErr != nil {
		return m.CreateErr
	}
	m.Commissions = append(m.Commissions, c)
	return nil
}

func (m *MockCommissionRepo) GetTariff(_ context.Context, tier domain.PartnerTier) (*domain.Tariff, error) {
	t, ok := m.Tariffs[tier]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return t, nil
}

func (m *MockCommissionRepo) GetAllTariffs(_ context.Context) ([]*domain.Tariff, error) {
	var result []*domain.Tariff
	for _, t := range m.Tariffs {
		result = append(result, t)
	}
	return result, nil
}

func (m *MockCommissionRepo) UpdateTariff(_ context.Context, t *domain.Tariff) error {
	if m.UpdateErr != nil {
		return m.UpdateErr
	}
	m.Tariffs[t.Tier] = t
	return nil
}

func (m *MockCommissionRepo) GetEventSpecialRate(_ context.Context, eventID uuid.UUID) (*float64, error) {
	r, ok := m.SpecialRates[eventID]
	if !ok {
		return nil, nil
	}
	return r, nil
}

func (m *MockCommissionRepo) ApproveAll(_ context.Context) (int64, error) {
	var count int64
	for _, c := range m.Commissions {
		if c.Status == domain.CommissionPending {
			c.Status = domain.CommissionApproved
			count++
		}
	}
	return count, nil
}

func (m *MockCommissionRepo) FlushToBalance(_ context.Context, _ uuid.UUID) error {
	return m.FlushErr
}

// --- MockPayoutRepo ---

type MockPayoutRepo struct {
	Payouts   []*domain.Payout
	CreateErr error
}

func (m *MockPayoutRepo) Create(_ context.Context, p *domain.Payout) error {
	if m.CreateErr != nil {
		return m.CreateErr
	}
	m.Payouts = append(m.Payouts, p)
	return nil
}

func (m *MockPayoutRepo) GetByPartner(_ context.Context, partnerID uuid.UUID, _, _ int) ([]*domain.Payout, int64, error) {
	var result []*domain.Payout
	for _, p := range m.Payouts {
		if p.PartnerID == partnerID {
			result = append(result, p)
		}
	}
	return result, int64(len(result)), nil
}

func (m *MockPayoutRepo) ListAll(_ context.Context, _ repository.PayoutFilter) ([]*domain.Payout, int64, error) {
	return m.Payouts, int64(len(m.Payouts)), nil
}

func (m *MockPayoutRepo) UpdateStatus(_ context.Context, id uuid.UUID, status domain.PayoutStatus, _ *string) error {
	for _, p := range m.Payouts {
		if p.ID == id {
			p.Status = status
			return nil
		}
	}
	return domain.ErrNotFound
}

func (m *MockPayoutRepo) ExportPending(_ context.Context) ([]*repository.PayoutExportRow, error) {
	return nil, nil
}

// --- MockTrackingRepo ---

type MockTrackingRepo struct {
	Clicks  map[string]*domain.TrackingClick
	Orders  map[string]*domain.Order
	SaveErr error
}

func NewMockTrackingRepo() *MockTrackingRepo {
	return &MockTrackingRepo{
		Clicks: make(map[string]*domain.TrackingClick),
		Orders: make(map[string]*domain.Order),
	}
}

func (m *MockTrackingRepo) SaveClick(_ context.Context, c *domain.TrackingClick) error {
	if m.SaveErr != nil {
		return m.SaveErr
	}
	m.Clicks[c.ClickID] = c
	return nil
}

func (m *MockTrackingRepo) GetClickByID(_ context.Context, clickID string) (*domain.TrackingClick, error) {
	c, ok := m.Clicks[clickID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return c, nil
}

func (m *MockTrackingRepo) GetActiveClickForPartner(_ context.Context, clickID string) (*domain.TrackingClick, error) {
	c, ok := m.Clicks[clickID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return c, nil
}

func (m *MockTrackingRepo) SaveOrder(_ context.Context, o *domain.Order) error {
	if m.SaveErr != nil {
		return m.SaveErr
	}
	m.Orders[o.ExternalOrderID] = o
	return nil
}

func (m *MockTrackingRepo) GetOrderByExternalID(_ context.Context, externalID string) (*domain.Order, error) {
	o, ok := m.Orders[externalID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return o, nil
}

func (m *MockTrackingRepo) GetPartnerStats(_ context.Context, _ uuid.UUID, period string) (*domain.PartnerStats, error) {
	return &domain.PartnerStats{Period: period}, nil
}

func (m *MockTrackingRepo) GetClickStats(_ context.Context, _ uuid.UUID, _ int) ([]repository.ClickStatsRow, error) {
	return nil, nil
}

// --- MockEventRepo ---

type MockEventRepo struct {
	Events map[uuid.UUID]*domain.Event
}

func NewMockEventRepo() *MockEventRepo {
	return &MockEventRepo{Events: make(map[uuid.UUID]*domain.Event)}
}

func (m *MockEventRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.Event, error) {
	e, ok := m.Events[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return e, nil
}

// --- MockPromoRepo ---

type MockPromoRepo struct {
	Codes map[string]*domain.PromoCode
}

func NewMockPromoRepo() *MockPromoRepo {
	return &MockPromoRepo{Codes: make(map[string]*domain.PromoCode)}
}

func (m *MockPromoRepo) GetByCode(_ context.Context, code string) (*domain.PromoCode, error) {
	p, ok := m.Codes[code]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return p, nil
}

func (m *MockPromoRepo) IncrementUses(_ context.Context, code string) error {
	if p, ok := m.Codes[code]; ok {
		p.UsesCount++
	}
	return nil
}

// --- MockAdminRepo ---

type MockAdminRepo struct {
	Admins map[string]*domain.AdminUser
}

func NewMockAdminRepo() *MockAdminRepo {
	return &MockAdminRepo{Admins: make(map[string]*domain.AdminUser)}
}

func (m *MockAdminRepo) GetByEmail(_ context.Context, email string) (*domain.AdminUser, error) {
	a, ok := m.Admins[email]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return a, nil
}

func (m *MockAdminRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.AdminUser, error) {
	for _, a := range m.Admins {
		if a.ID == id {
			return a, nil
		}
	}
	return nil, domain.ErrNotFound
}

// --- MockCommissionSvc ---

type MockCommissionSvc struct {
	CalculateErr         error
	CheckUpgradeTierErr  error
	CalledCalculate      []*domain.Order
}

func (m *MockCommissionSvc) Calculate(_ context.Context, order *domain.Order) error {
	m.CalledCalculate = append(m.CalledCalculate, order)
	return m.CalculateErr
}

func (m *MockCommissionSvc) CheckAndUpgradeTier(_ context.Context, _ uuid.UUID) error {
	return m.CheckUpgradeTierErr
}
