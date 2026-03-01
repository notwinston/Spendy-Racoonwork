# FutureSpend — Ralph Loop Implementation Plan

> **This document is the execution blueprint.** Each cycle below is designed to be run as a single ralph loop — an autonomous AI coding session with clear inputs, outputs, verification commands, and completion criteria. Every cycle produces tested, working code before the next one starts.

---

## Ground Rules for Every Ralph Loop

1. **Every cycle MUST end with passing tests.** No exceptions. If tests fail, the loop continues until they pass.
2. **Every cycle has a `verify` section** with exact shell commands to run. The loop is not done until all commands exit 0.
3. **Every cycle has a `developer can test` section** — a human-readable way for a developer to manually confirm the feature works.
4. **No cycle touches files outside its scope.** File ownership is listed explicitly.
5. **Cycles list their dependencies.** Never start a cycle until its dependencies are marked complete.
6. **If stuck for more than 3 attempts on the same error,** fall back to the documented alternative approach.

---

## Dependency Tree & Parallel Execution Map

```
PHASE 1: Foundation (must be sequential)
═══════════════════════════════════════════════════════════════
  Cycle 1: Expo Project Scaffold ─────┐
  Cycle 2: Supabase Schema + Auth ────┤── These 3 run in PARALLEL
  Cycle 3: FastAPI ML Scaffold ────────┘
                                       │
                                       ▼
PHASE 2: Core Integrations (parallel after Phase 1)
═══════════════════════════════════════════════════════════════
  Cycle 4: Auth Screens ──────────────────────── depends on [1, 2]
  Cycle 5: Synthetic Data Generator ──────────── depends on [2]
  Cycle 6: Calendar Integration ──────────────── depends on [2, 5]
  Cycle 7: Plaid Integration ────────────────── depends on [2]
  Cycle 8: ML Prediction Pipeline ───────────── depends on [3, 5]
                                       │
         ┌─────────┬──────────┬────────┤
         ▼         ▼          ▼        ▼
PHASE 3: Feature Screens (parallel after Phase 2)
═══════════════════════════════════════════════════════════════
  Cycle 9:  Dashboard Screen ────────── depends on [1, 4, 7]
  Cycle 10: Calendar View Screen ────── depends on [1, 6, 8]
  Cycle 11: Budget System ──────────── depends on [2, 7]
  Cycle 12: Plan Screen ───────────── depends on [1, 8, 11]
  Cycle 13: Floating AI Chat ─────── depends on [1, 8]
                                       │
         ┌─────────┬──────────┬────────┤
         ▼         ▼          ▼        ▼
PHASE 4: Social & Gamification (parallel after Phase 3)
═══════════════════════════════════════════════════════════════
  Cycle 14: Gamification Engine ─────── depends on [2, 11]
  Cycle 15: Social Features Backend ─── depends on [2]
  Cycle 16: Arena Screen ──────────── depends on [1, 14, 15]
  Cycle 17: Insights Screen ─────────── depends on [1, 8, 11]
                                       │
                                       ▼
PHASE 5: Polish & Demo (sequential after Phase 4)
═══════════════════════════════════════════════════════════════
  Cycle 18: Push Notifications ──────── depends on [14, 15]
  Cycle 19: Demo Data + Personas ────── depends on [ALL above]
  Cycle 20: Final Polish + Demo Mode ── depends on [19]
```

### Parallel Execution Groups

At maximum parallelism, here's what can run simultaneously:

| Time | Parallel Loops |
|------|---------------|
| **Wave 1** | Cycle 1 + Cycle 2 + Cycle 3 (3 parallel) |
| **Wave 2** | Cycle 4 + Cycle 5 + Cycle 7 (3 parallel, Cycle 6 waits for 5) |
| **Wave 3** | Cycle 6 + Cycle 8 (2 parallel, after Wave 2) |
| **Wave 4** | Cycle 9 + Cycle 10 + Cycle 11 + Cycle 13 (4 parallel) |
| **Wave 5** | Cycle 12 + Cycle 14 + Cycle 15 (3 parallel) |
| **Wave 6** | Cycle 16 + Cycle 17 (2 parallel) |
| **Wave 7** | Cycle 18 (1) |
| **Wave 8** | Cycle 19 → Cycle 20 (sequential) |

**Total: 20 cycles across 8 waves. With perfect parallelism: 8 sequential steps.**

---

## Phase 1: Foundation

---

### Cycle 1: Expo Project Scaffold + Navigation + Theme

**Objective:** Create a working React Native app with Expo, TypeScript, bottom tab navigation (5 tabs), stack navigators, and the dark theme system. Every screen is a placeholder — but navigation works end-to-end.

**Dependencies:** None (first cycle)

**Files to create:**
```
app/
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── src/
│   ├── constants/
│   │   ├── colors.ts          # Dark theme palette (#0A1628, #00D09C, etc.)
│   │   ├── typography.ts      # Font sizes, weights
│   │   └── spacing.ts         # Consistent spacing scale
│   ├── navigation/
│   │   ├── RootNavigator.tsx   # Auth check → Onboarding or Main
│   │   ├── AuthStack.tsx       # Login, Signup screens
│   │   ├── OnboardingStack.tsx # 4 onboarding screens
│   │   └── MainTabs.tsx        # 5-tab navigator: Dashboard, Calendar, Plan, Arena, Insights
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
│   │   ├── onboarding/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── ConnectCalendarScreen.tsx
│   │   │   ├── ConnectBankScreen.tsx
│   │   │   └── SetBudgetScreen.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   ├── calendar/
│   │   │   └── CalendarViewScreen.tsx
│   │   ├── plan/
│   │   │   └── PlanScreen.tsx
│   │   ├── arena/
│   │   │   └── ArenaScreen.tsx
│   │   ├── insights/
│   │   │   └── InsightsScreen.tsx
│   │   ├── profile/
│   │   │   └── SettingsScreen.tsx
│   │   └── shared/
│   │       └── BudgetDetailScreen.tsx
│   └── components/
│       ├── ui/
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   └── Header.tsx       # Global header with profile avatar top-right
│       └── FloatingChatButton.tsx  # Placeholder FAB
```

**Key decisions:**
- Use `expo-router` (file-based routing) OR `@react-navigation/native` with bottom tabs + stacks. Pick one and commit.
- All screens render a colored card with the screen name and a "This is [Screen Name]" text so navigation can be visually verified.
- The `Header` component appears on every screen with a profile avatar in the top-right that navigates to SettingsScreen.
- `FloatingChatButton` renders a teal circle (56px) in the bottom-right on every main screen. Tapping it shows an alert("Chat coming soon") for now.

**Verify (commands that must pass):**
```bash
# Install dependencies
cd app && npm install

# TypeScript compiles without errors
npx tsc --noEmit

# App starts without crashing (Expo)
npx expo start --no-dev --non-interactive &
sleep 15 && kill %1  # Starts successfully if no crash in 15s

# Lint passes
npx eslint src/ --ext .ts,.tsx --max-warnings 0

# Run unit tests
npx jest --passWithNoTests
```

**Developer can test:**
1. Run `npx expo start`, scan QR with Expo Go
2. See Welcome screen → tap "Get Started" → navigates through 4 onboarding screens
3. Bottom tab bar shows 5 tabs: Dashboard, Calendar, Plan, Arena, Insights
4. Tap each tab → shows placeholder screen with correct name
5. Top-right profile avatar is visible on every tab screen → tap opens Settings
6. Floating teal chat button visible in bottom-right on every tab screen

**Completion criteria:** App compiles, all 13+ screens are reachable via navigation, tab bar works, profile icon works on all screens, `tsc --noEmit` passes.

---

### Cycle 2: Supabase Schema + Auth + RLS

