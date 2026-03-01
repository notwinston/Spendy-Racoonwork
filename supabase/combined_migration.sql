-- ============================================================
-- 001: Create all custom ENUM types for FutureSpend
-- ============================================================

-- Calendar provider enum
CREATE TYPE calendar_provider AS ENUM ('google', 'apple', 'outlook', 'ical');

-- Event category enum
CREATE TYPE event_category AS ENUM (
  'dining', 'groceries', 'transport', 'entertainment', 'shopping',
  'travel', 'health', 'education', 'fitness', 'social',
  'professional', 'bills', 'personal', 'other'
);

-- Transaction frequency enum
CREATE TYPE transaction_frequency AS ENUM (
  'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
);

-- Feedback type enum
CREATE TYPE feedback_type AS ENUM (
  'correct', 'wrong_category', 'wrong_amount', 'did_not_happen'
);

-- Badge tier enum
CREATE TYPE badge_tier AS ENUM ('bronze', 'silver', 'gold', 'diamond');

-- Challenge participant status enum
CREATE TYPE participant_status AS ENUM (
  'active', 'completed', 'failed', 'withdrawn'
);

-- Streak type enum
CREATE TYPE streak_type AS ENUM (
  'daily_checkin', 'weekly_budget', 'savings'
);

-- XP source enum
CREATE TYPE xp_source AS ENUM (
  'checkin', 'budget', 'challenge', 'prediction', 'review', 'social', 'referral'
);

-- Friendship status enum
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');

-- Circle role enum
CREATE TYPE circle_role AS ENUM ('admin', 'member');

-- Nudge type enum
CREATE TYPE nudge_type AS ENUM (
  'encouragement', 'challenge_invite', 'celebration', 'reminder'
);

-- Notification priority enum
CREATE TYPE notification_priority AS ENUM ('high', 'medium', 'low');

-- Privacy level enum
CREATE TYPE privacy_level AS ENUM ('public', 'friends_only', 'private');

-- Plaid connection status enum
CREATE TYPE plaid_status AS ENUM ('active', 'needs_reauth', 'revoked', 'error');

-- Confidence label enum
CREATE TYPE confidence_label AS ENUM ('high', 'medium', 'low');
-- ============================================================
-- 002: Create core tables
-- ============================================================

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with app-specific profile data
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  friend_code   TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 8)),
  xp            INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 1,
  streak_count  INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  financial_health_score FLOAT,
  privacy_level privacy_level NOT NULL DEFAULT 'friends_only',
  timezone      TEXT NOT NULL DEFAULT 'America/Vancouver',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- CALENDAR CONNECTIONS
-- OAuth tokens for calendar service providers
-- ============================================================
CREATE TABLE calendar_connections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider                calendar_provider NOT NULL,
  access_token_encrypted  TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  calendar_ids            JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_sync_at            TIMESTAMPTZ,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, provider)
);


-- ============================================================
-- CALENDAR EVENTS
-- Synced and parsed calendar events
-- ============================================================
CREATE TABLE calendar_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  external_id             TEXT,
  calendar_connection_id  UUID REFERENCES calendar_connections(id) ON DELETE SET NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  location                TEXT,
  start_time              TIMESTAMPTZ NOT NULL,
  end_time                TIMESTAMPTZ,
  is_all_day              BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule         TEXT,
  attendee_count          INTEGER NOT NULL DEFAULT 1,
  category                event_category NOT NULL DEFAULT 'other',
  raw_data                JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, external_id, calendar_connection_id)
);


-- ============================================================
-- PLAID CONNECTIONS
-- Plaid Link token storage for bank integrations
-- ============================================================
CREATE TABLE plaid_connections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plaid_item_id           TEXT UNIQUE NOT NULL,
  access_token_encrypted  TEXT NOT NULL,
  institution_name        TEXT NOT NULL,
  institution_id          TEXT NOT NULL,
  status                  plaid_status NOT NULL DEFAULT 'active',
  last_sync_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- ACCOUNTS
