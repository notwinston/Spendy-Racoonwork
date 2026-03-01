-- ============================================================
-- 004: Create budget tables
-- ============================================================

-- ============================================================
-- BUDGETS
-- Monthly budgets per spending category
-- ============================================================
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category        event_category NOT NULL,
  monthly_limit   FLOAT NOT NULL CHECK (monthly_limit > 0),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (period_end > period_start),
  UNIQUE (user_id, category, period_start)
);


-- ============================================================
-- BUDGET SNAPSHOTS
-- Daily snapshots of budget status for trend tracking
-- ============================================================
CREATE TABLE budget_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  budget_id           UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  spent_amount        FLOAT NOT NULL DEFAULT 0,
  predicted_remaining FLOAT NOT NULL DEFAULT 0,
  burn_rate           FLOAT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (budget_id, date)
);