**Objective:** Deploy the complete database schema to Supabase, configure auth, set up Row Level Security, create the profile auto-creation trigger, and verify everything with integration tests.

**Dependencies:** None (first cycle, parallel with Cycle 1)

**Files to create:**
```
supabase/
├── config.toml
├── seed.sql                    # Initial badge definitions, challenge templates
├── migrations/
│   ├── 001_create_enums.sql
│   ├── 002_create_core_tables.sql      # profiles, calendar_connections, calendar_events, plaid_connections, accounts, transactions, recurring_transactions
│   ├── 003_create_prediction_tables.sql # spending_predictions, prediction_feedback
│   ├── 004_create_budget_tables.sql     # budgets, budget_snapshots
│   ├── 005_create_gamification_tables.sql # badges, user_badges, challenges, challenge_participants, streak_history, xp_transactions
│   ├── 006_create_social_tables.sql     # friendships, friend_circles, circle_members, social_nudges, notifications
│   ├── 007_create_rls_policies.sql
│   ├── 008_create_indexes.sql
│   ├── 009_create_triggers.sql          # handle_new_user, update_updated_at
│   └── 010_enable_realtime.sql
└── tests/
    ├── schema_test.sql          # Verify all 22 tables exist
    ├── rls_test.sql             # Verify RLS blocks cross-user access
    ├── trigger_test.sql         # Verify profile auto-creation
    └── run_tests.sh             # Orchestrator script
```

**Key schema details (from MVP.md §13):**
- 15 custom ENUMs (calendar_provider, event_category, transaction_frequency, feedback_type, badge_tier, participant_status, streak_type, xp_source, friendship_status, circle_role, nudge_type, notification_priority, privacy_level, plaid_status, confidence_label)
- 22 tables with proper foreign keys, unique constraints, CHECK constraints
- `friendships` has `CHECK (user_id < friend_id)` to prevent duplicates
- Profile auto-created on auth.users insert via trigger
- `updated_at` auto-updated via trigger on profiles
- RLS enabled on ALL 22 tables
- 30+ indexes on foreign keys and common query patterns
- Realtime enabled on: notifications, social_nudges, challenge_participants

**Verify:**
```bash
# Apply all migrations
cd supabase && supabase db reset

# Verify all 22 tables exist
supabase db test schema_test.sql

# Verify RLS: create two test users, verify user A cannot read user B's data
supabase db test rls_test.sql

# Verify trigger: create auth user → profile row auto-created
supabase db test trigger_test.sql

# Verify indexes exist
psql $DATABASE_URL -c "SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';" | grep -E "^[3-9][0-9]"

# Full test suite
bash supabase/tests/run_tests.sh
```

**Developer can test:**
1. Open Supabase dashboard → Table Editor → verify all 22 tables visible
2. Create a user via Supabase Auth → check `profiles` table has auto-created row with friend_code
3. Try inserting a transaction for user A → switch to user B's context → verify SELECT returns 0 rows (RLS works)
4. Check Authentication → Providers → email/password enabled
5. Check Database → Replication → notifications, social_nudges, challenge_participants enabled

**Completion criteria:** All 22 tables created, all ENUMs exist, all RLS policies active, all indexes created, realtime enabled, profile trigger works, all test SQL scripts pass.

---

### Cycle 3: FastAPI ML Service Scaffold

**Objective:** Create a working FastAPI microservice with the route structure, Pydantic schemas for all endpoints, health check, and a mock prediction pipeline that returns realistic placeholder data. Download the sentence-transformer model.

**Dependencies:** None (first cycle, parallel with Cycle 1 and 2)

**Files to create:**
```
ml-service/
├── pyproject.toml              # Poetry project with dependencies
├── Dockerfile
├── .env.example
├── app/
│   ├── main.py                 # FastAPI app initialization, CORS, routes
│   ├── config.py               # Environment config (API keys, model paths)
│   ├── routes/
│   │   ├── predict.py          # POST /ml/predict, POST /ml/batch-predict
│   │   ├── classify.py         # POST /ml/classify-event
│   │   ├── insights.py         # POST /ml/insights (Claude API)
│   │   ├── chat.py             # POST /ml/chat (streaming Claude)
│   │   └── health.py           # GET /ml/health, GET /ml/model/status
│   ├── schemas/
│   │   ├── events.py           # CalendarEvent, EventFeatures
│   │   ├── predictions.py      # PredictionRequest, PredictionResponse, BatchPredictionRequest
│   │   ├── classification.py   # ClassificationResponse
│   │   ├── insights.py         # InsightRequest, InsightResponse
│   │   └── chat.py             # ChatRequest, ChatResponse
│   ├── ml/
│   │   ├── embeddings.py       # SentenceTransformer wrapper, build_event_text()
│   │   ├── classifier.py       # SpendingCategoryClassifier (PyTorch)
│   │   ├── amount_predictor.py # XGBoost amount regression
│   │   ├── confidence.py       # Confidence scoring with Platt scaling
│   │   └── pipeline.py         # Full 5-stage pipeline orchestrator
│   ├── services/
│   │   ├── claude_service.py   # Claude API wrapper for insights + chat
│   │   └── feature_extractor.py # SPENDING_KEYWORDS, extract_features()
│   └── models/                 # Directory for saved model weights
│       └── .gitkeep
└── tests/
    ├── conftest.py             # Test fixtures (sample events, test client)
    ├── test_health.py          # Health endpoint returns 200
    ├── test_schemas.py         # All Pydantic schemas validate correctly
    ├── test_predict.py         # Predict endpoint returns valid response shape
    ├── test_classify.py        # Classify endpoint returns valid categories
    ├── test_embeddings.py      # Embedding generation works, returns 384-dim vector
    ├── test_feature_extractor.py # Feature extraction covers all keyword categories
    └── test_pipeline.py        # Full pipeline end-to-end returns valid output
```

**Key implementation details:**
- For this cycle, the classifier and amount predictor return MOCK data (random but realistic). The actual trained models come in Cycle 8.
- The sentence-transformer model (`all-MiniLM-L6-v2`) MUST be downloaded and working — embeddings.py should produce real 384-dim vectors.
- `feature_extractor.py` must implement the full SPENDING_KEYWORDS dictionary and `extract_features()` function from MVP.md §4.
- `pipeline.py` orchestrates all 5 stages in sequence but stages 2-4 return mocks for now.
- Claude service should have the actual API call structure but use a mock/fallback if no API key is set.
- All Pydantic schemas must match the JSON schemas from MVP.md §4.

**Verify:**
```bash
cd ml-service

# Install dependencies
poetry install

# Download sentence-transformer model (will cache locally)
python -c "from sentence_transformers import SentenceTransformer; m = SentenceTransformer('all-MiniLM-L6-v2'); print(f'Model loaded, dim={m.get_sentence_embedding_dimension()}')"

# Type check
poetry run mypy app/ --ignore-missing-imports

# Run all tests
poetry run pytest tests/ -v --tb=short

# Verify API starts and health endpoint works
poetry run uvicorn app.main:app --port 8000 &
sleep 5
curl -s http://localhost:8000/ml/health | python -m json.tool
curl -s -X POST http://localhost:8000/ml/predict -H "Content-Type: application/json" -d '{"event":{"title":"Team Lunch at Earls","location":"Earls Vancouver","start_time":"2026-03-06T12:30:00","duration_minutes":90,"attendees":["alice@co.com"]}}' | python -m json.tool
kill %1

# All tests pass
poetry run pytest tests/ -v --tb=short -q | tail -1 | grep "passed"
```

**Developer can test:**
1. Run `poetry run uvicorn app.main:app --reload`
2. Open `http://localhost:8000/docs` → see Swagger UI with all endpoints
3. Try `/ml/predict` with a sample event → get back a JSON with `category`, `amount`, `confidence`, `interval`
4. Try `/ml/health` → returns `{"status": "healthy", "model_version": "v1.0-mock"}`
5. Try `/ml/classify-event` → returns category probabilities summing to 1.0

