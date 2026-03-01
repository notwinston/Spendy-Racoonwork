# FutureSpend

**RBC Innovation Challenge Submission** | Mountain Madness 2026 — Team Racoonwork

FutureSpend is an AI-powered personal finance app that predicts your spending before it happens. It connects to your calendar and bank accounts, uses AI to forecast costs for upcoming events (including hidden expenses you might not expect), and gamifies the entire experience with XP, streaks, challenges, and a social leaderboard.

---

## Tech Stack

### Core

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.81.5 |
| Platform | Expo | 54.0.0 |
| Language | TypeScript | 5.9.2 |
| Navigation | Expo Router | 6.0.23 |
| State Management | Zustand | 5.0.11 |

### Backend & Data

| Service | Technology | Purpose |
|---------|-----------|---------|
| Database | Supabase (PostgreSQL) | Auth, data persistence, real-time subscriptions, RLS policies |
| Banking | Plaid | Bank account linking, transaction imports |
| Calendar | Expo Calendar | Apple Calendar, Google Calendar, Outlook, iCal sync |

### AI / LLM

| Provider | Model | Use Case |
|----------|-------|----------|
| Google Gemini | gemini-2.0-flash | Spending predictions, hidden cost analysis, receipt OCR (multimodal) |
| Anthropic Claude | claude-sonnet-4-20250514 | Spending predictions, financial insights |
| Mock Adapter | — | Offline fallback with keyword-based prediction rules |

The app uses a provider-agnostic LLM adapter pattern — swap between Claude, Gemini, or mock via env config with automatic fallback on failure.

### UI & Animation

- **React Native Reanimated** 4.1.1 — Spring-based animations, layout transitions
- **React Native SVG** 15.12.1 — Charts and visualizations
- **Expo Linear Gradient** — Atmospheric gradient backgrounds
- **Ionicons** (via @expo/vector-icons) — Icon system
- **Custom Glass UI** — Frosted glass card system with dark theme

### Fonts

- **DM Sans** — Primary UI font
- **DM Mono** — Numeric/data displays
- **Syne** — Brand headings

---

## Features

### Calendar-Powered Spending Predictions
- Syncs with Apple, Google, Outlook, and iCal calendars
- AI analyzes each event and predicts spending category + dollar amount with confidence scores
- Predictions include low/high ranges and explanations

### Hidden Cost Detection
- Detects unexpected costs beyond the base event (e.g., parking for dinner, drinks after a concert)
- Three confidence tiers: **Likely**, **Possible**, **Unlikely but Costly**
- Signal sources: historical spending, event metadata, social patterns, seasonal trends
- Lazy-loaded per event — only fetches when you tap to expand (no wasteful API calls)

### Dashboard
- Daily spending brief with upcoming event predictions
- Spending trajectory chart (burn rate visualization)
- Budget progress by category
- Financial health score ring (composite of 5 weighted factors)
- Rank widget showing XP level and tier

### Budgeting
- Category-level monthly budgets with auto-detection from transactions
- Spending velocity projections (forecast month-end totals)
- Anomaly detection (flags 2x+ historical spending)
- Savings goals with monthly contribution tracking

### Insights & Analytics
- **This Month** — Current period performance
- **Trends** — Historical spending patterns across months
- **Savings** — Recurring expenses and savings progress
- **AI Insights** — LLM-generated financial recommendations

### Gamification
- **XP & Levels** — Earn XP from check-ins, accurate predictions, budget adherence, challenges
- **Streaks** — Daily check-in streaks with longest streak tracking
- **Badges** — Bronze/Silver/Gold/Diamond tier badges with unlock conditions
- **Rank Tiers** — Bronze through Diamond based on savings rate
- **Challenges** — Template-based or custom, solo or with friends

### Social
- **Friends** — Add via friend codes, view spending leaderboards
- **Circles** — Named groups with invite codes (up to 20 members)
- **Nudges** — Send encouragement, challenge invites, celebrations
- **Leaderboard** — Global and friends-only rankings by XP

### Receipt Scanning
- Camera capture or gallery upload
- Gemini multimodal OCR extracts merchant, items, amounts, tax, tip
- Auto-categorization and transaction creation

### Wrapped (Year-in-Review)
- Spotify Wrapped-style financial summary
- Animated slides: Total Spent, Top Category, Biggest Purchase, Forecast, Savings, Budget Streak
- Shareable via screenshot capture

### AI Chat Assistant
- Floating chat button accessible from any screen
- Context-aware financial Q&A with streaming responses

---

## Project Structure

```
app/
├── app/                        # Expo Router screens
│   ├── (auth)/                 # Login, signup
│   ├── (tabs)/                 # Main tab navigation
│   │   ├── dashboard.tsx       # Financial overview
│   │   ├── plan.tsx            # Predictions & receipt scanning
│   │   ├── calendar.tsx        # Calendar + spending heatmap
│   │   ├── insights.tsx        # Analytics & trends
│   │   └── arena.tsx           # Gamification & social
│   ├── onboarding/             # Bank, calendar, budget setup
│   ├── arena/                  # Badges, challenges, circles
│   └── wrapped.tsx             # Year-in-review
├── src/
│   ├── components/             # 35+ React components
│   │   ├── ui/                 # Base UI (Card, Button, GlassCard, Header, ...)
│   │   ├── charts/             # HealthScoreRing, TrendLine, Donut, BurnRate
│   │   ├── insights/           # Tab-specific insight panels
│   │   └── wrapped/            # Year-in-review slides
│   ├── services/               # Business logic
│   │   ├── llm/                # AI adapter pattern (Claude, Gemini, Mock)
│   │   ├── predictionService   # Spending & hidden cost predictions
│   │   ├── gamificationService # XP, badges, challenges, leaderboard
│   │   ├── socialService       # Friends, circles, nudges
│   │   ├── calendarService     # Calendar provider sync
│   │   ├── plaidService        # Bank account integration
│   │   └── receiptService      # Camera OCR pipeline
│   ├── stores/                 # Zustand state (12 stores)
│   ├── types/                  # TypeScript type definitions
│   ├── constants/              # Colors, Typography, Spacing
│   ├── hooks/                  # Custom React hooks
│   └── data/                   # Demo persona datasets
└── supabase/
    └── migrations/             # 14 SQL migration files
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npx expo`)
- iOS Simulator or Android Emulator (or Expo Go)

### Install

```bash
cd app
npm install
```

### Environment Variables

Create `app/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
# Optional:
EXPO_PUBLIC_CLAUDE_API_KEY=your-claude-api-key
EXPO_PUBLIC_LLM_PROVIDER=gemini   # or claude, mock (auto-detects if omitted)
```

The app runs in **demo mode** automatically when Supabase credentials are not configured — all features work with pre-populated sample data.

### Run

```bash
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

### Database Setup

To use live Supabase, apply the migrations in order:

```bash
# Or paste supabase/combined_migration.sql into Supabase Dashboard SQL Editor
```

---

## Demo Personas

The app includes two pre-built demo personas for testing:

| Persona | Description |
|---------|-------------|
| **Sarah Chen** | UX Designer, 28 — Balanced spender with fitness & dining habits |
| **Marcus Thompson** | Software Engineer, 32 — Tech-savvy with travel & entertainment spending |

Select a persona on the login screen to instantly load realistic financial data, calendar events, transactions, and social connections.

---

## Team

**Racoonwork** — Mountain Madness 2026
