package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ticketon/tap/internal/domain"
)

type AdminRepo struct {
	db *pgxpool.Pool
}

func NewAdminRepo(db *pgxpool.Pool) *AdminRepo {
	return &AdminRepo{db: db}
}

func (r *AdminRepo) GetByEmail(ctx context.Context, email string) (*domain.AdminUser, error) {
	u := &domain.AdminUser{}
	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, role, full_name, created_at
		FROM admin_users WHERE email=$1`, email).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.FullName, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return u, err
}

func (r *AdminRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.AdminUser, error) {
	u := &domain.AdminUser{}
	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, role, full_name, created_at
		FROM admin_users WHERE id=$1`, id).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.FullName, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return u, err
}

func (r *AdminRepo) GetAnalytics(ctx context.Context, period string) (*domain.ChannelAnalytics, error) {
	interval := "30 days"
	switch period {
	case "7d":
		interval = "7 days"
	case "90d":
		interval = "90 days"
	}

	a := &domain.ChannelAnalytics{Period: period}

	r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(total_amount),0) FROM orders
		WHERE status='completed' AND created_at >= NOW() - ($1::TEXT::INTERVAL)`, interval).
		Scan(&a.TotalGMV)

	r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(total_amount),0) FROM orders
		WHERE status='completed' AND partner_id IS NOT NULL AND created_at >= NOW() - ($1::TEXT::INTERVAL)`, interval).
		Scan(&a.AffiliateGMV)

	r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(total_amount),0) FROM commissions
		WHERE status IN ('approved','paid') AND created_at >= NOW() - ($1::TEXT::INTERVAL)`, interval).
		Scan(&a.TotalCommissions)

	r.db.QueryRow(ctx, `
		SELECT COUNT(DISTINCT partner_id) FROM orders
		WHERE partner_id IS NOT NULL AND status='completed' AND created_at >= NOW() - ($1::TEXT::INTERVAL)`, interval).
		Scan(&a.ActivePartners)

	r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM orders
		WHERE partner_id IS NOT NULL AND status='completed' AND created_at >= NOW() - ($1::TEXT::INTERVAL)`, interval).
		Scan(&a.TotalOrders)

	if a.TotalGMV > 0 {
		a.AffiliatePct = a.AffiliateGMV / a.TotalGMV * 100
	}
	if a.TotalOrders > 0 {
		a.AffiliateCAC = a.TotalCommissions / float64(a.TotalOrders)
	}

	return a, nil
}

func (r *AdminRepo) LogAudit(ctx context.Context, actorType string, actorID uuid.UUID, action, resourceType string, resourceID *uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO audit_logs (actor_type, actor_id, action, resource_type, resource_id)
		VALUES ($1, $2, $3, $4, $5)`,
		actorType, actorID, action, resourceType, resourceID,
	)
	return err
}