**Completion criteria:** FastAPI starts, all routes respond, Pydantic schemas validate, sentence-transformer produces real embeddings, all pytest tests pass, Swagger docs render.

---

## Phase 2: Core Integrations

---

### Cycle 4: Auth Screens + Supabase Auth Integration

**Objective:** Build working Login and Signup screens connected to Supabase Auth. User can create an account, log in, log out, and the app routes to the correct stack (auth vs main) based on session state.

**Dependencies:** Cycle 1 (navigation scaffold), Cycle 2 (Supabase auth configured)

**Files to create/modify:**
```
app/src/
├── lib/
│   └── supabase.ts             # Supabase client initialization (with expo-secure-store for token persistence)
├── hooks/
│   └── useAuth.ts              # Auth state hook (session, user, loading, signUp, signIn, signOut)
├── stores/
│   └── authStore.ts            # Zustand auth store
├── screens/auth/
│   ├── LoginScreen.tsx          # Email + password fields, "Sign In" button, link to Signup
│   └── SignupScreen.tsx         # Name + email + password, "Create Account", link to Login
└── navigation/
    └── RootNavigator.tsx        # MODIFY: use auth state to switch between AuthStack and OnboardingStack/MainTabs
```

**Tests to write:**
```
app/src/__tests__/
├── hooks/useAuth.test.ts       # Mock Supabase, test signUp/signIn/signOut state transitions
├── screens/LoginScreen.test.tsx  # Renders fields, validates inputs, calls signIn
├── screens/SignupScreen.test.tsx # Renders fields, validates inputs, calls signUp
└── lib/supabase.test.ts        # Client initializes, returns valid instance
```

**Verify:**
```bash
cd app

# TypeScript compiles
npx tsc --noEmit

# Unit tests pass
npx jest src/__tests__/ --passWithNoTests

# Integration test: create user via CLI, verify profile exists
# (requires running Supabase)
npx ts-node scripts/test-auth-flow.ts
```

**Developer can test:**
1. Open app → see Login screen
2. Tap "Create Account" → navigate to Signup
3. Enter name, email, password → tap "Create Account" → should succeed, navigate to Onboarding
4. Log out → log back in with same credentials → navigate to Main Tabs (skip onboarding if already completed)
5. Check Supabase dashboard → user exists in auth.users, profile exists in profiles table with auto-generated friend_code

**Completion criteria:** Signup creates user + profile, login works, logout works, auth state persists across app restart, navigation routes correctly based on auth state.

---

### Cycle 5: Synthetic Data Generator

**Objective:** Build a data generator that produces 3 months of realistic calendar events and transaction data for both demo personas (Sarah and Marcus). This data is essential for ML training (Cycle 8) and demo mode (Cycle 19).

**Dependencies:** Cycle 2 (schema must exist for data shape)

**Files to create:**
```
data/
├── generators/
│   ├── calendar_generator.py    # Generates calendar events for both personas
│   ├── transaction_generator.py # Generates matching transactions
│   ├── persona_profiles.py      # Sarah and Marcus persona definitions
│   └── utils.py                 # Date helpers, random amount generators with natural variance
├── output/
│   ├── sarah_events.json
│   ├── sarah_transactions.json
│   ├── marcus_events.json
│   ├── marcus_transactions.json
│   └── training_pairs.json      # 10,000 event-to-transaction pairs for ML training
├── seed_supabase.py             # Script to load generated data into Supabase
└── tests/
    ├── test_calendar_generator.py
    ├── test_transaction_generator.py
    └── test_training_pairs.py
```

**Persona data requirements (from MVP.md §16):**

**Sarah Chen:**
- MWF classes (9:30am), study groups at coffee shops 2x/week ($6-10 each), gym 3x/week, Starbucks shifts weekends, Friday night outings ($30-60), occasional brunch ($20-30)
- Monthly income: $1,200, budget: $1,000
- Subscriptions: Spotify ($10.99), Netflix shared ($5), Adobe CC student ($15), iCloud ($1)

**Marcus Thompson:**
- Daily standup 10am, team lunches 2x/week ($20-35), gym 5x/week, dates 1-2x/month ($80-120 dinner), monthly board game night ($15), quarterly offsite
- Monthly income: $4,200, budget: $3,000
- 12 subscriptions totaling $220.86/month

**Training pairs:** 10,000 event-to-transaction pairs with realistic amounts, natural variance (±20%), and proper category distribution.

**Verify:**
```bash
cd data

# Generate all data
python generators/calendar_generator.py
python generators/transaction_generator.py

# Verify output files exist and have correct structure
python -c "
import json
events = json.load(open('output/sarah_events.json'))
txns = json.load(open('output/sarah_transactions.json'))
pairs = json.load(open('output/training_pairs.json'))
assert len(events) >= 180, f'Expected 180+ events, got {len(events)}'
assert len(txns) >= 200, f'Expected 200+ transactions, got {len(txns)}'
assert len(pairs) >= 10000, f'Expected 10000+ pairs, got {len(pairs)}'
print(f'Sarah: {len(events)} events, {len(txns)} transactions')

events_m = json.load(open('output/marcus_events.json'))
txns_m = json.load(open('output/marcus_transactions.json'))
print(f'Marcus: {len(events_m)} events, {len(txns_m)} transactions')
print(f'Training pairs: {len(pairs)}')
print('ALL CHECKS PASSED')
"

# Run tests
pytest tests/ -v
```

**Developer can test:**
1. Run the generators → open output JSON files
2. Verify Sarah's events include: MWF classes, study groups at JJ Bean/Waves Coffee, gym sessions, Starbucks shifts, Friday outings
3. Verify Marcus's events include: daily standups, team lunches at restaurants, gym sessions, dates, board game night
4. Verify transaction amounts have natural variance (not identical amounts for similar events)
5. Verify training pairs have proper category distribution (not all dining)

**Completion criteria:** Both personas have 3 months of realistic events + transactions, training dataset has 10,000+ pairs, all data conforms to the Supabase schema shapes, tests pass.

---

### Cycle 6: Calendar Integration (Google Calendar OAuth + iCal Parser)

**Objective:** Implement Google Calendar OAuth flow, event syncing, iCal file parsing, and the multi-calendar merging algorithm. Events are stored in the `calendar_events` table.

**Dependencies:** Cycle 2 (schema), Cycle 5 (synthetic data as fallback)

**Files to create/modify:**
```
app/src/
├── services/
│   ├── calendarService.ts       # Google Calendar OAuth + event fetch + iCal parse
│   └── calendarMerger.ts        # Multi-calendar merge + deduplication
├── hooks/
│   └── useCalendar.ts           # Hook for calendar state, sync trigger
├── screens/onboarding/
│   └── ConnectCalendarScreen.tsx # MODIFY: wire up OAuth, iCal upload, demo data buttons
└── __tests__/
    ├── services/calendarService.test.ts
    ├── services/calendarMerger.test.ts
    └── screens/ConnectCalendarScreen.test.ts

supabase/functions/
├── sync-calendar/
│   └── index.ts                 # Edge Function: fetch events from Google Calendar API, upsert to DB
└── import-ical/
    └── index.ts                 # Edge Function: parse uploaded .ics content, insert events
```

**Key implementation:**
- Google OAuth via `expo-auth-session` with `calendar.readonly` and `calendar.events.readonly` scopes
- Token refresh handling (check expiry, auto-refresh with stored refresh_token)
- Event normalization to unified schema: `{ title, description, location, start_time, end_time, is_all_day, recurrence_rule, attendee_count, category }`
- Multi-calendar merge: deduplicate by fuzzy title match (Levenshtein > 0.85) + same start_time
- iCal parser: extract VEVENT → SUMMARY, DTSTART, DTEND, LOCATION, DESCRIPTION, RRULE
- "Use Demo Data" button loads synthetic events from Cycle 5

