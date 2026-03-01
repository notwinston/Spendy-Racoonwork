# FutureSpend — Data Ingestion Implementation Guide

> How to replace every simulated data source with real integrations.

---

## Table of Contents

0. [Supabase Setup — Do This First](#0-supabase-setup--do-this-first)
1. [Transaction Ingestion via Plaid](#1-transaction-ingestion-via-plaid)
2. [Cross-Institution Tracking](#2-cross-institution-tracking)
3. [Calendar Integration](#3-calendar-integration)
4. [Camera Integration — Receipt Scanning](#4-camera-integration--receipt-scanning)
5. [Manual Calendar Entry with Price Prediction](#5-manual-calendar-entry-with-price-prediction)
6. [Architecture Summary](#6-architecture-summary)

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

### Schema Gaps — Columns/Tables That Need to Be Added

These are things the app references or needs but the current schema doesn't support.

#### Gap 1: No income/savings tracking

```sql
-- Option: Add to profiles
ALTER TABLE profiles ADD COLUMN monthly_income FLOAT;

-- Or create a dedicated table for flexibility
CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,          -- "Salary", "Freelance", etc.
  amount FLOAT NOT NULL,
  frequency transaction_frequency NOT NULL DEFAULT 'monthly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Gap 2: No daily check-in timestamp tracking

```sql
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  xp_awarded INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, (checked_in_at::date))   -- one per day
);
```

This enables the "Early Bird" (before 8 AM) and "Night Owl" (after 10 PM) badges.

#### Gap 3: No receipt storage

```sql
ALTER TABLE transactions ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
-- Values: 'plaid', 'receipt_scan', 'manual', 'csv_import'

ALTER TABLE transactions ADD COLUMN receipt_data JSONB;
-- Stores: merchant, items[], subtotal, tax, tip, etc.

ALTER TABLE transactions ADD COLUMN receipt_image_url TEXT;
-- Points to Supabase Storage bucket
```

#### Gap 4: No notification preferences table

```sql
CREATE TABLE notification_preferences (
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
```

#### Gap 5: No Plaid sync cursor

```sql
ALTER TABLE plaid_connections ADD COLUMN sync_cursor TEXT;
-- Stores the cursor for Plaid /transactions/sync incremental fetching
```

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

1. **`chatStore.ts`** — Replace hardcoded system prompt with dynamic data from stores
2. **`notificationStore.ts`** — Query real `notifications` table instead of always generating demo data
3. **`transaction-review.tsx`** — Write review changes back to `transactions` table via store
4. **`insights.tsx`** — Compute savings rate from real data instead of hardcoded `0.1`
5. **`budget-detail.tsx`** — Query `budget_snapshots` for real trend data instead of fabricated array
6. **`set-budget.tsx`** — Create real per-category `budgets` rows from onboarding selection
7. **`profiles.financial_health_score`** — Write computed health score back to database
8. **`gamificationService.ts`** — Implement the 10 stubbed badge conditions
9. **`arena.tsx`** — Wire challenge progress bar to real `challenge_participants.progress` instead of hardcoded 40%


## 1. Transaction Ingestion via Plaid

### Current State

`plaidService.ts` returns hardcoded "Demo Bank" data. There is no Plaid SDK, no token exchange, and `syncTransactions()` is a no-op that returns `[]`.

### What Plaid Actually Requires

Plaid does **not** allow direct client-side API calls. The flow is:

```
Mobile App  ──>  Your Backend Server  ──>  Plaid API
    │                    │
    │  (1) Link Token    │
    │  <─────────────────│
    │                    │
    │  (2) Plaid Link UI │
    │  (opens in-app)    │
    │                    │
    │  (3) Public Token  │
    │  ─────────────────>│
    │                    │
    │         (4) Exchange for Access Token
    │                    │──────────────────> Plaid
    │                    │<──────────────────
    │                    │
    │  (5) Transactions  │
    │  <─────────────────│──────────────────> Plaid /transactions/sync
```

### Implementation Steps

#### Step 1: Backend Server (Supabase Edge Function or standalone)

You need a server that holds your Plaid credentials. This cannot live in the mobile app.

**Option A: Supabase Edge Functions** (recommended for your stack)

Create three Edge Functions:

```
supabase/functions/
├── plaid-create-link-token/index.ts   # POST — creates a Link token
├── plaid-exchange-token/index.ts      # POST — exchanges public_token for access_token
└── plaid-sync-transactions/index.ts   # POST — fetches transactions for a connection
```

**Option B: Standalone Express/Fastify server** — same three endpoints, deployed to Railway/Fly/Render.

#### Step 2: Create Link Token

```typescript
// supabase/functions/plaid-create-link-token/index.ts
import { PlaidApi, Configuration, PlaidEnvironments, Products, CountryCode } from 'plaid';

const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[Deno.env.get('PLAID_ENV') ?? 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': Deno.env.get('PLAID_CLIENT_ID'),
      'PLAID-SECRET': Deno.env.get('PLAID_SECRET'),
    },
  },
}));

Deno.serve(async (req) => {
  const { userId } = await req.json();

  const response = await plaid.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'FutureSpend',
    products: [Products.Transactions],
    country_codes: [CountryCode.Ca],        // Canadian banks
    language: 'en',
    // For Canadian institutions (RBC, CIBC, TD, etc.):
    // Plaid covers them but some require OAuth redirect
    redirect_uri: 'https://your-app.com/plaid-oauth',
  });

  return Response.json({ link_token: response.data.link_token });
});
```

**Environment variables needed:**
- `PLAID_CLIENT_ID` — from Plaid dashboard
- `PLAID_SECRET` — sandbox, development, or production key
- `PLAID_ENV` — `sandbox`, `development`, or `production`

#### Step 3: Mobile App — Plaid Link

Install the React Native Plaid Link SDK:

```bash
npx expo install react-native-plaid-link-sdk
```

> **Important**: This is a native module. It will NOT work in Expo Go. You must use an EAS development build (`eas build --profile development`).

```typescript
// src/services/plaidService.ts (replace connectBank)
import { openLink, LinkSuccess } from 'react-native-plaid-link-sdk';

