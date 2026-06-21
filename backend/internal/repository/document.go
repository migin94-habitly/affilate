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

type DocumentRepo struct {
	db *pgxpool.Pool
}

func NewDocumentRepo(db *pgxpool.Pool) *DocumentRepo {
	return &DocumentRepo{db: db}
}

func (r *DocumentRepo) Create(ctx context.Context, d *domain.LegalDocument) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO legal_documents (id, partner_id, legal_status, doc_type, version, status)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		d.ID, d.PartnerID, d.LegalStatus, d.DocType, d.Version, d.Status,
	)
	return err
}

func (r *DocumentRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.LegalDocument, error) {
	d := &domain.LegalDocument{}
	err := r.db.QueryRow(ctx, `
		SELECT id, partner_id, legal_status, doc_type, version, status, partner_file_url, ticketon_file_url,
		       final_signed_url, rejection_reason, partner_signed_at, ticketon_signed_at, created_at, updated_at
		FROM legal_documents WHERE id=$1`, id).
		Scan(&d.ID, &d.PartnerID, &d.LegalStatus, &d.DocType, &d.Version, &d.Status,
			&d.PartnerFileURL, &d.TicketonFileURL, &d.FinalSignedURL, &d.RejectionReason,
			&d.PartnerSignedAt, &d.TicketonSignedAt, &d.CreatedAt, &d.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return d, err
}

func (r *DocumentRepo) GetByPartner(ctx context.Context, partnerID uuid.UUID) ([]*domain.LegalDocument, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, partner_id, legal_status, doc_type, version, status, partner_file_url, ticketon_file_url,
		       final_signed_url, rejection_reason, partner_signed_at, ticketon_signed_at, created_at, updated_at
		FROM legal_documents WHERE partner_id=$1 ORDER BY created_at DESC`, partnerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanDocuments(rows)
}

func (r *DocumentRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.DocumentStatus, opts ...DocumentUpdateOption) error {
	opt := documentUpdateOpts{}
	for _, o := range opts {
		o(&opt)
	}

	query := "UPDATE legal_documents SET status=$2, updated_at=NOW()"
	args := []interface{}{id, status}
	i := 3

	if opt.partnerFileURL != nil {
		query += fmt.Sprintf(", partner_file_url=$%d, partner_signed_at=NOW()", i)
		args = append(args, *opt.partnerFileURL)
		i++
	}
	if opt.ticketonFileURL != nil {
		query += fmt.Sprintf(", ticketon_file_url=$%d, ticketon_signed_at=NOW()", i)
		args = append(args, *opt.ticketonFileURL)
		i++
	}
	if opt.finalSignedURL != nil {
		query += fmt.Sprintf(", final_signed_url=$%d", i)
		args = append(args, *opt.finalSignedURL)
		i++
	}
	if opt.rejectionReason != nil {
		query += fmt.Sprintf(", rejection_reason=$%d", i)
		args = append(args, *opt.rejectionReason)
		i++
	}

	query += " WHERE id=$1"
	_, err := r.db.Exec(ctx, query, args...)
	return err
}

type documentUpdateOpts struct {
	partnerFileURL  *string
	ticketonFileURL *string
	finalSignedURL  *string
	rejectionReason *string
}

type DocumentUpdateOption func(*documentUpdateOpts)

func WithPartnerFile(url string) DocumentUpdateOption {
	return func(o *documentUpdateOpts) { o.partnerFileURL = &url }
}
func WithTicketonFile(url string) DocumentUpdateOption {
	return func(o *documentUpdateOpts) { o.ticketonFileURL = &url }
}
func WithFinalFile(url string) DocumentUpdateOption {
	return func(o *documentUpdateOpts) { o.finalSignedURL = &url }
}
func WithRejection(reason string) DocumentUpdateOption {
	return func(o *documentUpdateOpts) { o.rejectionReason = &reason }
}

type DocumentFilter struct {
	Status  string
	Page    int
	PerPage int
}

func (r *DocumentRepo) ListAll(ctx context.Context, filter DocumentFilter) ([]*domain.LegalDocument, int64, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	i := 1

	if filter.Status != "" {
		where += fmt.Sprintf(" AND status=$%d", i)
		args = append(args, filter.Status)
		i++
	}

	var total int64
	r.db.QueryRow(ctx, "SELECT COUNT(*) FROM legal_documents "+where, args...).Scan(&total)

	offset := (filter.Page - 1) * filter.PerPage
	args = append(args, filter.PerPage, offset)

	rows, err := r.db.Query(ctx,
		"SELECT id, partner_id, legal_status, doc_type, version, status, partner_file_url, ticketon_file_url, "+
			"final_signed_url, rejection_reason, partner_signed_at, ticketon_signed_at, created_at, updated_at "+
			"FROM legal_documents "+where+fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", i, i+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	docs, err := scanDocuments(rows)
	return docs, total, err
}

func scanDocuments(rows pgx.Rows) ([]*domain.LegalDocument, error) {
	var items []*domain.LegalDocument
	for rows.Next() {
		d := &domain.LegalDocument{}
		if err := rows.Scan(&d.ID, &d.PartnerID, &d.LegalStatus, &d.DocType, &d.Version, &d.Status,
			&d.PartnerFileURL, &d.TicketonFileURL, &d.FinalSignedURL, &d.RejectionReason,
			&d.PartnerSignedAt, &d.TicketonSignedAt, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, d)
	}
	return items, nil
}