-- Bank accounts retrieved from Plaid
-- ============================================================
CREATE TABLE accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plaid_connection_id UUID NOT NULL REFERENCES plaid_connections(id) ON DELETE CASCADE,
  plaid_account_id    TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  official_name       TEXT,
  type                TEXT NOT NULL,
  subtype             TEXT,
  current_balance     FLOAT,
  available_balance   FLOAT,
  currency            TEXT NOT NULL DEFAULT 'CAD',
  last_updated        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TRANSACTIONS
-- Financial transactions imported from Plaid
-- ============================================================
CREATE TABLE transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id            UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plaid_transaction_id  TEXT UNIQUE,
  amount                FLOAT NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'CAD',
  merchant_name         TEXT,
  category              event_category NOT NULL DEFAULT 'other',
  subcategory           TEXT,
  date                  DATE NOT NULL,
  pending               BOOLEAN NOT NULL DEFAULT false,
  is_recurring          BOOLEAN NOT NULL DEFAULT false,
  recurring_group_id    UUID,
  reviewed              BOOLEAN NOT NULL DEFAULT false,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- RECURRING TRANSACTIONS
-- Auto-detected recurring transaction patterns
-- ============================================================
CREATE TABLE recurring_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_name       TEXT NOT NULL,
  category            event_category NOT NULL DEFAULT 'other',
  avg_amount          FLOAT NOT NULL,
  frequency           transaction_frequency NOT NULL,
  next_expected_date  DATE,
  last_occurrence     DATE,
  confidence          FLOAT NOT NULL DEFAULT 0.0,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
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
-- ============================================================
-- 005: Create gamification tables
-- ============================================================

-- ============================================================
-- BADGES
-- Badge definitions available system-wide
-- ============================================================
CREATE TABLE badges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT UNIQUE NOT NULL,
  description       TEXT NOT NULL,
  icon_url          TEXT,
  tier              badge_tier NOT NULL DEFAULT 'bronze',
  unlock_condition  JSONB NOT NULL,
  xp_reward         INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- USER BADGES
-- Badges earned by individual users
-- ============================================================
CREATE TABLE user_badges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id      UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_notified   BOOLEAN NOT NULL DEFAULT false,

  UNIQUE (user_id, badge_id)
);


-- ============================================================
-- CHALLENGES
-- Challenge definitions and user-created instances
-- ============================================================
CREATE TABLE challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  challenge_type  TEXT NOT NULL,
  duration_days   INTEGER NOT NULL CHECK (duration_days > 0),
  goal            JSONB NOT NULL,
  reward_xp       INTEGER NOT NULL DEFAULT 100,
  is_template     BOOLEAN NOT NULL DEFAULT false,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- CHALLENGE PARTICIPANTS
-- Users participating in challenges with progress tracking
-- ============================================================
CREATE TABLE challenge_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress        JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          participant_status NOT NULL DEFAULT 'active',
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,

  UNIQUE (challenge_id, user_id)
);


-- ============================================================
-- STREAK HISTORY
-- Tracks all user streaks (active and historical)
-- ============================================================
CREATE TABLE streak_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type   streak_type NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE,
  length        INTEGER NOT NULL DEFAULT 1,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- XP TRANSACTIONS
-- Detailed log of all XP earned or spent
-- ============================================================
CREATE TABLE xp_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL,
  source        xp_source NOT NULL,
  reference_id  UUID,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ============================================================
-- 006: Create social tables
-- ============================================================

-- ============================================================
-- FRIENDSHIPS
-- Bidirectional friend connections between users
-- CHECK constraint prevents duplicate pairs and self-friending
-- ============================================================
CREATE TABLE friendships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        friendship_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at   TIMESTAMPTZ,

  CHECK (user_id < friend_id),
  UNIQUE (user_id, friend_id)
);


-- ============================================================
-- FRIEND CIRCLES
-- Named groups of friends for team challenges and leaderboards
-- ============================================================
CREATE TABLE friend_circles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  max_members   INTEGER NOT NULL DEFAULT 20,
  invite_code   TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- CIRCLE MEMBERS
