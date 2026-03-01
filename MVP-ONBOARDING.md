# FutureSpend — Team Onboarding Guide

### RBC Tech @ SFU Mountain Madness 2026 | Team Racoonwork

> **Read time: ~15 minutes.** This document gives every team member a complete understanding of what we're building, why, and how. For implementation details (code, SQL, API schemas), see the full [MVP.md](./MVP.md).

---

## Table of Contents

1. [What Are We Building?](#1-what-are-we-building)
2. [Why Will This Win?](#2-why-will-this-win)
3. [The Three Pillars](#3-the-three-pillars)
4. [Tech Stack at a Glance](#4-tech-stack-at-a-glance)
5. [How the System Works](#5-how-the-system-works)
6. [The AI Prediction Pipeline](#6-the-ai-prediction-pipeline)
7. [Financial Metrics We Track](#7-financial-metrics-we-track)
8. [Calendar Integration](#8-calendar-integration)
9. [Bank Data (Plaid)](#9-bank-data-plaid)
10. [Gamification System](#10-gamification-system)
11. [Social Features](#11-social-features)
12. [AI Chat Assistant](#12-ai-chat-assistant)
13. [Charts & Visuals](#13-charts--visuals)
14. [Notifications](#14-notifications)
15. [Database Overview](#15-database-overview)
16. [API Overview](#16-api-overview)
17. [Every Screen in the App](#17-every-screen-in-the-app)
18. [Demo Personas & Script](#18-demo-personas--script)
19. [24-Hour Build Plan](#19-24-hour-build-plan)
20. [Competition Checklist](#20-competition-checklist)

---

## 1. What Are We Building?

**FutureSpend** is a mobile app that predicts how much you'll spend based on your calendar, then gamifies saving money with your friends.

**One-line pitch:**
> "FutureSpend is the first personal finance app that reads your calendar to predict your spending before it happens — then gamifies saving with friends to make financial wellness social, fun, and sustainable."

**The problem:** Today's budgeting apps only tell you what you *already* spent. They're rearview mirrors. But your Google Calendar already knows what's coming — "Team Lunch at Earls" means ~$25, "Friday Night Karaoke" means ~$35, three social events in a weekend means your entertainment budget is about to get crushed. No app connects your schedule to your wallet.

**Our solution:** FutureSpend connects your calendar + bank account, uses AI to predict what each event will cost, and turns saving money into a social game with friends.

---

## 2. Why Will This Win?

**RBC NOMI extension:** NOMI (RBC's existing AI) looks *backward* at what you spent. FutureSpend looks *forward* at what you're *about to* spend. Together, they create a complete picture — past and future.

**Judging criteria alignment:**

| Criterion | Our Edge |
|-----------|----------|
| **Innovation** | No app treats calendar events as financial data. Our calendar-to-prediction pipeline is genuinely novel. |
| **Technical Complexity** | 5-stage ML pipeline, real-time Supabase backend, Plaid banking integration, Claude AI chat. |
| **User Impact** | Directly solves the #1 pain point for students and young professionals — unpredictable spending. |
| **Presentation** | Dark fintech UI is visually striking. Gamification creates natural "wow" demo moments. |

---

## 3. The Three Pillars

Everything we build maps to one of these three pillars:

### Pillar 1: Calendar Intelligence
Your schedule IS your spending plan. We analyze calendar events (title, location, time, attendees) to understand what expenses are coming.

### Pillar 2: Financial Predictions
Our ML pipeline classifies events into spending categories, predicts dollar amounts with confidence intervals, and generates human-readable explanations.

### Pillar 3: Social Gamification
Streaks, badges, leaderboards, friend circles, and savings challenges — inspired by Opal Screen Time — make saving money as engaging as a fitness app.

---

## 4. Tech Stack at a Glance

| Layer | Tool | Why |
|-------|------|-----|
| **Mobile App** | React Native + Expo + TypeScript | Cross-platform, fast iteration, judges scan QR to try it live on their phones |
| **Backend** | Supabase (Postgres + Auth + Realtime + Edge Functions) | Instant backend, eliminates 6-8 hours of work. Free tier is plenty. |
| **AI/ML** | Python + FastAPI | ML pipeline for predictions (sentence-transformers, XGBoost) |
| **LLM** | Claude API | Powers the AI chat assistant and generates insight explanations |
| **Banking** | Plaid API (sandbox mode) | Real transaction data without needing real bank credentials |
| **Calendar** | Google Calendar API + iCal parser | Schedule ingestion. Synthetic fallback for demo reliability. |
| **State** | Zustand | Lightweight state management, zero boilerplate |
| **Charts** | Victory Native | Dark-themed, animated financial charts |
| **Notifications** | Expo Push Notifications | Zero-config push alerts |

**Why this stack wins:** Supabase saves ~8 hours of backend work. Expo Go lets judges try the app instantly. The Python ML microservice shows real technical depth (not just an LLM wrapper).

---

## 5. How the System Works

The core data flow in 6 steps:

```
Calendar Events → NLP Extraction → Spending Prediction → Budget Assessment → User Notification → Gamification Update
```

**Step 1 — Calendar Ingestion:** User connects Google Calendar (or uploads .ics file, or uses demo data). Events are normalized into a unified format.

**Step 2 — NLP Feature Extraction:** The AI service reads event text ("Team Lunch at Earls, 6 attendees, Friday 12:30pm") and extracts spending signals — keywords, location type, social signals, time patterns.

**Step 3 — Spending Prediction:** A classifier predicts the spending category (dining, transport, entertainment, etc.). Then a regression model predicts the dollar amount with confidence interval (e.g., "$25 [$18-$35]").

**Step 4 — Budget Impact Assessment:** The predicted amount is compared against the user's budget. If projected spending will exceed the budget, a warning is generated with severity level.

**Step 5 — Notification & Insight:** Claude generates a human-readable explanation: "Your calendar shows 4 dining events this week totaling ~$140. That would put you at 95% of your dining budget. Consider cooking for one of these."

**Step 6 — Gamification Update:** Staying under budget, completing challenges, and maintaining streaks all earn XP, update leaderboards, and progress toward badges.

**Security:** All user data is isolated via Supabase Row Level Security. Even if the API is compromised, users can never access each other's private financial data. Social features only expose data users explicitly opt to share.

---

## 6. The AI Prediction Pipeline

This is our core technical differentiator — a 5-stage system:

### Stage 1: Event NLP
Takes calendar event text and converts it into a numerical representation using a pre-trained language model (sentence-transformers, all-MiniLM-L6-v2). Also extracts structured features: spending keywords, attendee count, location type, time of day, day of week.

### Stage 2: Category Classification
Classifies the event into one of 13 spending categories: dining, transportation, entertainment, shopping, groceries, coffee/drinks, health/fitness, education, personal care, gifts, travel, subscriptions, utilities. Outputs a probability for each category.

### Stage 3: Amount Prediction
An XGBoost regression model predicts the dollar amount based on: category, day of week, time of day, event duration, number of attendees, whether it's recurring, and the user's historical average for that category. Outputs a point estimate plus a confidence interval (e.g., $25 [$18-$35]).

### Stage 4: Confidence Scoring
Calibrates how certain we are about each prediction. Factors: how many similar events we've seen, how consistent the category prediction is, how much the amount varies historically, and whether it's a recurring event. Output: a score from 0 to 1 labeled as Low/Medium/High/Very High.

### Stage 5: LLM Insight Generation
Claude takes the prediction results plus the user's budget context and generates a natural-language explanation. Example: "Your 'Team Lunch at Earls' tomorrow typically costs $25-35. You've spent $180 of your $300 dining budget. Consider suggesting a more affordable spot."

**Training data:** We generate a synthetic dataset of 10,000 calendar-event-to-transaction pairs for training. The models improve over time with user feedback.

**Fallback:** If the ML service is down or confidence is too low, Claude API handles predictions directly.

---

## 7. Financial Metrics We Track

### Predictive Budget
`PredictedSpend = Sum of (each event's cost x confidence) + recurring expenses + seasonal adjustment`

Tells users how much they'll spend this month based on what's on their calendar.

### Spending Velocity
How fast you're burning through your budget per day, compared to the rate that would exactly exhaust it by month end. If you're spending 20%+ faster than pace, you get an alert.

### Burn Rate
A single number: 1.0 = exactly on pace, >1.0 = on track to exceed budget, <1.0 = under budget. Color-coded: green (<0.8), yellow (0.8-1.0), orange (1.0-1.2), red (>1.2).

### Calendar Correlation Index (Our Novel Metric)
Measures how well your calendar predicts your actual spending. High CCI = your schedule is a great financial signal. Low CCI = your spending is more spontaneous. This feeds back into the prediction engine to adjust weights.

### Financial Health Score
A composite score (0-100) mapped to grades A+ through F. Weighted across: budget adherence (30%), savings rate (25%), spending stability (20%), calendar correlation (15%), streak bonus (10%).

### Smart Savings Rules ("Save the Difference")
When you spend less than predicted, the system can automatically save a portion of the difference. Example: predicted $80 dinner, actual $55 → auto-save $12.50 (half the $25 difference). User-configurable savings rate from 10% to 100%.

### Compound Savings Projections
Shows what your savings will grow to over 6/12/24/60 months with compound interest. Includes conservative, expected, and optimistic scenarios.

---

## 8. Calendar Integration

**Google Calendar:** OAuth 2.0 flow. User grants read-only access. We sync events and refresh automatically. Tokens are encrypted in the database.

**iCal Upload:** Fallback for any calendar provider (Apple Calendar, Outlook, etc.). User uploads a .ics file, we parse all VEVENT components.

**Synthetic Data:** For the demo, we have a generator that produces 3 months of realistic calendar data with a mix of recurring and one-off events, locations, and attendee counts. This ensures our demo works perfectly regardless of OAuth issues.

**Event Categories:** Each event is classified into one of 8 categories: Work, Social, Health/Fitness, Personal, Family, Education, Entertainment, Travel. Each carries different typical spending ranges (e.g., Social events average $20-50, Work events average $0-30).

**Multi-Calendar Merging:** When a user connects multiple calendars, we deduplicate events by fuzzy-matching title + start time, with priority ordering: manual entries > work calendar > personal > shared.

---

## 9. Bank Data (Plaid)

**What Plaid does:** Securely connects to the user's bank accounts (checking, savings, credit cards) and pulls transaction data. We use the **sandbox mode** for the hackathon — this gives us realistic test data without needing real bank credentials.

**Key features we use:**
- **Transaction sync:** Pull 90 days of history initially, then incremental updates via webhooks
- **Balance monitoring:** Real-time balance checks, low balance alerts
- **Recurring detection:** Automatically identifies subscriptions and recurring charges by matching merchant name, similar amounts (within 10%), and regular intervals

**Sandbox setup:** Uses "First Platypus Bank" as the test institution with pre-configured accounts and transactions. Test credentials: user_good / pass_good.

**Fallback:** If Plaid has issues, we have a pre-built mock transaction dataset with 200+ realistic transactions per demo persona.

---

## 10. Gamification System

Inspired by **Opal Screen Time** — the app known for beautiful gem-themed badges, compelling streaks, and "Inner Circle" leaderboards. We adapt these mechanics for personal finance.

**Design philosophy:** Gamification enhances genuine motivation to save — it never manipulates or creates anxiety. Leaderboards celebrate effort (percentages, streaks), not income level.

### Streaks
Three streak types:
- **Daily Check-In:** Open app + review spending. Resets at midnight if missed.
- **Weekly Budget:** Stay within total budget for 7 consecutive days.
- **Savings Streak:** Save money every week.

Streak freezes: Earn 1 free freeze per 30-day streak. Extra freezes cost 500 XP. Max 3 held at once. Flames visually grow larger with longer streaks (small orange → medium → blue → purple → prismatic diamond at 365 days).

### Badges (20 gem-themed badges)
Tiers: Bronze (7 days) → Silver (30 days) → Gold (90 days) → Diamond (365 days)

Key badges include:
| Badge | Condition | Tier |
|-------|-----------|------|
| Invested | First 7-day check-in streak | Bronze |
| Steadfast | 7-day budget streak | Bronze |
| Radiant | 30-day check-in streak | Silver |
| Legendary | 90-day check-in streak | Gold |
| Prismatic | 365-day check-in streak | Diamond |
| Budget Boss | Under budget for 3 consecutive months | Gold |
| Penny Pincher | Saved $100+ total | Silver |
| Social Butterfly | Completed 5 group challenges | Silver |
| Fortune Teller | 10 accurate predictions confirmed | Gold |
| Zero Hero | Had a no-spend day | Bronze |
| Challenge Champion | Won 3 challenges (1st place) | Gold |

Full catalog: 20 badges total. Locked badges show as dark silhouettes with hints.

### Challenges (10 templates)
Time-bound goals users do alone or with friends:

| Challenge | Duration | Difficulty |
|-----------|----------|------------|
| No Eating Out Week | 7 days | Medium |
| Coffee Savings Challenge | 14 days | Easy |
| $500 Monthly Savings Sprint | 30 days | Hard |
| Transportation Thrift (no rideshare) | 7 days | Medium |
| Subscription Audit | 3 days | Easy |
| Zero Dollar Day (3 no-spend days in a week) | 7 days | Medium |
| Pack Lunch Week | 5 days | Medium |
| Entertainment Budget Challenge (<$50) | 14 days | Medium |
| Savings Snowball ($1, $2, $3...$7) | 7 days | Easy |
| Cash Only Week | 7 days | Hard |

Each challenge has: description, rules, progress tracking, XP rewards, and a shareable completion card.

### XP & Levels
Points for good behaviors:
- Daily check-in: 10 XP
- Stay under daily budget: 25 XP
- Complete a challenge: 100-500 XP (by difficulty)
- Accurate prediction confirmed: 50 XP
- Review a transaction: 5 XP
- Invite a friend who joins: 200 XP

50 levels total. Level formula: `XP_needed = 100 x level^1.5`. Titles progress: Novice Saver (1-5) → Budget Apprentice (6-10) → Money Manager (11-20) → Finance Pro (21-35) → Wealth Wizard (36-50).

### Leaderboards
Weekly and monthly rankings within friend circles. Composite score based on savings rate (35%), streak length (25%), challenge completions (25%), health score (15%). All metrics normalized to prevent income disparity from affecting rankings. Top 3 get crown/medal icons.

---

## 11. Social Features

### Friend System
- **Friend codes:** 8-character codes formatted as `SAVE-XXXX` (e.g., `SAVE-A1B2`)
- **QR codes** for in-person sharing
- **Deep links:** `futurespend://invite/{code}`
- **Contact sync:** Privacy-preserving — phone numbers are hashed (SHA-256) before lookup, never sent raw

### Inner Circles (Friend Groups)
- Named groups up to 20 members: "Roommates", "Work Friends", "Gym Buddies"
- Circle-specific leaderboards and challenges
- Lightweight in-app chat for encouragement
- Admin controls: invite/remove members, transfer admin, set open/closed

### Social Nudges
- Automated: "Sarah is on a 14-day streak! Send encouragement?"
- Manual: Tap to send "You got this!" to a friend
- Challenge invites: "Marcus invited you to No Eating Out Week"
- Celebrations: "Your circle saved $500 this month!"
- Rate limited to max 3 nudges per friend per day

### Privacy Controls
Granular visibility settings per data type:
- Show/hide actual dollar amounts (show percentages instead)
- Show/hide specific categories
- Show/hide on leaderboards
- Three privacy levels: Public (all friends), Circle Only, Private
- Default: Circle Only for amounts, Public for achievements

---

## 12. AI Chat Assistant (Floating Assistant)

A conversational interface powered by Claude that knows your calendar, budget, and spending history. Available as a **floating assistant button** on every screen — not a dedicated tab.

**How it works:**
- Small teal circle button in the bottom-right corner (above the tab bar) on every screen
- Tap opens a slide-up chat sheet
- Context-aware: suggested questions change based on which screen you're on
- Pulse animation when the AI has proactive insights to share
- Can be minimized by swiping down

**Example interactions:**

> **User:** "Can I afford to go out this weekend?"
> **AI:** "Looking at your calendar, you have Dinner with Alex on Saturday ($45) and Movie Night on Sunday ($25). With $120 left in entertainment, you'd have $50 remaining after. You're in good shape!"

> **User:** "How am I doing this month?"
> **AI:** "You're 18 days in and have spent $1,240 of $2,000 (62%). Burn rate is 1.03 — slightly above pace. Main culprit: dining at $380 vs $250 budget. Good news: your calendar shows a quieter week ahead."

> **User:** "Help me save more"
> **AI:** "I found 3 unused subscriptions ($75/month), you Uber when running late 6x this month ($111), and brown-bagging one team lunch/week saves $105. Total potential: $285/month."

**Smart features:**
- Suggested questions change based on context (before payday, after a big purchase, end of month)
- Can explain any prediction ("Why do you think my coffee meetup costs $8?")
- Can adjust predictions ("We're going somewhere fancy — update the estimate")
- Can create persistent rules ("Always budget $30 for team lunches")

---

## 13. Charts & Visuals

All charts use a dark theme inspired by Copilot.money.

**Color palette:**
- Background: `#0A1628` (dark navy)
- Cards: `#132039` (slightly lighter)
- Positive/accent: `#00D09C` (teal green)
- Warning: `#FFB020` (amber)
- Danger: `#FF4757` (red)
- Info: `#3B82F6` (blue)

**Six chart types:**

1. **Spending Heatmap (Calendar):** Monthly grid where each day is colored by spending intensity. Green = low, yellow = medium, red = high. Future days show predictions with dashed borders.

2. **Budget Progress Line Chart:** Cumulative spending line over the month. Solid line = actual, dashed line = predicted future, horizontal dashed line = budget limit. Area fills green under budget, red when over.

3. **Category Donut Chart:** Ring chart with segments per category. Center shows total. Tap to drill into a category.

4. **Trend Lines:** Weekly/monthly spending trends with actual (solid) vs predicted (dashed) overlaid. Shaded confidence intervals around predictions.

5. **Category Bar Chart:** Grouped bars showing budget vs actual vs predicted per category. Sorted by largest overspend.

6. **Savings Growth Curve:** Compound interest projection with current trajectory, goal markers, and conservative/expected/optimistic scenarios.

---

## 14. Notifications

Five categories of push notifications:

**Pre-Event Spending Alerts (24h before):**
"Coffee meetup with Sarah tomorrow: ~$15 predicted | You have $45 left in your coffee budget"

**Budget Warnings:**
- 50% used: informational
- 80% used: caution
- 100% exceeded: alert
- Burn rate warning: "At your current pace, you'll exceed by $X"

**Challenge Updates:**
Start, daily progress, near-completion encouragement, completion celebration with XP

**Social Nudges:**
Friend achievements, circle updates, incoming encouragement

**Streak Reminders:**
Evening reminder if not checked in, milestone celebrations, recovery prompts after a break

**Smart timing:** Learn user's active hours. Default quiet hours 10pm-8am. Max 5 notifications/day to prevent fatigue. Three priority tiers.

---

## 15. Database Overview

**22 tables** across 6 groups in Supabase PostgreSQL:

**Core (7 tables):** profiles, calendar_connections, calendar_events, plaid_connections, accounts, transactions, recurring_transactions

**Predictions (2 tables):** spending_predictions, prediction_feedback

**Budgets (2 tables):** budgets, budget_snapshots

**Gamification (6 tables):** badges, user_badges, challenges, challenge_participants, streak_history, xp_transactions

**Social (5 tables):** friendships, friend_circles, circle_members, social_nudges, notifications

**Key design decisions:**
- Row Level Security on ALL tables — data isolation at database level
- Friendships table uses `CHECK (user_id < friend_id)` to prevent duplicate pairs
- Friend codes are auto-generated unique 8-character strings
- Profile auto-created via trigger when auth.users row is inserted
- Realtime subscriptions enabled on: notifications, social_nudges, challenge_participants

---

## 16. API Overview

**Supabase handles most data access directly** via PostgREST (auto-generated REST from schema + RLS). **Edge Functions** (serverless Deno runtime) handle custom logic.

**Key API groups:**

| Module | Key Endpoints | Notes |
|--------|--------------|-------|
| Auth | signup, login, logout, session | Built into Supabase Auth |
| Calendar | connect, events, sync, import-ical | OAuth + Edge Functions |
| Finance | create-link-token, exchange-token, transactions, balances | Plaid via Edge Functions |
| Budgets | list, create/update, status, overview | PostgREST + computed views |
| Predictions | list, per-event, batch, feedback, accuracy | Edge Function → FastAPI ML service |
| AI Chat | send message (streaming), history, suggestions | Edge Function → Claude API |
| Gamification | stats, badges, challenges, join, leaderboard, check-in | Mix of PostgREST + Edge Functions |
| Social | friends, circles, nudges, leaderboard | PostgREST + Edge Functions |
| Notifications | list, mark read, preferences, register push token | PostgREST + Edge Functions |

**ML Service (FastAPI, separate from Supabase):**
- `POST /ml/predict` — single event prediction
- `POST /ml/batch-predict` — batch for all upcoming events
- `POST /ml/classify-event` — category classification only
- `GET /ml/model/status` — health check

**Real-time via WebSocket (Supabase Realtime):**
- New notifications, incoming nudges, challenge progress updates, leaderboard changes

---

## 17. Every Screen in the App

**13 screens** total, all using the dark theme (`#0A1628` background, `#00D09C` teal accent).

### Onboarding (4 screens)
1. **Welcome** — Logo animation, tagline, three feature highlights, "Get Started" button
2. **Connect Calendar** — Google OAuth button, .ics upload option, "Use Demo Data" for quick start, progress dots 2/4
3. **Connect Bank** — Plaid Link button, security badges ("bank-level encryption", "read-only"), sandbox option, progress dots 3/4
4. **Set Budget** — Large budget input, animated pie chart, category sliders, "Looks Good!" with confetti

### Main App (9 screens)
5. **Dashboard** — Metrics-only: budget summary with trajectory chart, category budget circles, burn rate gauge, Financial Health Score ring, key metric cards. Clean and focused. Bottom tab bar: five tabs with icons and labels: Dashboard (grid), Calendar (calendar), Plan (target), Arena (trophy), Insights (lightbulb). Profile is a top-right icon on every screen header, no longer a tab.
6. **Calendar View** — Month/week toggle, heatmap coloring (days colored by spending), tap day → bottom sheet with events and predictions, future days show dashed predicted spending
7. **Budget Detail** — Single category deep-dive: progress bar, 6-month trend chart, transaction list, "Adjust Budget" button
8. **Transaction Review** — Transaction card (merchant, amount, account), action buttons (Exclude, Split, Recurring, Review), category override, notes, linked calendar event (accessed from Plan tab's review queue)
9. **Plan** — Upcoming spending predictions (moved from old Dashboard), budget planning tools, savings rules config, recurring expenses, transaction review queue. The proactive planning hub.
10. **Arena** — Combined gamification + social. Internal sections: My Progress (level/XP/streaks/badges), Challenges (active + browse), Leaderboard (friends/circle/global), Friends & Circles (friend codes, circles, nudges). One hub for all competitive/social features.
11. **Leaderboard** — Now a sub-view within Arena (podium, ranked list, metric/period selectors)
12. **Insights** — Financial Health Score breakdown, trend charts, category donut chart, AI recommendations, Calendar Correlation Index, savings projections, month-over-month comparisons
13. **Settings & Profile** — Accessed via top-right profile avatar icon on any screen. Connected accounts, budget settings, notification preferences (per-category toggles), privacy controls, dark/light theme, sign out

### Global Component
- **Floating AI Chat** — Available on every screen as a bottom-right bubble button. Opens slide-up chat sheet with context-aware suggestions.

---

## 18. Demo Personas & Script

### Persona 1: Sarah Chen — University Student
- **Who:** 21, SFU CompSci student, part-time Starbucks barista
- **Income:** $1,200/month, budget: $1,000
- **Calendar:** Classes MWF, study groups at coffee shops 2x/week, gym 3x/week, Starbucks shifts weekends, Friday night social events
- **Pain points:** Coffee shop study sessions ($60-80/month), social FOMO spending, eating near campus vs cooking, inconsistent paychecks
- **FutureSpend value:** Predicts weekly coffee costs, alerts before expensive weekends, tracks spending against pay schedule, gamifies saving with roommate circle

**Demo flow for Sarah:**
1. Dashboard: "$340 left" at day 18, healthy burn rate
2. Calendar: Tap upcoming days — karaoke Friday ($35), brunch Saturday ($28), study group ($8)
3. Tap the floating AI assistant button: "Can I afford this weekend?" → personalized analysis with savings tips
4. Notification: "Study group tomorrow: ~$8, coffee budget at $45/$50. Bring a thermos?"
5. Navigate to Arena: 14-day streak, competing in Coffee Savings Challenge with roommates
6. Arena leaderboard: #2 in "SFU Roommates" circle at 72% savings rate

### Persona 2: Marcus Thompson — Young Professional
- **Who:** 26, junior dev at Vancouver startup
- **Income:** $4,200/month, budget: $3,000
- **Calendar:** Daily standup, team lunches 2x/week, gym 5x/week, dates 2x/month, monthly board game night
- **Pain points:** Team lunches ($160-280/month), dating costs unpredictable, 12 subscriptions ($221/month, some unused), Ubers when running late
- **FutureSpend value:** Detects subscription bloat (3 unused = $75/month savings), predicts expensive weeks, correlates late mornings with Uber spending, work circle competition

**Demo flow for Marcus:**
1. Dashboard: "$1,450 left" at day 15, burn rate at 1.08x (yellow warning)
2. Calendar week view: team lunches, date night, board game night — $143 predicted
3. Budget detail: Dining at 80%, trend chart showing month-over-month increase
4. Tap the floating AI assistant button: "Help me cut costs" → identifies $285/month in potential savings (subscriptions, lunches, Ubers)
5. Navigate to Arena: Level 12, 22-day streak, in "$500 Savings Sprint" challenge
6. Arena leaderboard: #3 in "Dev Team" circle

### 3-Minute Pitch Script
| Time | Content |
|------|---------|
| 0:00-0:30 | Problem: "Your calendar already knows what you'll spend." Show cluttered calendar vs bank statement. Introduce FutureSpend. |
| 0:30-1:00 | Quick onboarding montage. Show Sarah's dashboard. "She can see at a glance she's on track — but the real magic is what comes next." |
| 1:00-1:30 | Core magic: Calendar heatmap, tap Friday prediction, show ML confidence. "NOMI = rearview mirror. FutureSpend = windshield." |
| 1:30-2:00 | Arena: Marcus's streaks, badges, leaderboard. "Peer accountability drives real behavioral change." |
| 2:00-2:30 | Floating AI assistant: "Can I afford this weekend?" → personalized answer. "Help me save more" → identifies $285/month in cuts. |
| 2:30-3:00 | Flash architecture diagram. Mention 5-stage ML pipeline. Close: "See Tomorrow, Save Today, Share Success." |

---

## 19. 24-Hour Build Plan

### Team Roles
| Role | Person | Focus |
|------|--------|-------|
| **Dev A — Frontend Lead** | TBD | React Native screens, navigation, charts, animations |
| **Dev B — Backend Lead** | TBD | Supabase schema, Edge Functions, Plaid, auth |
| **Dev C — AI/ML Engineer** | TBD | FastAPI service, prediction models, Claude integration |
| **Dev D — Full-Stack Flex** | TBD | UI/UX, design assets, integration, demo prep, presentation |

### Timeline Summary

| Phase | Hours | What Happens |
|-------|-------|-------------|
| **Foundation** | 0-2 | Supabase schema + auth, Expo project setup, FastAPI scaffold, Figma wireframes |
| **Core Features** | 2-6 | Dashboard, calendar view, Plaid integration, ML pipeline, prediction UI |
| **Advanced Features** | 6-10 | AI chat, gamification engine, social features, notifications |
| **Integration** | 10-12 | Connect all frontend screens to live backend data, end-to-end testing |
| **Sleep/Rest** | 12-14 | Critical rest break (or power through on critical bugs only) |
| **Polish** | 14-18 | Responsive fixes, error states, demo data seeding, performance tuning |
| **Demo Prep** | 18-22 | Final UI polish, slide deck, demo rehearsal, persona switcher |
| **Final** | 22-24 | Bug sweep, backup plans, rehearsal, submission |

### Critical Path
1. **Supabase schema (Hour 0)** — EVERYTHING depends on this. Dev B must finish first.
2. **Calendar data (Hour 2-4)** — ML can't predict without events
3. **ML pipeline (Hour 2-6)** — Core differentiator. Claude API is the fallback.
4. **Frontend-backend integration (Hour 8-10)** — Where things typically break. Budget extra time.

### Must-Have vs Nice-to-Have

**Must ship (or we fail):**
- Calendar integration (at minimum demo data)
- Spending predictions for events
- Dashboard with budget tracking
- Basic gamification (streaks + badges)
- Floating AI Chat assistant
- Sarah's persona fully working

**Nice-to-have (in priority order):**
- Live Plaid integration (fallback: mock data)
- Social features (friend circles, leaderboards)
- Push notifications
- Challenge system
- Marcus's persona fully working
- Multiple calendar providers

### Key Risk Mitigations
- **Calendar OAuth fails?** → Use synthetic data generator. Demo works regardless.
- **Plaid issues?** → Pre-built mock transaction dataset.
- **ML accuracy too low?** → Claude API as fallback for predictions.
- **Running out of time?** → One polished persona beats two half-finished ones.
- **Cross-platform bugs?** → Demo on iOS only.

---

## 20. Competition Checklist

Every RBC challenge requirement and where we address it:

| Requirement | Our Answer |
|------------|-----------|
| **Multi-calendar integration** | Google Calendar OAuth + iCal upload + synthetic fallback + multi-calendar merging |
| **Spending prediction** | 5-stage ML pipeline: NLP → Classification → Amount → Confidence → Insights |
| **Savings optimization** | Smart Savings Rules, compound projections, AI-recommended strategies, subscription detection |
| **Gamification** | Opal-inspired: streaks, 20 badges, 10 challenge templates, XP/levels |
| **Social/Community** | Friend circles, leaderboards, shared challenges, social nudges, privacy controls |
| **Behavioral change** | Streaks for habit formation, peer accountability, contextual nudges, AI coaching |
| **RBC NOMI extension** | NOMI = backward (what you spent). FutureSpend = forward (what you'll spend). Temporal bridge. |
| **Technical innovation** | Calendar-to-spending ML pipeline, Calendar Correlation Index metric, semantic event understanding |
| **User experience** | Copilot.money dark UI + Opal gamification, floating AI chat assistant, 13 polished screens + global floating chat component |

---

*Built with love for RBC Tech @ SFU Mountain Madness 2026*
*Team Racoonwork*
