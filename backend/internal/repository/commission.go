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

type CommissionRepo struct {
	db *pgxpool.Pool
}

func NewCommissionRepo(db *pgxpool.Pool) *CommissionRepo {
	return &CommissionRepo{db: db}
}

func (r *CommissionRepo) Create(ctx context.Context, c *domain.Commission) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO commissions (id, order_id, partner_id, rate, base_amount, commission_amount, cpa_bonus, total_amount, status, fraud_hold)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		c.ID, c.OrderID, c.PartnerID, c.Rate, c.BaseAmount, c.CommissionAmount,
		c.CPABonus, c.TotalAmount, c.Status, c.FraudHold,
	)
	return err
}

func (r *CommissionRepo) GetByPartner(ctx context.Context, partnerID uuid.UUID, page, perPage int) ([]*domain.Commission, int64, error) {
	var total int64
	r.db.QueryRow(ctx, "SELECT COUNT(*) FROM commissions WHERE partner_id=$1", partnerID).Scan(&total)

	offset := (page - 1) * perPage
	rows, err := r.db.Query(ctx, `
		SELECT id, order_id, partner_id, rate, base_amount, commission_amount, cpa_bonus, total_amount, status, fraud_hold, created_at, updated_at
		FROM commissions WHERE partner_id=$1
		ORDER BY created_at DESC LIMIT $2 OFFSET $3`, partnerID, perPage, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	return scanCommissions(rows, total)
}

func (r *CommissionRepo) GetTariff(ctx context.Context, tier domain.PartnerTier) (*domain.Tariff, error) {
	t := &domain.Tariff{}
	err := r.db.QueryRow(ctx, `
		SELECT id, tier, base_rate, min_orders_for_silver, cpa_bonus, updated_at
		FROM tariffs WHERE tier=$1`, tier).
		Scan(&t.ID, &t.Tier, &t.BaseRate, &t.MinOrdersForSilver, &t.CPABonus, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return t, err
}

func (r *CommissionRepo) GetAllTariffs(ctx context.Context) ([]*domain.Tariff, error) {
	rows, err := r.db.Query(ctx, "SELECT id, tier, base_rate, min_orders_for_silver, cpa_bonus, updated_at FROM tariffs ORDER BY tier")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tariffs []*domain.Tariff
	for rows.Next() {
		t := &domain.Tariff{}
		if err := rows.Scan(&t.ID, &t.Tier, &t.BaseRate, &t.MinOrdersForSilver, &t.CPABonus, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tariffs = append(tariffs, t)
	}
	return tariffs, nil
}

func (r *CommissionRepo) UpdateTariff(ctx context.Context, t *domain.Tariff) error {
	_, err := r.db.Exec(ctx, `
		UPDATE tariffs SET base_rate=$2, min_orders_for_silver=$3, cpa_bonus=$4, updated_at=NOW()
		WHERE tier=$1`, t.Tier, t.BaseRate, t.MinOrdersForSilver, t.CPABonus)
	return err
}

func (r *CommissionRepo) GetEventSpecialRate(ctx context.Context, eventID uuid.UUID) (*float64, error) {
	var rate *float64
	err := r.db.QueryRow(ctx, "SELECT special_rate FROM events WHERE id=$1", eventID).Scan(&rate)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return rate, err
}

func (r *CommissionRepo) ListAll(ctx context.Context, filter CommissionFilter) ([]*domain.Commission, int64, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	i := 1

	if filter.PartnerID != uuid.Nil {
		where += fmt.Sprintf(" AND partner_id=$%d", i)
		args = append(args, filter.PartnerID)
		i++
	}
	if filter.Status != "" {
		where += fmt.Sprintf(" AND status=$%d", i)
		args = append(args, filter.Status)
		i++
	}

	var total int64
	r.db.QueryRow(ctx, "SELECT COUNT(*) FROM commissions "+where, args...).Scan(&total)

	offset := (filter.Page - 1) * filter.PerPage
	args = append(args, filter.PerPage, offset)
	rows, err := r.db.Query(ctx,
		"SELECT id, order_id, partner_id, rate, base_amount, commission_amount, cpa_bonus, total_amount, status, fraud_hold, created_at, updated_at FROM commissions "+
			where+fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", i, i+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	return scanCommissions(rows, total)
}

type CommissionFilter struct {
	PartnerID uuid.UUID
	Status    string
	Page      int
	PerPage   int
}

func (r *CommissionRepo) ApproveAll(ctx context.Context) (int64, error) {
	res, err := r.db.Exec(ctx, `
		UPDATE commissions SET status='approved', updated_at=NOW()
		WHERE status='pending' AND fraud_hold=FALSE`)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected(), nil
}

// AddToAvailableBalance moves approved commission to available balance
func (r *CommissionRepo) FlushToBalance(ctx context.Context, partnerID uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var total float64
	tx.QueryRow(ctx, `
		SELECT COALESCE(SUM(total_amount),0) FROM commissions
		WHERE partner_id=$1 AND status='approved'`, partnerID).Scan(&total)

	if total <= 0 {
		return tx.Commit(ctx)
	}

	_, err = tx.Exec(ctx, `
		UPDATE commissions SET status='paid', updated_at=NOW()
		WHERE partner_id=$1 AND status='approved'`, partnerID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO partner_balances (partner_id, available_amount)
		VALUES ($1, $2)
		ON CONFLICT (partner_id) DO UPDATE SET
		  available_amount = partner_balances.available_amount + $2,
		  updated_at = NOW()`, partnerID, total)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func scanCommissions(rows pgx.Rows, total int64) ([]*domain.Commission, int64, error) {
	var items []*domain.Commission
	for rows.Next() {
		c := &domain.Commission{}
		if err := rows.Scan(&c.ID, &c.OrderID, &c.PartnerID, &c.Rate, &c.BaseAmount,
			&c.CommissionAmount, &c.CPABonus, &c.TotalAmount, &c.Status, &c.FraudHold,
			&c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, c)
	}
	return items, total, nil
}