export async function connectBank(userId: string): Promise<{ connection: PlaidConnection; accounts: Account[] }> {
  // 1. Get link token from your backend
  const { link_token } = await fetch('YOUR_BACKEND/plaid-create-link-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  }).then(r => r.json());

  // 2. Open Plaid Link UI
  return new Promise((resolve, reject) => {
    openLink({
      tokenConfig: { token: link_token },
      onSuccess: async (success: LinkSuccess) => {
        // 3. Exchange public token via your backend
        const result = await fetch('YOUR_BACKEND/plaid-exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicToken: success.publicToken,
            institutionId: success.metadata.institution?.id,
            institutionName: success.metadata.institution?.name,
            accounts: success.metadata.accounts,
            userId,
          }),
        }).then(r => r.json());

        resolve(result);
      },
      onExit: (error) => {
        if (error) reject(error);
      },
    });
  });
}
```

#### Step 4: Exchange Token (Backend)

```typescript
// supabase/functions/plaid-exchange-token/index.ts
Deno.serve(async (req) => {
  const { publicToken, institutionId, institutionName, accounts, userId } = await req.json();

  // Exchange for permanent access token
  const exchangeResponse = await plaid.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const accessToken = exchangeResponse.data.access_token;
  const itemId = exchangeResponse.data.item_id;

  // Store encrypted access token in your database
  // CRITICAL: Never send the access_token to the client
  const { data: connection } = await supabase.from('plaid_connections').insert({
    user_id: userId,
    institution_id: institutionId,
    institution_name: institutionName,
    access_token_encrypted: encrypt(accessToken),  // Use your encryption method
    plaid_item_id: itemId,
    status: 'active',
  }).select().single();

  // Store accounts
  for (const acct of accounts) {
    await supabase.from('accounts').insert({
      user_id: userId,
      plaid_connection_id: connection.id,
      plaid_account_id: acct.id,
      name: acct.name,
      type: acct.type,
      subtype: acct.subtype,
      mask: acct.mask,
    });
  }

  return Response.json({ connection, accounts });
});
```

#### Step 5: Transaction Sync (Backend)

Plaid recommends the `/transactions/sync` endpoint (cursor-based, incremental):

```typescript
// supabase/functions/plaid-sync-transactions/index.ts
Deno.serve(async (req) => {
  const { connectionId } = await req.json();

  // Get the stored access token and cursor
  const { data: conn } = await supabase
    .from('plaid_connections')
    .select('access_token_encrypted, sync_cursor')
    .eq('id', connectionId)
    .single();

  const accessToken = decrypt(conn.access_token_encrypted);
  let cursor = conn.sync_cursor || '';
  let hasMore = true;
  const allAdded = [];
  const allModified = [];
  const allRemoved = [];

  while (hasMore) {
    const response = await plaid.transactionsSync({
      access_token: accessToken,
      cursor: cursor,
    });

    allAdded.push(...response.data.added);
    allModified.push(...response.data.modified);
    allRemoved.push(...response.data.removed);
    hasMore = response.data.has_more;
    cursor = response.data.next_cursor;
  }

  // Upsert transactions into your database
  for (const txn of allAdded) {
    await supabase.from('transactions').upsert({
      user_id: userId,
      plaid_transaction_id: txn.transaction_id,
      account_id: txn.account_id,
      amount: txn.amount,
      date: txn.date,
      merchant_name: txn.merchant_name || txn.name,
      category: mapPlaidCategory(txn.personal_finance_category),
      pending: txn.pending,
      // Plaid provides its own categorization
    }, { onConflict: 'plaid_transaction_id' });
  }

  // Save cursor for next sync
  await supabase.from('plaid_connections')
    .update({ sync_cursor: cursor, last_sync_at: new Date().toISOString() })
    .eq('id', connectionId);

  return Response.json({ added: allAdded.length, modified: allModified.length, removed: allRemoved.length });
});
```

#### Step 6: Ongoing Sync

Two approaches (use both):

1. **Plaid Webhooks** — Plaid sends `SYNC_UPDATES_AVAILABLE` to your backend when new transactions arrive. Set up a webhook endpoint that triggers the sync function.
2. **Pull on app open** — Call sync when the user opens the app or pulls to refresh on the dashboard.

### Canadian Bank Coverage

Plaid supports major Canadian institutions in production:

| Institution | Plaid Support | Notes |
|---|---|---|
| RBC Royal Bank | Yes | OAuth flow required |
| CIBC | Yes | OAuth flow required |
| TD Canada Trust | Yes | OAuth flow required |
| Scotiabank | Yes | OAuth flow required |
| BMO | Yes | OAuth flow required |
| Desjardins | Yes | OAuth flow required |
| National Bank | Yes | — |
| Tangerine | Yes | — |
| Simplii Financial | Yes | — |
| Wealthsimple | Yes | — |

> **Plaid pricing**: Sandbox is free. Production starts at $0.30/connection/month + $0.05/transaction call. There's a free tier for < 100 connections during development.

---

## 2. Cross-Institution Tracking

### The Problem

A user might have:
- RBC chequing (daily spending)
- CIBC Visa (credit card)
- TD savings account
- Wealthsimple TFSA

Each is a separate Plaid connection. You need to unify them into one financial picture.

### Implementation

#### Data Model (already in your schema)

```
plaid_connections (one per institution)
  └── accounts (one per card/account at that institution)
       └── transactions (all transactions across all accounts)
