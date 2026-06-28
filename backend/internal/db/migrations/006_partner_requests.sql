-- Bank details fields for partner_kyc
ALTER TABLE partner_kyc
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_account VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_bic VARCHAR(50),
  ADD COLUMN IF NOT EXISTS account_holder VARCHAR(255);

-- Partner requests (support tickets to admins)
CREATE TABLE IF NOT EXISTS partner_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES partners(id),
  type        VARCHAR(50)  NOT NULL DEFAULT 'general',
  subject     VARCHAR(255) NOT NULL,
  body        TEXT         NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'new',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Notes left by admins on requests
CREATE TABLE IF NOT EXISTS request_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES partner_requests(id) ON DELETE CASCADE,
  admin_id    UUID NOT NULL REFERENCES admin_users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_requests_partner_id ON partner_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_requests_status     ON partner_requests(status);
CREATE INDEX IF NOT EXISTS idx_request_notes_request_id   ON request_notes(request_id);
