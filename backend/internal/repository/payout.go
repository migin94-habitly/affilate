package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ticketon/tap/internal/domain"
)

type AdminPayoutRow struct {
	ID                uuid.UUID  `json:"id"`
	PartnerID         uuid.UUID  `json:"partner_id"`
	PartnerName       string     `json:"partner_name"`
	PartnerEmail      string     `json:"partner_email"`
	Amount            float64    `json:"amount"`
	Currency          string     `json:"currency"`
	FreedomPayAccount string     `json:"freedom_pay_account"`
	BankName          *string    `json:"bank_name,omitempty"`
	BankAccount       *string    `json:"bank_account,omitempty"`
	Status            string     `json:"status"`
	FreedomPayRef     *string    `json:"freedom_pay_ref,omitempty"`
	RequestedAt       time.Time  `json:"requested_at"`
	ProcessedAt       *time.Time `json:"processed_at,omitempty"`
	PaidAt            *time.Time `json:"paid_at,omitempty"`
	Notes             *string    `json:"notes,omitempty"`
}

type PayoutRepo struct {
	db *pgxpool.Pool
}

func NewPayoutRepo(db *pgxpool.Pool) *PayoutRepo {
	return &PayoutRepo{db: db}
}

func (r *PayoutRepo) Create(ctx context.Context, p *domain.Payout) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO payouts (id, partner_id, amount, currency, freedom_pay_account, status)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		p.ID, p.PartnerID, p.Amount, p.Currency, p.FreedomPayAccount, p.Status,
	)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE partner_balances
		SET available_amount = available_amount - $2,
		    pending_amount = pending_amount + $2,
		    updated_at = NOW()
		WHERE partner_id = $1`, p.PartnerID, p.Amount)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *PayoutRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Payout, error) {
	p := &domain.Payout{}
	err := r.db.QueryRow(ctx, `
		SELECT id, partner_id, amount, currency, freedom_pay_account, status,
		       freedom_pay_ref, requested_at, processed_at, paid_at, notes
		FROM payouts WHERE id=$1`, id).
		Scan(&p.ID, &p.PartnerID, &p.Amount, &p.Currency, &p.FreedomPayAccount,
			&p.Status, &p.FreedomPayRef, &p.RequestedAt, &p.ProcessedAt, &p.PaidAt, &p.Notes)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return p, err
}

func (r *PayoutRepo) GetByPartner(ctx context.Context, partnerID uuid.UUID, page, perPage int) ([]*domain.Payout, int64, error) {
	var total int64
	r.db.QueryRow(ctx, "SELECT COUNT(*) FROM payouts WHERE partner_id=$1", partnerID).Scan(&total)

	offset := (page - 1) * perPage
	rows, err := r.db.Query(ctx, `
		SELECT id, partner_id, amount, currency, freedom_pay_account, status,
		       freedom_pay_ref, requested_at, processed_at, paid_at, notes
		FROM payouts WHERE partner_id=$1
		ORDER BY requested_at DESC LIMIT $2 OFFSET $3`, partnerID, perPage, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	return scanPayouts(rows, total)
}

type PayoutFilter struct {
	Status  string
	Page    int
	PerPage int
}

func (r *PayoutRepo) ListAll(ctx context.Context, filter PayoutFilter) ([]*domain.Payout, int64, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	i := 1

	if filter.Status != "" {
		where += fmt.Sprintf(" AND status=$%d", i)
		args = append(args, filter.Status)
		i++
	}

	var total int64
	r.db.QueryRow(ctx, "SELECT COUNT(*) FROM payouts "+where, args...).Scan(&total)

	offset := (filter.Page - 1) * filter.PerPage
	args = append(args, filter.PerPage, offset)
	rows, err := r.db.Query(ctx,
		"SELECT id, partner_id, amount, currency, freedom_pay_account, status, freedom_pay_ref, requested_at, processed_at, paid_at, notes FROM payouts "+
			where+fmt.Sprintf(" ORDER BY requested_at DESC LIMIT $%d OFFSET $%d", i, i+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	return scanPayouts(rows, total)
}

func (r *PayoutRepo) ListAllAdmin(ctx context.Context, filter PayoutFilter) ([]*AdminPayoutRow, int64, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	i := 1

	if filter.Status != "" {
		where += fmt.Sprintf(" AND py.status=$%d", i)
		args = append(args, filter.Status)
		i++
	}

	var total int64
	r.db.QueryRow(ctx, "SELECT COUNT(*) FROM payouts py "+where, args...).Scan(&total)

	offset := (filter.Page - 1) * filter.PerPage
	args = append(args, filter.PerPage, offset)
	rows, err := r.db.Query(ctx, `
		SELECT py.id, py.partner_id, p.full_name, p.email,
		       py.amount, py.currency, py.freedom_pay_account,
		       k.bank_name, k.bank_account,
		       py.status, py.freedom_pay_ref, py.requested_at, py.processed_at, py.paid_at, py.notes
		FROM payouts py
		JOIN partners p ON p.id = py.partner_id
		LEFT JOIN partner_kyc k ON k.partner_id = py.partner_id
		`+where+fmt.Sprintf(" ORDER BY py.requested_at DESC LIMIT $%d OFFSET $%d", i, i+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*AdminPayoutRow
	for rows.Next() {
		row := &AdminPayoutRow{}
		if err := rows.Scan(
			&row.ID, &row.PartnerID, &row.PartnerName, &row.PartnerEmail,
			&row.Amount, &row.Currency, &row.FreedomPayAccount,
			&row.BankName, &row.BankAccount,
			&row.Status, &row.FreedomPayRef, &row.RequestedAt, &row.ProcessedAt, &row.PaidAt, &row.Notes,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, row)
	}
	return items, total, nil
}

func (r *PayoutRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.PayoutStatus, ref *string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var payout domain.Payout
	err = tx.QueryRow(ctx, "SELECT partner_id, amount FROM payouts WHERE id=$1", id).
		Scan(&payout.PartnerID, &payout.Amount)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE payouts SET status=$2, freedom_pay_ref=$3,
		  processed_at=CASE WHEN $2='processing' THEN NOW() ELSE processed_at END,
		  paid_at=CASE WHEN $2='paid' THEN NOW() ELSE paid_at END
		WHERE id=$1`, id, status, ref)
	if err != nil {
		return err
	}

	if status == domain.PayoutPaid {
		_, err = tx.Exec(ctx, `
			UPDATE partner_balances
			SET pending_amount = pending_amount - $2,
			    paid_out_amount = paid_out_amount + $2,
			    updated_at = NOW()
			WHERE partner_id = $1`, payout.PartnerID, payout.Amount)
		if err != nil {
			return err
		}
	} else if status == domain.PayoutFailed {
		_, err = tx.Exec(ctx, `
			UPDATE partner_balances
			SET pending_amount = pending_amount - $2,
			    available_amount = available_amount + $2,
			    updated_at = NOW()
			WHERE partner_id = $1`, payout.PartnerID, payout.Amount)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *PayoutRepo) ExportPending(ctx context.Context) ([]*PayoutExportRow, error) {
	rows, err := r.db.Query(ctx, `
		SELECT py.id, py.partner_id, p.full_name, p.email, k.freedom_pay_account,
		       py.amount, py.currency, py.requested_at
		FROM payouts py
		JOIN partners p ON p.id = py.partner_id
		LEFT JOIN partner_kyc k ON k.partner_id = py.partner_id
		WHERE py.status = 'requested'
		ORDER BY py.requested_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*PayoutExportRow
	for rows.Next() {
		row := &PayoutExportRow{}
		if err := rows.Scan(&row.PayoutID, &row.PartnerID, &row.PartnerName, &row.Email,
			&row.FreedomPayAccount, &row.Amount, &row.Currency, &row.RequestedAt); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, nil
}

type PayoutExportRow struct {
	PayoutID          uuid.UUID
	PartnerID         uuid.UUID
	PartnerName       string
	Email             string
	FreedomPayAccount string
	Amount            float64
	Currency          string
	RequestedAt       interface{}
}

func scanPayouts(rows pgx.Rows, total int64) ([]*domain.Payout, int64, error) {
	var items []*domain.Payout
	for rows.Next() {
		p := &domain.Payout{}
		if err := rows.Scan(&p.ID, &p.PartnerID, &p.Amount, &p.Currency, &p.FreedomPayAccount,
			&p.Status, &p.FreedomPayRef, &p.RequestedAt, &p.ProcessedAt, &p.PaidAt, &p.Notes); err != nil {
			return nil, 0, err
		}
		items = append(items, p)
	}
	return items, total, nil
}