```

The key is `user_id` — all queries filter by user, not by institution.

#### Unified Dashboard Query

```typescript
// Already works with current schema — transactions table has user_id
const { data: allTransactions } = await supabase
  .from('transactions')
  .select('*, accounts!inner(name, type, plaid_connections!inner(institution_name))')
  .eq('user_id', userId)
  .order('date', { ascending: false });

// Group by institution for the "Connected Accounts" section
const byInstitution = allTransactions.reduce((acc, txn) => {
  const inst = txn.accounts.plaid_connections.institution_name;
  if (!acc[inst]) acc[inst] = [];
  acc[inst].push(txn);
  return acc;
}, {});
```

#### Account Aggregation View (new screen needed)

Build an "Accounts" screen showing:
- Total net worth (sum of all account balances)
- Per-institution breakdown with account cards
- Per-account balance, last synced time, and recent transactions
- Color-coded by account type (chequing = blue, credit = red, savings = green)

#### Duplicate Detection

When a user pays their CIBC Visa from their RBC chequing account, Plaid reports two transactions:
1. RBC: -$500 "CIBC VISA PAYMENT"
2. CIBC: +$500 "PAYMENT RECEIVED"

Handle this with transfer detection:

```typescript
function isTransfer(txn: PlaidTransaction): boolean {
  // Plaid's personal_finance_category includes TRANSFER_IN / TRANSFER_OUT
  return txn.personal_finance_category?.primary === 'TRANSFER';
}

