package repository

import (
	"context"

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
