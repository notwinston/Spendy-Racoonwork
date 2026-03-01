-- ============================================================
-- 003: Create prediction tables
-- ============================================================

-- ============================================================
-- SPENDING PREDICTIONS
-- AI-generated spending predictions linked to calendar events
-- ============================================================
CREATE TABLE spending_predictions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  calendar_event_id   UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  predicted_category  event_category NOT NULL,
  predicted_amount    FLOAT NOT NULL,
  prediction_low      FLOAT NOT NULL,
  prediction_high     FLOAT NOT NULL,
  confidence_score    FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  confidence_label    confidence_label NOT NULL DEFAULT 'medium',
  model_version       TEXT NOT NULL DEFAULT 'v1.0',
  explanation         TEXT,
  actual_amount       FLOAT,
  was_accurate        BOOLEAN,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- PREDICTION FEEDBACK
-- User corrections to improve prediction accuracy
-- ============================================================
CREATE TABLE prediction_feedback (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prediction_id       UUID NOT NULL REFERENCES spending_predictions(id) ON DELETE CASCADE,
  feedback_type       feedback_type NOT NULL,
  corrected_category  event_category,
  corrected_amount    FLOAT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, prediction_id)
);