-- Membership in friend circles
-- ============================================================
CREATE TABLE circle_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id     UUID NOT NULL REFERENCES friend_circles(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          circle_role NOT NULL DEFAULT 'member',
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (circle_id, user_id)
);


-- ============================================================
-- SOCIAL NUDGES
-- Encouragement/reminder messages between friends
-- ============================================================
CREATE TABLE social_nudges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nudge_type    nudge_type NOT NULL,
  content       TEXT NOT NULL,
  reference_id  UUID,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- NOTIFICATIONS
-- Push notification log for all notification types
-- ============================================================
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  category      TEXT,
  priority      notification_priority NOT NULL DEFAULT 'medium',
  data          JSONB,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at       TIMESTAMPTZ
);
-- ============================================================
-- 007: Enable RLS on all tables and create policies
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PROFILES POLICIES
-- Users can read their own profile and accepted friends' profiles.
-- Users can only update their own profile.
-- ============================================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_friends"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT CASE
        WHEN user_id = auth.uid() THEN friend_id
        ELSE user_id
      END
      FROM friendships
      WHERE status = 'accepted'
        AND (user_id = auth.uid() OR friend_id = auth.uid())
    )
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ============================================================
-- CALENDAR CONNECTIONS POLICIES
-- Users can only CRUD their own calendar connections.
-- ============================================================
CREATE POLICY "calendar_connections_all_own"
  ON calendar_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- CALENDAR EVENTS POLICIES
-- Users can only access their own calendar events.
-- ============================================================
CREATE POLICY "calendar_events_all_own"
  ON calendar_events FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- PLAID CONNECTIONS POLICIES
-- Users can only access their own Plaid connections.
-- ============================================================
CREATE POLICY "plaid_connections_all_own"
  ON plaid_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- ACCOUNTS POLICIES
-- Users can only access their own bank accounts.
-- ============================================================
CREATE POLICY "accounts_all_own"
  ON accounts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- TRANSACTIONS POLICIES
-- Users can only access their own transactions.
-- ============================================================
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- RECURRING TRANSACTIONS POLICIES
-- Users can only access their own recurring transactions.
-- ============================================================
CREATE POLICY "recurring_transactions_all_own"
  ON recurring_transactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- SPENDING PREDICTIONS POLICIES
-- Users can only access their own predictions.
-- ============================================================
CREATE POLICY "spending_predictions_select_own"
  ON spending_predictions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "spending_predictions_insert_own"
  ON spending_predictions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "spending_predictions_update_own"
  ON spending_predictions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- PREDICTION FEEDBACK POLICIES
-- Users can only access and submit their own feedback.
-- ============================================================
CREATE POLICY "prediction_feedback_all_own"
  ON prediction_feedback FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- BUDGETS POLICIES
-- Users can only access their own budgets.
-- ============================================================
CREATE POLICY "budgets_all_own"
  ON budgets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- BUDGET SNAPSHOTS POLICIES
-- Users can only access their own budget snapshots.
-- ============================================================
CREATE POLICY "budget_snapshots_all_own"
  ON budget_snapshots FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- BADGES POLICIES
-- All authenticated users can read badge definitions.
-- Only service role can insert/update badge definitions.
-- ============================================================
CREATE POLICY "badges_select_all"
  ON badges FOR SELECT
  USING (true);


-- ============================================================
-- USER BADGES POLICIES
-- Users can see their own badges and friends' badges.
-- ============================================================
CREATE POLICY "user_badges_select_own"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_badges_select_friends"
  ON user_badges FOR SELECT
  USING (
    user_id IN (
      SELECT CASE
        WHEN user_id = auth.uid() THEN friend_id
        ELSE user_id
      END
      FROM friendships
      WHERE status = 'accepted'
        AND (user_id = auth.uid() OR friend_id = auth.uid())
    )
  );

CREATE POLICY "user_badges_insert_own"
  ON user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- CHALLENGES POLICIES
-- All authenticated users can see template challenges.
-- Users can see challenges they created or participate in.
-- ============================================================
CREATE POLICY "challenges_select_templates"
  ON challenges FOR SELECT
  USING (is_template = true);