**Verify:**
```bash
cd app

# TypeScript compiles
npx tsc --noEmit

# Unit tests
npx jest src/__tests__/services/calendarService.test.ts -v
npx jest src/__tests__/services/calendarMerger.test.ts -v

# Edge Function tests (Supabase CLI)
cd ../supabase
supabase functions serve sync-calendar --no-verify-jwt &
sleep 3
curl -s -X POST http://localhost:54321/functions/v1/sync-calendar \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-uuid"}' | python -m json.tool
kill %1

# Verify events in database
psql $DATABASE_URL -c "SELECT count(*) FROM calendar_events WHERE user_id = 'test-uuid';"
```

**Developer can test:**
1. Open app → Onboarding → "Connect Calendar" screen
2. Tap "Connect Google Calendar" → Google OAuth consent screen appears
3. Grant access → events sync → see success message with event count
4. OR tap "Upload .ics File" → pick a .ics file → events imported
5. OR tap "Use Demo Data" → synthetic events loaded instantly
6. Check Supabase dashboard → `calendar_events` table has rows

**Completion criteria:** At least one calendar connection method works end-to-end (OAuth, iCal, or demo data), events stored in DB, merge/dedup logic tested, all tests pass.

---

### Cycle 7: Plaid Integration (Sandbox)

**Objective:** Implement Plaid Link for account connection, transaction syncing, balance retrieval, and recurring transaction detection — all in sandbox mode.

**Dependencies:** Cycle 2 (schema)

**Files to create/modify:**
```
app/src/
├── services/
│   └── plaidService.ts          # Plaid Link setup, token exchange
├── hooks/
│   └── usePlaid.ts              # Hook for Plaid state, accounts, transactions
├── screens/onboarding/
│   └── ConnectBankScreen.tsx    # MODIFY: wire up Plaid Link button + sandbox option
└── __tests__/
    ├── services/plaidService.test.ts
    └── hooks/usePlaid.test.ts

supabase/functions/
├── create-link-token/
│   └── index.ts                 # Edge Function: call Plaid API to create link token
├── exchange-token/
│   └── index.ts                 # Edge Function: exchange public token for access token
└── sync-transactions/
    └── index.ts                 # Edge Function: pull transactions, upsert, detect recurring
```

**Key implementation:**
- Use `react-native-plaid-link-sdk` for Plaid Link modal
- Sandbox credentials: client_id + secret from env, test institution "First Platypus Bank", user_good/pass_good
- Initial sync: pull 90 days of transactions
- Category mapping: Plaid categories → FutureSpend categories (dining, transport, etc.)
- Recurring detection: group by merchant name similarity + amount proximity (±10%) + regular intervals

**Verify:**
```bash
cd app
npx tsc --noEmit
npx jest src/__tests__/services/plaidService.test.ts -v

# Test Edge Functions
cd ../supabase
supabase functions serve create-link-token --no-verify-jwt &
sleep 3
curl -s -X POST http://localhost:54321/functions/v1/create-link-token \
  -H "Authorization: Bearer $TEST_TOKEN" | python -m json.tool | grep "link_token"
kill %1

# Verify transactions loaded
psql $DATABASE_URL -c "SELECT count(*) FROM transactions;" | grep -E "[1-9][0-9]*"
```

**Developer can test:**
1. Open app → Onboarding → "Connect Bank" screen
2. Tap "Connect Your Bank" → Plaid Link modal opens
3. Select "First Platypus Bank" → enter user_good/pass_good
4. Success → accounts connected, transactions syncing
5. Check Supabase → `accounts` table has rows, `transactions` table has 90 days of data
6. Check `recurring_transactions` table → detected subscriptions

**Completion criteria:** Plaid sandbox connects, transactions sync, recurring detection runs, all stored in DB, tests pass.

---

### Cycle 8: ML Prediction Pipeline (Trained Models)

**Objective:** Train the category classifier and amount predictor on the synthetic dataset from Cycle 5. Replace the mock predictions in Cycle 3 with real models. Wire up Claude API for Stage 5 insight generation.

**Dependencies:** Cycle 3 (FastAPI scaffold), Cycle 5 (training data)

**Files to modify:**
```
ml-service/app/ml/
├── classifier.py       # MODIFY: train on synthetic data, save model weights
├── amount_predictor.py # MODIFY: train XGBoost on synthetic data, save model
├── confidence.py       # MODIFY: calibrate with Platt scaling on validation set
├── pipeline.py         # MODIFY: load real models, replace mock predictions

ml-service/
├── scripts/
│   ├── train_classifier.py      # Training script for category classifier
│   ├── train_amount_model.py    # Training script for XGBoost
│   └── evaluate_models.py       # Accuracy, MAE, RMSE, confidence calibration
├── app/models/
│   ├── classifier_v1.pt         # Saved PyTorch classifier weights
│   ├── amount_model_v1.json     # Saved XGBoost model
│   └── confidence_calibrator_v1.pkl  # Saved Platt scaler
└── tests/
    ├── test_trained_classifier.py    # Accuracy > 80% on test set
    ├── test_trained_amount.py        # MAE < $15 on test set
    ├── test_trained_confidence.py    # Calibration: "High" predictions within 20% of actual 80%+ of the time
    └── test_full_pipeline.py         # End-to-end: event in → prediction out (real models)
```

**Key training specs (from MVP.md §4):**
- Classifier: embedding(384) + structured_features(30) → Dense(256,ReLU) → Dropout(0.3) → Dense(128,ReLU) → Dense(13,Softmax)
- Amount predictor: XGBoost with features: category, day_of_week, time_of_day, location_price_level, event_duration, num_attendees, is_recurring, user_historical_avg, day_of_month, is_payday_week
- Confidence: Platt scaling, weighted formula: `confidence = base_category_confidence × recurrence_factor × data_quality_factor`
- Train/validation/test split: 70/15/15

**Accuracy targets:**
- Category classification: > 80% accuracy on test set
- Amount prediction: MAE < $15 on test set
- Confidence calibration: "High" confidence predictions are within 20% of actual amount at least 80% of the time

**Verify:**
```bash
cd ml-service

# Train models
poetry run python scripts/train_classifier.py
poetry run python scripts/train_amount_model.py

# Verify model files saved
ls -la app/models/classifier_v1.pt app/models/amount_model_v1.json

# Evaluate
poetry run python scripts/evaluate_models.py

# Run accuracy tests (these enforce the targets)
poetry run pytest tests/test_trained_classifier.py -v
poetry run pytest tests/test_trained_amount.py -v
poetry run pytest tests/test_trained_confidence.py -v

# Full pipeline test with real models
poetry run pytest tests/test_full_pipeline.py -v

# API integration test
poetry run uvicorn app.main:app --port 8000 &
sleep 5
curl -s -X POST http://localhost:8000/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"event":{"title":"Team Lunch at Earls","location":"Earls Kitchen Vancouver","start_time":"2026-03-06T12:30:00","duration_minutes":90,"attendees":["a@co.com","b@co.com"]}}' \
  | python -c "import sys,json; d=json.load(sys.stdin); assert d['category']=='dining'; assert 15<d['amount']<50; print('PASS:', d)"
kill %1
```

**Developer can test:**
1. Run `poetry run python scripts/evaluate_models.py` → see accuracy report printed
2. Start API → send "Coffee with Sarah at Starbucks" → expect category=coffee_drinks, amount ~$6-10
3. Send "Team Lunch at Earls, 6 attendees" → expect category=dining, amount ~$25-35, confidence High
4. Send "Gym Session" → expect category=health_fitness, amount ~$0, confidence Very High
5. Send "Birthday party at unknown venue" → expect lower confidence (Medium/Low)

