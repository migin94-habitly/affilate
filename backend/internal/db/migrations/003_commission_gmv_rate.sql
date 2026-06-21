-- PRD §5.2/5.3: GMV rate as source of truth for commission tariffs.
-- Adds gmv_rate (what partners see, stored as primary), updates base_rate semantics to SF%,
-- and adds pending rate fields for the mandatory decrease-notice guardrail (§5.5 guardrail #3).

ALTER TABLE tariffs
    ADD COLUMN IF NOT EXISTS gmv_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pending_gmv_rate DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS rate_effective_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS rate_change_reason TEXT;

-- Set correct GMV rates per PRD §5.2 (Bronze=3%, Silver=5%, Gold=7%)
-- and recalculate base_rate as SF% using default service_fee_pct=10%:
--   SF% = GMV% / SF_pct * 100
UPDATE tariffs SET gmv_rate = 3.00,  base_rate = 30.00 WHERE tier = 'bronze';
UPDATE tariffs SET gmv_rate = 5.00,  base_rate = 50.00 WHERE tier = 'silver';
UPDATE tariffs SET gmv_rate = 7.00,  base_rate = 70.00 WHERE tier = 'gold';

-- Correct CPA bonus seed (PRD §5.2: 500₸ for new buyer, on all tiers)
UPDATE tariffs SET cpa_bonus = 500 WHERE tier IN ('bronze', 'silver', 'gold');