CREATE POLICY "challenges_select_own"
  ON challenges FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "challenges_select_participating"
  ON challenges FOR SELECT
  USING (
    id IN (
      SELECT challenge_id FROM challenge_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "challenges_insert_own"
  ON challenges FOR INSERT
  WITH CHECK (creator_id = auth.uid());


-- ============================================================
-- CHALLENGE PARTICIPANTS POLICIES
-- Users can see participants in challenges they are part of.
-- Users can join challenges (insert themselves).
-- Users can update their own participation.
-- ============================================================
CREATE POLICY "challenge_participants_select_in_challenge"
  ON challenge_participants FOR SELECT
  USING (
    challenge_id IN (
      SELECT challenge_id FROM challenge_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "challenge_participants_insert_self"
  ON challenge_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "challenge_participants_update_own"
  ON challenge_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- STREAK HISTORY POLICIES
-- Users can only access their own streaks.
-- ============================================================
CREATE POLICY "streak_history_all_own"
  ON streak_history FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- XP TRANSACTIONS POLICIES
-- Users can only read their own XP transactions.
-- ============================================================
CREATE POLICY "xp_transactions_select_own"
  ON xp_transactions FOR SELECT
  USING (user_id = auth.uid());


-- ============================================================
-- FRIENDSHIPS POLICIES
-- Users can see friendships they are part of.
-- Users can insert friendships where they are one of the parties.
-- Users can update friendships they are part of (accept/block).
-- Users can delete friendships they are part of.
-- ============================================================
CREATE POLICY "friendships_select_own"
  ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_insert_own"
  ON friendships FOR INSERT
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_update_own"
  ON friendships FOR UPDATE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_delete_own"
  ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());


-- ============================================================
-- FRIEND CIRCLES POLICIES
-- Users can see circles they belong to.
-- Users can create circles.
-- ============================================================
CREATE POLICY "friend_circles_select_member"
  ON friend_circles FOR SELECT
  USING (
    id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "friend_circles_insert_own"
  ON friend_circles FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "friend_circles_update_admin"
  ON friend_circles FOR UPDATE
  USING (
    id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "friend_circles_delete_creator"
  ON friend_circles FOR DELETE
  USING (creator_id = auth.uid());


-- ============================================================
-- CIRCLE MEMBERS POLICIES
-- Users can see members of circles they belong to.
-- Admins can add/remove members.
-- ============================================================
CREATE POLICY "circle_members_select_in_circle"
  ON circle_members FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "circle_members_insert_admin"
  ON circle_members FOR INSERT
  WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "circle_members_delete_admin_or_self"
  ON circle_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- SOCIAL NUDGES POLICIES
-- Users can see nudges sent to them and nudges they sent.
-- Users can send nudges (insert as sender).
-- Recipients can mark nudges as read.
-- ============================================================
CREATE POLICY "social_nudges_select_recipient"
  ON social_nudges FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "social_nudges_select_sender"
  ON social_nudges FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "social_nudges_insert_sender"
  ON social_nudges FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "social_nudges_update_recipient"
  ON social_nudges FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());


-- ============================================================
-- NOTIFICATIONS POLICIES
-- Users can only access their own notifications.
-- ============================================================
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- ============================================================
-- 008: Performance indexes on foreign keys and query patterns
-- ============================================================

-- Calendar connections
CREATE INDEX idx_calendar_connections_user_id
  ON calendar_connections(user_id);

-- Calendar events
CREATE INDEX idx_calendar_events_user_id_start_time
  ON calendar_events(user_id, start_time);
CREATE INDEX idx_calendar_events_connection_id
  ON calendar_events(calendar_connection_id);
CREATE INDEX idx_calendar_events_category
  ON calendar_events(user_id, category);

-- Plaid connections
CREATE INDEX idx_plaid_connections_user_id
  ON plaid_connections(user_id);

-- Accounts
CREATE INDEX idx_accounts_user_id
  ON accounts(user_id);
CREATE INDEX idx_accounts_plaid_connection_id
  ON accounts(plaid_connection_id);

-- Transactions
CREATE INDEX idx_transactions_user_id_date
  ON transactions(user_id, date);
CREATE INDEX idx_transactions_account_id
  ON transactions(account_id);
CREATE INDEX idx_transactions_category
  ON transactions(user_id, category);
CREATE INDEX idx_transactions_recurring_group
  ON transactions(recurring_group_id)
  WHERE recurring_group_id IS NOT NULL;
CREATE INDEX idx_transactions_pending
  ON transactions(user_id, pending)
  WHERE pending = true;

-- Recurring transactions
CREATE INDEX idx_recurring_transactions_user_id
  ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_next_date
  ON recurring_transactions(next_expected_date)
  WHERE is_active = true;

-- Spending predictions
CREATE INDEX idx_spending_predictions_user_id_event
  ON spending_predictions(user_id, calendar_event_id);
CREATE INDEX idx_spending_predictions_created
  ON spending_predictions(user_id, created_at);

-- Prediction feedback
CREATE INDEX idx_prediction_feedback_prediction
  ON prediction_feedback(prediction_id);
CREATE INDEX idx_prediction_feedback_user
  ON prediction_feedback(user_id);

-- Budgets
CREATE INDEX idx_budgets_user_id_period
  ON budgets(user_id, period_start, period_end);
CREATE INDEX idx_budgets_user_category
  ON budgets(user_id, category);

-- Budget snapshots
CREATE INDEX idx_budget_snapshots_budget_date
  ON budget_snapshots(budget_id, date);
CREATE INDEX idx_budget_snapshots_user
  ON budget_snapshots(user_id);

-- User badges
CREATE INDEX idx_user_badges_user_id
  ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id
  ON user_badges(badge_id);

-- Challenges
CREATE INDEX idx_challenges_creator
  ON challenges(creator_id);
CREATE INDEX idx_challenges_template
  ON challenges(is_template)
  WHERE is_template = true;

-- Challenge participants
CREATE INDEX idx_challenge_participants_challenge_user
  ON challenge_participants(challenge_id, user_id);
CREATE INDEX idx_challenge_participants_user
  ON challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_status
  ON challenge_participants(status)
  WHERE status = 'active';

-- Streak history
CREATE INDEX idx_streak_history_user
  ON streak_history(user_id);
CREATE INDEX idx_streak_history_active
  ON streak_history(user_id, streak_type)
  WHERE is_active = true;

-- XP transactions
CREATE INDEX idx_xp_transactions_user
  ON xp_transactions(user_id, created_at);

-- Friendships
CREATE INDEX idx_friendships_user_status
  ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend_status
  ON friendships(friend_id, status);

-- Friend circles
CREATE INDEX idx_friend_circles_creator
  ON friend_circles(creator_id);

-- Circle members
CREATE INDEX idx_circle_members_circle
  ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user
  ON circle_members(user_id);

-- Social nudges
CREATE INDEX idx_social_nudges_recipient
  ON social_nudges(recipient_id, is_read, created_at);
CREATE INDEX idx_social_nudges_sender
  ON social_nudges(sender_id, created_at);

-- Notifications
CREATE INDEX idx_notifications_user_read_sent
  ON notifications(user_id, is_read, sent_at);
CREATE INDEX idx_notifications_category
  ON notifications(user_id, category);
-- ============================================================
-- 009: Create triggers
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ============================================================
-- 010: Enable Supabase Realtime subscriptions
-- ============================================================

-- Enable realtime on notification-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE social_nudges;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_participants;

-- Realtime use cases:
-- 1. notifications         -> Instant push notification delivery to the client.
--                             Client subscribes to INSERT events filtered by user_id.
-- 2. social_nudges         -> Real-time nudge delivery between friends.
--                             Client subscribes to INSERT events filtered by recipient_id.
-- 3. challenge_participants -> Live leaderboard updates and progress tracking.
--                             Client subscribes to UPDATE events filtered by challenge_id
--                             to see progress changes from all participants in real time.
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
-- ============================================================
-- 013: Add requested_by column to friendships
-- ============================================================
-- The friendships table uses CHECK (user_id < friend_id) for
-- bidirectional dedup, which means either user could be in either
-- column regardless of who sent the request. This column tracks
-- who actually initiated the friend request.

ALTER TABLE friendships
  ADD COLUMN requested_by UUID
  CONSTRAINT friendships_requested_by_fkey REFERENCES profiles(id) ON DELETE CASCADE;
-- ============================================================
-- 014: Seed badge & challenge data + global leaderboard RPC
-- ============================================================

-- ============================================================
-- 1A. Seed badges (20 rows) — idempotent via ON CONFLICT
-- ============================================================
INSERT INTO badges (name, description, icon_url, tier, unlock_condition, xp_reward) VALUES
  ('Invested',
   'Complete your first 7-day check-in streak',
   '/badges/invested.png',
   'bronze',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 7}',
   50),

  ('Steadfast',
   'Maintain a 7-day budget streak (stay under budget for a full week)',
   '/badges/steadfast.png',
   'bronze',
   '{"type": "streak", "streak_type": "weekly_budget", "length": 7}',
   50),

  ('Radiant',
   'Maintain a 30-day check-in streak',
   '/badges/radiant.png',
   'silver',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 30}',
   150),

  ('Legendary',
   'Maintain a 90-day check-in streak',
   '/badges/legendary.png',
   'gold',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 90}',
   500),

  ('Prismatic',
   'Maintain a 365-day check-in streak',
   '/badges/prismatic.png',
   'diamond',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 365}',
   2000),

  ('Budget Boss',
   'Stay under budget for 3 consecutive months',
   '/badges/budget-boss.png',
   'gold',
   '{"type": "budget_streak", "months": 3}',
   500),

  ('Penny Pincher',
   'Accumulate $100+ in total savings through the app',
   '/badges/penny-pincher.png',
   'silver',
   '{"type": "savings_total", "amount": 100}',
   150),

  ('Social Butterfly',
   'Complete 5 group/friend challenges',
   '/badges/social-butterfly.png',
   'silver',
   '{"type": "challenges_completed", "count": 5, "group_only": true}',
   150),

  ('Fortune Teller',
   'Have 10 calendar-predicted spends confirmed within 20% accuracy',
   '/badges/fortune-teller.png',
   'gold',
   '{"type": "accurate_predictions", "count": 10, "accuracy_threshold": 0.2}',
   500),

  ('Early Bird',
   'Check your finances before 8:00 AM for 7 consecutive days',
   '/badges/early-bird.png',
   'bronze',
   '{"type": "early_checkin", "days": 7, "before_hour": 8}',
   50),

  ('Zero Hero',
   'Have a complete no-spend day (zero transactions)',
   '/badges/zero-hero.png',
   'bronze',
   '{"type": "zero_spend_day", "count": 1}',
   50),

  ('Challenge Champion',
   'Win 3 challenges (place 1st in your group)',
   '/badges/challenge-champion.png',
   'gold',
   '{"type": "challenge_wins", "count": 3}',
   500),

  ('Data Driven',
   'Connect all data sources: bank account + calendar + savings account',
   '/badges/data-driven.png',
   'silver',
   '{"type": "connections", "required": ["plaid", "calendar"]}',
   150),

  ('Consistent',
   'Log spending (via app check-in) for 30 consecutive days',
   '/badges/consistent.png',
   'silver',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 30}',
   150),

  ('Dedicated',
   'Maintain a 180-day (6 month) check-in streak',
   '/badges/dedicated.png',
   'gold',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 180}',
   500),

  ('Thrift Lord',
   'Save $1,000+ cumulative through the app',
   '/badges/thrift-lord.png',
   'gold',
   '{"type": "savings_total", "amount": 1000}',
   500),

  ('Prediction Pro',
   'Achieve a CCI score of 0.8+ for 4 consecutive weeks',
   '/badges/prediction-pro.png',
   'gold',
   '{"type": "cci_streak", "score": 0.8, "weeks": 4}',
   500),

  ('Night Owl',
   'Review finances after 10 PM for 7 consecutive days',
   '/badges/night-owl.png',
   'bronze',
   '{"type": "late_checkin", "days": 7, "after_hour": 22}',
   50),

  ('Versatile',
   'Complete at least one challenge from 5 different categories',
   '/badges/versatile.png',
   'silver',
   '{"type": "challenge_categories", "count": 5}',
   150),

  ('Eternal',
   'Maintain a 365-day streak of any type',
   '/badges/eternal.png',
   'diamond',
   '{"type": "any_streak", "length": 365}',
   2000)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 1B. Seed challenge templates (10 rows) — idempotent
