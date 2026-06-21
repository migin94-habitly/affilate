-- Ticketon Affiliate Platform — Initial Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Partners
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    segment VARCHAR(50) NOT NULL CHECK (segment IN ('influencer', 'ugc', 'webservice')),
    tier VARCHAR(20) NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
    language VARCHAR(10) NOT NULL DEFAULT 'ru',
    country VARCHAR(10) NOT NULL DEFAULT 'KZ',
    legal_status VARCHAR(30) CHECK (legal_status IN ('legal_entity', 'sole_proprietor', 'individual')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_tier ON partners(tier);
CREATE INDEX idx_partners_segment ON partners(segment);

-- KYC
CREATE TABLE partner_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    iin VARCHAR(20),
    freedom_pay_account VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(partner_id)
);

-- Offer acceptances
CREATE TABLE offer_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    ip_address VARCHAR(50),
    accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(partner_id)
);

-- Events (synced from Ticketon core)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT '',
    event_date TIMESTAMP,
    venue VARCHAR(255) NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    base_url TEXT NOT NULL,
    min_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'KZT',
    service_fee_pct DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    special_rate DECIMAL(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_date ON events(event_date);

-- Commission tariffs
CREATE TABLE tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(20) NOT NULL UNIQUE CHECK (tier IN ('bronze', 'silver', 'gold')),
    base_rate DECIMAL(5,2) NOT NULL,
    min_orders_for_silver INT NOT NULL DEFAULT 10,
    cpa_bonus DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO tariffs (tier, base_rate, min_orders_for_silver, cpa_bonus) VALUES
    ('bronze', 15.00, 10, 0),
    ('silver', 20.00, 10, 0),
    ('gold', 25.00, 0, 500);

-- Tracking clicks
CREATE TABLE tracking_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    click_id VARCHAR(100) UNIQUE NOT NULL,
    partner_id UUID NOT NULL REFERENCES partners(id),
    event_id UUID REFERENCES events(id),
    ip_address VARCHAR(50) NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    referrer TEXT NOT NULL DEFAULT '',
    channel VARCHAR(50) NOT NULL DEFAULT 'web',
    cookie_expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clicks_partner ON tracking_clicks(partner_id);
CREATE INDEX idx_clicks_click_id ON tracking_clicks(click_id);
CREATE INDEX idx_clicks_created ON tracking_clicks(created_at);

-- Orders (received via webhook from Ticketon core)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_order_id VARCHAR(255) UNIQUE NOT NULL,
    click_id VARCHAR(100),
    partner_id UUID REFERENCES partners(id),
    event_id UUID REFERENCES events(id),
    buyer_email VARCHAR(255) NOT NULL DEFAULT '',
    is_new_buyer BOOLEAN NOT NULL DEFAULT FALSE,
    total_amount DECIMAL(12,2) NOT NULL,
    service_fee DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KZT',
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
    fraud_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_partner ON orders(partner_id);
CREATE INDEX idx_orders_click_id ON orders(click_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- Commissions
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    partner_id UUID NOT NULL REFERENCES partners(id),
    rate DECIMAL(5,2) NOT NULL,
    base_amount DECIMAL(12,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    cpa_bonus DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    fraud_hold BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_partner ON commissions(partner_id);
CREATE INDEX idx_commissions_status ON commissions(status);

-- Partner balances
CREATE TABLE partner_balances (
    partner_id UUID PRIMARY KEY REFERENCES partners(id) ON DELETE CASCADE,
    pending_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    available_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_out_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Payout requests
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KZT',
    freedom_pay_account VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'paid', 'failed')),
    freedom_pay_ref VARCHAR(255),
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP,
    paid_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_payouts_partner ON payouts(partner_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Legal documents
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    legal_status VARCHAR(30) NOT NULL CHECK (legal_status IN ('legal_entity', 'sole_proprietor', 'individual')),
    doc_type VARCHAR(50) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    partner_file_url TEXT,
    ticketon_file_url TEXT,
    final_signed_url TEXT,
    rejection_reason TEXT,
    partner_signed_at TIMESTAMP,
    ticketon_signed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docs_partner ON legal_documents(partner_id);
CREATE INDEX idx_docs_status ON legal_documents(status);

-- Admin users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'moderator' CHECK (role IN ('moderator', 'finance', 'legal', 'super_admin')),
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('partner', 'admin', 'system')),
    actor_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- Default super admin (password: Admin123!)
INSERT INTO admin_users (email, password_hash, role, full_name)
VALUES ('admin@ticketon.kz', '$2a$10$rqJ7Q8VGoKnJpGZCPQ4qx.8y5oZ4DMiZbFH3Iq5A7w5Qlr.v5mAe', 'super_admin', 'System Admin');
