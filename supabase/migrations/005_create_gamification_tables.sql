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
