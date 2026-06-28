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

type RequestRepo struct {
	db *pgxpool.Pool
}

func NewRequestRepo(db *pgxpool.Pool) *RequestRepo {
	return &RequestRepo{db: db}
}

func (r *RequestRepo) Create(ctx context.Context, req *domain.PartnerRequest) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO partner_requests (id, partner_id, type, subject, body, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
		req.ID, req.PartnerID, req.Type, req.Subject, req.Body, req.Status,
	)
	return err
}

func (r *RequestRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.PartnerRequest, error) {
	req := &domain.PartnerRequest{}
	err := r.db.QueryRow(ctx, `
		SELECT pr.id, pr.partner_id, COALESCE(p.full_name,'') as partner_name,
		  pr.type, pr.subject, pr.body, pr.status, pr.created_at, pr.updated_at
		FROM partner_requests pr
		LEFT JOIN partners p ON p.id = pr.partner_id
		WHERE pr.id = $1`, id).
		Scan(&req.ID, &req.PartnerID, &req.PartnerName,
			&req.Type, &req.Subject, &req.Body, &req.Status,
			&req.CreatedAt, &req.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	notes, _ := r.GetNotes(ctx, id)
	req.Notes = notes
	return req, nil
}

// ListByPartner returns requests for a specific partner.
func (r *RequestRepo) ListByPartner(ctx context.Context, partnerID uuid.UUID, page, perPage int) ([]*domain.PartnerRequest, int64, error) {
	var total int64
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM partner_requests WHERE partner_id=$1`, partnerID).Scan(&total); err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * perPage
	rows, err := r.db.Query(ctx, `
		SELECT id, partner_id, ''::text, type, subject, body, status, created_at, updated_at
		FROM partner_requests WHERE partner_id=$1
		ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		partnerID, perPage, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items, _, err := scanRequests(rows)
	return items, total, err
}

// ListAll returns all requests for admin view with optional status filter.
func (r *RequestRepo) ListAll(ctx context.Context, status string, page, perPage int) ([]*domain.PartnerRequest, int64, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	i := 1
	if status != "" {
		where += fmt.Sprintf(" AND pr.status=$%d", i)
		args = append(args, status)
		i++
	}

	var total int64
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM partner_requests pr `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	args = append(args, perPage, offset)
	rows, err := r.db.Query(ctx, `
		SELECT pr.id, pr.partner_id, COALESCE(p.full_name,'') as partner_name,
		  pr.type, pr.subject, pr.body, pr.status, pr.created_at, pr.updated_at
		FROM partner_requests pr
		LEFT JOIN partners p ON p.id = pr.partner_id
		`+where+fmt.Sprintf(` ORDER BY pr.created_at DESC LIMIT $%d OFFSET $%d`, i, i+1),
		args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items, _, err := scanRequests(rows)
	return items, total, err
}

// CountByStatus returns request counts grouped by status (for admin analytics).
func (r *RequestRepo) CountByStatus(ctx context.Context) (map[string]int64, error) {
	rows, err := r.db.Query(ctx,
		`SELECT status, COUNT(*) FROM partner_requests GROUP BY status`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := map[string]int64{}
	for rows.Next() {
		var status string
		var count int64
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		result[status] = count
	}
	return result, nil
}

func (r *RequestRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE partner_requests SET status=$2, updated_at=NOW() WHERE id=$1`, id, status)
	return err
}

func (r *RequestRepo) AddNote(ctx context.Context, note *domain.RequestNote) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO request_notes (id, request_id, admin_id, body, created_at)
		VALUES ($1, $2, $3, $4, NOW())`,
		note.ID, note.RequestID, note.AdminID, note.Body,
	)
	return err
}

func (r *RequestRepo) GetNotes(ctx context.Context, requestID uuid.UUID) ([]domain.RequestNote, error) {
	rows, err := r.db.Query(ctx, `
		SELECT rn.id, rn.request_id, rn.admin_id, COALESCE(au.full_name, au.email, '') as admin_name,
		  rn.body, rn.created_at
		FROM request_notes rn
		LEFT JOIN admin_users au ON au.id = rn.admin_id
		WHERE rn.request_id=$1 ORDER BY rn.created_at ASC`, requestID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []domain.RequestNote
	for rows.Next() {
		n := domain.RequestNote{}
		if err := rows.Scan(&n.ID, &n.RequestID, &n.AdminID, &n.AdminName, &n.Body, &n.CreatedAt); err != nil {
			return nil, err
		}
		notes = append(notes, n)
	}
	return notes, nil
}

func scanRequests(rows pgx.Rows) ([]*domain.PartnerRequest, int64, error) {
	var items []*domain.PartnerRequest
	for rows.Next() {
		req := &domain.PartnerRequest{}
		if err := rows.Scan(&req.ID, &req.PartnerID, &req.PartnerName,
			&req.Type, &req.Subject, &req.Body, &req.Status,
			&req.CreatedAt, &req.UpdatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, req)
	}
	return items, int64(len(items)), nil
}