**Completion criteria:** Both models trained and saved, accuracy targets met, full pipeline returns real predictions, Claude generates insights, all tests pass.

---

## Phase 3: Feature Screens

---

### Cycle 9: Dashboard Screen (Metrics Hub)

**Objective:** Build the Dashboard screen with real data: budget summary card with trajectory chart, category budget circles, burn rate gauge, Financial Health Score ring, and key metric cards.

**Dependencies:** Cycle 1 (navigation), Cycle 4 (auth/user), Cycle 7 (transaction data for metrics)

**Files to create/modify:**
```
app/src/
├── screens/dashboard/
│   └── DashboardScreen.tsx      # MODIFY: replace placeholder with real UI
├── components/dashboard/
│   ├── BudgetSummaryCard.tsx    # Hero card: "$X left", trajectory chart
│   ├── SpendingTrajectoryChart.tsx  # Victory Native line chart
│   ├── CategoryCircles.tsx      # Horizontal scroll of circular progress indicators
│   ├── BurnRateGauge.tsx        # Circular gauge, color-coded
│   ├── HealthScoreRing.tsx      # Large radial ring (0-100), letter grade center
│   └── MetricCards.tsx          # Row of 3: spending velocity, savings rate, CCI
├── hooks/
│   ├── useBudget.ts             # Fetch budget status, calculations
│   └── useMetrics.ts            # Compute burn rate, velocity, health score
├── stores/
│   └── budgetStore.ts           # Zustand store for budget state
└── __tests__/
    ├── components/BudgetSummaryCard.test.tsx
    ├── components/CategoryCircles.test.tsx
    ├── hooks/useBudget.test.ts
    └── hooks/useMetrics.test.ts
```

**Verify:**
```bash
cd app
npx tsc --noEmit
npx jest src/__tests__/components/BudgetSummaryCard.test.tsx -v
npx jest src/__tests__/components/CategoryCircles.test.tsx -v
npx jest src/__tests__/hooks/useBudget.test.ts -v
npx jest src/__tests__/hooks/useMetrics.test.ts -v
```

