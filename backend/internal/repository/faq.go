package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ticketon/tap/internal/domain"
)

type FAQRepo struct {
	db *pgxpool.Pool
}

func NewFAQRepo(db *pgxpool.Pool) *FAQRepo {
	return &FAQRepo{db: db}
}

// FAQ items

func (r *FAQRepo) ListActiveFAQ(ctx context.Context) ([]*domain.FAQItem, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, question, answer, category, sort_order, is_active, created_at, updated_at
		FROM faq_items WHERE is_active=TRUE ORDER BY sort_order, created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanFAQItems(rows)
}

func (r *FAQRepo) ListAllFAQ(ctx context.Context) ([]*domain.FAQItem, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, question, answer, category, sort_order, is_active, created_at, updated_at
		FROM faq_items ORDER BY sort_order, created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanFAQItems(rows)
}

func (r *FAQRepo) GetFAQ(ctx context.Context, id uuid.UUID) (*domain.FAQItem, error) {
	item := &domain.FAQItem{}
	err := r.db.QueryRow(ctx, `
		SELECT id, question, answer, category, sort_order, is_active, created_at, updated_at
		FROM faq_items WHERE id=$1`, id).
		Scan(&item.ID, &item.Question, &item.Answer, &item.Category, &item.SortOrder, &item.IsActive, &item.CreatedAt, &item.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return item, err
}

func (r *FAQRepo) CreateFAQ(ctx context.Context, item *domain.FAQItem) error {
	item.ID = uuid.New()
	_, err := r.db.Exec(ctx, `
		INSERT INTO faq_items (id, question, answer, category, sort_order, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		item.ID, item.Question, item.Answer, item.Category, item.SortOrder, item.IsActive,
	)
	return err
}

func (r *FAQRepo) UpdateFAQ(ctx context.Context, item *domain.FAQItem) error {
	_, err := r.db.Exec(ctx, `
		UPDATE faq_items
		SET question=$2, answer=$3, category=$4, sort_order=$5, is_active=$6, updated_at=NOW()
		WHERE id=$1`,
		item.ID, item.Question, item.Answer, item.Category, item.SortOrder, item.IsActive,
	)
	return err
}

func (r *FAQRepo) DeleteFAQ(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM faq_items WHERE id=$1", id)
	return err
}

// Contact info

func (r *FAQRepo) ListActiveContacts(ctx context.Context) ([]*domain.ContactInfo, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, type, label, value, sort_order, is_active, created_at, updated_at
		FROM contact_info WHERE is_active=TRUE ORDER BY sort_order, created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanContacts(rows)
}

func (r *FAQRepo) ListAllContacts(ctx context.Context) ([]*domain.ContactInfo, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, type, label, value, sort_order, is_active, created_at, updated_at
		FROM contact_info ORDER BY sort_order, created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanContacts(rows)
}

func (r *FAQRepo) GetContact(ctx context.Context, id uuid.UUID) (*domain.ContactInfo, error) {
	c := &domain.ContactInfo{}
	err := r.db.QueryRow(ctx, `
		SELECT id, type, label, value, sort_order, is_active, created_at, updated_at
		FROM contact_info WHERE id=$1`, id).
		Scan(&c.ID, &c.Type, &c.Label, &c.Value, &c.SortOrder, &c.IsActive, &c.CreatedAt, &c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return c, err
}

func (r *FAQRepo) CreateContact(ctx context.Context, c *domain.ContactInfo) error {
	c.ID = uuid.New()
	_, err := r.db.Exec(ctx, `
		INSERT INTO contact_info (id, type, label, value, sort_order, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		c.ID, c.Type, c.Label, c.Value, c.SortOrder, c.IsActive,
	)
	return err
}

func (r *FAQRepo) UpdateContact(ctx context.Context, c *domain.ContactInfo) error {
	_, err := r.db.Exec(ctx, `
		UPDATE contact_info
		SET type=$2, label=$3, value=$4, sort_order=$5, is_active=$6, updated_at=NOW()
		WHERE id=$1`,
		c.ID, c.Type, c.Label, c.Value, c.SortOrder, c.IsActive,
	)
	return err
}

func (r *FAQRepo) DeleteContact(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM contact_info WHERE id=$1", id)
	return err
}

func scanFAQItems(rows pgx.Rows) ([]*domain.FAQItem, error) {
	var items []*domain.FAQItem
	for rows.Next() {
		item := &domain.FAQItem{}
		if err := rows.Scan(&item.ID, &item.Question, &item.Answer, &item.Category,
			&item.SortOrder, &item.IsActive, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func scanContacts(rows pgx.Rows) ([]*domain.ContactInfo, error) {
	var items []*domain.ContactInfo
	for rows.Next() {
		c := &domain.ContactInfo{}
		if err := rows.Scan(&c.ID, &c.Type, &c.Label, &c.Value,
			&c.SortOrder, &c.IsActive, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	return items, nil
}
