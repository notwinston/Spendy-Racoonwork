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
