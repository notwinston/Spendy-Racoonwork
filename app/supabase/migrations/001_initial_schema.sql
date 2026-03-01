-- FutureSpend: Complete database schema
-- Run this in Supabase SQL Editor or via supabase db push

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     TEXT NOT NULL DEFAULT '',
  avatar_url       TEXT,
  friend_code      TEXT UNIQUE NOT NULL,
  monthly_income   NUMERIC(12,2),
  xp               INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  streak_count     INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  financial_health_score NUMERIC(5,2),
  privacy_level    TEXT NOT NULL DEFAULT 'friends_only',
  timezone         TEXT NOT NULL DEFAULT 'UTC',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. PLAID_CONNECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plaid_connections (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plaid_item_id          TEXT UNIQUE NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  institution_name       TEXT NOT NULL,
  institution_id         TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'active',
  last_sync_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plaid_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own plaid_connections" ON public.plaid_connections FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 3. ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plaid_connection_id UUID REFERENCES public.plaid_connections(id) ON DELETE SET NULL,
  plaid_account_id    TEXT NOT NULL,
  name                TEXT NOT NULL,
  official_name       TEXT,
  type                TEXT,
  subtype             TEXT,
  current_balance     NUMERIC(12,2),
  available_balance   NUMERIC(12,2),
  currency            TEXT NOT NULL DEFAULT 'CAD',
  last_updated        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id            UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  plaid_transaction_id  TEXT,
  amount                NUMERIC(12,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'CAD',
  merchant_name         TEXT,
  category              TEXT NOT NULL,
  subcategory           TEXT,
  date                  DATE NOT NULL,
  pending               BOOLEAN NOT NULL DEFAULT false,
  is_recurring          BOOLEAN NOT NULL DEFAULT false,
  recurring_group_id    TEXT,
  reviewed              BOOLEAN NOT NULL DEFAULT false,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 5. RECURRING_TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merchant_name      TEXT NOT NULL,
  category           TEXT NOT NULL,
  avg_amount         NUMERIC(12,2) NOT NULL,
  frequency          TEXT NOT NULL DEFAULT 'monthly',
  next_expected_date DATE,
  last_occurrence    DATE,
  confidence         NUMERIC(3,2),
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own recurring_transactions" ON public.recurring_transactions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 6. BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  monthly_limit NUMERIC(12,2) NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, period_start)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 7. CALENDAR_CONNECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider               TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  calendar_ids           TEXT[],
  last_sync_at           TIMESTAMPTZ,
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own calendar_connections" ON public.calendar_connections FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 8. CALENDAR_EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  external_id             TEXT,
  calendar_connection_id  UUID REFERENCES public.calendar_connections(id) ON DELETE SET NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  location                TEXT,
  start_time              TIMESTAMPTZ NOT NULL,
  end_time                TIMESTAMPTZ,
  is_all_day              BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule         TEXT,
  attendee_count          INTEGER NOT NULL DEFAULT 0,
  category                TEXT NOT NULL,
  raw_data                JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON public.calendar_events(user_id, start_time);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own calendar_events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 9. SPENDING_PREDICTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.spending_predictions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  calendar_event_id  UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  predicted_category TEXT NOT NULL,
  predicted_amount   NUMERIC(12,2) NOT NULL,
  prediction_low     NUMERIC(12,2),
  prediction_high    NUMERIC(12,2),
  confidence_score   NUMERIC(3,2),
  confidence_label   TEXT,
  model_version      TEXT,
  explanation        TEXT,
  actual_amount      NUMERIC(12,2),
  was_accurate       BOOLEAN,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spending_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own spending_predictions" ON public.spending_predictions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 10. PREDICTION_FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prediction_feedback (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prediction_id      UUID REFERENCES public.spending_predictions(id) ON DELETE SET NULL,
  feedback_type      TEXT NOT NULL,
  corrected_category TEXT,
  corrected_amount   NUMERIC(12,2),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prediction_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own prediction_feedback" ON public.prediction_feedback FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 11. BADGES (system data — public read)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.badges (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  icon_url         TEXT,
  tier             TEXT NOT NULL DEFAULT 'bronze',
  unlock_condition JSONB NOT NULL DEFAULT '{}',
  xp_reward        INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are publicly readable" ON public.badges FOR SELECT USING (true);

-- ============================================================
-- 12. USER_BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id    TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own user_badges" ON public.user_badges FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 13. XP_TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,
  source       TEXT NOT NULL,
  reference_id TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own xp_transactions" ON public.xp_transactions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 14. STREAK_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.streak_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  length      INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own streak_history" ON public.streak_history FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 15. CHALLENGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  challenge_type  TEXT NOT NULL,
  duration_days   INTEGER NOT NULL,
  goal            JSONB NOT NULL DEFAULT '{}',
  reward_xp       INTEGER NOT NULL DEFAULT 0,
  is_template     BOOLEAN NOT NULL DEFAULT false,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are public" ON public.challenges FOR SELECT USING (is_template = true);
CREATE POLICY "Users own challenges" ON public.challenges FOR ALL USING (auth.uid() = creator_id);

-- ============================================================
-- 16. CHALLENGE_PARTICIPANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress     JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'active',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own challenge_participants" ON public.challenge_participants FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 17. FRIENDSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at  TIMESTAMPTZ,
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users manage own friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = requested_by);
CREATE POLICY "Users update own friendships" ON public.friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users delete own friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================================
-- 18. FRIEND_CIRCLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.friend_circles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  max_members INTEGER NOT NULL DEFAULT 20,
  invite_code TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Circles readable by members" ON public.friend_circles FOR SELECT USING (true);
CREATE POLICY "Creator manages circles" ON public.friend_circles FOR ALL USING (auth.uid() = creator_id);

-- ============================================================
-- 19. CIRCLE_MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.circle_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.friend_circles(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own circle_members" ON public.circle_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Members can view circle" ON public.circle_members FOR SELECT USING (
  circle_id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid())
);

-- ============================================================
-- 20. SOCIAL_NUDGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.social_nudges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nudge_type   TEXT NOT NULL DEFAULT 'encouragement',
  content      TEXT NOT NULL,
  reference_id TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipients see nudges" ON public.social_nudges FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);
CREATE POLICY "Users send nudges" ON public.social_nudges FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients update nudges" ON public.social_nudges FOR UPDATE USING (auth.uid() = recipient_id);

-- ============================================================
-- Seed: Default badge definitions
-- ============================================================
INSERT INTO public.badges (id, name, description, tier, unlock_condition, xp_reward) VALUES
  ('first-forecast',    'First Forecast',    'Made your first spending prediction',           'bronze',  '{"type":"prediction_count","threshold":1}',   50),
  ('crystal-ball',      'Crystal Ball',      'Made 10 accurate predictions',                  'silver',  '{"type":"accurate_predictions","threshold":10}', 100),
  ('budget-guardian',   'Budget Guardian',    'Stayed under budget for a full month',          'silver',  '{"type":"budget_streak_days","threshold":30}', 150),
  ('hidden-cost-hunter','Hidden Cost Hunter', 'Discovered 5 hidden costs before spending',     'bronze',  '{"type":"hidden_costs_found","threshold":5}',  75),
  ('prediction-master', 'Prediction Master',  'Achieved 90% prediction accuracy over 30 days', 'gold',    '{"type":"accuracy_percent","threshold":90}',   200),
  ('financial-sage',    'Financial Sage',     'Reached level 10',                              'gold',    '{"type":"level","threshold":10}',             250),
  ('social-saver',      'Social Saver',      'Completed 3 group challenges',                  'silver',  '{"type":"group_challenges","threshold":3}',   125),
  ('streak-legend',     'Streak Legend',      'Maintained a 30-day streak',                    'gold',    '{"type":"streak_days","threshold":30}',       200),
  ('budget-boss',       'Budget Boss',       'Created budgets for 5 categories',               'bronze',  '{"type":"budget_categories","threshold":5}',   50),
  ('penny-pincher',     'Penny Pincher',     'Saved $500 in a single month',                   'silver',  '{"type":"monthly_savings","threshold":500}',  150),
  ('zero-hero',         'Zero Hero',         'Had a $0 spend day',                             'bronze',  '{"type":"zero_spend_days","threshold":1}',     25),
  ('challenge-champion','Challenge Champion', 'Completed 10 challenges',                       'gold',    '{"type":"challenges_completed","threshold":10}', 200),
  ('data-driven',       'Data Driven',       'Reviewed 50 transactions',                       'bronze',  '{"type":"reviewed_transactions","threshold":50}', 75),
  ('early-bird',        'Early Bird',        'Checked the app before 8 AM for 7 days',         'bronze',  '{"type":"early_checkins","threshold":7}',      50),
  ('night-owl',         'Night Owl',         'Logged spending after 10 PM for 7 days',         'bronze',  '{"type":"late_checkins","threshold":7}',       50),
  ('consistent',        'Consistent',        'Used the app every day for 14 days',             'silver',  '{"type":"daily_usage","threshold":14}',       100),
  ('dedicated',         'Dedicated',         'Used the app every day for 30 days',             'gold',    '{"type":"daily_usage","threshold":30}',       200),
  ('versatile',         'Versatile',         'Tracked spending in 8+ categories',              'silver',  '{"type":"category_count","threshold":8}',     100),
  ('thrift-lord',       'Thrift Lord',       'Reduced spending by 20% month-over-month',       'gold',    '{"type":"spending_reduction_pct","threshold":20}', 200),
  ('eternal',           'Eternal',           'Maintained a 100-day streak',                    'diamond', '{"type":"streak_days","threshold":100}',      500)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Auto-create profile on signup trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, friend_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'friend_code', upper(substr(md5(random()::text), 1, 8)))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