// Filter out transfers from spending calculations
const spending = transactions.filter(t => !isTransfer(t) && t.amount > 0);
```

---

## 3. Calendar Integration

### Current State

`calendarService.ts` has real Google Calendar fetch code but it can't run because OAuth requires a native build. Apple and Outlook are Alert stubs.

### Google Calendar

#### Prerequisites
1. Google Cloud Console project with Calendar API enabled
2. OAuth 2.0 client ID (iOS + Android)
3. EAS build (not Expo Go)

#### Implementation

Install the Google Sign-In library:

```bash
npx expo install @react-native-google-signin/google-signin
```

Configure in `app.json`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "infoPlist": {
        "CFBundleURLSchemes": ["com.googleusercontent.apps.YOUR_CLIENT_ID"]
      }
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "plugins": ["@react-native-google-signin/google-signin"]
  }
}
```

```typescript
// src/services/calendarService.ts — replace the Alert stubs
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export async function connectGoogleCalendar(userId: string) {
  // 1. Sign in with Google
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();

  // 2. Store the connection
  await calendarStore.addConnection(userId, 'google', tokens.accessToken);

  // 3. Sync events (your existing syncGoogleCalendar function already works)
  await calendarStore.syncCalendar(userId, tokens.accessToken);

  return { success: true, eventCount: calendarStore.getState().events.length };
}

// Token refresh (Google tokens expire after 1 hour)
export async function refreshGoogleToken(): Promise<string> {
  const tokens = await GoogleSignin.getTokens();
  // getTokens() automatically refreshes if expired
  return tokens.accessToken;
}
```

Your existing `syncGoogleCalendar()` function in `calendarService.ts` already makes the right API calls — it just needs a valid OAuth token.

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

### Microsoft Outlook / Office 365

Outlook uses Microsoft Graph API with OAuth 2.0.

```bash
npm install react-native-msal  # or use expo-auth-session
```

#### Option A: Using `expo-auth-session` (works in Expo Go for testing)

```typescript
// src/services/outlookCalendarService.ts
import * as AuthSession from 'expo-auth-session';
import { detectCategory } from './calendarService';

const TENANT_ID = 'common'; // multi-tenant
const CLIENT_ID = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID;

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
};

export async function connectOutlookCalendar(userId: string): Promise<CalendarEvent[]> {
  // 1. OAuth flow
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'futurespend' });

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes: ['Calendars.Read', 'User.Read'],
    redirectUri,
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    throw new Error('Outlook auth cancelled');
  }

  // 2. Exchange code for token
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier! },
    },
    discovery,
  );

  const accessToken = tokenResult.accessToken;

  // 3. Fetch calendar events from Microsoft Graph
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${now}&endDateTime=${future}&$top=500&$select=subject,start,end,location,bodyPreview,isAllDay,recurrence`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const data = await response.json();

  // 4. Map to CalendarEvent
  return data.value.map((event: any) => ({
    id: `outlook-${event.id}`,
    user_id: userId,
    external_id: event.id,
    title: event.subject,
    description: event.bodyPreview ?? null,
    start_time: event.start.dateTime,
    end_time: event.end.dateTime,
    location: event.location?.displayName ?? null,
    is_all_day: event.isAllDay,
    is_recurring: event.recurrence != null,
    detected_category: detectCategory(event.subject),
    source: 'outlook',
    created_at: new Date().toISOString(),
  }));
}
```

**Azure AD setup required:**
1. Register an app at https://portal.azure.com → App registrations
2. Add redirect URI: `futurespend://auth`
3. Add API permissions: `Calendars.Read`, `User.Read`
4. Set `EXPO_PUBLIC_MICROSOFT_CLIENT_ID` in `.env`

### Unified Calendar Store Update

Update your store to handle all three providers:

