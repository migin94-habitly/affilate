package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ticketon/tap/internal/domain"
)

type TrackingRepo struct {
	db *pgxpool.Pool
}

func NewTrackingRepo(db *pgxpool.Pool) *TrackingRepo {
	return &TrackingRepo{db: db}
}

func (r *TrackingRepo) SaveClick(ctx context.Context, c *domain.TrackingClick) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO tracking_clicks (id, click_id, partner_id, event_id, ip_address, user_agent, referrer, channel, cookie_expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (click_id) DO NOTHING`,
		c.ID, c.ClickID, c.PartnerID, c.EventID, c.IPAddress, c.UserAgent, c.Referrer, c.Channel, c.CookieExpires,
	)
	return err
}

func (r *TrackingRepo) GetClickByID(ctx context.Context, clickID string) (*domain.TrackingClick, error) {
	c := &domain.TrackingClick{}
	err := r.db.QueryRow(ctx, `
		SELECT id, click_id, partner_id, event_id, ip_address, user_agent, referrer, channel, cookie_expires_at, created_at
		FROM tracking_clicks WHERE click_id=$1`, clickID).
		Scan(&c.ID, &c.ClickID, &c.PartnerID, &c.EventID, &c.IPAddress, &c.UserAgent, &c.Referrer, &c.Channel, &c.CookieExpires, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return c, err
}

func (r *TrackingRepo) GetActiveClickForPartner(ctx context.Context, clickID string) (*domain.TrackingClick, error) {
	c := &domain.TrackingClick{}
	err := r.db.QueryRow(ctx, `
		SELECT id, click_id, partner_id, event_id, ip_address, user_agent, referrer, channel, cookie_expires_at, created_at
		FROM tracking_clicks WHERE click_id=$1 AND cookie_expires_at > NOW()`, clickID).
		Scan(&c.ID, &c.ClickID, &c.PartnerID, &c.EventID, &c.IPAddress, &c.UserAgent, &c.Referrer, &c.Channel, &c.CookieExpires, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return c, err
}

func (r *TrackingRepo) SaveOrder(ctx context.Context, o *domain.Order) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO orders (id, external_order_id, click_id, partner_id, event_id, buyer_email, is_new_buyer, total_amount, service_fee, currency, status, fraud_flag)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (external_order_id) DO NOTHING`,
		o.ID, o.ExternalOrderID, o.ClickID, o.PartnerID, o.EventID, o.BuyerEmail, o.IsNewBuyer,
		o.TotalAmount, o.ServiceFee, o.Currency, o.Status, o.FraudFlag,
	)
	return err
}

func (r *TrackingRepo) GetOrderByExternalID(ctx context.Context, externalID string) (*domain.Order, error) {
	o := &domain.Order{}
	err := r.db.QueryRow(ctx, `
		SELECT id, external_order_id, click_id, partner_id, event_id, buyer_email, is_new_buyer,
		       total_amount, service_fee, currency, status, fraud_flag, created_at
		FROM orders WHERE external_order_id=$1`, externalID).
		Scan(&o.ID, &o.ExternalOrderID, &o.ClickID, &o.PartnerID, &o.EventID, &o.BuyerEmail,
			&o.IsNewBuyer, &o.TotalAmount, &o.ServiceFee, &o.Currency, &o.Status, &o.FraudFlag, &o.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return o, err
}

type ClickStatsRow struct {
	Date   time.Time
	Clicks int64
	Orders int64
}

func (r *TrackingRepo) GetClickStats(ctx context.Context, partnerID uuid.UUID, days int) ([]ClickStatsRow, error) {
	rows, err := r.db.Query(ctx, `
		SELECT date_trunc('day', tc.created_at) AS day,
		       COUNT(tc.id) AS clicks,
		       COUNT(o.id) AS orders
		FROM tracking_clicks tc
		LEFT JOIN orders o ON o.click_id = tc.click_id AND o.status = 'completed'
		WHERE tc.partner_id = $1 AND tc.created_at >= NOW() - ($2::INT || ' days')::INTERVAL
		GROUP BY day ORDER BY day`, partnerID, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []ClickStatsRow
	for rows.Next() {
		var row ClickStatsRow
		if err := rows.Scan(&row.Date, &row.Clicks, &row.Orders); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, nil
}

func (r *TrackingRepo) GetPartnerStats(ctx context.Context, partnerID uuid.UUID, period string) (*domain.PartnerStats, error) {
	interval := "30 days"
	switch period {
	case "day":
		interval = "1 day"
	case "week":
		interval = "7 days"
	case "month":
		interval = "30 days"
	}

	stats := &domain.PartnerStats{Period: period}

	r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM tracking_clicks
		WHERE partner_id=$1 AND created_at >= NOW() - ($2::TEXT::INTERVAL)`, partnerID, interval).
		Scan(&stats.TotalClicks)

	r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM orders
		WHERE partner_id=$1 AND status='completed' AND created_at >= NOW() - ($2::TEXT::INTERVAL)`, partnerID, interval).
		Scan(&stats.TotalOrders)

	r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(total_amount),0) FROM commissions
		WHERE partner_id=$1 AND status IN ('approved','paid') AND created_at >= NOW() - ($2::TEXT::INTERVAL)`, partnerID, interval).
		Scan(&stats.TotalEarned)

	if stats.TotalClicks > 0 {
		stats.Conversion = float64(stats.TotalOrders) / float64(stats.TotalClicks) * 100
	}

	return stats, nil
}

// Fraud detection signals

type FraudAnomalyRow struct {
	PartnerID   uuid.UUID
	PartnerName string
	SignalType  string
	Count       int64
}

func (r *TrackingRepo) DetectClickSpike(ctx context.Context) ([]FraudAnomalyRow, error) {
	rows, err := r.db.Query(ctx, `
		SELECT tc.partner_id, p.full_name, 'click_spike' AS signal_type,
		       COUNT(tc.id) AS cnt
		FROM tracking_clicks tc
		JOIN partners p ON p.id = tc.partner_id
		WHERE tc.created_at >= NOW() - INTERVAL '1 hour'
		GROUP BY tc.partner_id, p.full_name
		HAVING COUNT(tc.id) > 100
		ORDER BY cnt DESC LIMIT 20`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []FraudAnomalyRow
	for rows.Next() {
		var row FraudAnomalyRow
		if err := rows.Scan(&row.PartnerID, &row.PartnerName, &row.SignalType, &row.Count); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, nil
}

func (r *TrackingRepo) DetectZeroConversion(ctx context.Context) ([]FraudAnomalyRow, error) {
	rows, err := r.db.Query(ctx, `
		SELECT tc.partner_id, p.full_name, 'zero_conversion' AS signal_type,
		       COUNT(tc.id) AS clicks
		FROM tracking_clicks tc
		JOIN partners p ON p.id = tc.partner_id
		LEFT JOIN orders o ON o.click_id = tc.click_id AND o.status = 'completed'
		WHERE tc.created_at >= NOW() - INTERVAL '7 days'
		GROUP BY tc.partner_id, p.full_name
		HAVING COUNT(tc.id) > 50 AND COUNT(o.id) = 0
		ORDER BY clicks DESC LIMIT 20`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []FraudAnomalyRow
	for rows.Next() {
		var row FraudAnomalyRow
		if err := rows.Scan(&row.PartnerID, &row.PartnerName, &row.SignalType, &row.Count); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, nil
}
