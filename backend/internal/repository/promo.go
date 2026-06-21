package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ticketon/tap/internal/domain"
)

type PromoRepo struct {
	db *pgxpool.Pool
}

func NewPromoRepo(db *pgxpool.Pool) *PromoRepo {
	return &PromoRepo{db: db}
}

func (r *PromoRepo) Create(ctx context.Context, p *domain.PromoCode) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO promo_codes (id, code, partner_id, event_id, is_active)
		VALUES ($1, $2, $3, $4, $5)`,
		p.ID, strings.ToUpper(p.Code), p.PartnerID, p.EventID, p.IsActive,
	)
	return err
}

func (r *PromoRepo) GetByCode(ctx context.Context, code string) (*domain.PromoCode, error) {
	p := &domain.PromoCode{}
	err := r.db.QueryRow(ctx, `
		SELECT id, code, partner_id, event_id, is_active, uses_count, created_at, updated_at
		FROM promo_codes WHERE code=$1 AND is_active=TRUE`, strings.ToUpper(code)).
		Scan(&p.ID, &p.Code, &p.PartnerID, &p.EventID, &p.IsActive, &p.UsesCount, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return p, err
}

func (r *PromoRepo) GetByPartner(ctx context.Context, partnerID uuid.UUID) ([]*domain.PromoCode, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, code, partner_id, event_id, is_active, uses_count, created_at, updated_at
		FROM promo_codes WHERE partner_id=$1 ORDER BY created_at DESC`, partnerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*domain.PromoCode
	for rows.Next() {
		p := &domain.PromoCode{}
		if err := rows.Scan(&p.ID, &p.Code, &p.PartnerID, &p.EventID, &p.IsActive, &p.UsesCount, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, nil
}

func (r *PromoRepo) IncrementUses(ctx context.Context, code string) error {
	_, err := r.db.Exec(ctx,
		"UPDATE promo_codes SET uses_count=uses_count+1, updated_at=NOW() WHERE code=$1",
		strings.ToUpper(code))
	return err
}

func (r *PromoRepo) SetActive(ctx context.Context, id uuid.UUID, isActive bool) error {
	_, err := r.db.Exec(ctx,
		"UPDATE promo_codes SET is_active=$2, updated_at=NOW() WHERE id=$1", id, isActive)
	return err
}