**Developer can test:**
1. Log in with a seeded user (Sarah's demo data loaded)
2. Dashboard shows "$X left of $1,000 budget" with a spending trajectory chart
3. Category circles scroll horizontally, each showing remaining amount with green/yellow/red coloring
4. Burn rate gauge shows the pace indicator
5. Health Score ring shows a grade (e.g., "B — 74")
6. Pull to refresh reloads all data

**Completion criteria:** Dashboard renders with real data from Supabase, all 5 component groups visible, charts animate, metrics compute correctly, tests pass.

---

### Cycle 10: Calendar View Screen

**Objective:** Build the Calendar View with month/week toggle, spending heatmap, day selection with bottom sheet, and prediction cards for future events.

**Dependencies:** Cycle 1 (navigation), Cycle 6 (calendar events), Cycle 8 (predictions)

**Files to create/modify:**
```
app/src/
├── screens/calendar/
│   └── CalendarViewScreen.tsx   # MODIFY: replace placeholder
├── components/calendar/
│   ├── MonthGrid.tsx            # Calendar grid with heatmap coloring
│   ├── WeekTimeline.tsx         # Week view with time slots
│   ├── DayCell.tsx              # Individual day cell with intensity + event dots
│   ├── DayDetailSheet.tsx       # Bottom sheet with events + predictions
│   ├── EventCard.tsx            # Single event with prediction overlay
│   └── ViewToggle.tsx           # Month/Week segmented control
├── hooks/
│   └── useCalendarView.ts      # Calendar data, predictions, heatmap calculations
└── __tests__/
    ├── components/MonthGrid.test.tsx
    ├── components/DayCell.test.tsx
    └── hooks/useCalendarView.test.ts
```

**Verify:**
```bash
cd app
npx tsc --noEmit
npx jest src/__tests__/components/MonthGrid.test.tsx -v
npx jest src/__tests__/components/DayCell.test.tsx -v
npx jest src/__tests__/hooks/useCalendarView.test.ts -v
```

**Developer can test:**
1. Navigate to Calendar tab → see month view with days colored by spending intensity
2. Future days show dashed borders with predicted spending tint
3. Tap a day → bottom sheet slides up showing events with predicted amounts and confidence badges
4. Toggle to Week view → see time-slot layout with event blocks
5. Swipe left/right → navigate months

**Completion criteria:** Month and week views render, heatmap coloring works, bottom sheet shows event details with predictions, tests pass.

---

### Cycle 11: Budget System

**Objective:** Build the budget CRUD system, budget calculation engine (burn rate, velocity, etc.), Budget Detail View screen, and the Set Budget onboarding screen.

**Dependencies:** Cycle 2 (schema), Cycle 7 (transaction data)

**Files to create/modify:**
```
app/src/
├── screens/
│   ├── onboarding/SetBudgetScreen.tsx  # MODIFY: wire up budget creation with category sliders
│   └── shared/BudgetDetailScreen.tsx   # MODIFY: replace placeholder
├── components/budget/
│   ├── BudgetProgressBar.tsx
│   ├── CategorySlider.tsx
│   ├── TrendChart.tsx           # 6-month category spending trend
│   └── TransactionList.tsx      # Scrollable transaction list for a category
├── services/
│   └── budgetService.ts         # Budget CRUD, calculation engine
├── hooks/
│   └── useBudgetDetail.ts       # Per-category budget data
└── __tests__/
    ├── services/budgetService.test.ts  # Test all formula calculations
    ├── screens/SetBudgetScreen.test.tsx
    └── screens/BudgetDetailScreen.test.tsx

supabase/functions/
└── calculate-budget-status/
    └── index.ts                 # Edge Function: aggregate spending, compute metrics
```

**Verify:**
```bash
cd app
npx tsc --noEmit
npx jest src/__tests__/services/budgetService.test.ts -v  # Most important — formulas must be correct
npx jest src/__tests__/screens/ -v
```

**Developer can test:**
1. Complete onboarding → Set Budget screen → drag category sliders → pie chart updates live
2. Tap "Looks Good!" → budget saved to Supabase
3. On Dashboard, tap a category circle → Budget Detail View opens
4. See progress bar, trend chart, transaction list for that category
5. Tap "Adjust Budget" → slider modal → change amount → saved

**Completion criteria:** Budget creation works, formulas compute correctly (burn rate, velocity per MVP.md §5), Budget Detail renders with real data, tests pass.

---

### Cycle 12: Plan Screen

**Objective:** Build the Plan tab — the proactive planning hub with upcoming predictions, budget tools, savings rules, recurring expenses, and transaction review queue.

**Dependencies:** Cycle 1 (navigation), Cycle 8 (predictions), Cycle 11 (budget system)

**Files to create/modify:**
```
app/src/
├── screens/plan/
│   └── PlanScreen.tsx           # MODIFY: replace placeholder
├── components/plan/
│   ├── PredictionsList.tsx      # Upcoming predicted events with amounts + confidence
│   ├── BudgetAdjuster.tsx       # Quick budget adjustment tools
│   ├── SavingsRulesConfig.tsx   # "Save the Difference" toggle + rate slider
│   ├── RecurringExpenses.tsx    # Upcoming recurring charges
│   └── ReviewQueue.tsx          # Unreviewed transactions queue
├── screens/shared/
│   └── TransactionReviewScreen.tsx  # Full transaction review (Exclude, Split, Recurring, Review)
├── hooks/
│   ├── usePredictions.ts        # Fetch predictions for upcoming events
│   ├── useSavingsRules.ts       # Smart savings config state
│   └── useReviewQueue.ts        # Unreviewed transactions
└── __tests__/
    ├── components/PredictionsList.test.tsx
    ├── components/SavingsRulesConfig.test.tsx
    ├── hooks/usePredictions.test.ts
    └── screens/TransactionReviewScreen.test.tsx
```

**Verify:**
```bash
cd app
npx tsc --noEmit
npx jest src/__tests__/components/PredictionsList.test.tsx -v
npx jest src/__tests__/hooks/usePredictions.test.ts -v
npx jest src/__tests__/screens/TransactionReviewScreen.test.tsx -v
```

**Developer can test:**
1. Navigate to Plan tab → see list of upcoming predicted expenses
2. Each prediction shows event name, time, predicted amount, confidence badge
3. Scroll down → recurring expenses section shows upcoming subscriptions
4. "Save the Difference" toggle → turn on → set savings rate with slider
5. Transaction review queue → tap transaction → review screen with Exclude/Split/Recurring/Review buttons
6. Mark as reviewed → card disappears from queue

**Completion criteria:** Plan screen renders all 5 sections with real data, predictions display correctly, transaction review flow works end-to-end, savings rules save to DB, tests pass.

---

### Cycle 13: Floating AI Chat Assistant

**Objective:** Build the floating chat button (FAB) and slide-up chat sheet that's accessible from every screen. Context-aware, powered by Claude, with streaming responses.

**Dependencies:** Cycle 1 (navigation/layout), Cycle 8 (prediction engine for context)

**Files to create/modify:**
```
app/src/
├── components/
│   ├── FloatingChatButton.tsx   # MODIFY: replace placeholder with real FAB
│   └── chat/
│       ├── ChatSheet.tsx         # Bottom sheet (80% height) with full chat UI
│       ├── MessageBubble.tsx     # AI and user message bubbles
│       ├── TypingIndicator.tsx   # Three pulsing dots
│       ├── SuggestedChips.tsx    # Context-aware suggestion carousel
│       └── QuickActions.tsx      # "This Week", "Budget Check", "Savings Tips"
├── services/
│   └── chatService.ts           # Send message to Claude via Edge Function, handle streaming
├── hooks/
│   ├── useChat.ts               # Chat state, message history, send/receive
│   └── useChatContext.ts        # Detect current screen, build context-aware suggestions
├── stores/
│   └── chatStore.ts             # Zustand store for chat messages + persistence
└── __tests__/
    ├── components/ChatSheet.test.tsx
    ├── components/SuggestedChips.test.tsx
    ├── services/chatService.test.ts
    └── hooks/useChat.test.ts

supabase/functions/
└── chat/
    └── index.ts                 # Edge Function: assemble user context, call Claude, stream response
```

**Context-aware suggestions by screen (from MVP.md §15, Global Overlay):**
- Dashboard: "How are my metrics looking?", "Am I on track this month?"
- Calendar: "What will I spend this week?", "Which day is most expensive?"
- Plan: "Help me adjust my budget", "What can I cut?"
- Arena: "Suggest a challenge for my circle", "How do I earn more XP?"
- Insights: "Explain my spending trend", "Why did my health score drop?"

**Verify:**
```bash
cd app
npx tsc --noEmit
npx jest src/__tests__/components/ChatSheet.test.tsx -v
npx jest src/__tests__/services/chatService.test.ts -v
npx jest src/__tests__/hooks/useChat.test.ts -v

# Edge Function test
cd ../supabase
supabase functions serve chat --no-verify-jwt &
sleep 3
curl -s -X POST http://localhost:54321/functions/v1/chat \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "How am I doing this month?", "screen": "dashboard"}' | head -5
kill %1
```

**Developer can test:**
1. On any tab screen → see teal floating button in bottom-right
2. Tap button → chat sheet slides up from bottom
3. See context-aware suggested question chips (different per screen)
4. Tap a chip → message sent → AI response streams in with typing indicator
5. Type a custom question → get personalized response based on budget/calendar data
6. Swipe sheet down → minimizes back to FAB
7. Navigate to different tab → FAB still visible, tap → chat history preserved, new suggestions

**Completion criteria:** FAB visible on all main screens, chat sheet opens/closes smoothly, Claude responds with context-aware answers, streaming works, suggestions change per screen, chat history persists, tests pass.

---

## Phase 4: Social & Gamification

---

### Cycle 14: Gamification Engine (Backend)

**Objective:** Implement the server-side gamification logic: XP awards, level calculations, streak tracking, badge condition evaluation, and challenge progress tracking.

**Dependencies:** Cycle 2 (schema), Cycle 11 (budget data for badge conditions)

**Files to create/modify:**
```
supabase/functions/
├── checkin/
│   └── index.ts                 # Daily check-in: increment streak, award XP, check badge conditions
├── award-xp/
│   └── index.ts                 # Generic XP award function (called by other functions)
├── evaluate-badges/
│   └── index.ts                 # Check all badge unlock conditions for a user
├── challenge-progress/
│   └── index.ts                 # Update challenge progress based on spending data
└── leaderboard/
    └── index.ts                 # Compute leaderboard rankings for a circle

supabase/
├── migrations/
│   └── 011_seed_badges.sql      # Insert all 20 badge definitions
└── tests/
    ├── test_xp_awards.sql
    ├── test_streak_logic.sql
    ├── test_badge_conditions.sql
    └── test_leaderboard.sql
```

**Key logic (from MVP.md §8):**
- XP awards: check-in=10, under_daily_budget=25, challenge_complete=100-500, prediction_confirmed=50, review_transaction=5, invite_friend=200
- Level formula: `XP_needed(level) = 100 × level^1.5`
- Streak types: daily_checkin, weekly_budget, savings
- Streak freeze: 1 free per 30 days, purchasable at 500 XP, max 3
- Badge conditions: 20 badges with specific unlock criteria
- Leaderboard score: `0.35×SavingsRate + 0.25×StreakLength + 0.25×ChallengeCompletions + 0.15×HealthScore` (all normalized)

**Verify:**
```bash
cd supabase

# Seed badges
supabase db reset  # Re-runs all migrations including badge seed

# Verify 20 badges exist
psql $DATABASE_URL -c "SELECT count(*) FROM badges;" | grep "20"

# Test XP and leveling
supabase db test tests/test_xp_awards.sql
supabase db test tests/test_streak_logic.sql
supabase db test tests/test_badge_conditions.sql
supabase db test tests/test_leaderboard.sql

# Edge Function test: daily check-in
supabase functions serve checkin --no-verify-jwt &
sleep 3
curl -s -X POST http://localhost:54321/functions/v1/checkin \
  -H "Authorization: Bearer $TEST_TOKEN" | python -m json.tool
kill %1

# Verify XP increased and streak incremented
psql $DATABASE_URL -c "SELECT xp, streak_count, level FROM profiles WHERE id = 'test-uuid';"
```

**Developer can test:**
1. Call check-in endpoint → verify XP increases by 10
2. Call check-in 7 days in a row → verify streak_count = 7, "Invested" badge earned
3. Spend under budget for a day → verify 25 XP awarded
4. Create a circle with 2 users → call leaderboard endpoint → verify ranked results
5. Check `user_badges` table → earned badges appear with correct timestamps

**Completion criteria:** XP awards work for all action types, level calculation is correct, streaks increment/reset properly, all 20 badges have conditions that can trigger, leaderboard computation is correct, tests pass.

---

### Cycle 15: Social Features Backend

**Objective:** Implement friend system, friend circles, social nudges, and privacy controls on the backend.

**Dependencies:** Cycle 2 (schema)

**Files to create/modify:**
```
supabase/functions/
├── add-friend/
│   └── index.ts                 # Send friend request by friend code
├── accept-friend/
│   └── index.ts                 # Accept friend request
├── create-circle/
│   └── index.ts                 # Create Inner Circle with invite code
├── join-circle/
│   └── index.ts                 # Join circle via invite code
├── send-nudge/
│   └── index.ts                 # Send social nudge (with rate limiting: max 3/friend/day)
└── circle-leaderboard/
    └── index.ts                 # Compute circle-specific leaderboard

supabase/tests/
├── test_friend_flow.sql         # Add friend, accept, verify bidirectional
├── test_circle_flow.sql         # Create circle, join, verify membership
├── test_nudge_limits.sql        # Verify rate limiting (3/friend/day)
└── test_privacy.sql             # Verify visibility controls
```

**Verify:**
```bash
cd supabase

supabase db test tests/test_friend_flow.sql
supabase db test tests/test_circle_flow.sql
supabase db test tests/test_nudge_limits.sql
supabase db test tests/test_privacy.sql

# Friend request flow
supabase functions serve add-friend --no-verify-jwt &
sleep 3
curl -s -X POST http://localhost:54321/functions/v1/add-friend \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"friend_code": "SAVE-A1B2"}' | python -m json.tool
kill %1
```

**Developer can test:**
1. User A sends friend request to User B via friend code → `friendships` row created with status=pending
2. User B accepts → status=accepted, both can see each other's profiles
3. User A creates circle "SFU Roommates" → invite code generated
4. User B joins with invite code → circle_members row created
5. User A sends nudge to User B → nudge stored, count verified
6. Try sending 4th nudge in same day → rejected (rate limit)
7. User B's privacy set to "private" → User A can't see User B's amounts on leaderboard

**Completion criteria:** Friend add/accept/block works, circles create/join works, nudge rate limiting works, privacy controls enforced by RLS, tests pass.

---

### Cycle 16: Arena Screen

**Objective:** Build the Arena tab — the combined gamification + social hub with 4 internal tabs: My Progress, Challenges, Leaderboard, Friends & Circles.

**Dependencies:** Cycle 1 (navigation), Cycle 14 (gamification engine), Cycle 15 (social backend)

**Files to create/modify:**
```
app/src/
├── screens/arena/
│   └── ArenaScreen.tsx          # MODIFY: replace placeholder with tabbed Arena
├── components/arena/
│   ├── ArenaTabBar.tsx          # Internal tab nav: My Progress | Challenges | Leaderboard | Friends & Circles
│   ├── progress/
│   │   ├── LevelHeader.tsx      # Level, XP progress bar, title
│   │   ├── StatsRow.tsx         # Streak, total XP, badges count
│   │   ├── StreakDisplay.tsx    # Flame animations with streak count
│   │   ├── BadgeGrid.tsx       # Earned (colorful) + locked (silhouette) badges
│   │   └── CheckInButton.tsx   # Floating "Check In" button with confetti
│   ├── challenges/
│   │   ├── ActiveChallenges.tsx
│   │   ├── ChallengeCatalog.tsx # Browse + join challenges
│   │   └── ChallengeCard.tsx    # Progress bar, days remaining, participants
│   ├── leaderboard/
│   │   ├── LeaderboardView.tsx  # Podium + ranked list + metric/period selectors
│   │   ├── Podium.tsx           # Top 3 with crown/medal icons
│   │   └── RankRow.tsx
│   └── social/
│       ├── FriendCodeCard.tsx   # QR + code + share
│       ├── FriendsList.tsx
│       ├── CirclesList.tsx
│       ├── CircleDetail.tsx
│       └── NudgeButton.tsx
├── hooks/
│   ├── useGamification.ts       # XP, level, streaks, badges
│   ├── useChallenges.ts         # Active + available challenges
│   ├── useLeaderboard.ts        # Rankings for selected scope/metric/period
│   └── useFriends.ts            # Friends, circles, nudges
└── __tests__/
    ├── components/arena/LevelHeader.test.tsx
    ├── components/arena/BadgeGrid.test.tsx
    ├── components/arena/LeaderboardView.test.tsx
    ├── hooks/useGamification.test.ts
    └── hooks/useLeaderboard.test.ts
```

**Verify:**
```bash
cd app
npx tsc --noEmit
npx jest src/__tests__/components/arena/ -v
npx jest src/__tests__/hooks/useGamification.test.ts -v
npx jest src/__tests__/hooks/useLeaderboard.test.ts -v
```

**Developer can test:**
1. Navigate to Arena tab → see "My Progress" tab by default
2. Level header shows current level, XP bar, title
3. Streaks display with flame icon and count
4. Badge grid shows earned badges (colorful) and locked (gray silhouettes)
5. Tap "Check In" → confetti, XP +10, streak increments
6. Switch to "Challenges" tab → see active challenges + catalog
7. Join a challenge → progress tracking starts
8. Switch to "Leaderboard" tab → see podium for top 3, ranked list below
9. Switch to "Friends & Circles" → see friend code, friend list, circle list
10. Create a circle → get invite code → share it

**Completion criteria:** All 4 internal tabs render with real data, check-in works, challenges joinable, leaderboard computes, friend/circle management works, tests pass.

---

### Cycle 17: Insights Screen

**Objective:** Build the Insights tab — the AI-powered analysis hub with Financial Health Score breakdown, trend charts, category donut, AI recommendations, CCI visualization, and savings projections.

**Dependencies:** Cycle 1 (navigation), Cycle 8 (predictions for CCI), Cycle 11 (budget data for trends)

**Files to create/modify:**
```
app/src/
├── screens/insights/
│   └── InsightsScreen.tsx       # MODIFY: replace placeholder
├── components/insights/
│   ├── HealthScoreBreakdown.tsx  # Large score ring + 5 component breakdown bars
│   ├── SpendingTrendChart.tsx    # Line chart, weekly/monthly/6mo toggle
│   ├── CategoryDonut.tsx         # Donut chart with legend
│   ├── AIRecommendations.tsx     # Claude-generated insight cards
│   ├── CCIVisualization.tsx      # Calendar Correlation Index gauge
│   ├── SavingsProjection.tsx     # Compound growth curve with goal markers
│   └── MonthComparison.tsx       # This month vs last month side-by-side
├── hooks/
│   ├── useInsights.ts            # Aggregate all insight data
│   └── useRecommendations.ts    # Fetch AI recommendations from Claude
└── __tests__/
    ├── components/insights/HealthScoreBreakdown.test.tsx
    ├── components/insights/SpendingTrendChart.test.tsx
    ├── hooks/useInsights.test.ts
    └── hooks/useRecommendations.test.ts
```

**Verify:**
```bash
cd app
npx tsc --noEmit
npx jest src/__tests__/components/insights/ -v
npx jest src/__tests__/hooks/useInsights.test.ts -v
```

**Developer can test:**
1. Navigate to Insights tab → see Financial Health Score ring at top (e.g., "B — 74")
2. Below: 5 component bars showing breakdown (Budget Adherence, Savings Rate, Stability, CCI, Streak)
3. Scroll → spending trend chart with week/month/6mo toggle
4. Category donut chart → tap a segment → drill into category detail
5. AI Recommendations section → 2-3 cards with actionable suggestions ("Cancel unused Adobe CC subscription")
6. CCI gauge shows calendar prediction accuracy
7. Savings projection shows compound growth curve

**Completion criteria:** All 7 visualization components render with real data, trend toggles work, AI recommendations load from Claude, CCI computes correctly, tests pass.

---

## Phase 5: Polish & Demo

---

### Cycle 18: Push Notifications

**Objective:** Set up Expo Push Notifications for spending alerts, budget warnings, challenge updates, social nudges, and streak reminders.

**Dependencies:** Cycle 14 (gamification for streak reminders), Cycle 15 (social for nudge delivery)

**Files to create/modify:**
```
app/src/
├── services/
│   └── notificationService.ts   # Register token, handle incoming notifications, deep links
├── hooks/
│   └── useNotifications.ts      # Permission request, token registration, handlers

supabase/functions/
├── register-push-token/
│   └── index.ts                 # Store device push token
├── send-notification/
│   └── index.ts                 # Generic notification sender via Expo Push API
└── notification-scheduler/
    └── index.ts                 # Cron-like: evaluate triggers, respect quiet hours, enforce caps

app/src/__tests__/
├── services/notificationService.test.ts
└── hooks/useNotifications.test.ts
```

**Verify:**
```bash
cd app
npx tsc --noEmit
npx jest src/__tests__/services/notificationService.test.ts -v

# Test notification sending
cd ../supabase
supabase functions serve send-notification --no-verify-jwt &
sleep 3
curl -s -X POST http://localhost:54321/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-uuid", "title": "Test", "body": "Hello", "category": "test", "priority": "medium"}' | python -m json.tool
kill %1
```

**Developer can test:**
1. Open app → accept notification permission
2. Trigger a budget warning (spend over 80%) → notification appears
3. Check notification preferences in Settings → toggle categories on/off
4. Verify quiet hours (10pm-8am) are respected
5. Verify max 5 notifications/day cap

**Completion criteria:** Push token registered, notifications send and receive, deep links navigate to correct screen, preferences respected, rate limiting works, tests pass.

---

### Cycle 19: Demo Data + Persona Setup

**Objective:** Create a complete demo mode with pre-seeded data for both personas (Sarah and Marcus). Include a persona switcher for the presentation.

**Dependencies:** ALL previous cycles

**Files to create/modify:**
```
app/src/
├── services/
│   └── demoService.ts           # Load demo data, switch personas, reset state
├── hooks/
│   └── useDemo.ts               # Demo mode state, persona selection
├── data/
│   ├── sarah_seed.json          # Complete seeded state: events, transactions, predictions, budget, streaks, badges, challenges, circle
│   └── marcus_seed.json         # Same for Marcus
└── screens/
    └── shared/
        └── DemoSwitcher.tsx     # Hidden gesture (triple-tap logo) → persona picker

data/
└── seed_demo_data.py            # Script to generate complete demo snapshots

supabase/functions/
└── seed-demo/
    └── index.ts                 # Edge Function: wipe and seed demo data for a user
```

**Demo state requirements (from MVP.md §16):**

**Sarah (Day 18 of month):**
- Budget: $1,000, spent $660, $340 left
- Burn rate: 0.97x (green)
- Upcoming: karaoke Friday ($35), brunch Saturday ($28), study group ($8)
- Streaks: 14-day daily check-in
- Badges: Invested, Steadfast, 2 more
- Active challenge: Coffee Savings Challenge (circle: SFU Roommates)
- Health Score: 72 (B)

**Marcus (Day 15 of month):**
- Budget: $3,000, spent $1,550, $1,450 left
- Burn rate: 1.08x (yellow warning)
- 12 subscriptions ($220.86/month)
- Streaks: 22-day check-in
- Level 12, Money Manager
- Active challenge: $500 Savings Sprint (circle: Dev Team)
- Health Score: 58 (D)

**Verify:**
```bash
cd app
npx tsc --noEmit

# Seed Sarah's demo data
cd ../supabase
curl -s -X POST http://localhost:54321/functions/v1/seed-demo \
  -H "Content-Type: application/json" \
  -d '{"persona": "sarah"}' | python -m json.tool

# Verify data loaded
psql $DATABASE_URL -c "SELECT count(*) FROM calendar_events WHERE user_id = (SELECT id FROM profiles WHERE display_name = 'Sarah Chen');" | grep -E "[1-9]"
psql $DATABASE_URL -c "SELECT count(*) FROM transactions WHERE user_id = (SELECT id FROM profiles WHERE display_name = 'Sarah Chen');" | grep -E "[1-9]"
psql $DATABASE_URL -c "SELECT xp, level, streak_count FROM profiles WHERE display_name = 'Sarah Chen';"

# Same for Marcus
curl -s -X POST http://localhost:54321/functions/v1/seed-demo \
  -H "Content-Type: application/json" \
  -d '{"persona": "marcus"}' | python -m json.tool
```

**Developer can test:**
1. Log in as Sarah → Dashboard shows "$340 left", all metrics populated
2. Calendar shows 3 months of events with predictions
3. Arena shows 14-day streak, earned badges, active challenge
4. Triple-tap app logo → persona switcher appears → switch to Marcus
5. Marcus's Dashboard shows "$1,450 left" with yellow burn rate warning
6. All screens populate correctly for both personas

**Completion criteria:** Both personas fully seeded, every screen shows correct data for each persona, persona switcher works, no empty states during demo.

---

### Cycle 20: Final Polish + Demo Mode

**Objective:** Add animations, loading states, error states, micro-interactions. Ensure the 3-minute demo flow works flawlessly. Build the demo mode toggle that defaults to seeded data on launch.

**Dependencies:** Cycle 19

**Files to modify:**
```
app/src/
├── App.tsx                      # MODIFY: add demo mode check on startup
├── components/ui/
│   ├── SkeletonLoader.tsx       # Skeleton loading screens for all data views
│   ├── EmptyState.tsx           # Empty state illustrations
│   ├── ErrorState.tsx           # Error recovery UI
│   └── ConfettiAnimation.tsx    # Reusable confetti for celebrations
├── screens/ (various)           # Add entrance animations, haptic feedback
└── constants/
    └── demoConfig.ts            # Demo mode flag, default persona, pre-cached chat responses
```

**Verify:**
```bash
cd app

# TypeScript clean
npx tsc --noEmit

# Full test suite — ALL tests across the project
npx jest --passWithNoTests --coverage

# Build check (no warnings)
npx expo export --platform ios 2>&1 | grep -c "error" | grep "0"

# Start app in demo mode and verify no crashes
DEMO_MODE=true npx expo start --no-dev --non-interactive &
sleep 20 && kill %1
```

**Developer can test:**
1. Fresh app launch → demo mode → Sarah's Dashboard loads instantly
2. Walk through the ENTIRE 3-minute demo script from MVP.md §16
3. Every screen transition is smooth (no jank, no white flashes)
4. Skeleton loaders appear briefly while data loads
5. Confetti plays on: onboarding completion, check-in, badge earn, challenge completion
6. Chat responses are fast (pre-cached for common demo queries)
7. No console warnings or errors in development mode

**Completion criteria:** Zero crashes, zero blank screens, demo script runs flawlessly end-to-end for both personas, all animations smooth, full test suite passes with coverage report.

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Cycles** | 20 |
| **Total Phases** | 5 |
| **Max Parallel Waves** | 8 |
| **Key Test Files** | 50+ test files across app/, ml-service/, supabase/ |
| **Verification Commands** | Every cycle has 3-6 automated checks |
| **Manual Test Steps** | Every cycle has 5-7 human-verifiable steps |

### Test Philosophy
- **Unit tests:** Every hook, service, and component has tests
- **Integration tests:** Supabase SQL tests verify schema, RLS, triggers
- **API tests:** FastAPI pytest suite verifies ML pipeline
- **End-to-end:** Demo flow serves as the ultimate integration test
- **Accuracy tests:** ML models must meet specific accuracy thresholds before the cycle completes

### If a Cycle Gets Stuck
1. Re-read the error message carefully
2. Check if a dependency cycle was completed correctly
3. Try the documented fallback approach (e.g., Claude API instead of ML model)
4. If stuck 3+ times on the same issue, flag it and move to the next cycle — come back later
5. Never skip tests to "move faster" — broken foundations compound into unfixable demo failures

---

*This plan references MVP.md sections throughout. For full specification details (schemas, formulas, UI specs), see [MVP.md](./MVP.md).*
