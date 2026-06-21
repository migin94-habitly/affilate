package domain

import (
	"time"

	"github.com/google/uuid"
)

// --- Partner ---

type PartnerSegment string

const (
	SegmentInfluencer PartnerSegment = "influencer"
	SegmentUGC        PartnerSegment = "ugc"
	SegmentWebService PartnerSegment = "webservice"
)

type PartnerTier string

const (
	TierBronze PartnerTier = "bronze"
	TierSilver PartnerTier = "silver"
	TierGold   PartnerTier = "gold"
)

type PartnerStatus string

const (
	StatusPending   PartnerStatus = "pending"
	StatusActive    PartnerStatus = "active"
	StatusSuspended PartnerStatus = "suspended"
	StatusBanned    PartnerStatus = "banned"
)

type LegalStatus string

const (
	LegalEntityLE  LegalStatus = "legal_entity"
	LegalEntityIP  LegalStatus = "sole_proprietor"
	LegalEntityPhys LegalStatus = "individual"
)

type Partner struct {
	ID           uuid.UUID      `json:"id"`
	Email        string         `json:"email"`
	Phone        string         `json:"phone,omitempty"`
	PasswordHash string         `json:"-"`
	FullName     string         `json:"full_name"`
	Segment      PartnerSegment `json:"segment"`
	Tier         PartnerTier    `json:"tier"`
	Status       PartnerStatus  `json:"status"`
	Language     string         `json:"language"`
	Country      string         `json:"country"`
	LegalStatus  *LegalStatus   `json:"legal_status,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

type PartnerKYC struct {
	ID                uuid.UUID `json:"id"`
	PartnerID         uuid.UUID `json:"partner_id"`
	IIN               string    `json:"iin,omitempty"`
	FreedomPayAccount string    `json:"freedom_pay_account"`
	Status            string    `json:"status"`
	VerifiedAt        *time.Time `json:"verified_at,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}

type OfferAcceptance struct {
	ID         uuid.UUID `json:"id"`
	PartnerID  uuid.UUID `json:"partner_id"`
	Language   string    `json:"language"`
	IPAddress  string    `json:"ip_address"`
	AcceptedAt time.Time `json:"accepted_at"`
}

// --- Events ---

type Event struct {
	ID            uuid.UUID  `json:"id"`
	ExternalID    string     `json:"external_id"`
	Title         string     `json:"title"`
	City          string     `json:"city"`
	Category      string     `json:"category"`
	Date          *time.Time `json:"date,omitempty"`
	Venue         string     `json:"venue"`
	ImageURL      string     `json:"image_url"`
	BaseURL       string     `json:"base_url"`
	MinPrice      float64    `json:"min_price"`
	Currency      string     `json:"currency"`
	ServiceFeePct float64    `json:"service_fee_pct"`
	IsActive      bool       `json:"is_active"`
	SpecialRate   *float64   `json:"special_rate,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// --- Tariffs ---

type Tariff struct {
	ID                 uuid.UUID  `json:"id"`
	Tier               PartnerTier `json:"tier"`
	// GmvRate is the partner-visible commission rate as % of order total (GMV) — source of truth per PRD §5.2.
	GmvRate            float64    `json:"gmv_rate"`
	// BaseRate is the derived internal rate as % of Ticketon Service Fee (auto-calculated from GmvRate).
	BaseRate           float64    `json:"base_rate"`
	MinOrdersForSilver int        `json:"min_orders_for_silver"`
	CPABonus           float64    `json:"cpa_bonus"`
	// PendingGmvRate holds a scheduled rate decrease until RateEffectiveAt (PRD §5.5 guardrail #3).
	PendingGmvRate     *float64   `json:"pending_gmv_rate,omitempty"`
	RateEffectiveAt    *time.Time `json:"rate_effective_at,omitempty"`
	RateChangeReason   *string    `json:"rate_change_reason,omitempty"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// --- Tracking ---

type TrackingClick struct {
	ID            uuid.UUID  `json:"id"`
	ClickID       string     `json:"click_id"`
	PartnerID     uuid.UUID  `json:"partner_id"`
	EventID       *uuid.UUID `json:"event_id,omitempty"`
	IPAddress     string     `json:"ip_address"`
	UserAgent     string     `json:"user_agent"`
	Referrer      string     `json:"referrer"`
	Channel       string     `json:"channel"`
	CookieExpires time.Time  `json:"cookie_expires_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

// --- Orders ---

type OrderStatus string

const (
	OrderCompleted OrderStatus = "completed"
	OrderRefunded  OrderStatus = "refunded"
	OrderCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID              uuid.UUID   `json:"id"`
	ExternalOrderID string      `json:"external_order_id"`
	ClickID         *string     `json:"click_id,omitempty"`
	PartnerID       *uuid.UUID  `json:"partner_id,omitempty"`
	EventID         *uuid.UUID  `json:"event_id,omitempty"`
	BuyerEmail      string      `json:"buyer_email,omitempty"`
	IsNewBuyer      bool        `json:"is_new_buyer"`
	TotalAmount     float64     `json:"total_amount"`
	ServiceFee      float64     `json:"service_fee"`
	Currency        string      `json:"currency"`
	Status          OrderStatus `json:"status"`
	FraudFlag       bool        `json:"fraud_flag"`
	CreatedAt       time.Time   `json:"created_at"`
}

// --- Commissions ---

type CommissionStatus string

const (
	CommissionPending  CommissionStatus = "pending"
	CommissionApproved CommissionStatus = "approved"
	CommissionRejected CommissionStatus = "rejected"
	CommissionPaid     CommissionStatus = "paid"
)

type Commission struct {
	ID               uuid.UUID        `json:"id"`
	OrderID          uuid.UUID        `json:"order_id"`
	PartnerID        uuid.UUID        `json:"partner_id"`
	Rate             float64          `json:"rate"`
	BaseAmount       float64          `json:"base_amount"`
	CommissionAmount float64          `json:"commission_amount"`
	CPABonus         float64          `json:"cpa_bonus"`
	TotalAmount      float64          `json:"total_amount"`
	Status           CommissionStatus `json:"status"`
	FraudHold        bool             `json:"fraud_hold"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

// --- Partner Balance ---

type PartnerBalance struct {
	PartnerID       uuid.UUID `json:"partner_id"`
	PendingAmount   float64   `json:"pending_amount"`
	AvailableAmount float64   `json:"available_amount"`
	PaidOutAmount   float64   `json:"paid_out_amount"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// --- Payouts ---

type PayoutStatus string

const (
	PayoutRequested  PayoutStatus = "requested"
	PayoutProcessing PayoutStatus = "processing"
	PayoutPaid       PayoutStatus = "paid"
	PayoutFailed     PayoutStatus = "failed"
)

type Payout struct {
	ID                uuid.UUID    `json:"id"`
	PartnerID         uuid.UUID    `json:"partner_id"`
	Amount            float64      `json:"amount"`
	Currency          string       `json:"currency"`
	FreedomPayAccount string       `json:"freedom_pay_account"`
	Status            PayoutStatus `json:"status"`
	FreedomPayRef     *string      `json:"freedom_pay_ref,omitempty"`
	RequestedAt       time.Time    `json:"requested_at"`
	ProcessedAt       *time.Time   `json:"processed_at,omitempty"`
	PaidAt            *time.Time   `json:"paid_at,omitempty"`
	Notes             *string      `json:"notes,omitempty"`
}

// --- Legal Documents ---

type DocumentStatus string

const (
	DocDraft                    DocumentStatus = "draft"
	DocAwaitingPartnerSignature DocumentStatus = "awaiting_partner_signature"
	DocUnderTicketonReview      DocumentStatus = "under_ticketon_review"
	DocAwaitingTicketonSignature DocumentStatus = "awaiting_ticketon_signature"
	DocSigned                   DocumentStatus = "signed"
	DocArchived                 DocumentStatus = "archived"
	DocRejected                 DocumentStatus = "rejected"
)

type LegalDocument struct {
	ID                uuid.UUID      `json:"id"`
	PartnerID         uuid.UUID      `json:"partner_id"`
	LegalStatus       LegalStatus    `json:"legal_status"`
	DocType           string         `json:"doc_type"`
	Version           int            `json:"version"`
	Status            DocumentStatus `json:"status"`
	PartnerFileURL    *string        `json:"partner_file_url,omitempty"`
	TicketonFileURL   *string        `json:"ticketon_file_url,omitempty"`
	FinalSignedURL    *string        `json:"final_signed_url,omitempty"`
	RejectionReason   *string        `json:"rejection_reason,omitempty"`
	PartnerSignedAt   *time.Time     `json:"partner_signed_at,omitempty"`
	TicketonSignedAt  *time.Time     `json:"ticketon_signed_at,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

// --- Admin Users ---

type AdminRole string

const (
	RoleModerator  AdminRole = "moderator"
	RoleFinance    AdminRole = "finance"
	RoleLegal      AdminRole = "legal"
	RoleSuperAdmin AdminRole = "super_admin"
)

type AdminUser struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         AdminRole `json:"role"`
	FullName     string    `json:"full_name"`
	CreatedAt    time.Time `json:"created_at"`
}

// --- Stats ---

type PartnerStats struct {
	Period        string  `json:"period"`
	TotalClicks   int64   `json:"total_clicks"`
	TotalOrders   int64   `json:"total_orders"`
	Conversion    float64 `json:"conversion_rate"`
	TotalEarned   float64 `json:"total_earned"`
	PendingAmount float64 `json:"pending_amount"`
	AvailableAmount float64 `json:"available_amount"`
}

type ClickDataPoint struct {
	Date   string `json:"date"`
	Clicks int64  `json:"clicks"`
	Orders int64  `json:"orders"`
}

// --- Fraud ---

type FraudSignal struct {
	PartnerID     uuid.UUID `json:"partner_id"`
	PartnerName   string    `json:"partner_name"`
	SignalType    string    `json:"signal_type"`
	Description   string    `json:"description"`
	Severity      string    `json:"severity"`
	Count         int64     `json:"count"`
	DetectedAt    time.Time `json:"detected_at"`
}

// --- Analytics ---

type ChannelAnalytics struct {
	Period            string  `json:"period"`
	TotalGMV          float64 `json:"total_gmv"`
	AffiliateGMV      float64 `json:"affiliate_gmv"`
	AffiliatePct      float64 `json:"affiliate_pct"`
	TotalCommissions  float64 `json:"total_commissions"`
	ActivePartners    int64   `json:"active_partners"`
	TotalOrders       int64   `json:"total_orders"`
	AffiliateCAC      float64 `json:"affiliate_cac"`
}

// --- Promo Codes ---

type PromoCode struct {
	ID        uuid.UUID  `json:"id"`
	Code      string     `json:"code"`
	PartnerID uuid.UUID  `json:"partner_id"`
	EventID   *uuid.UUID `json:"event_id,omitempty"`
	IsActive  bool       `json:"is_active"`
	UsesCount int        `json:"uses_count"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// --- Pagination ---

type PaginatedResult[T any] struct {
	Items      []T   `json:"items"`
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	TotalPages int   `json:"total_pages"`
}
