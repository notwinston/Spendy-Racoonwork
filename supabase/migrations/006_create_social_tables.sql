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
