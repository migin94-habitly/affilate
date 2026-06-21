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

type EventRepo struct {
	db *pgxpool.Pool
}

func NewEventRepo(db *pgxpool.Pool) *EventRepo {
	return &EventRepo{db: db}
}

func (r *EventRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Event, error) {
	e := &domain.Event{}
	err := r.db.QueryRow(ctx, `
		SELECT id, external_id, title, city, category, event_date, venue, image_url,
		       base_url, min_price, currency, service_fee_pct, is_active, special_rate, created_at, updated_at
		FROM events WHERE id=$1 AND is_active=TRUE`, id).
		Scan(&e.ID, &e.ExternalID, &e.Title, &e.City, &e.Category, &e.Date,
			&e.Venue, &e.ImageURL, &e.BaseURL, &e.MinPrice, &e.Currency,
			&e.ServiceFeePct, &e.IsActive, &e.SpecialRate, &e.CreatedAt, &e.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return e, err
}

type EventFilter struct {
	City     string
	Category string
	Search   string
	Page     int
	PerPage  int
}

func (r *EventRepo) List(ctx context.Context, filter EventFilter) ([]*domain.Event, int64, error) {
	where := "WHERE is_active=TRUE"
	args := []interface{}{}
	i := 1

	if filter.City != "" {
		where += fmt.Sprintf(" AND city=$%d", i)
		args = append(args, filter.City)
		i++
	}
	if filter.Category != "" {
		where += fmt.Sprintf(" AND category=$%d", i)
		args = append(args, filter.Category)
		i++
	}
	if filter.Search != "" {
		where += fmt.Sprintf(" AND title ILIKE $%d", i)
		args = append(args, "%"+filter.Search+"%")
		i++
	}

	var total int64
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM events "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.PerPage
	args = append(args, filter.PerPage, offset)
	rows, err := r.db.Query(ctx, `
		SELECT id, external_id, title, city, category, event_date, venue, image_url,
		       base_url, min_price, currency, service_fee_pct, is_active, special_rate, created_at, updated_at
		FROM events `+where+fmt.Sprintf(" ORDER BY event_date ASC NULLS LAST LIMIT $%d OFFSET $%d", i, i+1),
		args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var events []*domain.Event
	for rows.Next() {
		e := &domain.Event{}
		if err := rows.Scan(&e.ID, &e.ExternalID, &e.Title, &e.City, &e.Category, &e.Date,
			&e.Venue, &e.ImageURL, &e.BaseURL, &e.MinPrice, &e.Currency,
			&e.ServiceFeePct, &e.IsActive, &e.SpecialRate, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, 0, err
		}
		events = append(events, e)
	}
	return events, total, nil
}

func (r *EventRepo) Upsert(ctx context.Context, e *domain.Event) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO events (id, external_id, title, city, category, event_date, venue, image_url,
		                   base_url, min_price, currency, service_fee_pct, is_active, special_rate)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		ON CONFLICT (external_id) DO UPDATE SET
		  title=$3, city=$4, category=$5, event_date=$6, venue=$7, image_url=$8,
		  base_url=$9, min_price=$10, currency=$11, service_fee_pct=$12, is_active=$13,
		  special_rate=$14, updated_at=NOW()`,
		e.ID, e.ExternalID, e.Title, e.City, e.Category, e.Date, e.Venue, e.ImageURL,
		e.BaseURL, e.MinPrice, e.Currency, e.ServiceFeePct, e.IsActive, e.SpecialRate,
	)
	return err
}

func (r *EventRepo) GetCategories(ctx context.Context) ([]string, error) {
	rows, err := r.db.Query(ctx,
		"SELECT DISTINCT category FROM events WHERE is_active=TRUE AND category != '' ORDER BY category")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cats []string
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}

// ListAll returns all events (including inactive) for admin management.
func (r *EventRepo) ListAll(ctx context.Context, filter EventFilter) ([]*domain.Event, int64, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	i := 1

	if filter.City != "" {
		where += fmt.Sprintf(" AND city=$%d", i)
		args = append(args, filter.City)
		i++
	}
	if filter.Category != "" {
		where += fmt.Sprintf(" AND category=$%d", i)
		args = append(args, filter.Category)
		i++
	}
	if filter.Search != "" {
		where += fmt.Sprintf(" AND title ILIKE $%d", i)
		args = append(args, "%"+filter.Search+"%")
		i++
	}

	var total int64
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM events "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.PerPage
	args = append(args, filter.PerPage, offset)
	rows, err := r.db.Query(ctx, `
		SELECT id, external_id, title, city, category, event_date, venue, image_url,
		       base_url, min_price, currency, service_fee_pct, is_active, special_rate, created_at, updated_at
		FROM events `+where+fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", i, i+1),
		args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var events []*domain.Event
	for rows.Next() {
		e := &domain.Event{}
		if err := rows.Scan(&e.ID, &e.ExternalID, &e.Title, &e.City, &e.Category, &e.Date,
			&e.Venue, &e.ImageURL, &e.BaseURL, &e.MinPrice, &e.Currency,
			&e.ServiceFeePct, &e.IsActive, &e.SpecialRate, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, 0, err
		}
		events = append(events, e)
	}
	return events, total, nil
}

// GetByIDAdmin returns any event regardless of active status; for admin-only use.
func (r *EventRepo) GetByIDAdmin(ctx context.Context, id uuid.UUID) (*domain.Event, error) {
	e := &domain.Event{}
	err := r.db.QueryRow(ctx, `
		SELECT id, external_id, title, city, category, event_date, venue, image_url,
		       base_url, min_price, currency, service_fee_pct, is_active, special_rate, created_at, updated_at
		FROM events WHERE id=$1`, id).
		Scan(&e.ID, &e.ExternalID, &e.Title, &e.City, &e.Category, &e.Date,
			&e.Venue, &e.ImageURL, &e.BaseURL, &e.MinPrice, &e.Currency,
			&e.ServiceFeePct, &e.IsActive, &e.SpecialRate, &e.CreatedAt, &e.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return e, err
}

func (r *EventRepo) UpdateSpecialRate(ctx context.Context, id uuid.UUID, rate *float64) error {
	_, err := r.db.Exec(ctx,
		"UPDATE events SET special_rate=$2, updated_at=NOW() WHERE id=$1", id, rate)
	return err
}

func (r *EventRepo) SetActive(ctx context.Context, id uuid.UUID, isActive bool) error {
	_, err := r.db.Exec(ctx,
		"UPDATE events SET is_active=$2, updated_at=NOW() WHERE id=$1", id, isActive)
	return err
}

func (r *EventRepo) GetCities(ctx context.Context) ([]string, error) {
	rows, err := r.db.Query(ctx,
		"SELECT DISTINCT city FROM events WHERE is_active=TRUE AND city != '' ORDER BY city")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cities []string
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			return nil, err
		}
		cities = append(cities, c)
	}
	return cities, nil
}
