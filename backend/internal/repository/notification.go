package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ticketon/tap/internal/domain"
)

type NotificationRepo struct {
	db *pgxpool.Pool
}

func NewNotificationRepo(db *pgxpool.Pool) *NotificationRepo {
	return &NotificationRepo{db: db}
}

func (r *NotificationRepo) Create(ctx context.Context, n *domain.Notification) error {
	n.ID = uuid.New()
	_, err := r.db.Exec(ctx, `
		INSERT INTO partner_notifications (id, partner_id, type, title, body)
		VALUES ($1, $2, $3, $4, $5)`,
		n.ID, n.PartnerID, n.Type, n.Title, n.Body,
	)
	return err
}

func (r *NotificationRepo) ListByPartner(ctx context.Context, partnerID uuid.UUID, page, perPage int) ([]*domain.Notification, int64, error) {
	var total int64
	r.db.QueryRow(ctx, "SELECT COUNT(*) FROM partner_notifications WHERE partner_id=$1", partnerID).Scan(&total)

	offset := (page - 1) * perPage
	rows, err := r.db.Query(ctx, `
		SELECT id, partner_id, type, title, body, is_read, created_at
		FROM partner_notifications
		WHERE partner_id=$1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`, partnerID, perPage, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*domain.Notification
	for rows.Next() {
		n := &domain.Notification{}
		if err := rows.Scan(&n.ID, &n.PartnerID, &n.Type, &n.Title, &n.Body, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, n)
	}
	return items, total, nil
}

func (r *NotificationRepo) UnreadCount(ctx context.Context, partnerID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.QueryRow(ctx,
		"SELECT COUNT(*) FROM partner_notifications WHERE partner_id=$1 AND is_read=FALSE",
		partnerID,
	).Scan(&count)
	return count, err
}

func (r *NotificationRepo) MarkRead(ctx context.Context, id uuid.UUID, partnerID uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		"UPDATE partner_notifications SET is_read=TRUE WHERE id=$1 AND partner_id=$2",
		id, partnerID,
	)
	return err
}

func (r *NotificationRepo) MarkAllRead(ctx context.Context, partnerID uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		"UPDATE partner_notifications SET is_read=TRUE WHERE partner_id=$1 AND is_read=FALSE",
		partnerID,
	)
	return err
}

// ListAll returns notifications across all partners for admin view. Filter by partnerID if non-nil.
func (r *NotificationRepo) ListAll(ctx context.Context, partnerID *uuid.UUID, page, perPage int) ([]map[string]interface{}, int64, error) {
	where := "1=1"
	args := []interface{}{}
	i := 1
	if partnerID != nil {
		where += fmt.Sprintf(" AND pn.partner_id=$%d", i)
		args = append(args, *partnerID)
		i++
	}
	var total int64
	r.db.QueryRow(ctx, "SELECT COUNT(*) FROM partner_notifications pn WHERE "+where, args...).Scan(&total)
	offset := (page - 1) * perPage
	args = append(args, perPage, offset)
	rows, err := r.db.Query(ctx, fmt.Sprintf(`
		SELECT pn.id, pn.partner_id, p.email AS partner_email, p.full_name AS partner_name,
		       pn.type, pn.title, pn.body, pn.is_read, pn.created_at
		FROM partner_notifications pn
		JOIN partners p ON p.id = pn.partner_id
		WHERE %s
		ORDER BY pn.created_at DESC
		LIMIT $%d OFFSET $%d`, where, i, i+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var items []map[string]interface{}
	for rows.Next() {
		var id, pid uuid.UUID
		var partnerEmail, partnerName, typ, title, body string
		var isRead bool
		var createdAt time.Time
		if err := rows.Scan(&id, &pid, &partnerEmail, &partnerName, &typ, &title, &body, &isRead, &createdAt); err != nil {
			return nil, 0, err
		}
		items = append(items, map[string]interface{}{
			"id": id, "partner_id": pid, "partner_email": partnerEmail,
			"partner_name": partnerName, "type": typ, "title": title,
			"body": body, "is_read": isRead, "created_at": createdAt,
		})
	}
	return items, total, nil
}

// CreateBroadcast sends a notification to all active partners.
func (r *NotificationRepo) CreateBroadcast(ctx context.Context, typ, title, body string) (int, error) {
	rows, err := r.db.Query(ctx, "SELECT id FROM partners WHERE status='active'")
	if err != nil {
		return 0, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		rows.Scan(&id)
		ids = append(ids, id)
	}
	count := 0
	for _, pid := range ids {
		n := &domain.Notification{PartnerID: pid, Type: typ, Title: title, Body: body}
		if err := r.Create(ctx, n); err == nil {
			count++
		}
	}
	return count, nil
}
