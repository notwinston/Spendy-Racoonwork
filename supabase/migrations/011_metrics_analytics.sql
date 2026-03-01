-- ============================================================
-- Migration 011: Metrics & Analytics tables for MVP.md Section 5
-- ============================================================

-- New columns on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_income FLOAT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cci_score FLOAT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS savings_efficiency FLOAT;

-- New columns on spending_predictions
ALTER TABLE spending_predictions ADD COLUMN IF NOT EXISTS confidence_decay_lambda FLOAT DEFAULT 0.05;
ALTER TABLE spending_predictions ADD COLUMN IF NOT EXISTS matched_transaction_id UUID REFERENCES transactions(id);

-- New columns on transactions (for receipt scanning + source tracking)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_data JSONB;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;

-- Plaid sync cursor
ALTER TABLE plaid_connections ADD COLUMN IF NOT EXISTS sync_cursor TEXT;

-- ---- Income Sources ----
CREATE TABLE IF NOT EXISTS income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  amount FLOAT NOT NULL,
  frequency transaction_frequency NOT NULL DEFAULT 'monthly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_income_sources_user ON income_sources(user_id);
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY income_sources_user ON income_sources FOR ALL USING (auth.uid() = user_id);

-- ---- Daily Check-ins ----
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  xp_awarded INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, (checked_in_at::date))
);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON daily_checkins(user_id);
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY daily_checkins_user ON daily_checkins FOR ALL USING (auth.uid() = user_id);

-- ---- Notification Preferences ----
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spending_alerts BOOLEAN NOT NULL DEFAULT true,
  budget_warnings BOOLEAN NOT NULL DEFAULT true,
  social_nudges BOOLEAN NOT NULL DEFAULT true,
  challenge_updates BOOLEAN NOT NULL DEFAULT true,
  streak_reminders BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  push_token TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_preferences_user ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- ---- Spending Velocity (MVP 5.3) ----
CREATE TABLE IF NOT EXISTS spending_velocity_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  raw_velocity FLOAT NOT NULL DEFAULT 0,
  smoothed_velocity FLOAT NOT NULL DEFAULT 0,
  daily_spend FLOAT NOT NULL DEFAULT 0,
  rolling_7d_spend FLOAT NOT NULL DEFAULT 0,
  projected_overspend_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_velocity_user_date ON spending_velocity_daily(user_id, date DESC);
ALTER TABLE spending_velocity_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY velocity_user ON spending_velocity_daily FOR ALL USING (auth.uid() = user_id);

-- ---- Category Risk Scores (MVP 5.5) ----
CREATE TABLE IF NOT EXISTS category_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category event_category NOT NULL,
  cv_score FLOAT NOT NULL DEFAULT 0,
  mean_daily_spend FLOAT NOT NULL DEFAULT 0,
  stddev_daily_spend FLOAT NOT NULL DEFAULT 0,
  sample_days INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, (computed_at::date))
);
CREATE INDEX IF NOT EXISTS idx_risk_user_cat ON category_risk_scores(user_id, category);
ALTER TABLE category_risk_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY risk_user ON category_risk_scores FOR ALL USING (auth.uid() = user_id);

-- ---- CCI Scores (MVP 5.6) ----
CREATE TABLE IF NOT EXISTS cci_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category event_category,                -- NULL = overall CCI
  hit_rate FLOAT NOT NULL DEFAULT 0,
  avg_accuracy_weight FLOAT NOT NULL DEFAULT 0,
  cci_value FLOAT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, period_start)
);
CREATE INDEX IF NOT EXISTS idx_cci_user ON cci_scores(user_id, period_end DESC);
ALTER TABLE cci_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY cci_user ON cci_scores FOR ALL USING (auth.uid() = user_id);

-- ---- Health Score Snapshots (MVP 5.8) ----
CREATE TABLE IF NOT EXISTS health_score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  overall_score FLOAT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  grade TEXT NOT NULL,
  budget_adherence FLOAT NOT NULL DEFAULT 0,
  savings_rate FLOAT NOT NULL DEFAULT 0,
  spending_stability FLOAT NOT NULL DEFAULT 0,
  calendar_correlation FLOAT NOT NULL DEFAULT 0,
  streak_bonus FLOAT NOT NULL DEFAULT 0,
  trend FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_health_user_date ON health_score_snapshots(user_id, date DESC);
ALTER TABLE health_score_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_user ON health_score_snapshots FOR ALL USING (auth.uid() = user_id);

-- ---- Savings Goals (MVP 5.2) ----
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount FLOAT NOT NULL CHECK (target_amount > 0),
  current_amount FLOAT NOT NULL DEFAULT 0,
  monthly_contribution FLOAT NOT NULL DEFAULT 0,
  annual_interest_rate FLOAT NOT NULL DEFAULT 0.04,
  target_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY savings_goals_user ON savings_goals FOR ALL USING (auth.uid() = user_id);

-- ---- Savings Rules (MVP 5.9) ----
CREATE TABLE IF NOT EXISTS savings_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  round_up_enabled BOOLEAN NOT NULL DEFAULT false,
  round_up_multiplier FLOAT NOT NULL DEFAULT 1.0,
  save_the_difference_enabled BOOLEAN NOT NULL DEFAULT false,
  save_the_difference_rate FLOAT NOT NULL DEFAULT 0.5,
  daily_sweep_enabled BOOLEAN NOT NULL DEFAULT false,
  monthly_cap_pct FLOAT NOT NULL DEFAULT 0.15,
  target_savings_goal_id UUID REFERENCES savings_goals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE savings_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY savings_rules_user ON savings_rules FOR ALL USING (auth.uid() = user_id);

-- ---- Auto-Save Transactions (MVP 5.9) ----
CREATE TABLE IF NOT EXISTS auto_save_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  savings_goal_id UUID REFERENCES savings_goals(id),
  trigger_type TEXT NOT NULL,             -- 'event_match', 'daily_sweep', 'round_up'
  trigger_reference_id UUID,
  amount FLOAT NOT NULL CHECK (amount > 0),
  predicted_amount FLOAT,
  actual_amount FLOAT,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'completed', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_autosave_user ON auto_save_transactions(user_id, created_at DESC);
ALTER TABLE auto_save_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY autosave_user ON auto_save_transactions FOR ALL USING (auth.uid() = user_id);

-- ---- Seasonal Factors (MVP 5.1) ----
CREATE TABLE IF NOT EXISTS seasonal_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category event_category NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  adjustment_factor FLOAT NOT NULL DEFAULT 1.0,
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, month)
);
CREATE INDEX IF NOT EXISTS idx_seasonal_user ON seasonal_factors(user_id);
ALTER TABLE seasonal_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY seasonal_user ON seasonal_factors FOR ALL USING (auth.uid() = user_id);

-- ---- Metrics Computation Log (MVP 5.10) ----
CREATE TABLE IF NOT EXISTS metrics_computation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_metrics_log_name ON metrics_computation_log(metric_name, created_at DESC);
-- No RLS on metrics_computation_log — it's a system table
