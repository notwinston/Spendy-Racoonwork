# FutureSpend — Data Ingestion Implementation Guide

> How to replace every simulated data source with real integrations.

---

## Credentials

```env
EXPO_PUBLIC_SUPABASE_URL='sb_publishable_Gd-y2TJuzP48h4Ix_t0nkQ_lfR7Qgbk'
EXPO_PUBLIC_SUPABASE_ANON_KEY='sb_secret_CDhMHq3t3KrMlFVUaGhuhg_3TcFgUN2'

EXPO_PUBLIC_GEMINI_API_KEY='AIzaSyCeIQGpsyw9hgi7bpm4qlSMYVJBj4eVpZg'
EXPO_PUBLIC_LLM_PROVIDER=gemini
```

**We are using Gemini as our LLM provider.** All LLM calls (receipt scanning, price predictions, AI chat, insight generation) should use the Gemini API, NOT Claude. Use the `parseReceiptGemini()` path for receipt scanning, and configure the LLM adapter to default to Gemini everywhere. Claude is not available for this project.

## IMPORTANT: Migration Files Do Not Exist Yet — Create Them

The database schema is fully documented in Section 0 of this document (the Complete Database Schema starting around line 106, plus the migration SQL in the "Migration SQL" section around line 863). However, the actual `.sql` migration files (`supabase/migrations/001` through `010`) **do not exist on disk yet**.

**Before implementing any data ingestion feature, you MUST:**

1. Create the directory `supabase/migrations/` at the project root
2. Read the complete schema from this document (Section 0: all table definitions, ENUMs, RLS policies, indexes, triggers, and seed data)
3. Generate the migration `.sql` files from that schema, split logically:
   - `001_create_enums.sql` — all 15 custom ENUM types
   - `002_create_core_tables.sql` — profiles, calendar_connections, calendar_events, plaid_connections, accounts, transactions, recurring_transactions
   - `003_create_prediction_tables.sql` — spending_predictions, prediction_feedback
   - `004_create_budget_tables.sql` — budgets, budget_snapshots
   - `005_create_gamification_tables.sql` — badges, user_badges, challenges, challenge_participants, streak_history, xp_transactions
   - `006_create_social_tables.sql` — friendships, friend_circles, circle_members, social_nudges, notifications
   - `007_create_rls_policies.sql` — all 48 RLS policies
   - `008_create_indexes.sql` — all 32 indexes
   - `009_create_triggers_functions.sql` — handle_new_user trigger, update_updated_at trigger
   - `010_seed_data.sql` — 20 badges + 10 challenge templates
   - `011_create_metrics_tables.sql` — the additional metrics tables from the "Migration SQL — New Tables" section
4. Run them against Supabase using either `supabase db push` or by pasting into the Supabase SQL Editor

**Do not skip this step.** Every store in the app checks `isSupabaseConfigured` and will attempt to read/write these tables once the env vars are set.

## Implementation Scope — What to Build, What to Skip

We are running on **Expo Go** (no EAS dev build). This constrains which features are possible.

**Build these (in order):**

1. **Migration SQL files** — Create all 11 `.sql` files from the schema in this document and run them against Supabase
2. **Receipt scanning with camera** — `expo-camera` + `expo-image-picker` + Gemini Vision API. Works in Expo Go.
3. **Apple Calendar** — `expo-calendar` reads the device's local calendars. No OAuth, no API keys, no EAS build. Works in Expo Go (read-only).
4. **Manual calendar entry with price prediction** — User types "Lunch at Earls on Friday" → Gemini parses it into a structured event + spending prediction. Pure frontend + LLM, no native modules.