-- ============================================================

-- Partial unique index so ON CONFLICT works for templates only
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_template_title
  ON challenges (title) WHERE is_template = true;

INSERT INTO challenges (title, description, challenge_type, duration_days, goal, reward_xp, is_template) VALUES
  ('No Eating Out Week',
   'Cook every meal for a full week. Groceries are allowed — restaurants, takeout, and food delivery are not.',
   'no_spend',
   7,
   '{"target_amount": 0, "category": "dining", "goal_type": "spending_limit"}',
   250,
   true),

  ('Coffee Savings Challenge',
   'Make coffee at home for 2 weeks. Every day you skip the coffee shop, the estimated savings ($5/day default) are tracked.',
   'savings_target',
   14,
   '{"target_amount": 70, "category": "coffee_drinks", "goal_type": "savings_target", "daily_estimate": 5}',
   150,
   true),

  ('$500 Monthly Savings Sprint',
   'Aggressively save $500 in one month through reduced spending, auto-save, and manual transfers.',
   'savings_goal',
   30,
   '{"target_amount": 500, "goal_type": "savings_target"}',
   500,
   true),

  ('Transportation Thrift',
   'No Uber, Lyft, or taxis for a week. Public transit, biking, and walking only. Gas purchases are exempt.',
   'no_spend',
   7,
   '{"target_amount": 0, "category": "transport", "goal_type": "spending_limit"}',
   200,
   true),

  ('Subscription Audit',
   'Go through your recurring transactions, identify subscriptions, and cancel at least one you are not actively using.',
   'audit',
   3,
   '{"cancellations_required": 1, "goal_type": "category_reduction"}',
   100,
   true),

  ('Zero Dollar Day Challenge',
   'Three days this week with absolutely no spending. Plan meals ahead and find free activities.',
   'no_spend',
   7,
   '{"zero_spend_days": 3, "goal_type": "spending_limit"}',
   200,
   true),

  ('Pack Lunch Week',
   'Bring lunch from home every workday. Estimated savings of $12-18/day tracked automatically.',
   'no_spend',
   5,
   '{"target_amount": 0, "category": "dining", "goal_type": "spending_limit", "workdays_only": true}',
   200,
   true),

  ('Entertainment Budget Challenge',
   'Movies, concerts, games, streaming — keep your total entertainment spend under $50 for two weeks. Find free alternatives!',
   'budget_streak',
   14,
   '{"target_amount": 50, "category": "entertainment", "goal_type": "spending_limit"}',
   250,
   true),

  ('Savings Snowball',
   'Start small and build momentum. Day 1 save $1, Day 2 save $2, and so on. Total: $28 in one week.',
   'savings_target',
   7,
   '{"target_amount": 28, "goal_type": "savings_target", "incremental": true}',
   150,
   true),

  ('Cash Only Week',
   'Withdraw a set budget in cash and use only cash for the week. Card purchases (for bills/subscriptions) are exempt. Track cash spending manually.',
   'budget_streak',
   7,
   '{"goal_type": "spending_limit", "cash_only": true}',
   300,
   true)
ON CONFLICT (title) WHERE is_template = true DO NOTHING;

-- ============================================================
-- 1C. Global leaderboard RPC (bypasses RLS with SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_global_leaderboard(result_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER,
  level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.display_name, p.avatar_url, p.xp, p.level
  FROM profiles p
  WHERE p.privacy_level != 'private'
  ORDER BY p.xp DESC
  LIMIT result_limit;
END;
$$;
