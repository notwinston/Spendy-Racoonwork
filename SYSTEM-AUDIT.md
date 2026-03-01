# FutureSpend MVP — System Audit

> Generated 2026-03-01. Covers every file in `/workspace/app`.

---

## Architecture Overview

| Layer | Technology | Status |
|---|---|---|
| **Frontend** | React Native + Expo SDK 55 + TypeScript + Expo Router | Functional |
| **State** | Zustand (9 stores) | Functional (in-memory only in demo mode) |
| **Backend** | Supabase Cloud (PostgreSQL + Auth + Realtime) | Code paths exist; untested without credentials |
| **Predictions** | LLM via Claude/Gemini API | Real adapters exist; defaults to mock |
| **Banking** | Plaid | Entirely simulated — no SDK, no API calls |
| **Calendar** | Google Calendar OAuth | Real code exists; requires EAS build to run |
| **Theme** | Dark fintech (#0A1628 bg, #00D09C accent) | Fully applied |

The app has a dual-mode architecture. Every service checks `isDemoMode()` from `/workspace/app/src/lib/supabase.ts`. When Supabase credentials are missing (the default), all data comes from bundled JSON files and in-memory state. The Supabase code paths are written but have never been tested against a live database.

---

## What Actually Works

### Fully Functional

- **Navigation**: 5-tab bottom nav (Dashboard, Calendar, Plan, Arena, Insights), auth stack, onboarding flow, modal screens — all routing works via Expo Router
- **Demo persona login**: Tap Sarah or Marcus on the login screen → loads ~200 transactions, ~200 calendar events, predictions, budgets, gamification, and social data
- **Dark theme**: Consistent across all 13+ screens
- **Recurring transaction detection**: Real algorithm in `plaidService.ts` — groups by merchant, analyzes amount variance (20% threshold), detects frequency (weekly/biweekly/monthly/quarterly/yearly), calculates confidence scores
- **Calendar heatmap**: Month view colors days by predicted spending intensity, week view shows events with times
- **ICS parser**: `parseICSFile()` in `calendarService.ts` genuinely parses VEVENT blocks from .ics content (though the file picker UI to trigger it is not wired)
- **LLM adapters**: Claude and Gemini adapters make real API calls with streaming support — they work if you set `EXPO_PUBLIC_CLAUDE_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY`
- **Financial calculations**: Burn rate, budget adherence, health score (weighted composite), health grade (A-F) — all computed from actual transaction data
- **Category detection**: Keyword-based classifier with ~80 keywords across 14 categories, used for both calendar events and predictions
- **Type system**: 40+ TypeScript interfaces/types covering all entities, strict mode, zero compilation errors

### Works But Only In-Memory (Lost on Reload)

- **Daily check-in**: Awards 10 XP, increments streak, evaluates badges — but only in demo state
- **Friend requests**: Send/accept/remove friends — updates local arrays
- **Circle management**: Create/join circles — updates local arrays
- **Nudge sending**: With rate limiting (3/day per pair) — updates local arrays
- **Challenge join**: Adds participation — updates local arrays
- **Notification read/unread**: Tap to mark read — updates local state
- **Budget category display**: Shows spending per category from transactions

---

## What Is Simulated / Dummy

### Entirely Simulated (No Real Implementation)

| Feature | What Happens | Location |
|---|---|---|
| **Plaid bank connection** | Returns hardcoded "Demo Bank (Simulated)", balance $2,847.53, account "Chequing Account" | `plaidService.ts:connectBank()` |
| **Transaction sync** | No-op placeholder — logs warning, returns `[]` | `plaidService.ts:syncTransactions()` |
| **Google Calendar OAuth** | Shows Alert: "requires an EAS build" | `connect-calendar.tsx` |
| **Apple Calendar** | Shows Alert: "requires native modules" | `connect-calendar.tsx` |
| **ICS file picker** | Shows Alert: "requires expo-document-picker" | `connect-calendar.tsx` |
| **Data export** | Shows Alert: "available in a future update" | `settings.tsx` |
| **Push notifications** | No registration, no delivery infrastructure | `notificationStore.ts` |
| **Savings rules** | Toggle switches exist but do absolutely nothing | `plan.tsx` |
| **Transaction review persistence** | All marks (reviewed/excluded/category change) are local `useState` — never saved | `transaction-review.tsx` |

### Hardcoded Values

| Value | Location | Impact |
|---|---|---|
| Bank balance `$2,847.53` | `plaidService.ts` | Fake bank data |
| Default budgets totaling `$1,980` across 8 categories | `budgetStore.ts` | Budget never reflects user's actual choices |
| Chat system prompt: "$1,000 budget, $340 remaining, 0.97x burn rate, B health (74/100)" | `chatStore.ts` | AI gives advice based on fake numbers |
| Savings rate `0.1` (10%) | `insights.tsx` | Health score always uses fabricated savings rate |
| Budget trend chart `[65, 80, 72, 90, 55, current]` | `budget-detail.tsx` | 5 of 6 months are fabricated |
| Trend labels `['Oct','Nov','Dec','Jan','Feb','Mar']` | `budget-detail.tsx` | Static, not derived from actual dates |
| Challenge progress bar `width: '40%'` | `arena.tsx` | Never reflects actual progress |
| Monthly savings goal `$200` | `plan.tsx` | Not user-configurable |
| Demo gamification: xp 160, level 2, streak 5 | `gamificationService.ts` | Starting state is fake |
| Demo leaderboard: "You" 450, "Alex" 380, "Jordan" 290 | `gamificationService.ts` | Static rankings |
| Demo friends: Alex, Jordan (accepted), Sam (pending) | `socialService.ts` | Pre-built social graph |
| Demo circle: "Savings Squad", goal $500, current $340 | `socialService.ts` | Fake circle data |
| 6 demo notifications (budget warning, prediction ready, etc.) | `notificationStore.ts` | Always generated, never from real events |
| Persona stats: Sarah (L5, 450 XP, 7-day streak), Marcus (L3, 280 XP, 3-day streak) | `login.tsx` | Fixed demo profiles |

### Mock LLM Predictions

When no API key is set (the default), `mock.ts` returns predictions based on keyword matching:

| Keyword | Category | Amount Range |
|---|---|---|
| dinner, restaurant | dining | $30–$75 |
| lunch | dining | $12–$25 |
| coffee | dining | $4–$8 |
| grocery, supermarket | groceries | $60–$120 |
| uber, taxi, lyft | transport | $15–$35 |
| movie, concert, show | entertainment | $15–$50 |
| gym, yoga, workout | fitness | $0–$15 |
| flight | travel | $200–$600 |
| hotel | travel | $100–$300 |
| doctor, dentist | health | $30–$150 |
| shopping, mall | shopping | $25–$100 |
| *(default fallback)* | other | $10–$50 |

Confidence scores are random: `0.6 + Math.random() * 0.3`.

### Badge Conditions That Always Return `false`

10 of 20 badge unlock conditions in `gamificationService.ts` are stubbed:

1. `budget_streak` — requires tracking consecutive under-budget months (not implemented)
2. `savings_total` — requires cumulative savings tracking (not implemented)
3. `accurate_predictions` — requires prediction accuracy tracking (not implemented)
4. `cci_streak` — requires consecutive check-in streak beyond what's tracked
5. `early_checkin` — requires time-of-day tracking (not implemented)
6. `late_checkin` — requires time-of-day tracking (not implemented)
7. `challenge_categories` — requires cross-category challenge tracking (not implemented)
8. `challenge_wins` — requires win count tracking (not implemented)
9. `connections` — requires connection count (not implemented)
10. `zero_spend_day` — requires daily spending tracking (not implemented)

---

## Actions That Are Never Persisted

These user interactions update only local React/Zustand state and are **lost on app reload**:

1. **Transaction reviews** — mark as reviewed, change category, toggle recurring, exclude
2. **Savings rule toggles** — round-up transactions, save-the-difference
3. **Notification preferences** — all 5 toggle switches
4. **Privacy settings** — profile visibility, share spending, anonymous leaderboard
5. **Prediction feedback** — accuracy ratings logged to `console.log` only
6. **Display name edits** — stored in Zustand, not written to Supabase in demo mode
7. **Onboarding budget selection** — sets `totalBudget` but per-category defaults remain hardcoded
8. **Chat history** — conversation lives in Zustand, gone on reload
9. **Daily check-in state** — `dailyCheckinDone` flag resets on reload

---

## File Inventory

### Services (5 files + 4 LLM files)

| File | Lines | Real Logic | Simulated |
|---|---|---|---|
| `calendarService.ts` | ~200 | Google Calendar sync, ICS parser, category detection | Demo data loading |
| `plaidService.ts` | ~250 | Recurring transaction detection | Bank connection, transaction sync |
| `predictionService.ts` | ~150 | Prompt building, response parsing | Falls back to mock on error |
| `gamificationService.ts` | ~780 | XP/level math, badge/challenge CRUD, Supabase paths | Demo state, 10 badge conditions |
| `socialService.ts` | ~530 | Friend/circle/nudge logic, Supabase paths | Demo profiles and relationships |
| `llm/adapter.ts` | ~50 | Provider resolution factory | — |
| `llm/claude.ts` | ~80 | Real Anthropic API integration | — |
| `llm/gemini.ts` | ~80 | Real Google Gemini integration | — |
| `llm/mock.ts` | ~100 | — | Keyword-based fake predictions |

### Stores (9 files)

| File | Lines | Notes |
|---|---|---|
| `authStore.ts` | ~150 | Supabase auth + demo bypass |
| `budgetStore.ts` | ~200 | Financial formulas + hardcoded defaults |
| `calendarStore.ts` | ~160 | Thin wrapper around calendarService |
| `transactionStore.ts` | ~150 | Thin wrapper around plaidService |
| `predictionStore.ts` | ~160 | LLM pipeline + unpersisted feedback |
| `gamificationStore.ts` | ~250 | Delegates to gamificationService |
| `socialStore.ts` | ~280 | Delegates to socialService |
| `chatStore.ts` | ~200 | LLM chat with hardcoded context |
| `notificationStore.ts` | ~150 | Always demo, never queries DB |

### Screens (15 files)

| Screen | Status |
|---|---|
| `dashboard.tsx` | Renders real store data (from demo sources) |
| `calendar.tsx` | Full month/week views with heatmap and predictions |
| `plan.tsx` | Savings rules are non-functional toggles |
| `arena.tsx` | Challenge progress bar hardcoded at 40% |
| `insights.tsx` | Savings rate hardcoded at 10%, "AI recommendations" are string templates |
| `login.tsx` | Persona switcher with hardcoded profiles |
| `signup.tsx` | Real validation, delegates to auth store |
| `settings.tsx` | 3 features show Alert dialogs instead of working |
| `notifications.tsx` | Renders hardcoded demo notifications |
| `budget-detail.tsx` | 5 of 6 trend months are fabricated |
| `transaction-review.tsx` | Nothing persists — all local useState |
| `welcome.tsx` | Static content only |
| `connect-calendar.tsx` | All 3 connection methods show Alerts |
| `connect-bank.tsx` | Simulated connection, always loads demo data |
| `set-budget.tsx` | Selection doesn't override per-category defaults |

### Components (5 files)

| Component | Status |
|---|---|
| `FloatingChatButton.tsx` | Fully functional |
| `ChatSheet.tsx` | Fully functional (content quality depends on LLM adapter) |
| `ui/Button.tsx` | Fully functional |
| `ui/Card.tsx` | Fully functional |
| `ui/Header.tsx` | Fully functional |

---

## What Would Be Needed for Production

1. **Supabase credentials** — Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to enable real data persistence
2. **Run migrations** — Apply the 10 SQL migration files in `/workspace/supabase/migrations/` + `seed.sql`
3. **Plaid integration** — Implement real Plaid Link SDK, token exchange via backend server, and transaction sync API
4. **Google Calendar OAuth** — Build an EAS development build for native OAuth flow
5. **LLM API key** — Set `EXPO_PUBLIC_CLAUDE_API_KEY` or `EXPO_PUBLIC_GEMINI_API_KEY` for real predictions and chat
6. **Chat context** — Replace hardcoded financial summary in `chatStore.ts` system prompt with real data from stores
7. **Persistence layer** — Wire transaction reviews, notification preferences, privacy settings, prediction feedback, and savings rules to Supabase
8. **Badge conditions** — Implement the 10 stubbed badge evaluation functions
9. **Push notifications** — Add expo-notifications, registration flow, and server-side delivery
10. **Savings rules engine** — Implement round-up and save-the-difference logic
11. **Budget onboarding** — Make the selected total budget distribute across categories
12. **Trend data** — Replace fabricated trend arrays with real historical aggregations
