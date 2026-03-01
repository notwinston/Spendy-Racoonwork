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
