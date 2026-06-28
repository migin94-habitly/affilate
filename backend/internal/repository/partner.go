package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ticketon/tap/internal/domain"
)

type PartnerRepo struct {
	db *pgxpool.Pool
}

func NewPartnerRepo(db *pgxpool.Pool) *PartnerRepo {
	return &PartnerRepo{db: db}
}

func (r *PartnerRepo) Create(ctx context.Context, p *domain.Partner) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO partners (id, email, phone, password_hash, full_name, segment, tier, status, language, country)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		p.ID, p.Email, p.Phone, p.PasswordHash, p.FullName,
		p.Segment, p.Tier, p.Status, p.Language, p.Country,
	)
	return err
}

func (r *PartnerRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Partner, error) {
	p := &domain.Partner{}
	err := r.db.QueryRow(ctx, `
		SELECT id, email, phone, password_hash, full_name, segment, tier, status,
		       language, country, legal_status, created_at, updated_at
		FROM partners WHERE id = $1`, id).
		Scan(&p.ID, &p.Email, &p.Phone, &p.PasswordHash, &p.FullName,
			&p.Segment, &p.Tier, &p.Status, &p.Language, &p.Country,
			&p.LegalStatus, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return p, err
}

func (r *PartnerRepo) GetByEmail(ctx context.Context, email string) (*domain.Partner, error) {
	p := &domain.Partner{}
	err := r.db.QueryRow(ctx, `
		SELECT id, email, phone, password_hash, full_name, segment, tier, status,
		       language, country, legal_status, created_at, updated_at
		FROM partners WHERE email = $1`, email).
		Scan(&p.ID, &p.Email, &p.Phone, &p.PasswordHash, &p.FullName,
			&p.Segment, &p.Tier, &p.Status, &p.Language, &p.Country,
			&p.LegalStatus, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return p, err
}

func (r *PartnerRepo) Update(ctx context.Context, p *domain.Partner) error {
	_, err := r.db.Exec(ctx, `
		UPDATE partners SET phone=$2, full_name=$3, language=$4, country=$5, legal_status=$6, updated_at=NOW()
		WHERE id=$1`,
		p.ID, p.Phone, p.FullName, p.Language, p.Country, p.LegalStatus,
	)
	return err
}

func (r *PartnerRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.PartnerStatus) error {
	_, err := r.db.Exec(ctx,
		"UPDATE partners SET status=$2, updated_at=NOW() WHERE id=$1", id, status)
	return err
}

func (r *PartnerRepo) UpdateTier(ctx context.Context, id uuid.UUID, tier domain.PartnerTier) error {
	_, err := r.db.Exec(ctx,
		"UPDATE partners SET tier=$2, updated_at=NOW() WHERE id=$1", id, tier)
	return err
}

func (r *PartnerRepo) List(ctx context.Context, filter PartnerFilter) ([]*domain.Partner, int64, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	i := 1

	if filter.Status != "" {
		where += fmt.Sprintf(" AND status=$%d", i)
		args = append(args, filter.Status)
		i++
	}
	if filter.Segment != "" {
		where += fmt.Sprintf(" AND segment=$%d", i)
		args = append(args, filter.Segment)
		i++
	}
	if filter.Search != "" {
		where += fmt.Sprintf(" AND (email ILIKE $%d OR full_name ILIKE $%d)", i, i)
		args = append(args, "%"+filter.Search+"%")
		i++
	}

	var total int64
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM partners "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.PerPage
	args = append(args, filter.PerPage, offset)
	rows, err := r.db.Query(ctx, `
		SELECT id, email, phone, password_hash, full_name, segment, tier, status,
		       language, country, legal_status, created_at, updated_at
		FROM partners `+where+fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", i, i+1),
		args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var partners []*domain.Partner
	for rows.Next() {
		p := &domain.Partner{}
		if err := rows.Scan(&p.ID, &p.Email, &p.Phone, &p.PasswordHash, &p.FullName,
			&p.Segment, &p.Tier, &p.Status, &p.Language, &p.Country,
			&p.LegalStatus, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, 0, err
		}
		partners = append(partners, p)
	}
	return partners, total, nil
}

type PartnerFilter struct {
	Status  string
	Segment string
	Search  string
	Page    int
	PerPage int
}

// KYC

func (r *PartnerRepo) UpsertKYC(ctx context.Context, kyc *domain.PartnerKYC) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO partner_kyc (id, partner_id, iin, bank_name, bank_account, bank_bic, account_holder, freedom_pay_account, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (partner_id) DO UPDATE SET
		  iin=$3, bank_name=$4, bank_account=$5, bank_bic=$6, account_holder=$7,
		  freedom_pay_account=$8, status='pending'`,
		kyc.ID, kyc.PartnerID, kyc.IIN, kyc.BankName, kyc.BankAccount,
		kyc.BankBIC, kyc.AccountHolder, kyc.FreedomPayAccount, kyc.Status,
	)
	return err
}

func (r *PartnerRepo) GetKYC(ctx context.Context, partnerID uuid.UUID) (*domain.PartnerKYC, error) {
	k := &domain.PartnerKYC{}
	err := r.db.QueryRow(ctx, `
		SELECT id, partner_id, iin,
		  COALESCE(bank_name,''), COALESCE(bank_account,''), COALESCE(bank_bic,''),
		  COALESCE(account_holder,''), COALESCE(freedom_pay_account,''),
		  status, verified_at, created_at
		FROM partner_kyc WHERE partner_id=$1`, partnerID).
		Scan(&k.ID, &k.PartnerID, &k.IIN,
			&k.BankName, &k.BankAccount, &k.BankBIC,
			&k.AccountHolder, &k.FreedomPayAccount,
			&k.Status, &k.VerifiedAt, &k.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return k, err
}

// Offer acceptance

func (r *PartnerRepo) UpsertOfferAcceptance(ctx context.Context, oa *domain.OfferAcceptance) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO offer_acceptances (id, partner_id, language, ip_address, accepted_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (partner_id) DO UPDATE SET language=$3, ip_address=$4, accepted_at=NOW()`,
		oa.ID, oa.PartnerID, oa.Language, oa.IPAddress,
	)
	return err
}

func (r *PartnerRepo) HasAcceptedOffer(ctx context.Context, partnerID uuid.UUID) (bool, error) {
	var count int
	err := r.db.QueryRow(ctx,
		"SELECT COUNT(*) FROM offer_acceptances WHERE partner_id=$1", partnerID).Scan(&count)
	return count > 0, err
}

// Balance

func (r *PartnerRepo) GetBalance(ctx context.Context, partnerID uuid.UUID) (*domain.PartnerBalance, error) {
	b := &domain.PartnerBalance{PartnerID: partnerID}
	err := r.db.QueryRow(ctx, `
		SELECT pending_amount, available_amount, paid_out_amount, updated_at
		FROM partner_balances WHERE partner_id=$1`, partnerID).
		Scan(&b.PendingAmount, &b.AvailableAmount, &b.PaidOutAmount, &b.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return b, nil
	}
	return b, err
}

func (r *PartnerRepo) EnsureBalance(ctx context.Context, partnerID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO partner_balances (partner_id) VALUES ($1)
		ON CONFLICT (partner_id) DO NOTHING`, partnerID)
	return err
}

func (r *PartnerRepo) AddToPendingBalance(ctx context.Context, partnerID uuid.UUID, amount float64) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO partner_balances (partner_id, pending_amount)
		VALUES ($1, $2)
		ON CONFLICT (partner_id) DO UPDATE SET
		  pending_amount = partner_balances.pending_amount + $2,
		  updated_at = NOW()`, partnerID, amount)
	return err
}

func (r *PartnerRepo) CountMonthlyOrders(ctx context.Context, partnerID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM orders
		WHERE partner_id=$1 AND status='completed'
		  AND created_at >= date_trunc('month', NOW())`, partnerID).Scan(&count)
	return count, err
}