```typescript
// In calendarStore.ts — add a unified connect method
connectCalendar: async (userId: string, provider: CalendarProvider) => {
  set({ isLoading: true });
  try {
    let events: CalendarEvent[];

    switch (provider) {
      case 'google':
        events = await connectGoogleCalendar(userId);
        break;
      case 'apple':
        events = await connectAppleCalendar(userId);
        break;
      case 'outlook':
        events = await connectOutlookCalendar(userId);
        break;
    }

    // Merge with existing events (dedup by external_id)
    const existingMap = new Map(get().events.map(e => [e.external_id ?? e.id, e]));
    for (const event of events) {
      existingMap.set(event.external_id ?? event.id, event);
    }
    set({ events: Array.from(existingMap.values()) });

    // Persist to Supabase
    if (isSupabaseConfigured) {
      const rows = events.map(({ id, ...rest }) => rest);
      await supabase.from('calendar_events').upsert(rows, {
        onConflict: 'user_id,external_id,calendar_connection_id',
      });
    }
  } finally {
    set({ isLoading: false });
  }
},
```

---

## 4. Camera Integration — Receipt Scanning

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

## 5. Manual Calendar Entry with Price Prediction

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

## 6. Architecture Summary

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Plaid    │  │  Google   │  │  Apple   │  │Outlook │ │
│  │  (banks)  │  │ Calendar  │  │ Calendar │  │Calendar│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │              │              │             │      │
│  ┌────┴──────────────┴──────────────┴─────────────┴───┐ │
│  │              Your Backend Server                    │ │
│  │  (Supabase Edge Functions or Express)               │ │
│  │  - Token exchange    - Webhook handlers             │ │
│  │  - Encrypted storage - Transaction sync             │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────────┐ │
│  │              Supabase PostgreSQL                     │ │
│  │  transactions | calendar_events | accounts          │ │
│  │  plaid_connections | calendar_connections            │ │
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
│  │ (camera +  │   │ "lunch at x"   │   │ (Claude /   │ │
│  │  LLM OCR)  │   │  → $25-$55     │   │  Gemini)    │ │
│  └────────────┘   └────────────────┘   └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### API Keys / Credentials Needed

| Service | Key | Where to Get | Required? |
|---|---|---|---|
| Plaid | `PLAID_CLIENT_ID`, `PLAID_SECRET` | plaid.com/dashboard | Yes for bank data |
| Google Calendar | `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID` | console.cloud.google.com | Yes for Google Cal |
| Microsoft / Outlook | `MICROSOFT_CLIENT_ID` | portal.azure.com | Yes for Outlook |
| Claude (Anthropic) | `CLAUDE_API_KEY` | console.anthropic.com | Yes for receipt scanning + predictions |
| Gemini (Google AI) | `GEMINI_API_KEY` | aistudio.google.com | Alternative to Claude |
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | supabase.com dashboard | Yes for persistence |

### Build Requirements

| Feature | Expo Go? | EAS Dev Build? | Production Build? |
|---|---|---|---|
| Demo mode (current) | Yes | Yes | Yes |
| Google Calendar OAuth | No | Yes | Yes |
| Apple Calendar | Partial (read) | Yes | Yes |
| Outlook Calendar | Yes (via expo-auth-session) | Yes | Yes |
| Plaid Link | No | Yes | Yes |
| Camera (receipt scan) | Yes | Yes | Yes |
| Push notifications | No | Yes | Yes |

### Migration Order

Recommended implementation sequence:

1. **Supabase setup** — Create project, run migrations, set env vars. Enables persistence for everything.
2. **Camera + Receipt scanning** — Highest user delight, works in Expo Go, only needs an LLM API key.
3. **Apple Calendar** — `expo-calendar` mostly works in Expo Go. Lowest friction calendar integration.
4. **Manual event entry + price prediction** — Pure frontend + LLM, no native modules needed.
5. **EAS dev build** — Transition from Expo Go. Unlocks native modules.
6. **Google Calendar OAuth** — Requires EAS build + Google Cloud setup.
7. **Outlook Calendar** — Requires Azure AD app registration.
8. **Plaid integration** — Requires backend server + Plaid account + EAS build. Most complex.
9. **Cross-institution tracking** — Builds on Plaid, mostly a UI/query layer on top.
