-- ============================================================
-- Migration 012: Hidden Costs table for hidden cost predictions
-- ============================================================

-- Hidden cost tier enum
CREATE TYPE IF NOT EXISTS hidden_cost_tier AS ENUM ('likely', 'possible', 'unlikely_costly');

-- Hidden costs table
CREATE TABLE IF NOT EXISTS hidden_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES spending_predictions(id) ON DELETE CASCADE,
  calendar_event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  predicted_amount DECIMAL(10,2) NOT NULL,
  amount_low DECIMAL(10,2) NOT NULL,
  amount_high DECIMAL(10,2) NOT NULL,
  tier hidden_cost_tier NOT NULL DEFAULT 'possible',
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  category event_category NOT NULL,
  signal_source TEXT NOT NULL CHECK (signal_source IN ('historical','metadata','social','seasonal')),
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  actual_amount DECIMAL(10,2),
  was_accurate BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hidden_costs_event ON hidden_costs(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_hidden_costs_user ON hidden_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_costs_prediction ON hidden_costs(prediction_id);

-- Row Level Security
ALTER TABLE hidden_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own hidden costs" ON hidden_costs
  FOR ALL USING (auth.uid() = user_id);