**Skip these (require EAS dev build or API keys we don't have):**

- **Google Calendar** — requires `@react-native-google-signin/google-signin` (native module, no Expo Go) + Google Cloud Console OAuth setup + `GoogleService-Info.plist`
- **Microsoft Outlook** — requires Azure AD app registration. Lower priority.
- **Plaid bank integration** — requires `react-native-plaid-link-sdk` (native module, no Expo Go) + backend Edge Functions + Plaid dashboard signup. Most complex integration.
- **Cross-institution tracking** — depends on Plaid being implemented first

---

## Table of Contents

0. [Supabase Setup — Do This First](#0-supabase-setup--do-this-first)
1. [Plaid, Google Calendar, Microsoft Outlook (Deferred)](#1-plaid-google-calendar-microsoft-outlook-deferred) → see [EXTERNAL-INTEGRATIONS.md](./EXTERNAL-INTEGRATIONS.md)
2. [Calendar Integration (Apple Calendar)](#2-calendar-integration)
3. [Camera Integration — Receipt Scanning](#3-camera-integration--receipt-scanning)
4. [Manual Calendar Entry with Price Prediction](#4-manual-calendar-entry-with-price-prediction)
5. [Architecture Summary](#5-architecture-summary)

---

## 0. Supabase Setup — Do This First

### Why First

Every other feature in this document — Plaid transactions, calendar sync, receipt scanning, predictions, gamification — needs a database to persist to. Without Supabase, every piece of data lives in Zustand and vanishes on app reload. Supabase is also the cheapest and fastest integration: no native modules, no EAS build, no third-party API keys. Just a free project and two environment variables.

### What You Already Have

The schema is fully written across 10 migration files in `/workspace/supabase/migrations/`. It defines:

- **22 tables** across 6 domains
- **15 custom ENUM types**
- **48 RLS policies** (row-level security on every table)
- **32 indexes** for query performance
- **2 triggers** (auto-create profile on signup, auto-update timestamps)
- **3 realtime-enabled tables** (notifications, nudges, challenge participants)
- **Seed data**: 20 badges + 10 challenge templates

The app code already has Supabase queries in every store — they're just gated behind `isDemoMode()` and `isSupabaseConfigured` checks that currently return true/false respectively.

### Step-by-Step Setup

#### Step 1: Create a Supabase Project

1. Go to https://supabase.com → New Project
2. Choose a region close to your users (e.g., `us-west-1` for Vancouver)
3. Set a strong database password — save it somewhere secure
4. Wait ~2 minutes for provisioning
5. From Project Settings → API, copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/public key** (starts with `eyJ...`)

#### Step 2: Set Environment Variables

Create `/workspace/app/.env` (this file is gitignored):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

This single change flips `isDemoMode()` to `false` and `isSupabaseConfigured` to `true`, activating every Supabase code path in the app.

#### Step 3: Run Migrations

**Option A: Supabase CLI (recommended)**

```bash
# Install CLI if needed
npm install -g supabase

# Link to your project
cd /workspace
supabase link --project-ref your-project-id

# Run all migrations in order
supabase db push

# Seed badge and challenge data
supabase db reset --db-url postgresql://postgres:YOUR_PASSWORD@db.your-project-id.supabase.co:5432/postgres
```

**Option B: SQL Editor (manual)**

1. Go to your Supabase dashboard → SQL Editor
2. Run each migration file in order (001 through 010)
3. Run `seed.sql` last

The migrations are idempotent — they use `CREATE TYPE IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` where possible.

#### Step 4: Verify

After running migrations, check in the Supabase dashboard:

- **Table Editor**: Should show 22 tables
- **Auth → Policies**: Should show RLS enabled on all tables
- **Database → Functions**: Should show `handle_new_user` and `update_updated_at`
- **Realtime**: Should show `notifications`, `social_nudges`, `challenge_participants` enabled

#### Step 5: Test Auth Flow

1. Start the app: `cd /workspace/app && npx expo start`
2. Go to the Signup screen (not persona login)
3. Create an account with a real email
4. Check Supabase dashboard → Auth → Users — your user should appear
5. Check Table Editor → `profiles` — a profile row should exist (created by the `handle_new_user` trigger)

### Complete Database Schema

#### Domain: Core (7 tables)

```
profiles
├── id: UUID (PK, FK -> auth.users)
├── display_name: TEXT
├── avatar_url: TEXT?
├── friend_code: TEXT (UNIQUE, auto-generated 8-char hex)
├── xp: INTEGER (default 0)
├── level: INTEGER (default 1)
├── streak_count: INTEGER (default 0)
├── longest_streak: INTEGER (default 0)
├── financial_health_score: FLOAT?        ← NOT CURRENTLY WRITTEN BY APP
├── privacy_level: privacy_level (default 'friends_only')
├── timezone: TEXT (default 'America/Vancouver')
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ (auto-updated via trigger)

calendar_connections
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── provider: calendar_provider {google|apple|outlook|ical}
├── access_token_encrypted: TEXT
├── refresh_token_encrypted: TEXT?
├── calendar_ids: JSONB (default [])
├── last_sync_at: TIMESTAMPTZ?
├── is_active: BOOLEAN (default true)
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, provider)

calendar_events
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── external_id: TEXT?
├── calendar_connection_id: UUID? (FK -> calendar_connections)
├── title: TEXT
├── description: TEXT?
├── location: TEXT?
├── start_time: TIMESTAMPTZ
├── end_time: TIMESTAMPTZ?
├── is_all_day: BOOLEAN (default false)
├── recurrence_rule: TEXT?
├── attendee_count: INTEGER (default 1)
├── category: event_category (default 'other')
├── raw_data: JSONB?
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, external_id, calendar_connection_id)

plaid_connections
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── plaid_item_id: TEXT (UNIQUE)
├── access_token_encrypted: TEXT
├── institution_name: TEXT
├── institution_id: TEXT
├── status: plaid_status {active|needs_reauth|revoked|error}
├── last_sync_at: TIMESTAMPTZ?
└── created_at: TIMESTAMPTZ

accounts
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── plaid_connection_id: UUID (FK -> plaid_connections)
├── plaid_account_id: TEXT (UNIQUE)
├── name: TEXT
├── official_name: TEXT?
├── type: TEXT (chequing, savings, credit, etc.)
├── subtype: TEXT?
├── current_balance: FLOAT?
├── available_balance: FLOAT?
├── currency: TEXT (default 'CAD')
├── last_updated: TIMESTAMPTZ
└── created_at: TIMESTAMPTZ

transactions
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── account_id: UUID (FK -> accounts)
├── plaid_transaction_id: TEXT? (UNIQUE)
├── amount: FLOAT
├── currency: TEXT (default 'CAD')
├── merchant_name: TEXT?
├── category: event_category (default 'other')
├── subcategory: TEXT?
├── date: DATE
├── pending: BOOLEAN (default false)
├── is_recurring: BOOLEAN (default false)
├── recurring_group_id: UUID?
├── reviewed: BOOLEAN (default false)
├── notes: TEXT?
└── created_at: TIMESTAMPTZ

recurring_transactions
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── merchant_name: TEXT
├── category: event_category (default 'other')
├── avg_amount: FLOAT
├── frequency: transaction_frequency {weekly|biweekly|monthly|quarterly|yearly}
├── next_expected_date: DATE?
├── last_occurrence: DATE?
├── confidence: FLOAT (default 0.0)
├── is_active: BOOLEAN (default true)
└── created_at: TIMESTAMPTZ
```

#### Domain: Predictions (2 tables)

```
spending_predictions
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── calendar_event_id: UUID (FK -> calendar_events)
├── predicted_category: event_category
├── predicted_amount: FLOAT
├── prediction_low: FLOAT
├── prediction_high: FLOAT
├── confidence_score: FLOAT (CHECK 0..1)
├── confidence_label: confidence_label {high|medium|low}
├── confidence_decay_lambda: FLOAT (default 0.05)   ← MVP 5.1: λ for exponential decay
├── model_version: TEXT (default 'v1.0')
├── explanation: TEXT?
├── actual_amount: FLOAT?               ← for accuracy tracking after the fact
├── was_accurate: BOOLEAN?              ← set after comparison with real transaction
├── matched_transaction_id: UUID? (FK -> transactions)  ← links prediction to actual spend
└── created_at: TIMESTAMPTZ

prediction_feedback
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── prediction_id: UUID (FK -> spending_predictions)
├── feedback_type: feedback_type {correct|wrong_category|wrong_amount|did_not_happen}
├── corrected_category: event_category?
├── corrected_amount: FLOAT?
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, prediction_id)
```

#### Domain: Budgets (2 tables)

```
budgets
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── category: event_category
├── monthly_limit: FLOAT (CHECK > 0)
├── period_start: DATE
├── period_end: DATE (CHECK > period_start)
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, category, period_start)

budget_snapshots                          ← for historical trend charts
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── budget_id: UUID (FK -> budgets)
├── date: DATE
├── spent_amount: FLOAT (default 0)
├── predicted_remaining: FLOAT (default 0)
├── burn_rate: FLOAT (default 0)
├── created_at: TIMESTAMPTZ
└── UNIQUE(budget_id, date)
```

#### Domain: Gamification (6 tables)

```
badges (20 rows seeded)
├── id: UUID (PK)
├── name: TEXT (UNIQUE)
├── description: TEXT
├── icon_url: TEXT?
├── tier: badge_tier {bronze|silver|gold|diamond}
├── unlock_condition: JSONB
├── xp_reward: INTEGER (default 0)
└── created_at: TIMESTAMPTZ

user_badges
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── badge_id: UUID (FK -> badges)
├── earned_at: TIMESTAMPTZ
├── is_notified: BOOLEAN (default false)
└── UNIQUE(user_id, badge_id)

challenges (10 templates seeded)
├── id: UUID (PK)
├── creator_id: UUID? (FK -> profiles)
├── title: TEXT
├── description: TEXT?
├── challenge_type: TEXT
├── duration_days: INTEGER (CHECK > 0)
├── goal: JSONB
├── reward_xp: INTEGER (default 100)
├── is_template: BOOLEAN (default false)
├── starts_at: TIMESTAMPTZ?
├── ends_at: TIMESTAMPTZ?
└── created_at: TIMESTAMPTZ

challenge_participants (realtime enabled)
├── id: UUID (PK)
├── challenge_id: UUID (FK -> challenges)
├── user_id: UUID (FK -> profiles)
├── progress: JSONB (default {})
├── status: participant_status {active|completed|failed|withdrawn}
├── joined_at: TIMESTAMPTZ
├── completed_at: TIMESTAMPTZ?
└── UNIQUE(challenge_id, user_id)

streak_history
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── streak_type: streak_type {daily_checkin|weekly_budget|savings}
├── start_date: DATE
├── end_date: DATE?
├── length: INTEGER (default 1)
├── is_active: BOOLEAN (default true)
└── created_at: TIMESTAMPTZ

xp_transactions
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── amount: INTEGER
├── source: xp_source {checkin|budget|challenge|prediction|review|social|referral}
├── reference_id: UUID?
├── description: TEXT?
└── created_at: TIMESTAMPTZ
```

#### Domain: Social (5 tables)

```
friendships
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── friend_id: UUID (FK -> profiles)
├── status: friendship_status {pending|accepted|blocked}
├── created_at: TIMESTAMPTZ
├── accepted_at: TIMESTAMPTZ?
├── CHECK(user_id < friend_id)           ← prevents duplicates and self-friending
└── UNIQUE(user_id, friend_id)

friend_circles
├── id: UUID (PK)
├── creator_id: UUID (FK -> profiles)
├── name: TEXT
├── description: TEXT?
├── max_members: INTEGER (default 20)
├── invite_code: TEXT (UNIQUE, auto-generated 6-char hex)
└── created_at: TIMESTAMPTZ

circle_members
├── id: UUID (PK)
├── circle_id: UUID (FK -> friend_circles)
├── user_id: UUID (FK -> profiles)
├── role: circle_role {admin|member}
├── joined_at: TIMESTAMPTZ
└── UNIQUE(circle_id, user_id)

social_nudges (realtime enabled)
├── id: UUID (PK)
├── sender_id: UUID (FK -> profiles)
├── recipient_id: UUID (FK -> profiles)
├── nudge_type: nudge_type {encouragement|challenge_invite|celebration|reminder}
├── content: TEXT
├── reference_id: UUID?
├── is_read: BOOLEAN (default false)
└── created_at: TIMESTAMPTZ

notifications (realtime enabled)
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── title: TEXT
├── body: TEXT
├── category: TEXT?                      ← free text, not enum-constrained
├── priority: notification_priority {high|medium|low}
├── data: JSONB?
├── is_read: BOOLEAN (default false)
├── sent_at: TIMESTAMPTZ
└── read_at: TIMESTAMPTZ?
```

#### Domain: Metrics & Analytics (8 new tables)

These tables support every computed metric from MVP.md Section 5. None exist in the current schema — all require new migrations.

```
spending_velocity_daily                    ← MVP 5.3: Spending Velocity
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── date: DATE
├── raw_velocity: FLOAT                   ← V(t) = ΔSpending / 7 days
├── smoothed_velocity: FLOAT              ← EWMA: 0.3 × V(t) + 0.7 × V_smooth(t-1)
├── daily_spend: FLOAT                    ← total spend for this day
├── rolling_7d_spend: FLOAT               ← sum of last 7 days
├── projected_overspend_date: DATE?       ← today + remaining_budget / V_smooth
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, date)

category_risk_scores                       ← MVP 5.5: CV / Risk Score
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── category: event_category
├── cv_score: FLOAT                       ← σ(daily_spend) / μ(daily_spend) over 30 days
├── mean_daily_spend: FLOAT
├── stddev_daily_spend: FLOAT
├── sample_days: INTEGER                  ← number of days with spending in window
├── computed_at: TIMESTAMPTZ
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, category, (computed_at::date))

cci_scores                                 ← MVP 5.6: Calendar Correlation Index
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── category: event_category?             ← NULL = overall CCI, non-null = per-category
├── hit_rate: FLOAT                       ← predicted_with_spend / total_predicted
├── avg_accuracy_weight: FLOAT            ← mean of (1 - |pred-actual|/max(pred,actual))
├── cci_value: FLOAT                      ← hit_rate × avg_accuracy_weight
├── period_start: TIMESTAMPTZ
├── period_end: TIMESTAMPTZ
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, category, period_start)

health_score_snapshots                     ← MVP 5.8: Health Score weekly trending
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── date: DATE
├── overall_score: FLOAT (CHECK 0..100)
├── grade: TEXT                           ← A+, A, B, C, D, F
├── budget_adherence: FLOAT (CHECK 0..100)
├── savings_rate: FLOAT (CHECK 0..100)
├── spending_stability: FLOAT (CHECK 0..100)
├── calendar_correlation: FLOAT (CHECK 0..100)
├── streak_bonus: FLOAT (CHECK 0..100)
├── trend: FLOAT?                         ← score - previous_score
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, date)

savings_goals                              ← MVP 5.2: Compound Savings Projections
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── name: TEXT                            ← "Emergency Fund", "Vacation", etc.
├── target_amount: FLOAT (CHECK > 0)
├── current_amount: FLOAT (default 0)
├── monthly_contribution: FLOAT (default 0)
├── annual_interest_rate: FLOAT (default 0.04)  ← 4% default
├── target_date: DATE?
├── is_active: BOOLEAN (default true)
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

savings_rules                              ← MVP 5.9: Smart Savings Rules
├── id: UUID (PK)
├── user_id: UUID UNIQUE (FK -> profiles)  ← one config per user
├── round_up_enabled: BOOLEAN (default false)
├── round_up_multiplier: FLOAT (default 1.0)   ← 1x, 2x, 3x round-up
├── save_the_difference_enabled: BOOLEAN (default false)
├── save_the_difference_rate: FLOAT (default 0.5)  ← 50% of savings captured
├── daily_sweep_enabled: BOOLEAN (default false)
├── monthly_cap_pct: FLOAT (default 0.15)      ← max 15% of income auto-saved
├── target_savings_goal_id: UUID? (FK -> savings_goals)
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

auto_save_transactions                     ← MVP 5.9: Auto-save log
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── savings_goal_id: UUID? (FK -> savings_goals)
├── trigger_type: TEXT                    ← 'event_match', 'daily_sweep', 'round_up'
├── trigger_reference_id: UUID?           ← prediction_id or transaction_id
├── amount: FLOAT (CHECK > 0)
├── predicted_amount: FLOAT?              ← what was predicted
├── actual_amount: FLOAT?                 ← what was actually spent
├── status: TEXT (default 'pending')      ← 'pending', 'completed', 'cancelled'
├── created_at: TIMESTAMPTZ
└── completed_at: TIMESTAMPTZ?

seasonal_factors                           ← MVP 5.1: Seasonal adjustment
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── category: event_category
├── month: INTEGER (CHECK 1..12)          ← calendar month
├── adjustment_factor: FLOAT (default 1.0)  ← multiplier (e.g., 1.3 = 30% higher in Dec)
├── sample_size: INTEGER (default 0)      ← months of data this is based on
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, category, month)
```

#### New columns on existing tables

```
profiles (add columns)
├── monthly_income: FLOAT?                ← for SavingsRate computation (MVP 5.8)
├── cci_score: FLOAT?                     ← cached overall CCI (MVP 5.6)
└── savings_efficiency: FLOAT?            ← cached η score (MVP 5.7)

income_sources                             ← detailed income tracking
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── source_name: TEXT                     ← "Salary", "Freelance", etc.
├── amount: FLOAT
├── frequency: transaction_frequency (default 'monthly')
├── is_active: BOOLEAN (default true)
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

daily_checkins                             ← for Early Bird / Night Owl badges
├── id: UUID (PK)
├── user_id: UUID (FK -> profiles)
├── checked_in_at: TIMESTAMPTZ (default now())
├── xp_awarded: INTEGER (default 10)
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, (checked_in_at::date))

metrics_computation_log                    ← MVP 5.10: track computation runs
├── id: UUID (PK)
├── metric_name: TEXT                     ← 'spending_velocity', 'cv_risk', 'cci', 'health_score', etc.
├── user_id: UUID? (FK -> profiles)       ← NULL for system-wide runs
├── started_at: TIMESTAMPTZ
├── completed_at: TIMESTAMPTZ?
├── duration_ms: INTEGER?
├── status: TEXT (default 'running')      ← 'running', 'completed', 'failed'
├── error_message: TEXT?
└── created_at: TIMESTAMPTZ
```

### Computed Metrics and What Feeds Them (aligned with MVP.md Section 5)

These are ALL the metrics specified in MVP.md. Each maps to database tables defined above + the new Metrics & Analytics domain below.

---

#### 5.1 Predictive Budget Formula

```
PredictedSpend(t) = Σ(EventCost_i × Confidence_i) + RecurringExpenses(t) + SeasonalAdjustment(t)
```

With confidence decay: `Confidence_i(t) = Confidence_i(t0) × e^(-λ × (t - t0))`, λ = 0.05

| Variable | Formula | Data Source |
|---|---|---|
| `EventCost_i` | Per-event predicted amount | `spending_predictions.predicted_amount` |
| `Confidence_i` | Decayed confidence | `spending_predictions.confidence_score` × `e^(-0.05 × days_since_prediction)` using `spending_predictions.created_at` |
| `RecurringExpenses(t)` | Sum of active recurring amounts for period | `recurring_transactions` WHERE `is_active = true` AND `next_expected_date` in range |
| `SeasonalAdjustment(t)` | Historical same-month multiplier | `seasonal_factors` table (new) |

**Computation**: On calendar sync + daily recalculation. Latency target < 2s.

---

#### 5.2 Compound Savings Projections

```
FV = PV(1 + r)^n + PMT × ((1 + r)^n - 1) / r
```

| Variable | Description | Data Source |
|---|---|---|
| `PV` | Current savings balance | `savings_goals.current_amount` (new table) |
| `r` | Monthly interest rate | `savings_goals.annual_interest_rate / 12` |
| `n` | Months remaining | `savings_goals.target_date - now()` in months |
| `PMT` | Monthly contribution | `savings_goals.monthly_contribution` |

Three projection lines: conservative (r×0.5), expected (r), optimistic (r×1.5).

**Computation**: On demand when user opens projections screen. Latency target < 500ms.

---

#### 5.3 Spending Velocity

```
V(t) = ΔSpending / ΔTime    (7-day rolling window)
V_smooth(t) = 0.3 × V(t) + 0.7 × V_smooth(t-1)    (EWMA smoothing)
```

Projected overspend date = `today + (remaining_budget / V_smooth)` if V_smooth > daily_budget.

| Value | Source |
|---|---|
| `ΔSpending` | Sum of transactions in last 7 days |
| `V(t)` | `spending_velocity_daily.raw_velocity` (new table) |
| `V_smooth(t)` | `spending_velocity_daily.smoothed_velocity` |
| `remaining_budget` | `SUM(budgets.monthly_limit) - SUM(transactions for month)` |

**Computation**: Event-driven on every new transaction. Latency target < 200ms.

---

#### 5.4 Burn Rate (per-category and overall)

```
BurnRate = (CurrentSpending / ElapsedDays) × TotalDays / TotalBudget
```

| Value | Source |
|---|---|
| `TotalBudget` | `SUM(budgets.monthly_limit)` for current period |
| `CurrentSpending` | `SUM(ABS(transactions.amount))` for current month |
| `ElapsedDays` | `EXTRACT(DAY FROM now())` |
| `TotalDays` | Days in current month |

Color thresholds: ≤0.8 green, ≤1.0 blue, ≤1.2 yellow, >1.2 red.

Per-category burn rate stored in `budget_snapshots.burn_rate` (one snapshot per budget per day).

**Computation**: Event-driven on every new transaction + hourly refresh. Latency target < 100ms.

---

#### 5.5 Risk/Volatility Score (CV per category)

```
CV_category = σ(daily_spend) / μ(daily_spend)    over 30-day window
```

| Value | Source |
|---|---|
| `σ(daily_spend)` | Standard deviation of daily totals per category |
| `μ(daily_spend)` | Mean of daily totals per category |
| Result | `category_risk_scores.cv_score` (new table) |

Higher CV = more volatile/risky category. Used in SpendingStability component of Health Score.

**Computation**: Daily at midnight. Latency target < 5s.

---

#### 5.6 Calendar Correlation Index (CCI)

```
CCI = Σ(predicted_events_with_actual_spend) / Σ(total_predicted_events) × accuracy_weight
accuracy_weight = 1 - |predicted - actual| / max(predicted, actual)
```

| CCI Range | Interpretation |
|---|---|
| 0.8 - 1.0 | Excellent — calendar is a strong spending predictor |
| 0.6 - 0.8 | Good — calendar captures most spending triggers |
| 0.4 - 0.6 | Moderate — some spending is calendar-driven |
| 0.2 - 0.4 | Weak — spending mostly unrelated to calendar |
| 0.0 - 0.2 | Poor — calendar data is not predictive |

**Adaptive Weighting** feeds back into Predictive Budget:

```
calendar_weight = min(0.6, CCI × 0.7)
historical_weight = 1.0 - calendar_weight
```

**Per-Category CCI** also tracked (e.g., "Social" CCI might be 0.85 while "Work" CCI is 0.3).

| Value | Source |
|---|---|
| Hit rate | `COUNT(predictions WHERE actual_amount IS NOT NULL) / COUNT(predictions)` from `spending_predictions` |
| Accuracy weight | `1 - ABS(predicted_amount - actual_amount) / GREATEST(predicted_amount, actual_amount)` |
| Overall CCI | `cci_scores.overall_cci` (new table) |
| Per-category CCI | `cci_scores` with category column |
| Profile CCI | `profiles.cci_score` (new column) |

**Computation**: Weekly batch (Sunday night). Latency target < 30s.

---

#### 5.7 Savings Efficiency Score

```
η = (ActualSaved / PredictedSaveable) × 100
PredictedSaveable = Σ max(0, PredictedAmount_i - ActualAmount_i)   for all events i
```

| η Range | Meaning |
|---|---|
| 80-100% | Capturing nearly all potential savings |
| 50-80% | Good savings behavior, room to optimize |
| 20-50% | Savings opportunities being missed |
| < 20% | Not acting on savings opportunities; increase nudge frequency |

When `η < 50%`, generate weekly insight nudge.

| Value | Source |
|---|---|
| `ActualSaved` | `SUM(auto_save_transactions.amount)` (new table) |
| `PredictedSaveable` | Computed from `spending_predictions` WHERE `actual_amount < predicted_amount` |

---

#### 5.8 Financial Health Score (Composite — 5 components)

```
HealthScore = w1×BudgetAdherence + w2×SavingsRate + w3×SpendingStability + w4×CalendarCorrelation + w5×StreakBonus
```

| Weight | Component | Range (0-100) | Formula | Data Source |
|---|---|---|---|---|
| **w1 = 0.30** | BudgetAdherence | 0-100 | `max(0, 100 - (overspend_pct × 2))` | `transactions` vs `budgets` |
| **w2 = 0.25** | SavingsRate | 0-100 | `min(100, (monthly_saved / monthly_income) × 500)` — 20% = perfect | `income_sources` (new) + `transactions` |
| **w3 = 0.20** | SpendingStability | 0-100 | `max(0, 100 - (avg_CV_across_categories × 100))` | `category_risk_scores.cv_score` (new) |
| **w4 = 0.15** | CalendarCorrelation | 0-100 | `CCI × 100` | `cci_scores.overall_cci` (new) |
| **w5 = 0.10** | StreakBonus | 0-100 | `min(100, current_streak_days × 3.33)` — 30 days = full | `profiles.streak_count` |

**Grade Mapping:**

| Score | Grade | Color | Label |
|---|---|---|---|
| 90-100 | A+ | `#22C55E` | Outstanding |
| 80-89 | A | `#4ADE80` | Excellent |
| 70-79 | B | `#86EFAC` | Good |
| 60-69 | C | `#FACC15` | Fair |
| 50-59 | D | `#F97316` | Needs Improvement |
| 0-49 | F | `#EF4444` | At Risk |

**Weekly Trend**: `HealthTrend = HealthScore(this_week) - HealthScore(last_week)` → stored in `health_score_snapshots` (new table).

**Computation**: Daily at midnight + on-demand. Latency target < 1s.

---

#### 5.9 Smart Savings Rules ("Save the Difference")

```
AutoSave(event) = max(0, PredictedAmount - ActualAmount) × savings_rate
DailySweep = max(0, DailyBudget - DailyActualSpend) × savings_rate
MaxAutoSave(month) = MonthlyIncome × 0.15
```

| Value | Source |
|---|---|
| `savings_rate` | `savings_rules.save_the_difference_rate` (new table, default 0.5) |
| Auto-save log | `auto_save_transactions` (new table) |
| Monthly cap | `income_sources` → `monthly_income × 0.15` |

Event matching: transactions within ±2 hours of event, matched by location proximity and category.

**Computation**: Event-driven (post-event match). Latency target < 1s.

---

#### 5.10 Metrics Computation Schedule

| Metric | Frequency | Latency Target | Trigger |
|---|---|---|---|
| Spending Velocity | Every new transaction | < 200ms | Event-driven |
| Burn Rate | Every new transaction + hourly | < 100ms | Event-driven + cron |
| Predictive Budget | On calendar sync + daily | < 2s | Event-driven + cron |
| CV / Risk Score | Daily at midnight | < 5s | Cron |
| CCI | Weekly (Sunday night) | < 30s | Cron batch |
| Health Score | Daily at midnight + on-demand | < 1s | Cron + user action |
| Savings Projections | On demand | < 500ms | User action |
| Auto-Save Calculations | Post-event match | < 1s | Event-driven |

---

#### Supporting Queries

**Category Spending Breakdown (Insights donut chart):**

```sql
SELECT category, SUM(ABS(amount)) as total
FROM transactions
WHERE user_id = $1 AND date >= date_trunc('month', now())
GROUP BY category ORDER BY total DESC
```

**Weekly Spending Trend (Insights bar chart):**

```sql
SELECT date_trunc('week', date) as week, SUM(ABS(amount)) as total
FROM transactions
WHERE user_id = $1 AND date >= now() - interval '6 weeks'
GROUP BY week ORDER BY week
```

**Monthly Trend (budget-detail — replaces fabricated data):**

```sql
SELECT date_trunc('month', date) as month, SUM(ABS(amount)) as total
FROM transactions
WHERE user_id = $1 AND category = $2 AND date >= now() - interval '6 months'
GROUP BY month ORDER BY month
```

**Budget Snapshots (daily job):**

```sql
INSERT INTO budget_snapshots (user_id, budget_id, date, spent_amount, predicted_remaining, burn_rate)
SELECT b.user_id, b.id, CURRENT_DATE,
  COALESCE(SUM(ABS(t.amount)), 0),
  b.monthly_limit - COALESCE(SUM(ABS(t.amount)), 0),
  CASE WHEN b.monthly_limit > 0
    THEN COALESCE(SUM(ABS(t.amount)), 0) / (b.monthly_limit / 30.0 * EXTRACT(DAY FROM CURRENT_DATE))
    ELSE 0 END
FROM budgets b
LEFT JOIN transactions t ON t.user_id = b.user_id AND t.category = b.category
  AND t.date >= b.period_start AND t.date <= CURRENT_DATE
WHERE b.period_start <= CURRENT_DATE AND b.period_end >= CURRENT_DATE
GROUP BY b.id, b.user_id, b.monthly_limit
ON CONFLICT (budget_id, date) DO UPDATE
  SET spent_amount = EXCLUDED.spent_amount,
      predicted_remaining = EXCLUDED.predicted_remaining,
      burn_rate = EXCLUDED.burn_rate;
```

**Prediction Accuracy Matching:**

```sql
UPDATE spending_predictions sp
SET actual_amount = t.amount,
    matched_transaction_id = t.id,
    was_accurate = ABS(t.amount - sp.predicted_amount) / sp.predicted_amount <= 0.20
FROM transactions t
JOIN calendar_events e ON e.user_id = t.user_id
  AND t.merchant_name ILIKE '%' || e.title || '%'
  AND t.date BETWEEN e.start_time::date - 1 AND e.start_time::date + 1
WHERE sp.calendar_event_id = e.id AND sp.actual_amount IS NULL;
```

**CCI Weekly Batch:**

```sql
WITH prediction_matches AS (
  SELECT sp.user_id, sp.predicted_category,
    COUNT(*) as total_predictions,
    COUNT(sp.actual_amount) as matched_predictions,
    AVG(CASE WHEN sp.actual_amount IS NOT NULL
      THEN 1.0 - ABS(sp.predicted_amount - sp.actual_amount) / GREATEST(sp.predicted_amount, sp.actual_amount)
      ELSE NULL END) as avg_accuracy_weight
  FROM spending_predictions sp
  WHERE sp.created_at >= now() - interval '30 days'
  GROUP BY sp.user_id, sp.predicted_category
)
INSERT INTO cci_scores (user_id, category, hit_rate, avg_accuracy_weight, cci_value, period_start, period_end)
SELECT user_id, predicted_category,
  matched_predictions::float / NULLIF(total_predictions, 0),
  COALESCE(avg_accuracy_weight, 0),
  (matched_predictions::float / NULLIF(total_predictions, 0)) * COALESCE(avg_accuracy_weight, 0),
  now() - interval '30 days', now()
FROM prediction_matches;
```

#### XP and Level (Gamification)

```
Level thresholds: cumulative sum of 100 * n^1.5
  Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 383 XP, Level 4 = 903 XP, ...
```

| Value | Source |
|---|---|
| `xp` | `profiles.xp` (updated by `xp_transactions` inserts) |
| `level` | `profiles.level` (updated alongside XP) |
| `streak_count` | `profiles.streak_count` |

XP is awarded for: check-ins (10), budget adherence (varies), challenge completion (`challenges.reward_xp`), prediction reviews (5-10), social actions (5-10), referrals (50).

### Migration SQL — New Tables and Columns for MVP.md Metrics

Run this as migration `011_metrics_analytics.sql` after the existing 10 migrations.

```sql
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
```

### Schema Summary — Full Table Count After Migration 011

| Domain | Tables | New in 011 |
|---|---|---|
| Core | 7 | 0 (columns added to `profiles`, `transactions`, `plaid_connections`, `spending_predictions`) |
| Predictions | 2 | 0 |
| Budgets | 2 | 0 |
| Gamification | 6 | 0 |
| Social | 5 | 0 |
| Metrics & Analytics | 11 | 11 (`income_sources`, `daily_checkins`, `notification_preferences`, `spending_velocity_daily`, `category_risk_scores`, `cci_scores`, `health_score_snapshots`, `savings_goals`, `savings_rules`, `auto_save_transactions`, `seasonal_factors`) |
| System | 1 | 1 (`metrics_computation_log`) |
| **Total** | **34** | **12** |

### What Happens When You Flip the Switch

Once you set the two env vars, here's what changes in each part of the app:

| Feature | Before (Demo) | After (Supabase) |
|---|---|---|
| **Auth** | `setUser()` with fake profile | Real `supabase.auth.signUp/signIn` |
| **Transactions** | Loaded from bundled JSON | Fetched from `transactions` table |
| **Calendar events** | Loaded from bundled JSON | Fetched from `calendar_events` table |
| **Budgets** | Hardcoded 8 defaults | Fetched from `budgets` table, user-configurable |
| **Predictions** | Stored in Zustand only | Written to `spending_predictions` table |
| **Recurring detection** | Stored in Zustand only | Written to `recurring_transactions` table |
| **Gamification** | In-memory maps | Real `profiles`, `user_badges`, `xp_transactions`, `streak_history` |
| **Social** | Fake friends/circles | Real `friendships`, `friend_circles`, `circle_members` |
| **Notifications** | 6 hardcoded notifications | Real `notifications` table with realtime |
| **Settings/Preferences** | Local state only | **Still local** — need to add `notification_preferences` table |
| **Transaction reviews** | Local useState only | **Still local** — need to wire `transactions.reviewed` updates |
| **Chat context** | Hardcoded fake numbers | **Still hardcoded** — need to wire dynamic store data |

### Remaining App Code Fixes After Supabase Setup

These are the code changes needed to fully utilize the database:

#### Priority 1 — Core data flow
1. **`chatStore.ts`** — Replace hardcoded system prompt with dynamic data from stores
2. **`notificationStore.ts`** — Query real `notifications` table instead of always generating demo data
3. **`transaction-review.tsx`** — Write review changes back to `transactions` table via store
4. **`set-budget.tsx`** — Create real per-category `budgets` rows from onboarding selection

#### Priority 2 — Metric formulas (MVP 5.x alignment)
5. **`budgetStore.ts`** — Update `calculateHealthScore` from 4 components (0.35/0.30/0.15/0.20) to MVP's 5 components (0.30/0.25/0.20/0.15/0.10). Wire SpendingStability from `category_risk_scores` and CalendarCorrelation from `cci_scores`
6. **`insights.tsx`** — Compute savings rate from `income_sources` or `profiles.monthly_income` instead of hardcoded `0.1`. Add compound savings projection (FV formula) replacing simple multiplication
7. **`budget-detail.tsx`** — Query `budget_snapshots` for real trend data instead of fabricated array `[65, 80, 72, 90, 55, current]`
8. **`profiles.financial_health_score`** — Write computed health score back to database. Also write `cci_score` and `savings_efficiency`

#### Priority 3 — New metric computations
9. **New: `metricsService.ts`** — Create service to compute spending velocity (EWMA), CV/risk scores, CCI batch, health score snapshots, and seasonal factors. Write results to the new Metrics & Analytics tables
10. **New: `savingsService.ts`** — Implement auto-save matching (event match within ±2 hours, daily sweep, round-up). Log to `auto_save_transactions`. Enforce monthly cap (`income × 0.15`)
11. **`plan.tsx`** — Wire savings rule toggles to `savings_rules` table instead of no-op

#### Priority 4 — Gamification + UI
12. **`gamificationService.ts`** — Implement the 10 stubbed badge conditions (use `daily_checkins` for early/late badges, `category_risk_scores` for zero-spend-day)
13. **`arena.tsx`** — Wire challenge progress bar to real `challenge_participants.progress` instead of hardcoded 40%
14. **Dashboard** — Add spending velocity indicator, projected overspend date warning


## 1. Plaid, Google Calendar, Microsoft Outlook (Deferred)

> These integrations require EAS dev builds, external API credentials, or third-party accounts. Full implementation details have been moved to **[EXTERNAL-INTEGRATIONS.md](./EXTERNAL-INTEGRATIONS.md)**.

---

## 2. Calendar Integration

### Apple Calendar

Apple Calendar uses the device's local calendar database via `expo-calendar`. No OAuth needed — it uses iOS permission prompts.

```bash
npx expo install expo-calendar
```

```typescript
// src/services/appleCalendarService.ts
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export async function connectAppleCalendar(userId: string): Promise<CalendarEvent[]> {
  // 1. Request permission
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission denied');
  }

  // 2. Get all calendars
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // 3. Fetch events for the next 90 days
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

  const allEvents: CalendarEvent[] = [];

  for (const cal of calendars) {
    const events = await Calendar.getEventsAsync(
      [cal.id],
      startDate,
      endDate,
    );

    for (const event of events) {
      allEvents.push({
        id: `apple-${event.id}`,
        user_id: userId,
        calendar_connection_id: `apple-${cal.id}`,
        external_id: event.id,
        title: event.title,
        description: event.notes ?? null,
        start_time: event.startDate,
        end_time: event.endDate,
        location: event.location ?? null,
        is_all_day: event.allDay,
        is_recurring: event.recurrenceRule != null,
        detected_category: detectCategory(event.title),
        source: 'apple',
        created_at: new Date().toISOString(),
      });
    }
  }

  return allEvents;
}
```

> **Note**: `expo-calendar` works in Expo Go on iOS for reading. For writing events, you need a development build.

---

## 3. Camera Integration — Receipt Scanning

### Overview

User takes a photo of a receipt → OCR extracts text → LLM structures the data → creates a transaction.

### Implementation

#### Step 1: Camera + Image Picker

```bash
npx expo install expo-camera expo-image-picker
```

```typescript
// src/services/receiptService.ts
import * as ImagePicker from 'expo-image-picker';
import { createLLMAdapter } from './llm/adapter';

export async function captureReceipt(): Promise<string> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') throw new Error('Camera permission denied');

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images',
    quality: 0.8,           // Balance quality vs upload size
    base64: true,           // Need base64 for LLM vision APIs
    allowsEditing: true,    // Let user crop
  });

  if (result.canceled) throw new Error('Cancelled');
  return result.assets[0].base64!;
}

export async function pickReceiptFromGallery(): Promise<string> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) throw new Error('Cancelled');
  return result.assets[0].base64!;
}
```

#### Step 2: Receipt Parsing via LLM Vision

Both Claude and Gemini support image input. This is the most accurate approach — no separate OCR step needed.

```typescript
// src/services/receiptService.ts (continued)

interface ParsedReceipt {
  merchant_name: string;
  date: string;              // YYYY-MM-DD
  total: number;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  category: EventCategory;
  payment_method: string | null;  // "Visa ending 4242"
}

export async function parseReceipt(base64Image: string): Promise<ParsedReceipt> {
  const prompt = `Analyze this receipt image and extract the following as JSON:
{
  "merchant_name": "store/restaurant name",
  "date": "YYYY-MM-DD",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "currency": "CAD",
  "items": [{"name": "item", "quantity": 1, "price": 0.00}],
  "category": "one of: dining|groceries|transport|entertainment|shopping|travel|health|education|fitness|social|professional|bills|personal|other",
  "payment_method": "card type if visible, else null"
}
Return ONLY valid JSON. If a field is not visible, use null.`;

  // For Claude Vision:
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse receipt');

  return JSON.parse(jsonMatch[0]);
}
```

#### Step 3: For Gemini Vision (alternative)

```typescript
export async function parseReceiptGemini(base64Image: string): Promise<ParsedReceipt> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: prompt },  // Same prompt as above
          ],
        }],
      }),
    },
  );

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch![0]);
}
```

#### Step 4: Receipt → Transaction

```typescript
// src/services/receiptService.ts (continued)

export async function createTransactionFromReceipt(
  userId: string,
  receipt: ParsedReceipt,
): Promise<Transaction> {
  const transaction: Omit<Transaction, 'id'> = {
    user_id: userId,
    amount: -receipt.total,  // Negative = expense
    date: receipt.date,
    merchant_name: receipt.merchant_name,
    category: receipt.category,
    description: receipt.items.map(i => i.name).join(', '),
    is_recurring: false,
    source: 'receipt_scan',
    receipt_data: receipt,  // Store full parsed receipt as JSONB
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    return data;
  }

  // Demo mode — add to local store
  return { id: `receipt-${Date.now()}`, ...transaction };
}
```

#### Step 5: UI Component

```typescript
// New screen: app/scan-receipt.tsx
// - Camera preview with "Take Photo" button
// - Or "Choose from Gallery" button
// - After capture: shows loading spinner "Analyzing receipt..."
// - Shows parsed results in editable form:
//   - Merchant name (editable)
//   - Total amount (editable)
//   - Date (editable)
//   - Category (picker)
//   - Line items (list)
// - "Save Transaction" button
// - "Retake" button if parsing looks wrong
```

#### Schema Addition

Add a `receipt_data` JSONB column to the transactions table:

```sql
ALTER TABLE transactions ADD COLUMN receipt_data JSONB;
ALTER TABLE transactions ADD COLUMN source TEXT DEFAULT 'manual';
-- source values: 'plaid', 'receipt_scan', 'manual', 'csv_import'
```

### Cost Considerations

- **Claude Vision**: ~$0.002-0.005 per receipt (depends on image size)
- **Gemini Vision**: Free tier covers ~1,500 requests/day; paid tier is ~$0.001/receipt
- Consider caching: if the user re-scans the same receipt, detect duplicates by merchant + amount + date

---

## 4. Manual Calendar Entry with Price Prediction

### The Feature

User types: "Lunch at Earls on Friday" → app creates a calendar event AND immediately predicts "$35-55, dining, 85% confidence".

### Implementation

#### Step 1: Natural Language Event Parser

Use your existing LLM adapter to parse free-text into structured event data:

```typescript
// src/services/eventParserService.ts
import { createLLMAdapter } from './llm/adapter';

interface ParsedEvent {
  title: string;
  date: string;            // ISO date
  time: string | null;     // HH:mm or null
  duration_minutes: number;
  location: string | null;
  category: EventCategory;
  predicted_amount: number;
  prediction_low: number;
  prediction_high: number;
  confidence: number;
}

export async function parseNaturalLanguageEvent(
  input: string,
  userTimezone: string = 'America/Vancouver',
): Promise<ParsedEvent> {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().toLocaleDateString('en', { weekday: 'long' });

  const prompt = `Parse this into a calendar event with spending prediction. Today is ${dayOfWeek}, ${today}. Timezone: ${userTimezone}.

Input: "${input}"

Return JSON:
{
  "title": "event title",
  "date": "YYYY-MM-DD",
  "time": "HH:mm or null",
  "duration_minutes": 60,
  "location": "venue name or null",
  "category": "dining|groceries|transport|entertainment|shopping|travel|health|education|fitness|social|professional|bills|personal|other",
  "predicted_amount": 0.00,
  "prediction_low": 0.00,
  "prediction_high": 0.00,
  "confidence": 0.85
}

For spending prediction, consider:
- Restaurant meals: lunch $15-35, dinner $30-80, fast food $8-15
- Coffee shops: $5-10
- Groceries: $40-120
- Movies: $15-25
- Gym: $0-50/month
- Gas: $40-80
- Shopping: varies widely, estimate conservatively

If the venue is known (e.g., "Earls", "Cactus Club"), use typical price ranges for that establishment.
Return ONLY valid JSON.`;

  const adapter = createLLMAdapter();
  const response = await adapter.predict(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch![0]);
}
```

#### Step 2: Mock Version (No API Key)

```typescript
// src/services/eventParserService.ts — add fallback

const VENUE_PRICES: Record<string, { low: number; high: number; category: EventCategory }> = {
  // Vancouver restaurants
  'earls': { low: 25, high: 55, category: 'dining' },
  'cactus club': { low: 30, high: 60, category: 'dining' },
  'joeys': { low: 25, high: 50, category: 'dining' },
  'white spot': { low: 15, high: 30, category: 'dining' },
  'tim hortons': { low: 4, high: 12, category: 'dining' },
  'starbucks': { low: 5, high: 10, category: 'dining' },
  'mcdonalds': { low: 8, high: 15, category: 'dining' },
  'subway': { low: 8, high: 15, category: 'dining' },
  // Add more venues...
};

const ACTIVITY_PRICES: Record<string, { low: number; high: number; category: EventCategory }> = {
  'lunch': { low: 15, high: 35, category: 'dining' },
  'dinner': { low: 30, high: 75, category: 'dining' },
  'breakfast': { low: 10, high: 25, category: 'dining' },
  'coffee': { low: 4, high: 8, category: 'dining' },
  'movie': { low: 15, high: 25, category: 'entertainment' },
  'concert': { low: 40, high: 150, category: 'entertainment' },
  'gym': { low: 0, high: 15, category: 'fitness' },
  'yoga': { low: 15, high: 25, category: 'fitness' },
  'groceries': { low: 40, high: 120, category: 'groceries' },
  'shopping': { low: 25, high: 100, category: 'shopping' },
  'uber': { low: 10, high: 30, category: 'transport' },
  'gas': { low: 40, high: 80, category: 'transport' },
  'haircut': { low: 25, high: 60, category: 'personal' },
  'dentist': { low: 50, high: 200, category: 'health' },
  'doctor': { low: 0, high: 50, category: 'health' },
};

function parseEventLocally(input: string): ParsedEvent {
  const lower = input.toLowerCase();

  // Find venue match
  let priceInfo = null;
  for (const [venue, info] of Object.entries(VENUE_PRICES)) {
    if (lower.includes(venue)) {
      priceInfo = info;
      break;
    }
  }

  // Fall back to activity match
  if (!priceInfo) {
    for (const [activity, info] of Object.entries(ACTIVITY_PRICES)) {
      if (lower.includes(activity)) {
        priceInfo = info;
        break;
      }
    }
  }

  priceInfo = priceInfo ?? { low: 10, high: 50, category: 'other' as EventCategory };
  const mid = (priceInfo.low + priceInfo.high) / 2;

  // Parse date ("friday", "tomorrow", "next tuesday", etc.)
  const date = parseFuzzyDate(lower);

  return {
    title: input,
    date: date.toISOString().split('T')[0],
    time: extractTime(lower),
    duration_minutes: 60,
    location: extractVenue(lower),
    category: priceInfo.category,
    predicted_amount: Math.round(mid * 100) / 100,
    prediction_low: priceInfo.low,
    prediction_high: priceInfo.high,
    confidence: priceInfo === VENUE_PRICES[Object.keys(VENUE_PRICES).find(v => lower.includes(v))!] ? 0.8 : 0.6,
  };
}
```

#### Step 3: Quick-Add UI

```typescript
// Add to plan.tsx or as a new component
// - Text input with placeholder "Lunch at Earls on Friday..."
// - As user types, debounce 500ms then show prediction preview:
//   [🍽 Dining]  $25 - $55  (85% confidence)
// - "Add to Calendar" button creates the event + prediction
// - Shows in calendar with prediction badge immediately
```

#### Step 4: Learning from History

Over time, improve predictions by using the user's actual spending data:

```typescript
export function getPersonalizedPrediction(
  merchant: string,
  category: EventCategory,
  transactions: Transaction[],
): { low: number; high: number; average: number } {
  // Find past transactions at this merchant
  const pastAtMerchant = transactions.filter(
    t => t.merchant_name?.toLowerCase().includes(merchant.toLowerCase()),
  );

  if (pastAtMerchant.length >= 3) {
    const amounts = pastAtMerchant.map(t => Math.abs(t.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    return { low: min * 0.9, high: max * 1.1, average: avg };
  }

  // Fall back to category average
  const categoryTxns = transactions.filter(t => t.category === category);
  if (categoryTxns.length >= 5) {
    const amounts = categoryTxns.map(t => Math.abs(t.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    return { low: avg * 0.5, high: avg * 1.5, average: avg };
  }

  // Fall back to defaults
  return ACTIVITY_PRICES[category] ?? { low: 10, high: 50, average: 30 };
}
```

---

## 5. Architecture Summary

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Apple   │  │  Demo    │  │  Receipt Scanner     │  │
│  │ Calendar │  │  Data    │  │  (camera + Gemini)   │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       │              │                    │              │
│  ┌────┴──────────────┴────────────────────┴───────────┐ │
│  │              Supabase PostgreSQL                     │ │
│  │  transactions | calendar_events | budgets           │ │
│  │  predictions  | calendar_connections                │ │
│  └────────────────────┬───────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────┐
│                 MOBILE APP                               │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────────┐ │
│  │              Zustand Stores                         │ │
│  │  transactionStore | calendarStore | predictionStore │ │
│  └──────┬──────────────────┬──────────────────┬───────┘ │
│         │                  │                  │         │
│  ┌──────┴─────┐   ┌───────┴───────┐   ┌──────┴──────┐ │
│  │  Receipt   │   │  Manual Entry  │   │    LLM      │ │
│  │  Scanner   │   │  NL Parser     │   │  Predictions│ │
│  │ (camera +  │   │ "lunch at x"   │   │  (Gemini)   │ │
│  │  Gemini)   │   │  → $25-$55     │   │             │ │
│  └────────────┘   └────────────────┘   └─────────────┘ │
└─────────────────────────────────────────────────────────┘

> For the full architecture including Plaid, Google Calendar, and Outlook,
> see EXTERNAL-INTEGRATIONS.md
```

### API Keys / Credentials Needed

| Service | Key | Where to Get | Required? |
|---|---|---|---|
| Gemini (Google AI) | `GEMINI_API_KEY` | aistudio.google.com | Yes for receipt scanning + predictions |
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | supabase.com dashboard | Yes for persistence |

> Plaid, Google Calendar, and Microsoft Outlook credentials are documented in [EXTERNAL-INTEGRATIONS.md](./EXTERNAL-INTEGRATIONS.md).

### Build Requirements

| Feature | Expo Go? | EAS Dev Build? | Production Build? |
|---|---|---|---|
| Demo mode (current) | Yes | Yes | Yes |
| Apple Calendar | Partial (read) | Yes | Yes |
| Camera (receipt scan) | Yes | Yes | Yes |
| Push notifications | No | Yes | Yes |

> Google Calendar, Outlook, and Plaid build requirements are in [EXTERNAL-INTEGRATIONS.md](./EXTERNAL-INTEGRATIONS.md).

### Migration Order

Recommended implementation sequence:

1. **Supabase setup** — Create project, run migrations, set env vars. Enables persistence for everything.
2. **Camera + Receipt scanning** — Highest user delight, works in Expo Go, only needs an LLM API key.
3. **Apple Calendar** — `expo-calendar` mostly works in Expo Go. Lowest friction calendar integration.
4. **Manual event entry + price prediction** — Pure frontend + LLM, no native modules needed.

> For deferred integrations (Google Calendar, Outlook, Plaid), see [EXTERNAL-INTEGRATIONS.md](./EXTERNAL-INTEGRATIONS.md).
