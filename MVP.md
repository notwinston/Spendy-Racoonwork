# FutureSpend — See Tomorrow, Save Today, Share Success
## MVP Specification Document
### RBC Tech @ SFU Mountain Madness 2026 Hackathon

---

## Table of Contents

1. [Product Vision & Elevator Pitch](#1-product-vision--elevator-pitch)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [AI/ML Prediction Pipeline](#4-aiml-prediction-pipeline)
5. [Database Schema](#5-database-schema)
6. [API Specification](#6-api-specification)
7. [Calendar Integration](#7-calendar-integration)
8. [Gamification Engine](#8-gamification-engine)
9. [Social Features & Inner Circles](#9-social-features--inner-circles)
10. [Notification System](#10-notification-system)
11. [User Interface & Screens](#11-user-interface--screens)
12. [Security & Privacy](#12-security--privacy)
13. [Demo Strategy & Synthetic Data](#13-demo-strategy--synthetic-data)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [Risk Mitigation](#15-risk-mitigation)
16. [Judging Criteria Alignment](#16-judging-criteria-alignment)
17. [Future Vision & RBC Integration](#17-future-vision--rbc-integration)

---

## 1. Product Vision & Elevator Pitch

### One-Line Pitch

> **"FutureSpend is the first personal finance app that reads your calendar to predict your spending before it happens — then gamifies saving with friends to make financial wellness social, fun, and sustainable."**

### Problem Statement

Modern life is financially unpredictable — not because people lack discipline, but because their lives are scattered across dozens of calendars, commitments, and social obligations. A student juggling classes, part-time shifts, club events, and a social life has spending patterns that are deeply intertwined with their schedule, yet no financial tool understands this connection. The RBC challenge captures this perfectly: the "unpredictable nature of modern multi-calendar life" is the root cause of budget overruns, missed savings goals, and financial stress.

Today's budgeting tools are **reactive**. They tell you what you already spent. By the time you see you've blown your dining budget, you've already swiped the card. Users need a system that looks *forward* — one that understands that "Dinner with Sarah at Miku" on Friday means a $45 expense is coming, that three back-to-back social events this weekend will strain the entertainment budget, and that next Tuesday's recurring "Gym" event means the monthly membership fee is about to hit.

Beyond prediction, financial behavior change is hard in isolation. Research consistently shows that social accountability, gamification, and community participation drive sustained habit formation. Yet personal finance remains one of the most isolating domains — people don't talk about money, don't share goals, and don't celebrate wins together.

**FutureSpend bridges both gaps simultaneously.**

### Unique Value Proposition — Three Pillars

| Pillar | What It Does | Why It Matters |
|--------|-------------|----------------|
| **Calendar Intelligence** | Ingests events from Google Calendar, iCal, and manual entries; uses NLP to extract financial signals from event metadata (title, location, attendees, time, recurrence) | No other finance app treats your calendar as a financial data source. Your schedule *is* your spending plan — we just make it explicit. |
| **Financial Predictions** | ML pipeline classifies events into spending categories, predicts amounts with confidence intervals, and generates actionable insights via LLM | Shifts personal finance from reactive tracking to proactive planning. Users see their financial future before it arrives. |
| **Social Gamification** | Streaks, milestones, leaderboards, inner circles (trusted friend groups), savings challenges, and peer engagement mechanics inspired by Opal Screen Time's UX | Makes saving money as engaging as a fitness app. Social dynamics drive behavioral change — the RBC challenge's core ask. |

### Extending RBC NOMI — The Temporal Bridge

RBC NOMI is a powerful AI assistant that analyzes *past* transactions to surface insights: "You spent 15% more on dining this month." NOMI looks **backward** through the rearview mirror of transaction history.

FutureSpend looks **forward** through the windshield of calendar data. It tells you *before* you spend: "Based on your calendar, you're projected to spend $420 on dining this month — $120 over budget. Here's what you can adjust."

Together, NOMI + FutureSpend create a **complete temporal view** of personal finances:

```
    PAST ◄──────── NOMI ────────── PRESENT ──────── FutureSpend ────────► FUTURE

    Transaction History          Real-Time Balance          Calendar Predictions
    Spending Analysis            Current Budget Status      Projected Spending
    Pattern Recognition          Account Overview           Proactive Alerts
    Retroactive Insights         NOMI Find & Save           Pre-emptive Savings
```

NOMI's "Find & Save" feature automatically moves small amounts to savings based on past patterns. FutureSpend's "Future Save" feature does the same thing but *predictively* — if your calendar shows a light spending week ahead, it proactively suggests (or auto-moves) a larger savings amount because it *knows* you can afford it.

### Competition Alignment — Judging Criteria

| Criterion | How FutureSpend Excels |
|-----------|----------------------|
| **Innovation** | First-of-its-kind calendar-to-finance prediction pipeline. No existing app treats calendar events as financial signals. Novel fusion of NLP, time-series prediction, and social gamification. |
| **Technical Complexity** | Multi-stage ML pipeline (embeddings, classification, regression, confidence calibration, LLM generation). Real-time calendar sync. Supabase Realtime for live social features. Plaid integration for actual financial data. |
| **User Impact** | Directly addresses the number one financial pain point for students and young professionals: unpredictable spending. Social features create sustained engagement beyond the hackathon. Inclusive design for diverse financial situations. |
| **Presentation** | Dark fintech dashboard (Copilot.money aesthetic) is visually striking. Gamification elements (streaks, leaderboards) create natural demo moments. Calendar-to-prediction flow is an intuitive, "wow factor" demo narrative. |

---

## 2. Tech Stack

### Stack Overview

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Frontend** | React Native (Expo) | SDK 52 | Cross-platform (iOS + Android) from a single codebase. Expo managed workflow eliminates native build complexity — critical for a 24-hour hackathon. Expo Go enables instant demo on any phone without App Store deployment. TypeScript provides type safety across the entire frontend. |
| **Language** | TypeScript | 5.x | End-to-end type safety. Shared type definitions between frontend and Supabase Edge Functions. Catches bugs at compile time, not runtime — essential when moving fast. |
| **Backend** | Supabase | Latest | Instant backend: PostgreSQL database, authentication (email, OAuth, magic links), Realtime subscriptions (WebSocket-based), Edge Functions (Deno runtime), and Row Level Security — all out of the box. Eliminates 80% of backend boilerplate. Free tier is more than sufficient for hackathon scale. |
| **AI/ML Service** | Python + FastAPI | 3.11 / 0.109 | Python is the lingua franca of ML. FastAPI provides async HTTP endpoints with automatic OpenAPI docs. Pydantic models enforce strict input/output schemas. Uvicorn ASGI server handles concurrent prediction requests. |
| **ML Libraries** | sentence-transformers, scikit-learn, XGBoost | Latest | sentence-transformers provides pre-trained NLP models (all-MiniLM-L6-v2) for event text embeddings. scikit-learn for classification pipeline. XGBoost for gradient-boosted amount regression with built-in feature importance. |
| **LLM** | Claude API (Anthropic) | claude-sonnet-4-20250514 | Best-in-class reasoning for generating nuanced financial insights. Structured output mode for reliable JSON responses. Cost-effective for hackathon usage. Supports system prompts for consistent persona (financial advisor tone). |
| **Financial Data** | Plaid API | Latest | Industry-standard financial data aggregation. Sandbox mode provides realistic test data (transactions, balances, accounts) without real bank credentials. Production-ready architecture means the demo can scale to real users post-hackathon. |
| **Calendar** | Google Calendar API + iCal | v3 | Google Calendar covers ~70% of users. iCal parser (ical.js) handles Apple Calendar, Outlook, and any standards-compliant calendar. Synthetic calendar fallback ensures demo reliability even without live API access. |
| **State Management** | Zustand | 4.x | Minimal boilerplate (3-5 lines to create a store vs. 30+ for Redux). Built-in TypeScript support. Supports middleware (persist, devtools). No provider wrapping needed. Perfect for hackathon velocity. |
| **Charts** | Victory Native + react-native-chart-kit | Latest | Victory Native provides composable, animated chart components (bar, line, pie, area). react-native-chart-kit adds additional chart types with minimal config. Both support the dark theme aesthetic. |
| **Push Notifications** | Expo Push Notifications | Latest | Zero-config push notifications through Expo's push service. No native module linking required. Supports scheduled notifications for pre-event spending alerts. |
| **Deployment** | Expo Go (dev) / EAS Build (prod) | Latest | Expo Go for instant hackathon demo — judges scan a QR code and the app loads on their phone. No build pipeline needed for demo day. EAS Build available for standalone builds if needed. |

### Tech Stack Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FUTURESPEND TECH STACK                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        CLIENT LAYER                                 │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │  React Native (Expo SDK 52) + TypeScript                     │  │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐  │  │    │
│  │  │  │ Zustand   │ │ Victory  │ │ Expo Push │ │ Expo Router   │  │  │    │
│  │  │  │ (State)   │ │ (Charts) │ │ (Notifs)  │ │ (Navigation)  │  │  │    │
│  │  │  └──────────┘ └──────────┘ └───────────┘ └───────────────┘  │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────┬───────────────────────────────────┘    │
│                                    │ HTTPS / WSS                            │
│  ┌─────────────────────────────────▼───────────────────────────────────┐    │
│  │                       BACKEND LAYER (Supabase)                      │    │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────────┐    │    │
│  │  │   Auth   │ │ Realtime │ │   Edge    │ │    PostgreSQL     │    │    │
│  │  │  (OAuth, │ │  (WSS    │ │ Functions │ │  (RLS-enabled,    │    │    │
│  │  │  Magic   │ │  subscr- │ │  (Deno    │ │   structured      │    │    │
│  │  │  Link)   │ │  iptions)│ │  runtime) │ │   schemas)        │    │    │
│  │  └──────────┘ └──────────┘ └─────┬─────┘ └───────────────────┘    │    │
│  └──────────────────────────────────┬──────────────────────────────────┘    │
│                                     │ HTTP (internal)                       │
│  ┌──────────────────────────────────▼──────────────────────────────────┐    │
│  │                      AI/ML LAYER (FastAPI)                          │    │
│  │  ┌────────────────┐ ┌──────────────┐ ┌──────────────────────┐      │    │
│  │  │ NLP Pipeline   │ │ Prediction   │ │ LLM Integration      │      │    │
│  │  │ (sentence-     │ │ Engine       │ │ (Claude API)         │      │    │
│  │  │  transformers) │ │ (XGBoost)    │ │                      │      │    │
│  │  └────────────────┘ └──────────────┘ └──────────────────────┘      │    │
│  └──────────────────────────────────┬──────────────────────────────────┘    │
│                                     │ HTTPS (external)                      │
│  ┌──────────────────────────────────▼──────────────────────────────────┐    │
│  │                     EXTERNAL SERVICES                               │    │
│  │  ┌──────────────┐ ┌──────────────────┐ ┌──────────────────────┐    │    │
│  │  │  Plaid API   │ │ Google Calendar  │ │   Claude API         │    │    │
│  │  │  (Sandbox)   │ │ API + iCal       │ │   (Anthropic)        │    │    │
│  │  └──────────────┘ └──────────────────┘ └──────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why This Stack Wins at a Hackathon

1. **Speed to MVP**: Supabase eliminates 6-8 hours of backend work (auth, database, realtime, API). Expo eliminates 2-3 hours of native build tooling. Combined savings: ~10 hours — nearly half the hackathon.
2. **Demo Quality**: Expo Go means judges interact with a *real app on their own phones*. No "imagine this deployed" hand-waving. Supabase Realtime means social features update live during the demo.
3. **Technical Depth**: The Python ML microservice demonstrates genuine AI/ML engineering (not just an LLM wrapper). Plaid integration shows production-grade financial data handling. The architecture is modular and extensible.
4. **Post-Hackathon Viability**: Every technology choice scales. Supabase handles millions of rows. FastAPI handles thousands of concurrent requests. React Native deploys to both app stores. This is not a throwaway prototype.

---

## 3. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                         ┌──────────────────────┐                                │
│                         │    MOBILE CLIENT      │                                │
│                         │   React Native/Expo   │                                │
│                         │                       │                                │
│                         │  ┌────┐ ┌────┐ ┌───┐ │                                │
│                         │  │Cal │ │Fin │ │Soc│ │                                │
│                         │  │View│ │Dash│ │ial│ │                                │
│                         │  └────┘ └────┘ └───┘ │                                │
│                         └──────────┬────────────┘                                │
│                                    │                                             │
│                    ┌───────────────┼───────────────┐                             │
│                    │ HTTPS/REST    │ WSS/Realtime  │                             │
│                    ▼               ▼               │                             │
│  ┌─────────────────────────────────────────────────┼────────────────────────┐    │
│  │                    SUPABASE PLATFORM            │                        │    │
│  │                                                 │                        │    │
│  │  ┌─────────────┐  ┌────────────────┐  ┌────────▼────────┐              │    │
│  │  │    AUTH      │  │  EDGE FUNCS    │  │    REALTIME     │              │    │
│  │  │             │  │                │  │                 │              │    │
│  │  │ - OAuth 2.0 │  │ - /predict     │  │ - Leaderboard   │              │    │
│  │  │ - Magic Link│  │ - /sync-cal    │  │   updates       │              │    │
│  │  │ - JWT       │  │ - /challenge   │  │ - Challenge     │              │    │
│  │  │ - RLS       │  │ - /insights    │  │   progress      │              │    │
│  │  └─────────────┘  └───────┬────────┘  │ - Friend        │              │    │
│  │                           │           │   activity       │              │    │
│  │  ┌────────────────────────▼────────┐  └─────────────────┘              │    │
│  │  │         POSTGRESQL              │                                    │    │
│  │  │                                 │                                    │    │
│  │  │  users ─┬─ calendar_events      │                                    │    │
│  │  │         ├─ predictions          │                                    │    │
│  │  │         ├─ transactions         │                                    │    │
│  │  │         ├─ budgets              │                                    │    │
│  │  │         ├─ streaks              │                                    │    │
│  │  │         ├─ circles              │                                    │    │
│  │  │         ├─ challenges           │                                    │    │
│  │  │         └─ achievements         │                                    │    │
│  │  │                                 │                                    │    │
│  │  │  Row Level Security on ALL      │                                    │    │
│  │  │  tables — users only see        │                                    │    │
│  │  │  their own data + shared        │                                    │    │
│  │  │  circle data                    │                                    │    │
│  │  └─────────────────────────────────┘                                    │    │
│  └────────────────────────────┬────────────────────────────────────────────┘    │
│                               │ HTTP (internal network)                         │
│                               ▼                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐     │
│  │                    AI/ML MICROSERVICE (FastAPI)                        │     │
│  │                                                                        │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │     │
│  │  │  Stage 1     │  │  Stage 2     │  │  Stage 3     │  │ Stage 4  │  │     │
│  │  │  NLP Event   │──▶  Category    │──▶  Amount      │──▶ Confid-  │  │     │
│  │  │  Embedding   │  │  Classifier  │  │  Prediction  │  │ ence     │  │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────┬─────┘  │     │
│  │                                                              │        │     │
│  │                                                     ┌────────▼─────┐  │     │
│  │                                                     │  Stage 5     │  │     │
│  │                                                     │  LLM Insight │  │     │
│  │                                                     │  (Claude)    │  │     │
│  │                                                     └──────────────┘  │     │
│  └─────────────────────────┬──────────────────────────────────────────────┘     │
│                            │ HTTPS (external)                                   │
│               ┌────────────┼────────────┐                                       │
│               ▼            ▼            ▼                                       │
│  ┌────────────────┐ ┌────────────┐ ┌──────────────┐                            │
│  │   Plaid API    │ │  Google    │ │  Claude API  │                            │
│  │   (Sandbox)    │ │  Calendar  │ │  (Anthropic) │                            │
│  │                │ │  API       │ │              │                            │
│  │ - Transactions │ │ - Events   │ │ - Insights   │                            │
│  │ - Balances     │ │ - Sync     │ │ - Summaries  │                            │
│  │ - Accounts     │ │ - Watch    │ │ - Advice     │                            │
│  └────────────────┘ └────────────┘ └──────────────┘                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Module Boundaries

The system is organized as a **modular monolith** — logically separated modules that share a database but maintain strict interface boundaries. This gives hackathon speed (no inter-service networking) with production-ready separation of concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                        MODULE MAP                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │  CALENDAR MODULE │     │  FINANCE MODULE  │                   │
│  │                 │     │                 │                   │
│  │ - Google Cal    │────▶│ - Plaid sync    │                   │
│  │   OAuth + sync  │     │ - Transaction   │                   │
│  │ - iCal import   │     │   categorization│                   │
│  │ - Event parsing │     │ - Budget CRUD   │                   │
│  │ - Recurrence    │     │ - Balance track │                   │
│  │   expansion     │     │ - Spending      │                   │
│  │ - Synthetic     │     │   aggregation   │                   │
│  │   fallback      │     │                 │                   │
│  └────────┬────────┘     └────────┬────────┘                   │
│           │                       │                             │
│           ▼                       ▼                             │
│  ┌────────────────────────────────────────────┐                │
│  │              AI/ML MODULE                   │                │
│  │                                             │                │
│  │ - Event NLP (embeddings)                    │                │
│  │ - Category classification                   │                │
│  │ - Amount prediction (XGBoost)               │                │
│  │ - Confidence calibration                    │                │
│  │ - LLM insight generation (Claude)           │                │
│  │ - Model versioning + A/B testing            │                │
│  └──────────┬───────────────┬──────────────────┘                │
│             │               │                                   │
│             ▼               ▼                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ GAMIFICATION     │  │  NOTIFICATION    │                    │
│  │ MODULE           │  │  MODULE          │                    │
│  │                  │  │                  │                    │
│  │ - Streak engine  │  │ - Push notifs    │                    │
│  │ - Points/XP      │  │ - Pre-event      │                    │
│  │ - Milestones     │  │   spending alerts│                    │
│  │ - Leaderboards   │  │ - Streak reminders│                   │
│  │ - Achievements   │  │ - Challenge       │                   │
│  │ - Challenges     │  │   updates        │                    │
│  └────────┬─────────┘  └──────────────────┘                    │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                          │
│  │  SOCIAL MODULE   │                                          │
│  │                  │                                          │
│  │ - Inner circles  │                                          │
│  │ - Friend system  │                                          │
│  │ - Shared         │                                          │
│  │   challenges     │                                          │
│  │ - Activity feed  │                                          │
│  │ - Privacy        │                                          │
│  │   controls       │                                          │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Narrative

The core data flow — from calendar event to actionable user notification — follows a six-step pipeline:

**Step 1: Calendar Ingestion**
A user's Google Calendar syncs via OAuth 2.0, or they import an `.ics` file. The Calendar Module normalizes all events into a unified schema: `{ title, description, location, start_time, end_time, duration_minutes, recurrence_rule, attendees[], source }`. Events are stored in `calendar_events` with a foreign key to the user. A Supabase Realtime subscription notifies the AI/ML module of new events.

**Step 2: NLP Feature Extraction**
The AI/ML microservice receives the event payload. The sentence-transformers model (`all-MiniLM-L6-v2`) encodes the concatenated text (`title + description + location`) into a 384-dimensional embedding vector. Additional structured features are extracted: `spending_keywords` (regex-matched terms like "dinner," "uber," "tickets"), `social_signals` (attendee count, group indicators), `location_type` (restaurant, store, gym — via string matching or geocoding), `time_of_day` (morning/afternoon/evening/night), and `day_of_week`.

**Step 3: Spending Prediction**
The embedding vector and structured features feed into a two-stage prediction head. First, a fine-tuned classifier predicts the spending category (dining, transportation, entertainment, etc.) with a probability distribution. Second, an XGBoost regression model predicts the dollar amount, conditioned on the predicted category and user-specific historical averages. The output includes a point estimate and a prediction interval (e.g., `$25 [$18 - $35]`).

**Step 4: Budget Impact Assessment**
The predicted amount is compared against the user's current budget status for the relevant category. The system calculates: remaining budget, projected end-of-month total (historical spend + sum of future predictions), and budget health score. If the projected total exceeds the budget, a warning is generated with severity (caution / warning / critical).

**Step 5: User Notification & Insight Delivery**
Claude API generates a human-readable insight combining the prediction, budget context, and actionable advice. The insight is pushed to the user via Expo Push Notification (for upcoming events) or displayed in the app's prediction feed. Example: "Your calendar shows 4 dining events this week totaling ~$140. That would put you at 95% of your $300 dining budget with 2 weeks left. Consider cooking for one of these — swapping Thursday's dinner out could save ~$35."

**Step 6: Gamification Update**
Every financial action (staying under budget, hitting a savings target, completing a challenge) updates the gamification state. Points are awarded, streaks are checked, leaderboards are recalculated via Supabase Realtime, and achievement conditions are evaluated. Circle members receive activity updates: "Alex just hit a 7-day streak! Send them a high-five."

### Supabase Architecture — Row Level Security

Row Level Security (RLS) is the cornerstone of the data access model. Every table has RLS policies that enforce data isolation at the database level — not the application level. This means even if the API is compromised, users cannot access each other's data.

```sql
-- Example RLS policy for predictions table
-- Users can only read their own predictions
CREATE POLICY "Users read own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only read circle data if they are a member
CREATE POLICY "Circle members read shared data" ON circle_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circle_activities.circle_id
      AND circle_members.user_id = auth.uid()
      AND circle_members.status = 'active'
    )
  );

-- Users can only modify their own budgets
CREATE POLICY "Users manage own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);
```

This approach ensures that social features (circles, leaderboards, challenges) expose *only* the data users have explicitly opted to share, while all private financial data remains strictly isolated.

---

## 4. AI/ML Prediction Pipeline

The prediction pipeline is FutureSpend's core technical differentiator — a five-stage system that transforms unstructured calendar events into actionable financial predictions with calibrated confidence scores and human-readable insights.

### Pipeline Overview

```
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│  Stage 1  │    │  Stage 2  │    │  Stage 3  │    │  Stage 4  │    │  Stage 5  │
│           │    │           │    │           │    │           │    │           │
│  Calendar │───▶│ Spending  │───▶│  Amount   │───▶│Confidence │───▶│    LLM    │
│  Event    │    │ Category  │    │Prediction │    │ Scoring   │    │  Insight  │
│  NLP      │    │ Classif.  │    │           │    │           │    │Generation │
│           │    │           │    │           │    │           │    │           │
│ Embedding │    │ Softmax   │    │ XGBoost   │    │  Platt    │    │  Claude   │
│  Vector   │    │ Probs     │    │ Regressor │    │ Scaling   │    │   API     │
└───────────┘    └───────────┘    └───────────┘    └───────────┘    └───────────┘
     384-dim         13 cats       $ estimate       0.0 - 1.0       Natural
     vector          + probs       + interval       + label         language
```

---

### Stage 1: Calendar Event NLP

**Objective:** Convert unstructured calendar event metadata into a dense numerical representation suitable for downstream classification and regression.

**Model:** `sentence-transformers/all-MiniLM-L6-v2`
- 22.7M parameters
- 384-dimensional output embeddings
- Trained on 1B+ sentence pairs
- Inference time: ~5ms per event on CPU
- Chosen for its balance of quality and speed — small enough to run on a single CPU instance with low latency

**Input Processing:**
The event's textual fields are concatenated into a single input string with structural markers:

```python
def build_event_text(event: CalendarEvent) -> str:
    parts = []
    parts.append(f"Event: {event.title}")
    if event.description:
        parts.append(f"Description: {event.description}")
    if event.location:
        parts.append(f"Location: {event.location}")
    parts.append(f"Time: {event.start_time.strftime('%A %I:%M %p')}")
    parts.append(f"Duration: {event.duration_minutes} minutes")
    if event.attendees:
        parts.append(f"Attendees: {len(event.attendees)} people")
    return " | ".join(parts)
```

Example input string:
```
"Event: Team Lunch at Earls | Location: Earls Kitchen + Bar, Vancouver |
 Time: Friday 12:30 PM | Duration: 90 minutes | Attendees: 6 people"
```

**Output:** A 384-dimensional float vector representing the semantic content of the event.

**Additional Feature Extraction:**
Beyond the embedding, structured features are extracted via rule-based methods:

```python
SPENDING_KEYWORDS = {
    "dining": ["lunch", "dinner", "brunch", "restaurant", "cafe", "eat", "food"],
    "transport": ["uber", "lyft", "taxi", "gas", "parking", "transit"],
    "entertainment": ["movie", "concert", "show", "game", "festival", "bar", "club"],
    "shopping": ["mall", "store", "buy", "shop", "market"],
    "coffee": ["coffee", "starbucks", "tim hortons", "cafe"],
    "fitness": ["gym", "yoga", "crossfit", "fitness", "workout"],
    "education": ["class", "lecture", "tutorial", "study group", "workshop"],
}

def extract_features(event: CalendarEvent) -> dict:
    text_lower = f"{event.title} {event.description} {event.location}".lower()
    return {
        "spending_keywords": {cat: any(kw in text_lower for kw in kws)
                              for cat, kws in SPENDING_KEYWORDS.items()},
        "social_signals": {
            "attendee_count": len(event.attendees),
            "is_group_event": len(event.attendees) > 2,
            "has_external_attendees": any("@" in a for a in event.attendees),
        },
        "location_type": classify_location(event.location),
        "time_of_day": get_time_bucket(event.start_time),  # morning/afternoon/evening/night
        "day_of_week": event.start_time.strftime("%A"),
        "is_weekend": event.start_time.weekday() >= 5,
        "duration_minutes": event.duration_minutes,
        "is_recurring": event.recurrence_rule is not None,
    }
```

**Input Schema:**

```json
{
  "event_id": "uuid",
  "title": "Team Lunch at Earls",
  "description": "Monthly team lunch - celebrating Q1 wins",
  "location": "Earls Kitchen + Bar, 905 Hornby St, Vancouver",
  "start_time": "2026-03-06T12:30:00-08:00",
  "end_time": "2026-03-06T14:00:00-08:00",
  "duration_minutes": 90,
  "recurrence_rule": null,
  "attendees": [
    "alice@company.com",
    "bob@company.com",
    "carol@company.com",
    "dave@company.com",
    "eve@company.com",
    "frank@company.com"
  ],
  "source": "google_calendar"
}
```

**Output Schema (Stage 1):**

```json
{
  "event_id": "uuid",
  "embedding": [0.0231, -0.0891, 0.1542, "... (384 floats)"],
  "structured_features": {
    "spending_keywords": {
      "dining": true,
      "transport": false,
      "entertainment": false,
      "shopping": false,
      "coffee": false,
      "fitness": false,
      "education": false
    },
    "social_signals": {
      "attendee_count": 6,
      "is_group_event": true,
      "has_external_attendees": false
    },
    "location_type": "restaurant",
    "time_of_day": "afternoon",
    "day_of_week": "Friday",
    "is_weekend": false,
    "duration_minutes": 90,
    "is_recurring": false
  }
}
```

---

### Stage 2: Spending Category Classification

**Objective:** Classify each calendar event into one of 13 spending categories with probability distributions.

**Categories:**

| ID | Category | Description | Example Events |
|----|----------|-------------|----------------|
| 0 | `dining` | Restaurants, takeout, meal events | "Dinner at Cactus Club", "Team Lunch" |
| 1 | `transportation` | Ride-shares, gas, transit, parking | "Airport Pickup", "Road Trip" |
| 2 | `entertainment` | Movies, concerts, events, nightlife | "Drake Concert", "Movie Night" |
| 3 | `shopping` | Retail, malls, online shopping | "Metrotown Trip", "Black Friday" |
| 4 | `groceries` | Grocery stores, meal prep | "Costco Run", "Weekly Groceries" |
| 5 | `coffee_drinks` | Coffee shops, cafes, drinks | "Coffee with Sarah", "Starbucks" |
| 6 | `health_fitness` | Gym, yoga, sports, health | "CrossFit Class", "Dentist Appt" |
| 7 | `education` | Courses, books, workshops | "Python Workshop", "Textbook Pickup" |
| 8 | `personal_care` | Haircuts, spa, grooming | "Haircut at Main Barber", "Spa Day" |
| 9 | `gifts` | Birthday, holiday, special occasions | "Mom's Birthday", "Wedding Gift" |
| 10 | `travel` | Flights, hotels, vacation activities | "Whistler Weekend", "Flight to Toronto" |
| 11 | `subscriptions` | Recurring digital/physical subscriptions | "Gym Membership", "Netflix" |
| 12 | `utilities` | Bills, rent-adjacent, household | "Hydro Bill Due", "Internet Setup" |

**Model Architecture:**

```
Input Layer
    |
    |-- Embedding Vector (384-dim) ──────────────────────────┐
    |                                                         |
    |-- Structured Features (one-hot + numeric, ~30-dim) ────┤
    |                                                         |
    └─────────────────────────────────────────────────────────┤
                                                              |
                                                    Concatenation (414-dim)
                                                              |
                                                     Dense(256, ReLU)
                                                              |
                                                     Dropout(0.3)
                                                              |
                                                     Dense(128, ReLU)
                                                              |
                                                     Dropout(0.2)
                                                              |
                                                     Dense(13, Softmax)
                                                              |
                                                    Category Probabilities
```

**Implementation:**

```python
import torch
import torch.nn as nn

class SpendingCategoryClassifier(nn.Module):
    def __init__(self, embedding_dim=384, structured_dim=30, num_categories=13):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(embedding_dim + structured_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, num_categories),
        )

    def forward(self, embedding, structured_features):
        x = torch.cat([embedding, structured_features], dim=-1)
        logits = self.network(x)
        return torch.softmax(logits, dim=-1)
```

**Output Schema (Stage 2):**

```json
{
  "event_id": "uuid",
  "predicted_category": "dining",
  "category_probabilities": {
    "dining": 0.847,
    "entertainment": 0.062,
    "coffee_drinks": 0.041,
    "shopping": 0.018,
    "transportation": 0.012,
    "groceries": 0.008,
    "health_fitness": 0.004,
    "education": 0.003,
    "personal_care": 0.002,
    "gifts": 0.001,
    "travel": 0.001,
    "subscriptions": 0.001,
    "utilities": 0.000
  },
  "category_confidence": 0.847
}
```

---

### Stage 3: Amount Prediction

**Objective:** Predict the dollar amount a user will spend for a given calendar event, with uncertainty quantification.

**Model:** XGBoost Gradient Boosted Regression (with quantile regression for prediction intervals)

**Why XGBoost over Neural Networks for Amount Prediction:**
- Handles heterogeneous features (categorical + numerical) natively
- Built-in feature importance for explainability (critical for financial applications)
- Robust to outliers in spending data
- Fast inference (~1ms per prediction)
- Quantile regression mode provides natural prediction intervals without distributional assumptions

**Feature Vector:**

| Feature | Type | Description |
|---------|------|-------------|
| `category` | categorical (one-hot) | Predicted spending category from Stage 2 |
| `category_confidence` | float | Confidence of category prediction |
| `day_of_week` | categorical (one-hot) | Monday through Sunday |
| `time_of_day` | categorical (one-hot) | morning / afternoon / evening / night |
| `location_price_level` | int (0-4) | Price level of venue (0=unknown, 1=cheap, 4=expensive) |
| `event_duration` | float | Duration in minutes |
| `num_attendees` | int | Number of event attendees |
| `is_recurring` | bool | Whether the event recurs |
| `user_historical_avg` | float | User's average spend for this category |
| `user_historical_median` | float | User's median spend for this category |
| `user_historical_std` | float | Standard deviation of user's spend for this category |
| `day_of_month` | int (1-31) | Day of the month |
| `is_payday_week` | bool | Whether this falls within user's configured payday week |
| `is_weekend` | bool | Saturday or Sunday |
| `is_holiday` | bool | Recognized holiday |
| `recurrence_avg_amount` | float | Average amount for previous instances of this recurring event |
| `weeks_until_month_end` | float | Weeks remaining in the month |

**Training Configuration:**

```python
import xgboost as xgb

# Point estimate model
point_model = xgb.XGBRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
)

# Lower bound (10th percentile)
lower_model = xgb.XGBRegressor(
    objective="reg:quantileerror",
    quantile_alpha=0.1,
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
)

# Upper bound (90th percentile)
upper_model = xgb.XGBRegressor(
    objective="reg:quantileerror",
    quantile_alpha=0.9,
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
)
```

**Output Schema (Stage 3):**

```json
{
  "event_id": "uuid",
  "predicted_amount": 28.50,
  "prediction_interval": {
    "low": 18.00,
    "high": 42.00,
    "confidence_level": 0.80
  },
  "amount_currency": "CAD",
  "feature_importance": {
    "user_historical_avg": 0.342,
    "category": 0.218,
    "location_price_level": 0.156,
    "num_attendees": 0.098,
    "time_of_day": 0.071,
    "day_of_week": 0.045,
    "event_duration": 0.038,
    "is_recurring": 0.032
  }
}
```

---

### Stage 4: Confidence Scoring

**Objective:** Produce a single, calibrated confidence score (0.0 to 1.0) that reflects how reliable the overall prediction is, combining uncertainty from both category classification and amount regression.

**Methodology: Platt Scaling + Multi-Factor Calibration**

Raw model outputs (softmax probabilities, regression variance) are often poorly calibrated — a model saying "80% confident" might only be correct 60% of the time. Platt scaling fits a logistic regression on a held-out calibration set to map raw scores to true probabilities.

Beyond calibration, the confidence score incorporates multiple factors that affect real-world prediction reliability:

**Confidence Factors:**

| Factor | Weight | Description | Range |
|--------|--------|-------------|-------|
| `historical_match_count` | 0.30 | How many similar past events the user has, mapped to a saturation curve | 0.0 (no history) to 1.0 (10+ matches) |
| `category_certainty` | 0.25 | Calibrated softmax probability of the top predicted category | 0.0 to 1.0 |
| `amount_variance` | 0.20 | Inverse normalized width of the prediction interval — narrow = confident | 0.0 (very wide) to 1.0 (very narrow) |
| `recurrence_bonus` | 0.15 | Recurring events with past transaction matches are highly predictable | 0.0 (non-recurring) to 1.0 (recurring with consistent history) |
| `data_quality` | 0.10 | Completeness of event metadata (title + location + description + attendees) | 0.0 (title only) to 1.0 (all fields populated) |

**Confidence Formula:**

```python
def compute_confidence(
    category_prob: float,
    prediction_interval: tuple[float, float],
    predicted_amount: float,
    historical_matches: int,
    is_recurring: bool,
    recurrence_history_consistency: float,
    metadata_completeness: float,
) -> tuple[float, str]:
    # Factor 1: Historical match count (saturating curve)
    history_factor = 1 - math.exp(-0.3 * historical_matches)

    # Factor 2: Category certainty (Platt-scaled)
    category_factor = platt_scale(category_prob)

    # Factor 3: Amount variance (inverse normalized interval width)
    interval_width = prediction_interval[1] - prediction_interval[0]
    relative_width = interval_width / max(predicted_amount, 1.0)
    amount_factor = max(0, 1 - (relative_width / 2.0))

    # Factor 4: Recurrence bonus
    if is_recurring:
        recurrence_factor = 0.5 + 0.5 * recurrence_history_consistency
    else:
        recurrence_factor = 0.3  # baseline for non-recurring

    # Factor 5: Data quality
    data_quality_factor = metadata_completeness  # 0.0 to 1.0

    # Weighted combination
    confidence = (
        0.30 * history_factor +
        0.25 * category_factor +
        0.20 * amount_factor +
        0.15 * recurrence_factor +
        0.10 * data_quality_factor
    )

    # Map to human-readable label
    label = (
        "Very High" if confidence >= 0.85 else
        "High" if confidence >= 0.70 else
        "Medium" if confidence >= 0.50 else
        "Low"
    )

    return confidence, label
```

**Output Schema (Stage 4):**

```json
{
  "event_id": "uuid",
  "confidence_score": 0.78,
  "confidence_label": "High",
  "confidence_breakdown": {
    "historical_match_count": {
      "raw_value": 8,
      "factor_score": 0.909,
      "weight": 0.30
    },
    "category_certainty": {
      "raw_value": 0.847,
      "factor_score": 0.823,
      "weight": 0.25
    },
    "amount_variance": {
      "raw_value": 0.842,
      "factor_score": 0.579,
      "weight": 0.20
    },
    "recurrence_bonus": {
      "raw_value": 0.0,
      "factor_score": 0.300,
      "weight": 0.15
    },
    "data_quality": {
      "raw_value": 0.875,
      "factor_score": 0.875,
      "weight": 0.10
    }
  }
}
```

---

### Stage 5: LLM Insight Generation

**Objective:** Transform raw prediction data into a conversational, actionable financial insight that feels like advice from a knowledgeable friend — not a robot.

**Model:** Claude (claude-sonnet-4-20250514) via Anthropic API

**Why Claude for Insight Generation:**
- Superior reasoning about nuanced financial situations
- Natural, conversational tone without being preachy
- Structured output mode ensures consistent JSON responses
- Handles edge cases gracefully (e.g., "I can't predict spending for 'Mystery Event' — want to add more details?")

**System Prompt:**

```
You are FutureSpend's financial insight engine. You generate brief, actionable,
encouraging financial insights for users based on their calendar predictions.

Tone: Friendly financial advisor meets supportive friend. Never preachy, never
judgmental. Celebrate wins. Frame challenges as opportunities. Use specific
numbers and concrete suggestions.

Format rules:
- Keep insights to 2-3 sentences max
- Always include at least one specific, actionable suggestion
- Reference the event by name
- Reference the user's budget status when relevant
- Use Canadian dollars (CAD)
- Be encouraging even when the news isn't great

Never say: "You should", "You need to", "You must"
Prefer: "Consider", "One option", "You could", "What if"
```

**Prompt Template:**

```
Generate a financial insight for this upcoming event:

Event: {event_title}
Date/Time: {event_datetime}
Predicted Category: {predicted_category}
Predicted Amount: ${predicted_amount} (range: ${interval_low} - ${interval_high})
Confidence: {confidence_label} ({confidence_score})

User's Budget Context:
- {category} budget: ${budget_amount}/month
- Spent so far: ${spent_amount} ({percent_used}% used)
- Remaining: ${remaining} for {days_remaining} days
- Projected month-end total: ${projected_total}
- Budget status: {budget_status}

Historical Patterns:
- Average for this type of event: ${historical_avg}
- Last similar event: "{last_similar_event}" on {last_event_date} for ${last_event_amount}
- This month's {category} trend: {trend_direction} ({trend_percent}%)

Respond with a JSON object:
{
  "insight_text": "The main insight message (2-3 sentences)",
  "savings_tip": "A specific actionable tip (1 sentence, optional)",
  "mood": "positive | neutral | cautionary",
  "emoji_icon": "A single relevant emoji for the UI"
}
```

**Example Output:**

```json
{
  "event_id": "uuid",
  "insight": {
    "insight_text": "Your 'Team Lunch at Earls' on Friday typically runs $25-35 based on your history there. You've used $180 of your $300 dining budget with 18 days left — still in good shape, but this week has 3 dining events lined up.",
    "savings_tip": "Consider splitting appetizers instead of individual ones — your group lunches average $8 less when you go family-style.",
    "mood": "neutral",
    "emoji_icon": "🍽️"
  },
  "generated_at": "2026-03-04T10:30:00Z",
  "model_version": "claude-sonnet-4-20250514",
  "prompt_tokens": 342,
  "completion_tokens": 89
}
```

---

### Training Data Strategy

**Synthetic Dataset Specification:**

Since no public dataset maps calendar events to financial transactions, we generate a synthetic training corpus of 10,000 calendar-event-to-transaction pairs.

**Generation Parameters:**

```python
SYNTHETIC_CONFIG = {
    "num_samples": 10000,
    "users": 200,               # 50 events per user on average
    "date_range": "2025-01-01 to 2026-02-28",
    "categories": 13,
    "locations_per_category": 30,  # realistic venue names per city
    "cities": ["Vancouver", "Burnaby", "Surrey", "Richmond"],

    "amount_distributions": {
        "dining":          {"mean": 32, "std": 18, "min": 8,   "max": 150},
        "transportation":  {"mean": 18, "std": 12, "min": 3,   "max": 80},
        "entertainment":   {"mean": 45, "std": 30, "min": 10,  "max": 250},
        "shopping":        {"mean": 65, "std": 50, "min": 10,  "max": 500},
        "groceries":       {"mean": 55, "std": 25, "min": 15,  "max": 200},
        "coffee_drinks":   {"mean": 7,  "std": 3,  "min": 3,   "max": 15},
        "health_fitness":  {"mean": 35, "std": 20, "min": 10,  "max": 100},
        "education":       {"mean": 45, "std": 35, "min": 10,  "max": 300},
        "personal_care":   {"mean": 40, "std": 25, "min": 15,  "max": 120},
        "gifts":           {"mean": 55, "std": 40, "min": 15,  "max": 300},
        "travel":          {"mean": 180,"std": 120,"min": 30,  "max": 800},
        "subscriptions":   {"mean": 15, "std": 8,  "min": 5,   "max": 50},
        "utilities":       {"mean": 85, "std": 35, "min": 30,  "max": 200},
    },

    "event_title_templates": {
        "dining": [
            "Dinner at {restaurant}",
            "Lunch with {friend}",
            "Team lunch at {restaurant}",
            "Brunch with {group}",
            "Date night at {restaurant}",
            "{restaurant} reservation",
        ],
        "transportation": [
            "Uber to {destination}",
            "Gas fill-up",
            "Parking at {location}",
            "Transit pass renewal",
            "Airport shuttle",
        ],
        # ... (templates for all 13 categories)
    },

    "noise_injection": {
        "title_typos": 0.05,        # 5% of titles have minor typos
        "missing_location": 0.20,   # 20% have no location
        "missing_description": 0.40, # 40% have no description
        "amount_noise": 0.15,       # +/- 15% random noise on amounts
        "wrong_category": 0.03,     # 3% intentionally mislabeled for robustness
    }
}
```

**Synthetic Data Features:**
- Realistic event titles with actual Vancouver-area restaurant, store, and venue names
- Natural spending variance following log-normal distributions (people don't spend the same amount every time)
- Temporal patterns: higher spending on weekends, near payday, during holidays
- Social patterns: group events cost more; attendee count correlates with amount
- Recurrence patterns: weekly gym, biweekly groceries, monthly subscriptions
- Noise injection: missing fields, typos, and edge cases to train robust models

**Continuous Learning Loop:**

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Calendar   │────▶│  Prediction  │────▶│  User Feedback  │
│   Event      │     │  (Category   │     │  (Actual spend, │
│              │     │   + Amount)  │     │   correct cat., │
│              │     │              │     │   thumbs up/    │
│              │     │              │     │   down)          │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                                   ▼
                                         ┌─────────────────┐
                                         │  Feedback Store  │
                                         │  (Supabase)      │
                                         └────────┬────────┘
                                                   │ Batch (nightly)
                                                   ▼
                                         ┌─────────────────┐
                                         │  Model Retrain   │
                                         │  (fine-tune on   │
                                         │   user-specific  │
                                         │   corrections)   │
                                         └────────┬────────┘
                                                   │
                                                   ▼
                                         ┌─────────────────┐
                                         │  Updated Model   │
                                         │  (A/B tested     │
                                         │   before deploy) │
                                         └─────────────────┘
```

Users implicitly provide feedback when they log actual transactions that correspond to predicted events. Explicit feedback is collected via a simple "Was this prediction helpful?" thumbs up/down and optional amount correction. Over time, the model becomes personalized to each user's spending patterns.

---

### Real-Time Inference Pipeline

**Trigger Conditions:**

| Trigger | Action | Latency Target |
|---------|--------|----------------|
| Calendar sync (bulk) | Batch predict all new/modified events for next 30 days | < 5s for 50 events |
| New event created | Single-event prediction | < 200ms |
| Event modified | Re-predict with updated metadata | < 200ms |
| Event approaching (T-24h) | Re-predict with latest budget context + generate fresh LLM insight | < 500ms |
| User opens prediction detail | Refresh prediction if stale (> 1h old) | < 300ms |

**Caching Strategy:**

```python
CACHE_CONFIG = {
    "prediction_ttl": {
        "far_future": 86400,       # > 7 days away: cache for 24 hours
        "this_week": 14400,        # 2-7 days away: cache for 4 hours
        "tomorrow": 3600,          # 1-2 days away: cache for 1 hour
        "today": 900,              # < 24 hours away: cache for 15 minutes
        "imminent": 0,             # < 2 hours away: always fresh
    },
    "insight_ttl": 3600,           # LLM insights cached for 1 hour
    "embedding_ttl": 604800,       # Embeddings cached for 7 days (text doesn't change)
    "cache_backend": "supabase",   # Store in predictions table with updated_at timestamp
}
```

Predictions are cached in the `predictions` table with a `stale_after` timestamp computed from the event's proximity. When a user views their prediction feed, the app checks `stale_after` and only re-fetches predictions that have expired. Embeddings are cached aggressively since they only depend on event text, which rarely changes.

---

### Full Pipeline Input/Output Schemas

**Pipeline Input:**

```json
{
  "request_id": "req_abc123",
  "user_id": "usr_xyz789",
  "events": [
    {
      "event_id": "evt_001",
      "title": "Team Lunch at Earls",
      "description": "Monthly team lunch - celebrating Q1 wins",
      "location": "Earls Kitchen + Bar, 905 Hornby St, Vancouver",
      "start_time": "2026-03-06T12:30:00-08:00",
      "end_time": "2026-03-06T14:00:00-08:00",
      "duration_minutes": 90,
      "recurrence_rule": null,
      "attendees": ["alice@co.com", "bob@co.com", "carol@co.com",
                     "dave@co.com", "eve@co.com", "frank@co.com"],
      "source": "google_calendar"
    }
  ],
  "user_context": {
    "budgets": {
      "dining": {"limit": 300, "spent": 180, "remaining": 120}
    },
    "historical_averages": {
      "dining": {"mean": 28.50, "median": 25.00, "std": 12.30}
    },
    "payday_config": {
      "frequency": "biweekly",
      "last_payday": "2026-02-27"
    }
  },
  "options": {
    "include_insights": true,
    "include_confidence_breakdown": true,
    "include_feature_importance": true
  }
}
```

**Pipeline Output:**

```json
{
  "request_id": "req_abc123",
  "predictions": [
    {
      "event_id": "evt_001",
      "event_title": "Team Lunch at Earls",
      "event_datetime": "2026-03-06T12:30:00-08:00",

      "category": {
        "predicted": "dining",
        "probabilities": {
          "dining": 0.847,
          "entertainment": 0.062,
          "coffee_drinks": 0.041,
          "shopping": 0.018,
          "transportation": 0.012,
          "groceries": 0.008,
          "health_fitness": 0.004,
          "education": 0.003,
          "personal_care": 0.002,
          "gifts": 0.001,
          "travel": 0.001,
          "subscriptions": 0.001,
          "utilities": 0.000
        }
      },

      "amount": {
        "predicted": 28.50,
        "currency": "CAD",
        "interval": {
          "low": 18.00,
          "high": 42.00,
          "confidence_level": 0.80
        },
        "feature_importance": {
          "user_historical_avg": 0.342,
          "category": 0.218,
          "location_price_level": 0.156,
          "num_attendees": 0.098,
          "time_of_day": 0.071,
          "day_of_week": 0.045,
          "event_duration": 0.038,
          "is_recurring": 0.032
        }
      },

      "confidence": {
        "score": 0.78,
        "label": "High",
        "breakdown": {
          "historical_match_count": {"value": 8, "score": 0.909, "weight": 0.30},
          "category_certainty": {"value": 0.847, "score": 0.823, "weight": 0.25},
          "amount_variance": {"value": 0.842, "score": 0.579, "weight": 0.20},
          "recurrence_bonus": {"value": 0.0, "score": 0.300, "weight": 0.15},
          "data_quality": {"value": 0.875, "score": 0.875, "weight": 0.10}
        }
      },

      "insight": {
        "text": "Your 'Team Lunch at Earls' on Friday typically runs $25-35 based on your history there. You've used $180 of your $300 dining budget with 18 days left — still in good shape, but this week has 3 dining events lined up.",
        "savings_tip": "Consider splitting appetizers instead of individual ones — your group lunches average $8 less when you go family-style.",
        "mood": "neutral",
        "emoji_icon": "🍽️"
      },

      "budget_impact": {
        "category": "dining",
        "budget_limit": 300.00,
        "spent_before": 180.00,
        "projected_after": 208.50,
        "remaining_after": 91.50,
        "percent_used_after": 69.5,
        "days_remaining": 18,
        "daily_budget_remaining": 5.08,
        "status": "on_track",
        "projected_month_end": 285.00
      },

      "metadata": {
        "pipeline_version": "1.0.0",
        "model_versions": {
          "embedding": "all-MiniLM-L6-v2",
          "classifier": "spending-cat-v1.0",
          "regressor": "amount-xgb-v1.0",
          "calibrator": "platt-v1.0",
          "llm": "claude-sonnet-4-20250514"
        },
        "inference_time_ms": 187,
        "cached": false,
        "stale_after": "2026-03-05T12:30:00-08:00"
      }
    }
  ],

  "summary": {
    "events_processed": 1,
    "total_predicted_spend": 28.50,
    "total_inference_time_ms": 187,
    "warnings": []
  }
}
```



## 5. Financial Calculations & Metrics Engine

The metrics engine is the analytical core of FutureSpend. It transforms raw transaction data, calendar events, and user behavior into actionable financial insights. All formulas are designed to run efficiently on the client side for real-time dashboard updates, with heavier computations (historical aggregations, ML-based adjustments) offloaded to the backend.

---

### 5.1 Predictive Budget Formula

```
PredictedSpend(t) = Σ(EventCost_i × Confidence_i) + RecurringExpenses(t) + SeasonalAdjustment(t)
```

**Component Breakdown:**

| Component | Description | Source |
|-----------|-------------|--------|
| `EventCost_i` | Estimated cost for calendar event `i` in time period `t`. Derived from category averages, location data, attendee count, and historical spending on similar events. | Calendar Integration + Transaction History |
| `Confidence_i` | A value between 0.0 and 1.0 representing how confident the system is in the cost prediction for event `i`. New event types start at 0.5; confidence increases as more data is collected. | ML Model / Heuristic Engine |
| `RecurringExpenses(t)` | Sum of all detected recurring transactions expected in period `t` (rent, subscriptions, loan payments, utilities). Pulled from the Recurring Transaction Detection module. | Plaid Transaction Sync |
| `SeasonalAdjustment(t)` | A correction factor based on month-over-month historical spending variance. Accounts for predictable fluctuations (higher spending in December, lower in January, etc.). | Historical Data Analysis |

**SeasonalAdjustment Calculation:**

```
SeasonalAdjustment(t) = μ_monthly_spend × (MonthFactor(month_of(t)) - 1.0)

MonthFactor(m) = avg_spend(month=m, all_years) / avg_spend(all_months, all_years)
```

- `MonthFactor` is a ratio comparing the average spend for a given calendar month against the overall monthly average.
- A `MonthFactor` of 1.15 for December means spending is typically 15% above the annual monthly average.
- For new users with fewer than 3 months of data, `SeasonalAdjustment` defaults to 0 and the system relies on category-level national averages as a bootstrap.

**Confidence Decay:**

Confidence values decay over time for events that lack recent corroborating data:

```
Confidence_i(t) = Confidence_i(t0) × e^(-λ × (t - t0))
```

Where `λ = 0.05` (decay constant) and `t - t0` is measured in weeks since the last confirmed spend for that event type.

**Example:**

A user has the following events next week:
- "Dinner with Alex" at a restaurant (EventCost = $45, Confidence = 0.82)
- "Gym session" (EventCost = $0 — membership already paid, Confidence = 0.95)
- "Team offsite" (EventCost = $25 for lunch, Confidence = 0.60)

RecurringExpenses for the week = $385 (prorated: rent $1,200/4.33 + Spotify $10.99/4.33 + car insurance $150/4.33)
SeasonalAdjustment for February = -$12 (historically a lower-spend month)

```
PredictedSpend = ($45×0.82 + $0×0.95 + $25×0.60) + $385 + (-$12)
              = ($36.90 + $0 + $15.00) + $385 - $12
              = $424.90
```

---

### 5.2 Compound Savings Projections

```
FV = PV(1 + r)^n + PMT × ((1 + r)^n - 1) / r
```

| Variable | Definition | Typical Value |
|----------|-----------|---------------|
| `FV` | Future Value — the projected total savings at the end of the period | Calculated |
| `PV` | Present Value — current savings balance | User's linked savings account balance |
| `r` | Monthly interest rate (annual rate / 12) | 0.00375 (4.5% APY / 12) |
| `n` | Number of months in the projection | 6, 12, 24, 60 |
| `PMT` | Monthly contribution — derived from the user's average monthly savings or a user-set goal | From Plaid data or user input |

**Example Calculation:**

A user has $2,000 in savings (PV), earns 4.5% APY (r = 0.00375/month), and saves $300/month (PMT). Projection for 12 months:

```
FV = $2,000 × (1.00375)^12 + $300 × ((1.00375)^12 - 1) / 0.00375
   = $2,000 × 1.04594 + $300 × (0.04594 / 0.00375)
   = $2,091.88 + $300 × 12.251
   = $2,091.88 + $3,675.30
   = $5,767.18
```

The dashboard displays this as a growth curve chart with three lines:
1. **Conservative** — using `PMT × 0.8` (assumes user saves 20% less than average)
2. **Expected** — using actual `PMT`
3. **Optimistic** — using `PMT × 1.2` plus "Save the Difference" contributions

Users can drag a slider to adjust `n` and `PMT` to see real-time projections update.

---

### 5.3 Spending Velocity

```
V(t) = ΔSpending / ΔTime    (rolling 7-day window)
```

Spending Velocity measures the rate at which a user is consuming their budget. It is calculated as the total spending in the most recent 7-day window divided by 7, giving a daily spend rate in dollars per day.

**Budget-Implied Velocity:**

```
BudgetVelocity = TotalMonthlyBudget / DaysInMonth
```

This is the constant daily spending rate that would exactly exhaust the budget by month-end.

**Overspend Detection:**

```
SpendingRatio = V(t) / BudgetVelocity
```

| SpendingRatio | Status | Action |
|--------------|--------|--------|
| < 0.8 | Under-spending | Show positive reinforcement, suggest savings transfer |
| 0.8 - 1.0 | On track | Normal dashboard display |
| 1.0 - 1.2 | Caution | Yellow warning indicator on dashboard |
| > 1.2 | **Alert threshold** | Push notification: "You're spending 20%+ faster than your budget allows. At this rate, you'll exceed your budget by [date]." |

**Projected Overspend Date:**

When `V(t) > BudgetVelocity`:

```
DaysUntilBudgetExhausted = RemainingBudget / V(t)
OverspendDate = today + DaysUntilBudgetExhausted
```

This date is prominently displayed on the dashboard when the user is trending over budget.

**Smoothing:**

To avoid noisy alerts from single large purchases, the velocity uses an exponentially weighted moving average (EWMA):

```
V_smooth(t) = α × V(t) + (1 - α) × V_smooth(t-1)
```

Where `α = 0.3` — giving recent spending more weight while dampening one-off spikes.

---

### 5.4 Burn Rate

```
BurnRate = (CurrentSpending / ElapsedDays) × TotalDays / TotalBudget
```

| Variable | Definition |
|----------|-----------|
| `CurrentSpending` | Total amount spent so far this budget period (month) |
| `ElapsedDays` | Number of days elapsed in the current budget period |
| `TotalDays` | Total days in the budget period (28-31 for monthly) |
| `TotalBudget` | User's set budget for this period |

**Interpretation:**
- `BurnRate = 1.0` means the user is exactly on pace to spend their entire budget.
- `BurnRate > 1.0` means on track to **exceed** the budget.
- `BurnRate < 1.0` means on track to come in **under** budget.

**Color Coding System:**

| BurnRate Range | Color | Hex Code | Label |
|---------------|-------|----------|-------|
| < 0.80 | Green | `#22C55E` | Excellent |
| 0.80 - 1.00 | Yellow | `#FACC15` | On Track |
| 1.00 - 1.20 | Orange | `#F97316` | Caution |
| > 1.20 | Red | `#EF4444` | Over Budget |

The BurnRate is displayed as a circular gauge on the main dashboard, with the needle and arc colored according to the ranges above. A subtle pulsing animation activates when the rate enters the orange or red zone.

**Per-Category BurnRate:**

The system also computes BurnRate for each spending category independently, allowing users to see which categories are driving overspending:

```
BurnRate_category = (CurrentSpending_category / ElapsedDays) × TotalDays / Budget_category
```

---

### 5.5 Risk/Volatility Score (Coefficient of Variation)

```
CV_category = σ(daily_spend_category) / μ(daily_spend_category)
```

| Variable | Definition |
|----------|-----------|
| `σ(daily_spend_category)` | Standard deviation of daily spending in a specific category over the last 30 days |
| `μ(daily_spend_category)` | Mean daily spending in that category over the same 30-day window |

**Interpretation:**

| CV Range | Volatility Level | Prediction Strategy |
|----------|-----------------|---------------------|
| 0.0 - 0.3 | Low | Tight prediction intervals (mean ± 10%) |
| 0.3 - 0.7 | Moderate | Standard prediction intervals (mean ± 25%) |
| 0.7 - 1.2 | High | Wide prediction intervals (mean ± 50%) |
| > 1.2 | Very High | Flag as unpredictable; use median instead of mean; alert user |

**Usage in Predictions:**

The CV directly influences the confidence band width on the predictive budget chart:

```
PredictionInterval_category = μ_category ± z × σ_category
```

Where `z = 1.96` for a 95% confidence interval. Categories with high CV get visually wider bands on the spending forecast chart, communicating uncertainty to the user honestly.

**Dashboard Display:**

Each spending category card shows a small volatility indicator:
- Steady bar icon for low CV
- Wavy bar icon for moderate CV
- Zigzag bar icon for high/very high CV

---

### 5.6 Calendar Correlation Index (Novel Metric)

This is a **FutureSpend original metric** and a key differentiator for the product.

```
CCI = Σ(predicted_events_with_actual_spend) / Σ(total_predicted_events) × accuracy_weight
```

```
accuracy_weight = 1 - |predicted_amount - actual_amount| / max(predicted_amount, actual_amount)
```

**Component Breakdown:**

| Component | Definition |
|-----------|-----------|
| `predicted_events_with_actual_spend` | Count of calendar events where the system predicted a spend AND the user actually spent money within ±2 hours of the event time |
| `total_predicted_events` | Total count of calendar events for which the system made a spend prediction |
| `accuracy_weight` | A penalty factor from 0.0 to 1.0 that reduces the CCI when the predicted amount differs significantly from the actual amount |

**CCI Scoring:**

| CCI Range | Interpretation |
|-----------|---------------|
| 0.8 - 1.0 | Excellent — calendar is a strong spending predictor for this user |
| 0.6 - 0.8 | Good — calendar captures most spending triggers |
| 0.4 - 0.6 | Moderate — some spending is calendar-driven, some is spontaneous |
| 0.2 - 0.4 | Weak — user's spending is mostly unrelated to calendar events |
| 0.0 - 0.2 | Poor — calendar data is not predictive; rely on other signals |

**Adaptive Weighting:**

The CCI feeds back into the Predictive Budget Formula. When a user's CCI is high, the system increases the weight of calendar-derived predictions. When CCI is low, the system shifts to relying more on recurring transaction patterns and historical averages:

```
calendar_weight = min(0.6, CCI × 0.7)
historical_weight = 1.0 - calendar_weight
```

**Per-Category CCI:**

The system also tracks CCI by category — for example, a user's CCI for "Social" events might be 0.85 (they always spend when meeting friends) while their CCI for "Work" events might be 0.3 (work meetings rarely trigger spending).

**Example:**

Over the past month, FutureSpend predicted spending for 20 calendar events. Of those:
- 15 events had actual associated spending (hit rate = 15/20 = 0.75)
- Average accuracy_weight across those 15 events = 0.82

```
CCI = 0.75 × 0.82 = 0.615
```

Interpretation: "Good" — the calendar is a reasonably strong predictor for this user.

---

### 5.7 Savings Efficiency Score

```
η = (ActualSaved / PredictedSaveable) × 100
```

| Variable | Definition |
|----------|-----------|
| `ActualSaved` | The amount the user actually saved (transferred to savings, or unspent budget that was swept) |
| `PredictedSaveable` | The total predicted spend minus actual spend, summed across all events and categories where `actual < predicted` |

**Only positive differences count:**

```
PredictedSaveable = Σ max(0, PredictedAmount_i - ActualAmount_i)   for all events i
```

This means the metric only considers situations where the user spent *less* than predicted. Overspending on other events is tracked separately by BurnRate.

**Interpretation:**

| η Range | Meaning |
|---------|---------|
| 80-100% | The user is capturing nearly all potential savings |
| 50-80% | Good savings behavior, room to optimize |
| 20-50% | Savings opportunities are being missed |
| < 20% | User is not acting on savings opportunities; increase nudge frequency |

**Nudge Logic:**

When `η < 50%`, the system generates a weekly insight:
> "Last week, you spent $42 less than expected on dining — but only $8 was saved. Turn on Auto-Save to capture the difference automatically!"

---

### 5.8 Financial Health Score (Composite)

```
HealthScore = w1 × BudgetAdherence + w2 × SavingsRate + w3 × SpendingStability + w4 × CalendarCorrelation + w5 × StreakBonus
```

**Weight Distribution:**

| Weight | Component | Range (0-100) | Description |
|--------|-----------|---------------|-------------|
| `w1 = 0.30` | BudgetAdherence | 0-100 | 100 if under budget, scaled down linearly as overspend increases. `score = max(0, 100 - (overspend_pct × 2))` |
| `w2 = 0.25` | SavingsRate | 0-100 | `min(100, (monthly_saved / monthly_income) × 500)` — targets 20% savings rate as "perfect" |
| `w3 = 0.20` | SpendingStability | 0-100 | `max(0, 100 - (avg_CV_across_categories × 100))` — lower volatility = higher score |
| `w4 = 0.15` | CalendarCorrelation | 0-100 | `CCI × 100` — rewards users whose spending is predictable via calendar |
| `w5 = 0.10` | StreakBonus | 0-100 | `min(100, current_streak_days × 3.33)` — 30-day streak = full marks |

**Grade Mapping:**

| Score Range | Grade | Dashboard Color | Emoji-Free Label |
|-------------|-------|----------------|------------------|
| 90 - 100 | A+ | `#22C55E` (bright green) | Outstanding |
| 80 - 89 | A | `#4ADE80` (green) | Excellent |
| 70 - 79 | B | `#86EFAC` (light green) | Good |
| 60 - 69 | C | `#FACC15` (yellow) | Fair |
| 50 - 59 | D | `#F97316` (orange) | Needs Improvement |
| 0 - 49 | F | `#EF4444` (red) | At Risk |

**Display:**

The Health Score is displayed as a large radial progress ring on the dashboard home screen, with the letter grade centered inside. Below the ring, a row of five small progress bars shows the breakdown by component, so users can see which areas to improve.

**Weekly Trend:**

```
HealthTrend = HealthScore(this_week) - HealthScore(last_week)
```

A positive trend shows an upward arrow; negative shows downward. The trend value is displayed next to the score.

---

### 5.9 Smart Savings Rules ("Save the Difference")

```
AutoSave(event) = max(0, PredictedAmount - ActualAmount) × savings_rate
```

| Variable | Definition | Default |
|----------|-----------|---------|
| `PredictedAmount` | The system's predicted spend for the event | From Predictive Budget Formula |
| `ActualAmount` | The actual matched transaction amount | From Plaid transaction data |
| `savings_rate` | User-configurable percentage of the difference to auto-save | 0.5 (50%) |

**Configurable Range:** `savings_rate` can be set from `0.1` (save 10% of the difference) to `1.0` (save 100% of the difference).

**Matching Logic:**

After each calendar event concludes, the system:
1. Looks for transactions within ±2 hours of the event time window.
2. Matches transactions by location proximity (if available) and category.
3. Sums matched transactions as `ActualAmount`.
4. If `ActualAmount < PredictedAmount`, calculates the auto-save amount.
5. Queues a transfer to the user's linked savings account (or simply logs it if auto-transfer is not enabled).

**Example:**

FutureSpend predicted a "Birthday dinner" would cost $80 based on historical restaurant spending. The user actually spent $55.

```
AutoSave = max(0, $80 - $55) × 0.5 = $25 × 0.5 = $12.50
```

The user sees a notification: "You spent $25 less than expected on dinner! We saved $12.50 for you."

**Daily Sweep:**

At end-of-day, the system also calculates a daily-level auto-save:

```
DailySweep = max(0, DailyBudget - DailyActualSpend) × savings_rate
```

Users can enable or disable daily sweep independently of event-level auto-save.

**Monthly Cap:**

To prevent over-saving (which could cause cash flow issues), auto-saves are capped:

```
MaxAutoSave(month) = MonthlyIncome × 0.15
```

Once the cap is reached, auto-saves pause for the remainder of the month and the user is notified.

---

### 5.10 Metrics Computation Schedule

| Metric | Computation Frequency | Latency Target |
|--------|----------------------|----------------|
| Spending Velocity | Every new transaction (event-driven) | < 200ms |
| Burn Rate | Every new transaction + hourly refresh | < 100ms |
| Predictive Budget | On calendar sync + daily recalculation | < 2s |
| CV / Risk Score | Daily at midnight | < 5s |
| CCI | Weekly (Sunday night batch) | < 30s |
| Health Score | Daily at midnight + on-demand | < 1s |
| Savings Projections | On demand (user opens projections screen) | < 500ms |
| Auto-Save Calculations | Event-driven (post-event match) | < 1s |

---

## 6. Calendar Integration System

The Calendar Integration System is the feature that makes FutureSpend unique among personal finance apps. By connecting a user's calendar, the system can anticipate future spending before it happens and proactively help users plan.

---

### 6.1 Google Calendar OAuth Flow

**OAuth 2.0 Authorization Code Flow:**

| Parameter | Value |
|-----------|-------|
| Authorization Endpoint | `https://accounts.google.com/o/oauth2/v2/auth` |
| Token Endpoint | `https://oauth2.googleapis.com/token` |
| Scopes | `https://www.googleapis.com/auth/calendar.readonly`, `https://www.googleapis.com/auth/calendar.events.readonly` |
| Response Type | `code` |
| Access Type | `offline` (to receive a refresh token) |
| Prompt | `consent` (force consent screen to ensure refresh token is issued) |

**Step-by-Step Flow Diagram (ASCII):**

```
┌──────────────┐     1. User taps "Connect Calendar"     ┌───────────────────┐
│              │ ──────────────────────────────────────── │                   │
│  FutureSpend │                                          │   Google OAuth    │
│  Mobile App  │     2. Redirect to Google consent page   │   Consent Screen  │
│              │ ──────────────────────────────────────▶  │                   │
└──────────────┘                                          └───────────────────┘
       ▲                                                          │
       │                                                          │
       │     3. User grants permission                            │
       │        Google redirects with authorization code           │
       │◀─────────────────────────────────────────────────────────┘
       │
       │     4. App sends auth code to FutureSpend backend
       ▼
┌──────────────┐     5. Backend exchanges code for tokens ┌───────────────────┐
│  FutureSpend │ ──────────────────────────────────────▶  │  Google Token API  │
│   Backend    │                                          │                   │
│              │     6. Receives access_token +            │                   │
│              │        refresh_token                      │                   │
│              │ ◀──────────────────────────────────────── │                   │
└──────────────┘                                          └───────────────────┘
       │
       │     7. Store encrypted tokens in database
       │     8. Fetch calendar events using access_token
       │     9. Begin event processing pipeline
       ▼
┌──────────────┐
│  Calendar    │
│  Events DB   │
└──────────────┘
```

**Token Refresh Handling:**

- Access tokens expire after 1 hour.
- Before each API call, check if the token expires within the next 5 minutes.
- If expiring, use the stored `refresh_token` to obtain a new `access_token`.
- If the refresh token is revoked (user revokes access in Google settings), mark the calendar connection as "disconnected" and prompt re-authorization.

```typescript
async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await db.getCalendarTokens(userId);

  if (tokens.expires_at > Date.now() + 5 * 60 * 1000) {
    return tokens.access_token;
  }

  // Token is expiring — refresh it
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const newTokens = await response.json();
  await db.updateCalendarTokens(userId, {
    access_token: newTokens.access_token,
    expires_at: Date.now() + newTokens.expires_in * 1000,
  });

  return newTokens.access_token;
}
```

**Error Handling:**

| Error | Action |
|-------|--------|
| `invalid_grant` (refresh token revoked) | Mark connection as disconnected, notify user, prompt re-auth |
| `rate_limit_exceeded` | Exponential backoff: 1s, 2s, 4s, 8s, max 60s |
| `not_found` (calendar deleted) | Remove calendar from sync, notify user |
| Network timeout | Retry up to 3 times with 2s delay |

---

### 6.2 Multi-Calendar Merging Algorithm

Users often have multiple calendars (work, personal, shared family calendar, etc.). The merging algorithm combines events from all connected sources into a single unified timeline.

**Step 1: Fetch Events from All Connected Calendars**

```typescript
async function fetchAllEvents(userId: string, startDate: Date, endDate: Date): Promise<RawEvent[]> {
  const calendars = await db.getConnectedCalendars(userId);
  const eventPromises = calendars.map(cal => fetchCalendarEvents(cal, startDate, endDate));
  const eventArrays = await Promise.all(eventPromises);
  return eventArrays.flat();
}
```

**Step 2: Deduplication by Fuzzy Matching**

Events are considered duplicates if they match on both title similarity AND time proximity:

```
isDuplicate(eventA, eventB) =
  titleSimilarity(eventA.title, eventB.title) > 0.85   // Levenshtein-based
  AND |eventA.start_time - eventB.start_time| < 30 minutes
```

Title similarity uses normalized Levenshtein distance:

```
titleSimilarity(a, b) = 1 - (levenshteinDistance(lower(a), lower(b)) / max(len(a), len(b)))
```

**Step 3: Priority Ordering for Conflict Resolution**

When duplicates are detected, the system keeps the event from the highest-priority source:

| Priority | Source | Rationale |
|----------|--------|-----------|
| 1 (highest) | Manual entries (user-created in FutureSpend) | User explicitly set the cost/details |
| 2 | Work calendar | Usually most accurate for time/location |
| 3 | Personal calendar | Primary personal source |
| 4 | Shared/family calendars | May contain events not relevant to this user |
| 5 (lowest) | iCal imports | Static snapshots, may be outdated |

**Step 4: Conflict Resolution Rules**

| Scenario | Resolution |
|----------|-----------|
| Same event, different times across calendars | Use highest-priority source's time |
| Same event, one has location and other does not | Merge: keep the version with location data |
| Same event, different descriptions | Concatenate descriptions with source labels |
| Overlapping events from different calendars | Keep both (they are genuinely different events) |
| Recurring event vs. single instance edit | Single instance edit takes precedence for that occurrence |

**Step 5: Unified Event Schema**

```json
{
  "event_id": "uuid-v4",
  "user_id": "uuid-v4",
  "source": "google_calendar | apple_calendar | manual | ical_import",
  "source_event_id": "original-calendar-event-id",
  "calendar_name": "Work",
  "title": "Team Lunch at Nuba",
  "description": "Monthly team lunch — 8 people expected",
  "start_time": "2026-03-05T12:00:00-08:00",
  "end_time": "2026-03-05T13:30:00-08:00",
  "is_all_day": false,
  "location": {
    "name": "Nuba Restaurant",
    "address": "207 W Hastings St, Vancouver, BC",
    "latitude": 49.2827,
    "longitude": -123.1067
  },
  "attendees": [
    { "name": "Alex Kim", "email": "alex@company.com", "response": "accepted" }
  ],
  "attendee_count": 8,
  "recurrence_rule": null,
  "category": "social",
  "predicted_spend": {
    "amount": 35.00,
    "currency": "CAD",
    "confidence": 0.78,
    "basis": "historical_average"
  },
  "actual_spend": null,
  "is_free_event": false,
  "priority": 2,
  "created_at": "2026-02-28T10:00:00Z",
  "updated_at": "2026-02-28T10:00:00Z"
}
```

---

### 6.3 Event Categorization Taxonomy

The system automatically categorizes calendar events based on keyword matching, location data, time-of-day heuristics, and attendee information.

| Category | Keywords / Signals | Example Events | Typical Spend Range (CAD) |
|----------|-------------------|----------------|--------------------------|
| **Work** | "meeting", "standup", "sprint", "review", "1:1", "onboarding", "interview", office locations, work calendar source | "Sprint Planning", "1:1 with Manager", "Client Presentation" | $0 - $15 (coffee/lunch nearby) |
| **Social** | "dinner", "drinks", "party", "birthday", "hangout", "brunch", "happy hour", "catch up", 2+ attendees from personal contacts | "Dinner with Sarah", "Jake's Birthday", "Friday Drinks" | $20 - $80 |
| **Health/Fitness** | "gym", "yoga", "run", "CrossFit", "physiotherapy", "dentist", "doctor", "clinic", "therapy", gym/clinic locations | "Morning Yoga", "Dentist Appointment", "CrossFit WOD" | $0 - $30 (class fees, supplements) |
| **Personal** | "haircut", "barber", "nails", "spa", "shopping", "errands", "pickup", "appointment" | "Haircut at Barber & Co", "Car Service Appointment" | $15 - $100 |
| **Family** | "family dinner", "kids", "school", "recital", "soccer practice", "playdate", family member names in attendees | "Soccer Game (Liam)", "Family Dinner at Mom's", "School Concert" | $0 - $60 |
| **Education** | "class", "lecture", "workshop", "tutorial", "study group", "exam", "lab", university locations | "CMPT 372 Lecture", "Study Group — Library", "AWS Workshop" | $0 - $25 (textbooks, printing) |
| **Entertainment** | "movie", "concert", "show", "game", "festival", "museum", "gallery", "theatre", entertainment venue locations | "Canucks Game", "Movie Night", "Jazz Festival" | $25 - $150 |
| **Travel** | "flight", "hotel", "airbnb", "road trip", "airport", "train", "bus", all-day events with distant locations | "Flight to Toronto", "Weekend in Whistler", "Road Trip to Portland" | $100 - $500+ |

**Categorization Algorithm:**

```
1. Check for exact keyword matches in title (case-insensitive)
2. If no keyword match, check location against known venue categories
3. If still unmatched, use time-of-day heuristic:
   - 6am-9am weekday + no attendees → Personal/Health
   - 9am-5pm weekday + work calendar → Work
   - 6pm-10pm + 2+ attendees → Social
   - Weekend + all-day → Entertainment/Travel
4. If still unmatched, classify as "Personal" (default)
5. Allow user to manually override any categorization (overrides are learned)
```

**Learning from Overrides:**

When a user manually re-categorizes an event, the system stores the correction and uses it to improve future categorizations:

```
UserOverride: {
  pattern: "standup comedy",      // was incorrectly matched to "Work" via "standup"
  original_category: "work",
  corrected_category: "entertainment",
  user_id: "uuid"
}
```

Future events matching "standup comedy" for this user will be categorized as "Entertainment."

---

### 6.4 Synthetic Data Generator (for Demo)

For the hackathon demo, the app needs realistic calendar data without requiring real user calendars. The synthetic data generator creates 3 months of plausible event data.

**Generator Function Signature:**

```typescript
interface SyntheticEventConfig {
  startDate: Date;             // e.g., 2025-12-01
  endDate: Date;               // e.g., 2026-02-28
  persona: 'student' | 'professional' | 'parent';
  density: 'light' | 'moderate' | 'busy';  // events per week: 5, 10, 18
  includeLocation: boolean;
  includeAttendees: boolean;
}

interface GeneratedEvent {
  title: string;
  start_time: string;          // ISO 8601
  end_time: string;
  category: EventCategory;
  location?: Location;
  attendees?: Attendee[];
  attendee_count: number;
  is_recurring: boolean;
  recurrence_rule?: string;    // RRULE format
  predicted_spend: number;
  actual_spend: number;        // for historical events; null for future
}

function generateSyntheticCalendar(config: SyntheticEventConfig): GeneratedEvent[];
```

**Recurring Event Templates (Weekly):**

| Event | Day | Time | Category | Cost |
|-------|-----|------|----------|------|
| "Morning Run" | Mon, Wed, Fri | 06:30-07:15 | Health/Fitness | $0 |
| "Team Standup" | Mon-Fri | 09:00-09:15 | Work | $0 |
| "Gym Session" | Tue, Thu | 17:30-18:30 | Health/Fitness | $0 |
| "Grocery Shopping" | Saturday | 10:00-11:00 | Personal | $60-90 |
| "Meal Prep Sunday" | Sunday | 14:00-16:00 | Personal | $0 |
| "Coffee with Coworkers" | Wednesday | 15:00-15:30 | Social | $5-7 |

**One-Off Event Pool (Randomly Sampled):**

| Event | Category | Cost Range | Frequency |
|-------|----------|------------|-----------|
| "Dinner at [Restaurant]" | Social | $30-80 | 2-4x/month |
| "Birthday Party — [Name]" | Social | $20-50 | 1x/month |
| "Dentist Appointment" | Health | $0-150 | 1x/3 months |
| "Concert — [Artist]" | Entertainment | $40-120 | 1x/2 months |
| "Weekend Trip to [City]" | Travel | $200-500 | 1x/2 months |
| "Haircut" | Personal | $30-50 | 1x/month |
| "Date Night" | Social | $50-100 | 2x/month |
| "Workshop: [Topic]" | Education | $0-50 | 1x/month |
| "Doctor's Visit" | Health | $0-30 | 1x/2 months |
| "Hockey Game" | Entertainment | $50-100 | 1x/month |

**Location Data:**

The generator uses a pool of real Vancouver-area locations:

```typescript
const locationPool = {
  restaurants: [
    { name: "Nuba", address: "207 W Hastings St", lat: 49.2827, lng: -123.1067 },
    { name: "Japadog", address: "530 Robson St", lat: 49.2812, lng: -123.1198 },
    { name: "Miku", address: "200-70 Burrard St", lat: 49.2870, lng: -123.1133 },
  ],
  gyms: [
    { name: "Anytime Fitness SFU", address: "8900 Nelson Way", lat: 49.2781, lng: -122.9199 },
  ],
  entertainment: [
    { name: "Rogers Arena", address: "800 Griffiths Way", lat: 49.2778, lng: -123.1089 },
    { name: "Scotiabank Theatre", address: "900 Burrard St", lat: 49.2814, lng: -123.1254 },
  ],
};
```

**Output Format:**

The generator outputs a JSON array of `GeneratedEvent` objects. For historical dates (before today), `actual_spend` is populated with a value that deviates from `predicted_spend` by ±20% (with occasional outliers of ±50%) to simulate realistic prediction accuracy.

---

### 6.5 iCal (.ics) Parser Fallback

For users who cannot or prefer not to use Google OAuth, FutureSpend supports importing calendar data via `.ics` file upload.

**Supported VEVENT Properties:**

| iCal Property | Maps To | Required | Example |
|--------------|---------|----------|---------|
| `SUMMARY` | `title` | Yes | `SUMMARY:Team Lunch at Nuba` |
| `DTSTART` | `start_time` | Yes | `DTSTART:20260305T120000` |
| `DTEND` | `end_time` | No (default: start + 1 hour) | `DTEND:20260305T133000` |
| `LOCATION` | `location.name` | No | `LOCATION:207 W Hastings St` |
| `DESCRIPTION` | `description` | No | `DESCRIPTION:Monthly team lunch` |
| `RRULE` | `recurrence_rule` | No | `RRULE:FREQ=WEEKLY;BYDAY=TU,TH` |
| `ATTENDEE` | `attendees[]` | No | `ATTENDEE;CN=Alex:mailto:alex@co.com` |
| `UID` | `source_event_id` | Yes | `UID:abc123@google.com` |
| `STATUS` | (filter) | No | Skip events with `STATUS:CANCELLED` |

**Parser Implementation:**

```typescript
import ICAL from 'ical.js';

interface ParsedICalEvent {
  uid: string;
  title: string;
  start_time: Date;
  end_time: Date;
  location?: string;
  description?: string;
  recurrence_rule?: string;
  attendees: string[];
}

function parseICSFile(icsContent: string): ParsedICalEvent[] {
  const jcalData = ICAL.parse(icsContent);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');

  return vevents
    .map(vevent => {
      const event = new ICAL.Event(vevent);

      if (event.status === 'CANCELLED') return null;

      return {
        uid: event.uid,
        title: event.summary || 'Untitled Event',
        start_time: event.startDate.toJSDate(),
        end_time: event.endDate?.toJSDate() || new Date(event.startDate.toJSDate().getTime() + 3600000),
        location: vevent.getFirstPropertyValue('location') || undefined,
        description: event.description || undefined,
        recurrence_rule: vevent.getFirstPropertyValue('rrule')?.toString() || undefined,
        attendees: vevent.getAllProperties('attendee').map(a => a.getParameter('cn') || a.getFirstValue()),
      };
    })
    .filter(Boolean) as ParsedICalEvent[];
}
```

**Mapping to Unified Event Schema:**

After parsing, each `ParsedICalEvent` is transformed into the unified schema defined in Section 6.2:

1. `uid` is stored as `source_event_id`
2. `source` is set to `"ical_import"`
3. Location string is geocoded via a geocoding API to populate `latitude`/`longitude`
4. The event is run through the categorization taxonomy (Section 6.3)
5. `predicted_spend` is computed using category averages

**Recurring Event Expansion:**

For events with `RRULE`, the parser expands recurrences within the target date range:

```typescript
function expandRecurrences(vevent: ICAL.Component, rangeStart: Date, rangeEnd: Date): ParsedICalEvent[] {
  const event = new ICAL.Event(vevent);
  const iterator = event.iterator();
  const instances: ParsedICalEvent[] = [];

  let next = iterator.next();
  while (next && next.toJSDate() <= rangeEnd) {
    if (next.toJSDate() >= rangeStart) {
      instances.push({
        ...baseEvent,
        start_time: next.toJSDate(),
        end_time: new Date(next.toJSDate().getTime() + event.duration.toSeconds() * 1000),
      });
    }
    next = iterator.next();
  }

  return instances;
}
```

**File Upload UX:**

1. User taps "Import Calendar File" on the calendar connection screen.
2. Native file picker opens, filtered to `.ics` files.
3. File is read client-side and parsed.
4. Preview screen shows the first 10 events with detected categories.
5. User confirms import.
6. Events are sent to the backend and stored.
7. A banner reminds the user: "Imported calendars don't auto-update. Re-import to refresh."

---

## 7. Plaid Financial Data Integration

Plaid provides the real-time financial data backbone for FutureSpend. It connects to the user's bank accounts, credit cards, and other financial institutions to pull transaction history, balances, and recurring payment data.

---

### 7.1 Account Linking Flow

**Plaid Link Integration in React Native:**

FutureSpend uses `react-native-plaid-link-sdk` to embed Plaid Link directly into the app.

```typescript
import { PlaidLink, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk';

// Backend generates a link_token first
const linkToken = await api.createLinkToken(userId);

<PlaidLink
  tokenConfig={{
    token: linkToken,
    noLoadingState: false,
  }}
  onSuccess={(success: LinkSuccess) => {
    // Exchange public_token for access_token on the backend
    api.exchangePublicToken(success.publicToken, success.metadata);
  }}
  onExit={(exit: LinkExit) => {
    if (exit.error) {
      analytics.track('plaid_link_error', { error: exit.error });
    }
  }}
>
  <ConnectBankButton />
</PlaidLink>
```

**Sandbox Mode Configuration:**

For the hackathon demo, Plaid runs in sandbox mode:

```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
```

**Test Credentials (Plaid Sandbox):**

| Field | Value |
|-------|-------|
| Username | `user_good` |
| Password | `pass_good` |
| Institution | First Platypus Bank |
| MFA | Not required in sandbox |

**Supported Account Types:**

| Account Type | Plaid Type | Use in FutureSpend |
|-------------|-----------|-------------------|
| Checking | `depository` / `checking` | Primary spending tracking, balance monitoring |
| Savings | `depository` / `savings` | Savings balance for projections, auto-save target |
| Credit Card | `credit` | Spending tracking, statement balance, credit utilization |

**Step-by-Step User Flow:**

```
1. User taps "Connect Bank Account" on the dashboard
2. App requests a link_token from the FutureSpend backend
3. Backend calls Plaid's /link/token/create with:
   - user.client_user_id
   - products: ['transactions']
   - country_codes: ['US', 'CA']
   - language: 'en'
4. Plaid Link opens in a webview/modal
5. User selects their bank (or "First Platypus Bank" in sandbox)
6. User enters credentials
7. User selects which accounts to share
8. Plaid returns a public_token to the app
9. App sends public_token to the FutureSpend backend
10. Backend calls /item/public_token/exchange to get:
    - access_token (stored securely, encrypted at rest)
    - item_id (stored in user's account record)
11. Backend triggers initial transaction sync (Section 7.2)
12. User sees "Account Connected!" confirmation with account names and masked numbers
```

**Link Token Creation (Backend):**

```typescript
app.post('/api/create-link-token', async (req, res) => {
  const { userId } = req.body;

  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'FutureSpend',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us, CountryCode.Ca],
    language: 'en',
    // For sandbox, use sandbox redirect URI
    redirect_uri: process.env.PLAID_REDIRECT_URI,
  });

  res.json({ link_token: response.data.link_token });
});
```

---

### 7.2 Transaction Sync

**Initial Sync: Pull 90 Days of History**

On first connection, the system performs a full historical pull using the Plaid Transactions Sync API (`/transactions/sync`):

```typescript
async function initialTransactionSync(accessToken: string, userId: string) {
  let cursor: string | undefined = undefined;
  let hasMore = true;
  const allTransactions: Transaction[] = [];

  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: cursor,
      count: 500,
    });

    allTransactions.push(...response.data.added);
    cursor = response.data.next_cursor;
    hasMore = response.data.has_more;
  }

  // Store cursor for future incremental syncs
  await db.updateSyncCursor(userId, cursor);

  // Process and store transactions
  await processTransactions(userId, allTransactions);
}
```

**Ongoing: Webhook-Driven Incremental Sync**

After initial sync, Plaid sends webhooks when new transactions are available:

```typescript
// Webhook endpoint
app.post('/webhooks/plaid', async (req, res) => {
  const { webhook_type, webhook_code, item_id } = req.body;

  if (webhook_type === 'TRANSACTIONS') {
    switch (webhook_code) {
      case 'SYNC_UPDATES_AVAILABLE':
        // New transactions available — trigger incremental sync
        const userId = await db.getUserByItemId(item_id);
        await incrementalTransactionSync(userId);
        break;

      case 'INITIAL_UPDATE':
        // Initial transaction pull complete (for large histories)
        break;

      case 'HISTORICAL_UPDATE':
        // Older transactions now available
        break;
    }
  }

  res.sendStatus(200);
});
```

**Transaction Schema:**

```json
{
  "transaction_id": "plaid-txn-id",
  "user_id": "uuid-v4",
  "account_id": "plaid-account-id",
  "amount": 42.50,
  "currency": "CAD",
  "date": "2026-02-27",
  "datetime": "2026-02-27T19:32:00Z",
  "name": "NUBA RESTAURANT",
  "merchant_name": "Nuba",
  "pending": false,
  "plaid_category": ["Food and Drink", "Restaurants"],
  "plaid_category_id": "13005000",
  "futurespend_category": "social",
  "location": {
    "address": "207 W Hastings St",
    "city": "Vancouver",
    "region": "BC",
    "country": "CA",
    "lat": 49.2827,
    "lon": -123.1067
  },
  "payment_channel": "in store",
  "matched_event_id": "uuid-v4 | null",
  "created_at": "2026-02-28T01:00:00Z"
}
```

**Plaid Category to FutureSpend Category Mapping:**

| Plaid Category (Top Level) | Plaid Subcategory | FutureSpend Category |
|---------------------------|-------------------|---------------------|
| Food and Drink | Restaurants | Social |
| Food and Drink | Coffee Shop | Social |
| Food and Drink | Groceries | Personal |
| Travel | Airlines | Travel |
| Travel | Lodging | Travel |
| Travel | Car Rental | Travel |
| Transportation | Ride Share, Taxi | Personal |
| Transportation | Gas Stations | Personal |
| Recreation | Gyms and Fitness Centers | Health/Fitness |
| Healthcare | Doctor, Dentist | Health/Fitness |
| Healthcare | Pharmacy | Health/Fitness |
| Shops | Clothing | Personal |
| Shops | Electronics | Personal |
| Entertainment | Music, Movies, TV | Entertainment |
| Entertainment | Sporting Events | Entertainment |
| Transfer | Deposit, Withdrawal | (excluded) |
| Payment | Rent, Mortgage | Personal (recurring) |
| Payment | Insurance | Personal (recurring) |
| Service | Subscription | Personal (recurring) |
| Education | Tuition, Books | Education |

**Transaction-to-Event Matching:**

After processing each new transaction, the system attempts to match it to a calendar event:

```typescript
async function matchTransactionToEvent(transaction: Transaction, userId: string): Promise<string | null> {
  const events = await db.getEventsInTimeWindow(
    userId,
    new Date(transaction.datetime - 2 * HOUR),
    new Date(transaction.datetime + 2 * HOUR)
  );

  for (const event of events) {
    const categoryMatch = event.category === transaction.futurespend_category;
    const locationMatch = event.location && transaction.location
      ? haversineDistance(event.location, transaction.location) < 0.5  // km
      : false;

    if (categoryMatch || locationMatch) {
      await db.linkTransactionToEvent(transaction.transaction_id, event.event_id);
      await updateEventActualSpend(event.event_id, transaction.amount);
      return event.event_id;
    }
  }

  return null;  // No matching event found
}
```

---

### 7.3 Balance Monitoring

**Real-Time Balance Checks:**

```typescript
async function getAccountBalances(accessToken: string): Promise<AccountBalance[]> {
  const response = await plaidClient.accountsBalanceGet({
    access_token: accessToken,
  });

  return response.data.accounts.map(account => ({
    account_id: account.account_id,
    name: account.name,
    type: account.type,
    subtype: account.subtype,
    current_balance: account.balances.current,
    available_balance: account.balances.available,
    currency: account.balances.iso_currency_code,
    last_updated: new Date(),
  }));
}
```

**Available vs. Current Balance:**

| Balance Type | Definition | Use in FutureSpend |
|-------------|-----------|-------------------|
| `current` | Total balance including pending transactions | Displayed on dashboard as "Account Balance" |
| `available` | Balance minus pending transactions and holds | Used for low-balance alerts and budget calculations |

The distinction matters: a user might have $500 current balance but only $200 available after pending charges. FutureSpend uses `available` for all forward-looking calculations.

**Low Balance Alerts:**

```typescript
interface BalanceAlertConfig {
  threshold_type: 'fixed' | 'dynamic';
  fixed_threshold?: number;           // e.g., $100
  dynamic_days_of_runway?: number;    // e.g., alert if < 3 days of spending runway
}

async function checkBalanceAlerts(userId: string) {
  const balances = await getAccountBalances(accessToken);
  const config = await db.getAlertConfig(userId);

  for (const account of balances) {
    if (account.type !== 'depository') continue;

    let shouldAlert = false;
    let message = '';

    if (config.threshold_type === 'fixed') {
      if (account.available_balance < config.fixed_threshold) {
        shouldAlert = true;
        message = `Your ${account.name} balance is below $${config.fixed_threshold}. Available: $${account.available_balance}`;
      }
    } else {
      // Dynamic: based on spending velocity
      const dailySpend = await getSpendingVelocity(userId);
      const daysOfRunway = account.available_balance / dailySpend;

      if (daysOfRunway < config.dynamic_days_of_runway) {
        shouldAlert = true;
        message = `At your current spending rate, your ${account.name} will run out in ${Math.floor(daysOfRunway)} days.`;
      }
    }

    if (shouldAlert) {
      await sendPushNotification(userId, {
        title: 'Low Balance Alert',
        body: message,
        category: 'balance_alert',
      });
    }
  }
}
```

**Balance Check Schedule:**

- Every 4 hours for checking accounts
- Every 12 hours for savings accounts
- On-demand when user opens the dashboard
- After each transaction sync

---

### 7.4 Recurring Transaction Detection

The system automatically identifies recurring transactions (subscriptions, rent, utilities, loan payments) to improve spending predictions.

**Detection Algorithm:**

```typescript
interface RecurringTransaction {
  id: string;
  user_id: string;
  merchant_name: string;
  category: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  average_amount: number;
  amount_variance: number;          // standard deviation
  last_occurrence: Date;
  next_expected_date: Date;
  occurrences: number;              // total times seen
  confidence: number;               // 0.0 - 1.0
  is_confirmed: boolean;            // user manually confirmed
}

async function detectRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
  const transactions = await db.getTransactions(userId, { days: 90 });

  // Group by merchant name similarity
  const merchantGroups = groupByMerchant(transactions, similarityThreshold: 0.85);

  const recurring: RecurringTransaction[] = [];

  for (const [merchant, txns] of merchantGroups) {
    if (txns.length < 2) continue;

    // Check amount proximity (within ±10%)
    const amounts = txns.map(t => t.amount);
    const avgAmount = mean(amounts);
    const amountCV = standardDeviation(amounts) / avgAmount;

    if (amountCV > 0.15) continue;  // amounts too variable — not recurring

    // Check interval regularity
    const intervals = computeIntervals(txns);  // days between consecutive transactions
    const detectedFrequency = classifyFrequency(intervals);

    if (!detectedFrequency) continue;  // no regular pattern found

    // Compute confidence based on number of occurrences and regularity
    const intervalCV = standardDeviation(intervals) / mean(intervals);
    const confidence = Math.min(1.0, (txns.length / 5) * (1 - intervalCV));

    recurring.push({
      id: generateId(),
      user_id: userId,
      merchant_name: merchant,
      category: txns[0].futurespend_category,
      frequency: detectedFrequency,
      average_amount: avgAmount,
      amount_variance: standardDeviation(amounts),
      last_occurrence: txns[txns.length - 1].date,
      next_expected_date: computeNextDate(txns[txns.length - 1].date, detectedFrequency),
      occurrences: txns.length,
      confidence: confidence,
      is_confirmed: false,
    });
  }

  return recurring;
}
```

**Frequency Classification:**

| Interval Range (days) | Classified Frequency |
|-----------------------|---------------------|
| 5 - 9 | Weekly |
| 12 - 17 | Biweekly |
| 26 - 34 | Monthly |
| 85 - 100 | Quarterly |
| 350 - 380 | Annual |

**Merchant Name Similarity:**

Transaction merchant names from banks are often messy (e.g., "NETFLIX.COM/BILL", "Netflix Inc", "NETFLIX"). The system normalizes names before comparison:

```
1. Convert to lowercase
2. Remove common suffixes: "inc", "llc", "ltd", "corp", ".com"
3. Remove special characters: *, #, digits-only suffixes
4. Trim whitespace
5. Compare using Jaro-Winkler similarity (threshold: 0.85)
```

**User Confirmation Flow:**

Detected recurring transactions are surfaced to the user for confirmation:

```
"We noticed you pay Netflix ~$15.99 every month.
Is this a recurring subscription?"
[ Yes, it's recurring ]  [ No, ignore ]  [ Edit details ]
```

Confirmed transactions get `confidence = 1.0` and are never re-evaluated.

---

### 7.5 Sandbox Configuration

**Setting Up Plaid Sandbox for Hackathon Demo:**

**Step 1: Obtain Credentials**

1. Sign up at [dashboard.plaid.com](https://dashboard.plaid.com).
2. Navigate to Team Settings > Keys.
3. Copy the `client_id` and `sandbox` secret.

**Step 2: Environment Variables**

```env
PLAID_CLIENT_ID=<your_client_id>
PLAID_SECRET=<your_sandbox_secret>
PLAID_ENV=sandbox
PLAID_PRODUCTS=transactions
PLAID_COUNTRY_CODES=US,CA
PLAID_REDIRECT_URI=http://localhost:3000/oauth-callback
```

**Step 3: Plaid Client Initialization**

```typescript
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);
```

**Step 4: Test Institution Details**

| Property | Value |
|----------|-------|
| Institution Name | First Platypus Bank |
| Institution ID | `ins_109508` |
| Username | `user_good` |
| Password | `pass_good` |
| MFA Required | No (sandbox default) |
| Available Products | Transactions, Auth, Balance, Identity, Assets |

**Pre-Configured Test Accounts:**

| Account Name | Type | Subtype | Starting Balance |
|-------------|------|---------|-----------------|
| Plaid Checking | depository | checking | $110.00 |
| Plaid Saving | depository | savings | $210.00 |
| Plaid CD | depository | cd | $1,000.00 |
| Plaid Credit Card | credit | credit card | $410.00 (owed) |
| Plaid Money Market | depository | money market | $43,200.00 |

The sandbox provides pre-populated transaction history for these accounts, including a mix of recurring and one-off transactions across multiple categories.

**Switching from Sandbox to Development/Production:**

| Aspect | Sandbox | Development | Production |
|--------|---------|-------------|------------|
| Secret Key | Sandbox secret | Development secret | Production secret |
| Base Path | `PlaidEnvironments.sandbox` | `PlaidEnvironments.development` | `PlaidEnvironments.production` |
| Institutions | Test only (First Platypus Bank) | ~500 live institutions (100 items limit) | All institutions (unlimited) |
| Data | Simulated | Real user data | Real user data |
| Webhooks | Simulated (must trigger manually) | Real | Real |
| Cost | Free | Free (limited items) | Per-item pricing |
| Approval | None | None | Plaid review required |

**To switch environments:**

1. Update `PLAID_SECRET` to the target environment's secret.
2. Update `PLAID_ENV` to `development` or `production`.
3. Update `plaidConfig.basePath` accordingly.
4. For production: complete Plaid's application review process and compliance requirements.
5. Update webhook URLs to production endpoints.

**Sandbox Webhook Testing:**

In sandbox mode, webhooks must be manually triggered:

```typescript
// Trigger a sandbox webhook for testing
await plaidClient.sandboxItemFireWebhook({
  access_token: accessToken,
  webhook_code: 'SYNC_UPDATES_AVAILABLE',
});
```

---

## 8. Gamification System (Opal-Inspired)

The gamification system is inspired by **Opal Screen Time** — known for its beautiful gem-themed milestones, compelling streak mechanics, and community "Inner Circle" leaderboards. FutureSpend adapts these mechanics for personal finance, transforming budgeting from a chore into a rewarding daily habit.

**Design Philosophy:**
- **Intrinsic motivation first:** Gamification enhances the user's genuine desire to save money; it never manipulates or creates anxiety.
- **Progress visibility:** Every action contributes visibly to progress — no hidden mechanics.
- **Social without shame:** Leaderboards celebrate effort, not income level. All metrics are relative (percentages, streaks) not absolute ($$ amounts).
- **Visual delight:** Gem-themed badges with subtle shine animations, streak flame icons with particle effects, and smooth level-up transitions inspired by Opal's polished UI.

---

### 8.1 Streaks

Streaks are the core engagement loop. They reward consistency over perfection.

**Streak Types:**

| Streak | Condition | Reset Rule | Visual |
|--------|-----------|------------|--------|
| **Daily Check-In** | Open the app and review at least one spending summary screen | Resets if user does not open app for 24 hours (midnight to midnight, user's local time) | Flame icon with day counter |
| **Weekly Budget** | Stay within total weekly budget (spending <= budget) for 7 consecutive days | Resets on the first day the user exceeds their daily budget | Shield icon with week counter |
| **Savings Streak** | Save any amount of money every week (via auto-save or manual transfer to savings) | Resets if a full calendar week passes with $0 saved | Piggy bank icon with week counter |

**Streak Freeze:**

- Users earn **1 free streak freeze for every 30-day streak** they maintain.
- A streak freeze prevents the streak from resetting for one missed day/week.
- Additional streak freezes can be "purchased" with XP: **500 XP per freeze**.
- Maximum freezes held at once: 3.
- When a freeze is used, the streak counter shows a snowflake icon for that day instead of the normal flame.
- Freeze is consumed automatically on a missed day (no user action needed).

**Streak Milestones:**

At specific streak lengths, the flame icon upgrades visually:

| Streak Length | Flame Appearance | Animation |
|--------------|-----------------|-----------|
| 1-6 days | Small orange flame | Static |
| 7-13 days | Medium orange flame | Gentle flicker |
| 14-29 days | Large yellow-orange flame | Active flicker |
| 30-59 days | Blue flame | Pulsing glow |
| 60-89 days | Purple flame | Swirling particles |
| 90-179 days | White-hot flame with aura | Radiating light |
| 180-364 days | Prismatic flame (rainbow cycle) | Color-shifting particles |
| 365+ days | Diamond-encrusted eternal flame | Full particle system with sparkles |

**Streak Recovery Prompt:**

When a streak is about to reset (23 hours since last check-in), the system sends a push notification:

> "Your 17-day streak is about to end! Open FutureSpend in the next hour to keep it alive."

If the streak does reset:

> "Your 17-day streak ended. But you built the habit once — you can do it again. New streak starts now!"

---

### 8.2 Milestones / Badges (Gem-Themed like Opal)

Badges are permanent achievements displayed on the user's profile. They follow a gem/crystal theme inspired by Opal.

**Tier System:**

| Tier | Requirement | Visual Style | Border Color |
|------|-------------|-------------|-------------|
| Bronze | 7 days / first threshold | Rough, uncut stone | `#CD7F32` |
| Silver | 30 days / intermediate threshold | Polished, faceted gem | `#C0C0C0` |
| Gold | 90 days / advanced threshold | Brilliant-cut gem with glow | `#FFD700` |
| Diamond | 365 days / expert threshold | Flawless diamond with prismatic refraction | `#B9F2FF` |

**Full Badge Catalog:**

| # | Badge Name | Unlock Condition | Tier | Icon Description |
|---|-----------|-----------------|------|-----------------|
| 1 | **Invested** | Complete your first 7-day check-in streak | Bronze | Small amber crystal with a faint inner glow |
| 2 | **Steadfast** | Maintain a 7-day budget streak (stay under budget for a full week) | Bronze | Sturdy quartz pillar, slightly rough-cut |
| 3 | **Radiant** | Maintain a 30-day check-in streak | Silver | Polished topaz with warm golden light radiating outward |
| 4 | **Legendary** | Maintain a 90-day check-in streak | Gold | Brilliant ruby with deep crimson light and a gold setting |
| 5 | **Prismatic** | Maintain a 365-day check-in streak | Diamond | Perfect diamond refracting light into rainbow spectrum |
| 6 | **Budget Boss** | Stay under budget for 3 consecutive months | Gold | Emerald crown with intricate gold filigree |
| 7 | **Penny Pincher** | Accumulate $100+ in total savings through the app | Silver | Stack of copper coins transforming into a silver nugget |
| 8 | **Social Butterfly** | Complete 5 group/friend challenges | Silver | Opal butterfly with iridescent wings |
| 9 | **Fortune Teller** | Have 10 calendar-predicted spends confirmed within 20% accuracy | Gold | Crystal ball with swirling purple mist |
| 10 | **Early Bird** | Check your finances before 8:00 AM for 7 consecutive days | Bronze | Yellow citrine shaped like a sunrise |
| 11 | **Zero Hero** | Have a complete no-spend day (zero transactions) | Bronze | Clear quartz circle — perfectly empty, perfectly pure |
| 12 | **Challenge Champion** | Win 3 challenges (place 1st in your group) | Gold | Tournament sapphire trophy with platinum trim |
| 13 | **Data Driven** | Connect all data sources: bank account + calendar + savings account | Silver | Circuit-patterned opal — tech meets nature |
| 14 | **Consistent** | Log spending (via app check-in) for 30 consecutive days | Silver | Perfectly symmetrical amethyst with mirror-like facets |
| 15 | **Dedicated** | Maintain a 180-day (6 month) check-in streak | Gold | Heart-shaped garnet set in a gold pendant — deep commitment |
| 16 | **Thrift Lord** | Save $1,000+ cumulative through the app | Gold | Massive gold nugget with diamond inclusions |
| 17 | **Prediction Pro** | Achieve a CCI score of 0.8+ for 4 consecutive weeks | Gold | All-seeing eye carved from tiger's eye stone |
| 18 | **Night Owl** | Review finances after 10 PM for 7 consecutive days | Bronze | Dark onyx owl with glowing moonstone eyes |
| 19 | **Versatile** | Complete at least one challenge from 5 different categories | Silver | Multi-colored tourmaline — many facets, many colors |
| 20 | **Eternal** | Maintain a 365-day streak of any type | Diamond | Flawless alexandrite that shifts color — changes but never breaks |

**Badge Award Animation:**

When a user unlocks a badge:
1. Screen dims slightly with a dark overlay.
2. The gem materializes from particles at the center of the screen.
3. Light rays emanate from the gem as it rotates.
4. The badge name and description fade in below.
5. "Share" and "Dismiss" buttons appear after 2 seconds.
6. The badge is permanently added to the user's profile badge case.

**Badge Case Display:**

The user's profile shows a grid of all badges — unlocked badges are vivid and full-color; locked badges are shown as dark silhouettes with a "?" overlay and a hint about the unlock condition (e.g., "Maintain a 30-day streak to unlock").

---

### 8.3 Challenges (Community Savings Challenges)

Challenges are time-bound, goal-oriented activities that users can undertake alone or with friends. They are the primary social feature of FutureSpend.

**Challenge Template System:**

Each challenge is defined by a template:

```typescript
interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  rules: string[];
  duration_days: number;
  goal_type: 'spending_limit' | 'savings_target' | 'streak' | 'category_reduction';
  goal_metric: string;                // e.g., "dining_spend < $0" or "saved >= $500"
  goal_value: number;
  progress_unit: string;              // e.g., "dollars saved", "days completed"
  min_participants: number;
  max_participants: number;
  difficulty: 'easy' | 'medium' | 'hard';
  reward_xp: number;
  badge_id?: string;                  // optional badge awarded on completion
  shareable_card_template: string;    // template ID for the completion share card
  icon: string;
  color: string;
}
```

**Challenge Catalog:**

| # | Challenge Name | Duration | Goal | Difficulty | Reward XP | Description |
|---|---------------|----------|------|------------|-----------|-------------|
| 1 | **No Eating Out Week** | 7 days | $0 spent on restaurants/takeout | Medium | 250 XP | Cook every meal for a full week. Groceries are allowed — restaurants, takeout, and food delivery are not. |
| 2 | **Coffee Savings Challenge** | 14 days | Skip coffee shops; save the difference | Easy | 150 XP | Make coffee at home for 2 weeks. Every day you skip the coffee shop, the estimated savings ($5/day default) are tracked. |
| 3 | **$500 Monthly Savings Sprint** | 30 days | Save $500 total | Hard | 500 XP | Aggressively save $500 in one month through reduced spending, auto-save, and manual transfers. |
| 4 | **Transportation Thrift** | 7 days | $0 on rideshare/taxi; walk, bike, or transit only | Medium | 200 XP | No Uber, Lyft, or taxis for a week. Public transit, biking, and walking only. Gas purchases are exempt. |
| 5 | **Subscription Audit** | 3 days | Review and cancel at least 1 unused subscription | Easy | 100 XP | Go through your recurring transactions, identify subscriptions, and cancel at least one you're not actively using. |
| 6 | **Zero Dollar Day Challenge** | 7 days | Have 3 zero-spend days in one week | Medium | 200 XP | Three days this week with absolutely no spending. Plan meals ahead and find free activities. |
| 7 | **Pack Lunch Week** | 5 days | Pack lunch Mon-Fri; $0 on workday lunch purchases | Medium | 200 XP | Bring lunch from home every workday. Estimated savings of $12-18/day tracked automatically. |
| 8 | **Entertainment Budget Challenge** | 14 days | Stay under $50 total entertainment spending | Medium | 250 XP | Movies, concerts, games, streaming — keep your total entertainment spend under $50 for two weeks. Find free alternatives! |
| 9 | **Savings Snowball** | 7 days | Save increasing amounts each day ($1, $2, $3...$7 = $28 total) | Easy | 150 XP | Start small and build momentum. Day 1 save $1, Day 2 save $2, and so on. Total: $28 in one week. |
| 10 | **Cash Only Week** | 7 days | Use only cash for discretionary purchases | Hard | 300 XP | Withdraw a set budget in cash and use only cash for the week. Card purchases (for bills/subscriptions) are exempt. Track cash spending manually. |

**Challenge Entry Flow:**

```
1. User browses challenge catalog (or receives invite from friend)
2. User taps "Join Challenge"
3. If group challenge: select friends to invite (or join existing group)
4. Review rules and confirm
5. Challenge starts at midnight on the selected start date
6. Daily progress notifications:
   - "Day 3 of No Eating Out Week — you're on track! 🔥"
   - "You spent $12 at Starbucks — Coffee Savings Challenge progress affected."
7. At challenge end:
   - If completed: XP awarded, badge (if applicable), completion card generated
   - If failed: "You made it 5 out of 7 days — that's still progress! Try again?"
```

**Progress Tracking:**

Each challenge tracks progress as a percentage:

```
progress = (current_metric_value / goal_value) × 100
```

For spending-limit challenges, progress is inverted:

```
progress = max(0, (1 - current_spend / max_allowed_spend)) × 100
```

Progress is displayed as:
- A horizontal progress bar on the challenge card
- A daily breakdown view showing each day's contribution
- A group view showing all participants' progress side-by-side

**Shareable Completion Card:**

When a user completes a challenge, a visually rich card is generated that can be shared to social media or within the app:

```
┌─────────────────────────────────────┐
│  ✧ CHALLENGE COMPLETE ✧            │
│                                     │
│  No Eating Out Week                 │
│  ─────────────────────              │
│  7/7 days completed                 │
│  $87.50 saved                       │
│                                     │
│  [User Avatar]  @username           │
│  [FutureSpend Logo]                 │
│                                     │
│  "I saved $87 by cooking at home    │
│   for a week!"                      │
│                                     │
└─────────────────────────────────────┘
```

The card uses the dark fintech dashboard aesthetic — dark background, subtle gradients, and the challenge's accent color.

---

### 8.4 Leaderboards

Leaderboards foster friendly competition within trusted social circles, inspired by Opal's "Inner Circle" concept.

**Leaderboard Types:**

| Leaderboard | Timeframe | Reset | Metric |
|------------|-----------|-------|--------|
| **Weekly Sprint** | Monday to Sunday | Every Monday at midnight | Composite score (see below) |
| **Monthly Marathon** | 1st to last day of month | Monthly | Composite score |
| **All-Time Legends** | Since account creation | Never | Total XP |
| **Challenge Board** | Per active challenge | When challenge ends | Challenge-specific progress |

**Composite Leaderboard Score:**

```
LeaderboardScore = 0.35 × SavingsRate_normalized + 0.25 × StreakLength_normalized + 0.25 × ChallengeCompletions_normalized + 0.15 × HealthScore_normalized
```

All metrics are normalized to 0-100 within the friend group, ensuring that the score reflects relative performance rather than absolute dollar amounts. This prevents income disparity from affecting rankings.

**Normalization:**

```
normalized(value) = (value - min_in_group) / (max_in_group - min_in_group) × 100
```

**Inner Circle (Friend Groups):**

- Users create or join "Inner Circles" — small groups of 2-10 friends.
- Each circle has its own leaderboard.
- Users can be in multiple circles (e.g., "College Friends", "Work Team", "Family").
- Creating a circle generates a unique invite code (6 characters, alphanumeric).

```typescript
interface InnerCircle {
  id: string;
  name: string;                    // e.g., "SFU Squad"
  invite_code: string;             // e.g., "FS7K2M"
  created_by: string;              // user_id
  members: CircleMember[];
  created_at: Date;
}

interface CircleMember {
  user_id: string;
  display_name: string;
  avatar_url: string;
  joined_at: Date;
  is_visible: boolean;             // opt-out of leaderboard display
  current_rank: number;
  weekly_score: number;
  monthly_score: number;
  total_xp: number;
}
```

**Leaderboard Display:**

```
┌─────────────────────────────────────────┐
│  SFU Squad — Weekly Sprint              │
│  ───────────────────────────            │
│                                         │
│  1.  ♛  Alex K.        2,340 pts       │
│  2.  ♕  Jordan M.      2,180 pts       │
│  3.  ♖  Sam R.         1,950 pts       │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─       │
│  4.     Chris L.       1,820 pts       │
│  5.     You            1,650 pts  ←    │
│  6.     Taylor W.      1,400 pts       │
│                                         │
│  Your rank: #5 of 6  |  ↑2 from last   │
│                        week             │
└─────────────────────────────────────────┘
```

- Top 3 are highlighted with crown/medal icons:
  - 1st place: Crown icon (gold)
  - 2nd place: Queen icon (silver)
  - 3rd place: Rook icon (bronze)
- The current user's row is always highlighted with an arrow indicator.
- Rank change from the previous period is shown (up/down arrows with delta).

**Privacy Controls:**

| Setting | Description | Default |
|---------|-----------|---------|
| Show on leaderboard | Toggle visibility — when off, user's rank is hidden from others but they can still see the board | On |
| Share savings rate | Allow savings rate (%) to be visible to circle members | On |
| Share streak | Allow streak length to be visible | On |
| Share health score | Allow financial health score to be visible | Off |
| Share actual amounts | Allow dollar amounts (not just percentages) | Off |

---

### 8.5 XP / Level System

XP (Experience Points) provide a unified currency for all gamification activities. Levels give users a sense of long-term progression.

**XP Award Table:**

| Action | XP Awarded | Frequency Limit | Notes |
|--------|-----------|-----------------|-------|
| Daily check-in (open app + review) | 10 XP | 1x per day | Must view at least one summary screen |
| Stay under daily budget | 25 XP | 1x per day | Calculated at end of day |
| Stay under weekly budget | 75 XP | 1x per week | Bonus on top of daily awards |
| Complete a challenge (Easy) | 100 XP | Per challenge | Awarded once at completion |
| Complete a challenge (Medium) | 250 XP | Per challenge | Awarded once at completion |
| Complete a challenge (Hard) | 500 XP | Per challenge | Awarded once at completion |
| Accurate prediction confirmed (within 20%) | 50 XP | 5x per day max | When actual spend matches calendar prediction |
| Review a transaction | 5 XP | 20x per day max | Tap on a transaction and confirm/categorize |
| Share an achievement | 15 XP | 3x per day max | Share badge or challenge card |
| Invite a friend who joins | 200 XP | Unlimited | Friend must complete onboarding |
| Connect a new data source | 50 XP | Per source (1x each) | Bank, calendar, savings account |
| First savings auto-save | 100 XP | 1x ever | One-time bonus for enabling auto-save |
| Maintain a 7-day streak | 50 XP | 1x per streak tier | Bonus at streak milestones |
| Maintain a 30-day streak | 200 XP | 1x per streak tier | Bonus at streak milestones |
| Maintain a 90-day streak | 500 XP | 1x per streak tier | Bonus at streak milestones |
| Win a challenge (1st place in group) | 150 XP (bonus) | Per challenge | On top of completion XP |

**Level Formula:**

```
XP_needed(level) = 100 × level^1.5
```

**Level Thresholds (Selected):**

| Level | Total XP Required | Cumulative XP to Reach | Title |
|-------|-------------------|----------------------|-------|
| 1 | 0 | 0 | Novice Saver |
| 2 | 283 | 283 | Novice Saver |
| 3 | 520 | 803 | Novice Saver |
| 4 | 800 | 1,603 | Novice Saver |
| 5 | 1,118 | 2,721 | Novice Saver |
| 6 | 1,470 | 4,191 | Budget Apprentice |
| 7 | 1,852 | 6,043 | Budget Apprentice |
| 8 | 2,263 | 8,306 | Budget Apprentice |
| 9 | 2,700 | 11,006 | Budget Apprentice |
| 10 | 3,162 | 14,168 | Budget Apprentice |
| 11 | 3,648 | 17,816 | Money Manager |
| 15 | 5,809 | 36,904 | Money Manager |
| 20 | 8,944 | 74,460 | Money Manager |
| 21 | 9,621 | 84,081 | Finance Pro |
| 25 | 12,500 | 128,076 | Finance Pro |
| 30 | 16,432 | 201,800 | Finance Pro |
| 35 | 20,703 | 294,876 | Finance Pro |
| 36 | 21,600 | 316,476 | Wealth Wizard |
| 40 | 25,298 | 410,553 | Wealth Wizard |
| 45 | 30,187 | 550,900 | Wealth Wizard |
| 50 | 35,355 | 713,980 | Wealth Wizard |

**Level Titles:**

| Level Range | Title | Description |
|-------------|-------|-------------|
| 1 - 5 | **Novice Saver** | Just getting started — learning the basics of budgeting and tracking |
| 6 - 10 | **Budget Apprentice** | Building consistent habits — regular check-ins and budget awareness |
| 11 - 20 | **Money Manager** | Solid financial habits — using predictions, completing challenges |
| 21 - 35 | **Finance Pro** | Advanced user — high savings rate, accurate predictions, active in community |
| 36 - 50 | **Wealth Wizard** | Master of personal finance — long streaks, many badges, helping others |

**Level-Up Experience:**

When a user levels up:
1. A full-screen celebration animation plays (confetti burst with the new level number).
2. The new title is displayed prominently.
3. If the level crosses a title boundary (e.g., 10 to 11, Budget Apprentice to Money Manager), an extra-special animation plays with the new title revealed letter by letter.
4. Any level-gated features are unlocked (future consideration for premium tiers).
5. The level-up is shared to all Inner Circles as a feed item: "[User] just reached Level 11 — Money Manager!"

**XP Progress Bar:**

On the profile screen, a progress bar shows current XP progress toward the next level:

```
Level 14 — Money Manager
[████████████░░░░░░░░] 72%
4,180 / 5,809 XP to Level 15
```

**Anti-Gaming Measures:**

To prevent XP farming:
- Daily caps on repeatable actions (noted in the "Frequency Limit" column above).
- Transaction reviews must involve actual categorization or confirmation — rapid-fire tapping is detected and blocked.
- Challenge completion requires actual spending behavior change, verified against Plaid data.
- Referral XP requires the referred user to complete full onboarding (connect at least one bank account).

**XP Decay (Optional — Disabled by Default):**

For competitive leaderboards, an optional XP decay can be enabled at the circle level:
```
WeeklyXP_effective = WeeklyXP_earned × activity_multiplier
activity_multiplier = min(1.0, days_active_this_week / 5)
```

This prevents inactive users from holding high leaderboard positions purely from historical XP.

---

### 8.6 Gamification Data Schema

```sql
-- User gamification state
CREATE TABLE user_gamification (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_title VARCHAR(50) DEFAULT 'Novice Saver',

  -- Streaks
  checkin_streak INTEGER DEFAULT 0,
  checkin_streak_best INTEGER DEFAULT 0,
  budget_streak INTEGER DEFAULT 0,
  budget_streak_best INTEGER DEFAULT 0,
  savings_streak INTEGER DEFAULT 0,
  savings_streak_best INTEGER DEFAULT 0,
  streak_freezes_available INTEGER DEFAULT 0,

  last_checkin_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Badge awards
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_id VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  tier VARCHAR(20) NOT NULL,         -- bronze, silver, gold, diamond
  unlocked_at TIMESTAMP DEFAULT NOW(),
  is_showcase BOOLEAN DEFAULT FALSE  -- user has pinned this to profile
);

-- Challenge participation
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active',  -- active, completed, failed, withdrawn
  progress DECIMAL(5,2) DEFAULT 0.00,
  completed_at TIMESTAMP,
  xp_awarded INTEGER DEFAULT 0
);

-- Challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY,
  template_id VARCHAR(50) NOT NULL,
  circle_id UUID REFERENCES inner_circles(id),
  created_by UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming',  -- upcoming, active, completed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inner Circles
CREATE TABLE inner_circles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Circle membership
CREATE TABLE circle_members (
  circle_id UUID REFERENCES inner_circles(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  is_visible BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (circle_id, user_id)
);

-- XP transaction log (audit trail)
CREATE TABLE xp_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,       -- e.g., 'daily_checkin', 'challenge_complete'
  reference_id UUID,                 -- optional link to challenge, badge, etc.
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.7 Notification Schedule for Gamification

| Trigger | Notification | Timing |
|---------|-------------|--------|
| Streak at risk | "Your X-day streak ends in 1 hour!" | 1 hour before midnight |
| Streak milestone | "You just hit a 30-day streak! Badge unlocked: Radiant" | Immediately on milestone |
| Challenge starting | "Your No Eating Out Week starts tomorrow!" | 8:00 PM the night before |
| Challenge progress | "Day 3 of 7 — you're on track!" | Daily at 6:00 PM during challenge |
| Challenge completed | "You did it! 250 XP earned. Share your victory!" | Immediately on completion |
| Challenge failed | "Challenge ended. You made it X/Y days. Try again?" | Immediately on challenge end |
| Level up | "Level Up! You're now Level 15 — Money Manager" | Immediately on level-up |
| Friend joined circle | "[Name] just joined your Inner Circle!" | Immediately |
| Leaderboard change | "You moved up to #2 in SFU Squad this week!" | Daily at 9:00 AM if rank changed |
| Badge near-unlock | "You're 2 days away from unlocking Radiant!" | When within 20% of badge condition |



## 9. Social Features

### Friend Codes & Invite Links

- **8-character alphanumeric friend codes** formatted as `SAVE-XXXX` (e.g., `SAVE-A1B2`, `SAVE-K9M3`)
  - Generated on account creation, unique per user
  - Case-insensitive matching for ease of entry
  - Regenerable if user wants a fresh code (old code expires after 72 hours)
- **Deep link invite URLs:** `futurespend://invite/{code}`
  - Falls back to web URL `https://futurespend.app/invite/{code}` for users without the app installed
  - Web landing page shows inviter's name, avatar, and a "Download & Connect" CTA
- **QR code generation for in-person sharing:**
  - QR code encodes the deep link URL
  - Rendered in-app on a share card with the user's display name and avatar
  - Downloadable as PNG for sharing via other channels
- **Referral tracking for XP rewards:**
  - Inviter receives +200 XP when invitee completes onboarding
  - Invitee receives +100 XP welcome bonus via referral
  - Referral chain tracked in `referrals` table for analytics
  - Cap: max 50 referral bonuses per user to prevent abuse

### Contact List Sync

- **Permission-based phone contact matching:**
  - Explicit opt-in prompt explaining what data is used and why
  - Contacts are processed client-side before any data leaves the device
  - Users can skip this step entirely during onboarding
- **Hash-based privacy-preserving lookup (SHA-256 of phone numbers):**
  - Phone numbers normalized to E.164 format before hashing
  - Only SHA-256 hashes are sent to the server, never raw phone numbers
  - Server compares hashes against registered user hashes
  - Hashes are not stored after the lookup completes
- **Suggested friends from contacts already on platform:**
  - Results displayed as "People you may know" list
  - One-tap "Add Friend" button per suggestion
  - Users can dismiss suggestions permanently
  - Suggestions refresh when contacts change (via periodic background sync with user permission)

### Friend Circles ("Inner Circle")

- **Create named groups (max 20 members):**
  - Example circle names: "Roommates", "Work Friends", "Gym Buddies", "Study Group"
  - Custom circle icon selection (from preset library)
  - Circle creator becomes admin by default
  - Users can belong to up to 10 circles simultaneously
- **Circle-specific leaderboards and challenges:**
  - Weekly savings leaderboard ranked by percentage saved (not raw dollars, to keep it fair)
  - Circle-only challenges visible only to members
  - Historical circle stats: "This circle has saved $4,200 together since April"
- **Circle chat for encouragement and accountability:**
  - Lightweight in-app messaging (text only, no media)
  - Auto-generated celebration messages when a member hits a milestone
  - Chat history retained for 90 days
  - Mute option per circle
- **Admin controls:**
  - Invite new members via friend code or direct invite
  - Remove members (with confirmation)
  - Transfer admin role to another member
  - Delete circle (requires admin confirmation, notifies all members)
  - Set circle privacy: open (anyone with link can join) or closed (invite-only)

### Shared Challenge Participation

- **Create challenge -> invite circle -> track progress together:**
  - Challenge creator selects type, duration, and target
  - Invite sent to entire circle or selected members
  - Members must accept to participate (no auto-enrollment)
  - Minimum 2 participants required to start a group challenge
- **Real-time progress updates via Supabase Realtime:**
  - Live progress bars update as transactions are logged
  - "Activity feed" in challenge view showing member progress events
  - Supabase Realtime channels scoped per challenge for efficiency
  - Presence indicators showing who is currently viewing the challenge
- **Completion celebrations with shareable cards:**
  - Auto-generated summary card on challenge completion
  - Card includes: challenge name, duration, amount saved, participant rankings
  - Share to Instagram Stories, iMessage, or download as image
  - Card styled with FutureSpend branding and dark theme aesthetic
- **Group stats:**
  - Average savings per member
  - Total group savings across all challenges
  - Best performer (by percentage of goal achieved)
  - Group streak: consecutive challenges completed together
  - Comparison: "Your circle saves 23% more than the average FutureSpend circle"

### Privacy Controls

- **Granular visibility settings:**
  - **Show/hide actual dollar amounts:** toggle to display percentages instead (e.g., "85% of budget used" vs "$425 of $500 used")
  - **Show/hide specific categories:** individually toggle visibility per spending category (e.g., hide "Healthcare" from friends)
  - **Show/hide streak count:** option to keep streak progress private
  - **Show/hide on leaderboards:** opt out of appearing on any leaderboard rankings
- **Privacy levels (per data type):**
  - **Public:** visible to all friends
  - **Circle Only:** visible only to members of shared circles
  - **Private:** visible only to the user
- **Defaults:**
  - Dollar amounts: Circle Only
  - Achievement badges: Public
  - Streak count: Public
  - Category breakdown: Circle Only
  - Leaderboard participation: Public (opt-out available)
- **Additional privacy measures:**
  - Profile visibility toggle: searchable by friend code only vs discoverable in contact sync
  - Block user functionality: blocked users cannot see any data, send nudges, or invite to circles
  - Data shown to friends is always computed server-side to prevent client-side spoofing

### Social Nudge System

- **Automated nudges:**
  - Streak celebration: "Sarah is on a 14-day streak! Send encouragement?"
  - Savings milestone: "Marcus just saved $500 this month! Give a high-five?"
  - Challenge progress: "Your roommates are 80% through No Takeout Week!"
  - Triggered by server-side events, queued for delivery during active hours
- **Manual nudges:**
  - Tap to send predefined messages: "You got this!", "Keep it up!", "Almost there!"
  - Custom short message option (max 100 characters)
  - Nudge appears as a push notification and in-app notification
  - Recipient sees sender name and nudge type
- **Challenge invitations:**
  - "Marcus invited you to No Eating Out Week"
  - Accept/decline buttons in notification
  - Preview of challenge details before accepting
- **Celebration notifications:**
  - "Your circle saved $500 this month!"
  - "3 of 4 roommates completed the Coffee Savings challenge!"
  - Auto-generated when group milestones are reached
- **Nudge types (enum):**
  - `encouragement` — positive reinforcement for progress
  - `challenge_invite` — invitation to join a challenge
  - `celebration` — milestone or completion celebration
  - `reminder` — gentle check-in or accountability prompt
- **Rate limiting:**
  - Max 3 nudges per friend per day (per sender)
  - Max 10 outgoing nudges per user per day (total across all friends)
  - Automated nudges count toward the recipient's incoming cap, not the sender's
  - Cooldown: 1 hour minimum between nudges to the same person

---

## 10. AI Chat Assistant

### Conversational Interface

- **Chat bubble UI with message history:**
  - User messages right-aligned with primary accent background (#00D09C)
  - AI messages left-aligned with card background (#132039)
  - Timestamps shown on long-press or after 5-minute gaps between messages
  - Scrollable history with "load more" for older messages
  - Persistent across sessions (history stored in Supabase)
- **Typing indicator during AI response generation:**
  - Animated three-dot indicator in AI message bubble position
  - Appears immediately on message send, disappears when response streams in
  - Streaming response: tokens appear as they are generated for perceived speed
- **Suggested questions carousel at bottom:**
  - Horizontally scrollable pill buttons below the input field
  - 3-5 contextually generated suggestions refreshed after each interaction
  - Tapping a suggestion sends it as a user message immediately
- **Quick action buttons:**
  - Persistent row above the keyboard: "Check my budget", "What's coming up?", "Challenge ideas", "Spending summary"
  - Actions trigger pre-built prompts with full context injection
  - Buttons adapt based on user state (e.g., "How's my challenge?" only appears during active challenges)

### Context-Aware Responses

- **System prompt includes (injected per request):**
  - User's current budget status: total budget, amount spent, amount remaining, days left in period
  - Upcoming calendar events with spending predictions (next 7 days)
  - Recent transactions (last 10 transactions with categories and amounts)
  - Financial health score and contributing factors
  - Active challenges: name, progress, days remaining
  - Streak status: current streak length, longest streak, streak type
  - User preferences: communication tone, notification settings
- **Context window management:**
  - Recent conversation messages (last 20) included in full
  - Older messages summarized into a rolling context summary
  - Financial data refreshed on each new message (not cached from prior turns)
  - Total context kept under model token limits with priority-based truncation
- **Personalization:**
  - Learns preferred response length (concise vs detailed) from user feedback (thumbs up/down)
  - Adapts tone: casual, professional, or motivational based on user setting
  - Remembers user-specified rules and preferences (stored in user profile): "I always split bills 50/50", "My rent is $1,200"

### Example Conversations

**Weekend spending check:**
```
User: "Can I afford to go out this weekend?"

AI: "Looking at your calendar, you have 'Dinner with Alex' on Saturday
and 'Movie Night' on Sunday. Based on your history, that's roughly $45
for dinner and $25 for movies. You have $120 left in your entertainment
budget this month, so you'd have $50 remaining. You're in good shape!"
```

**Monthly progress review:**
```
User: "How am I doing this month?"

AI: "You're 18 days into March and have spent $1,240 of your $2,000
budget (62%). Your burn rate is 1.03 — slightly above pace. The main
culprit is dining out ($380 vs $250 budget). Good news: your calendar
shows a quieter week ahead with mostly work events, so you should
naturally spend less. Want me to suggest some savings strategies?"
```

**Challenge creation with friends:**
```
User: "Set up a savings challenge for my roommates"

AI: "Great idea! Here are some popular challenges for friend groups:
1. Pack Lunch Week — No eating out for lunch, 7 days
2. Coffee Savings — Make coffee at home for 2 weeks
3. Free Fun Week — Only free activities for entertainment

Which one sounds good? Or I can create a custom challenge!"
```

**Prediction explanation:**
```
User: "Why does it think my coffee meetup will cost $8?"

AI: "That prediction is based on three signals:
1. Your average coffee shop transaction is $7.40 (across 23 visits)
2. The event is at 'Blue Bottle Coffee' — your past visits there
   average $8.20
3. It's a weekday morning meetup, which historically costs slightly
   less than weekend visits ($7.80 vs $9.10)

The $8 estimate is a weighted blend of these. Want me to adjust it?"
```

### Suggested Questions (Dynamically Generated)

Questions are selected based on the user's current context and timing:

| Trigger Condition | Suggested Question |
|---|---|
| Before payday (1-2 days) | "How should I allocate my next paycheck?" |
| After a large transaction | "Was that purchase within my plan?" |
| Monday morning | "What's my spending forecast for this week?" |
| End of month (last 3 days) | "How did I do this month?" |
| Active challenge in progress | "How's my challenge going?" |
| Streak at risk (no check-in today) | "Am I on track to keep my streak?" |
| New calendar events synced | "What will this week's events cost me?" |
| Budget category at 80%+ | "Where can I cut back this month?" |
| After receiving a social nudge | "How are my friends doing on their goals?" |
| First open of the day | "What's on my financial radar today?" |

### Integration with Prediction Engine

- **Explain any prediction:**
  - User can tap any predicted amount in the UI and ask "Why this amount?"
  - AI breaks down the prediction into contributing factors with weights
  - Shows historical data points that informed the prediction
- **Adjust predictions:**
  - User can tell the AI to update a specific prediction: "Actually, we're going to a fancy place, update the estimate"
  - AI updates the prediction in the database and recalculates budget impact
  - Adjustment is logged as user feedback to improve future predictions
- **Create persistent rules:**
  - "Always budget $30 for team lunches" creates a rule stored in user preferences
  - Rules override model predictions for matching events
  - Rules can be listed, edited, and deleted: "Show me my prediction rules"
  - Rules are matched by event title keywords, location, or calendar source
- **Proactive AI insights (push to chat):**
  - AI can initiate conversation in the chat with insights: "I noticed you've been spending more on transit this week. Did your commute change?"
  - User can disable proactive messages in settings
  - Max 1 proactive message per day

---

## 11. Data Visualization Specs

All charts use a dark theme inspired by Copilot.money: dark navy backgrounds, high-contrast accent colors, and clean typography. Charts are rendered using a performant charting library (e.g., Victory Native or react-native-chart-kit for React Native, or Chart.js/D3 for web).

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Background | `#0A1628` | App background, chart canvas |
| Card Background | `#132039` | Card surfaces, chart containers |
| Primary Accent | `#00D09C` | Positive values, under-budget, success states |
| Warning | `#FFB020` | Approaching budget, caution states |
| Danger | `#FF4757` | Over budget, negative trends, alerts |
| Info | `#3B82F6` | Informational elements, links, secondary data |
| Text Primary | `#FFFFFF` | Headings, primary labels, key values |
| Text Secondary | `#8899AA` | Axis labels, secondary text, captions |
| Chart Series | `["#00D09C", "#3B82F6", "#FFB020", "#FF4757", "#A855F7", "#EC4899"]` | Sequential series colors for multi-category charts |

**Typography for charts:**
- Axis labels: 10px, `#8899AA`, semi-bold
- Data labels: 12px, `#FFFFFF`, bold
- Chart titles: 16px, `#FFFFFF`, bold
- Tooltip text: 12px, `#FFFFFF`, regular on `#1E293B` background

### Spending Heatmap (Calendar View)

A monthly calendar grid where each day cell is colored by spending intensity, giving users an at-a-glance view of their spending patterns over time.

**Specifications:**
- Monthly calendar grid layout (7 columns for days of week, 4-6 rows)
- Each day cell colored by total spending for that day
- Color scale: `$0` = `#0A1628` (dark/no spend) -> `$50` = `#00D09C` (green/low) -> `$100` = `#FFB020` (yellow/medium) -> `$200+` = `#FF4757` (red/high)
- Future days with predicted spending shown with a **dotted border** and slightly reduced opacity (0.7)
- Today's cell highlighted with a solid white border
- Tap any day cell to expand a breakdown popover showing individual transactions
- Swipe left/right to navigate between months

**Layout mockup:**
```
┌──────────────────────────────────────────────────────┐
│  < February 2026 >                                   │
│                                                      │
│  Mon   Tue   Wed   Thu   Fri   Sat   Sun             │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐         │
│ │     │     │     │     │     │     │  1  │         │
│ │     │     │     │     │     │     │ ░░░ │         │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤         │
│ │  2  │  3  │  4  │  5  │  6  │  7  │  8  │         │
│ │ ▓▓▓ │ ░░░ │ ░░░ │ ▓▓▓ │ ███ │ ███ │ ▓▓▓ │         │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤         │
│ │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │         │
│ │ ░░░ │ ░░░ │ ▓▓▓ │ ░░░ │ ▓▓▓ │ ███ │ ░░░ │         │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤         │
│ │ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │         │
│ │ ░░░ │ ▓▓▓ │ ░░░ │ ░░░ │ ░░░ │ ▓▓▓ │ ░░░ │         │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤         │
│ │ 23  │ 24  │ 25  │ 26  │ 27  │ 28  │     │         │
│ │ ░░░ │ ▓▓▓ │ ░░░ │ ▓▓▓ │ ┊░┊ │ ┊░┊ │     │         │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘         │
│                                                      │
│  Legend: ░░░ Low ($0-50)  ▓▓▓ Med ($50-100)          │
│          ███ High ($100-200)  ┊░┊ Predicted           │
└──────────────────────────────────────────────────────┘
```

### Budget Progress Charts (Copilot-Style)

A line chart showing cumulative spending over the month against the budget limit, with a forward-looking predicted trajectory.

**Specifications:**
- X-axis: days of the month (1-28/30/31), labeled every 5 days
- Y-axis: cumulative dollar amount, auto-scaled with $0 at bottom
- **Budget limit line:** horizontal dashed line in `#8899AA` with label "Budget: $X"
- **Actual spending line:** solid line in `#00D09C` (when under budget) transitioning to `#FF4757` (when over)
- **Predicted future line:** dotted line extending from current day to end of month in `#3B82F6`
- **Area fill:** gradient fill below the actual spending line; green (`#00D09C` at 20% opacity) when under budget, red (`#FF4757` at 20% opacity) when over
- **Today marker:** vertical dashed line at current day with "Today" label
- Tooltip on hover/tap: shows date, cumulative amount, and delta from budget pace

**Layout mockup:**
```
┌──────────────────────────────────────────────────────┐
│  Monthly Budget Progress                             │
│                                                      │
│  $2,000 ┤╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ Budget      │
│         │                          ....··            │
│  $1,500 ┤                    ....··                  │
│         │                ...·                        │
│  $1,240 ┤- - - - - - -●·                            │
│         │            ╱  ↑ Today                      │
│  $1,000 ┤          ╱                                 │
│         │        ╱                                   │
│    $500 ┤     ╱                                      │
│         │  ╱ ░░░░░░░░░░░ (green fill under line)     │
│      $0 ┤╱───────────────────────────────            │
│         1     5     10    15    20    25   28/31      │
│                                                      │
│  ── Actual   ··· Predicted   ╌╌ Budget limit         │
└──────────────────────────────────────────────────────┘
```

### Category Breakdown (Donut Chart)

A donut/ring chart showing the proportion of spending across categories, with an interactive drill-down.

**Specifications:**
- Donut ring with ~60% inner radius (thick ring, not thin)
- **Center display:** total amount spent in large bold text (e.g., "$1,240"), with "Total Spent" subtitle in secondary text
- Top 5 categories shown as individual segments, remaining categories grouped as "Other"
- Each segment labeled externally with: category icon, category name, percentage, and dollar amount
- Segments ordered clockwise by size (largest first)
- Segment colors drawn from the chart series palette in order
- Tap a segment to drill down into a category detail view showing individual transactions
- Subtle animation: segments grow outward slightly on tap/hover

**Layout mockup:**
```
┌──────────────────────────────────────────────────────┐
│  Spending by Category                                │
│                                                      │
│         Dining $380 (31%) ●                          │
│                          ╱ ╲                         │
│          ┌──────────────╱───╲──────────┐             │
│          │ ▓▓▓▓▓▓▓▓▓▓▓▓▓     ░░░░░░░░ │             │
│          │ ▓▓▓▓▓▓▓▓▓▓▓         ░░░░░░ │             │
│          │ ▓▓▓▓▓▓▓   $1,240    ░░░░░░ │             │
│          │ ▓▓▓▓▓▓▓   total     ▒▒▒▒▒▒ │             │
│          │ ▓▓▓▓▓▓▓▓▓▓▓         ▒▒▒▒▒▒ │             │
│          │ ████████████████ ▒▒▒▒▒▒▒▒▒ │             │
│          └─────────────────────────────┘             │
│                                                      │
│  ▓ Dining 31%    ░ Transport 22%    ▒ Groceries 18% │
│  █ Shopping 16%  ○ Other 13%                         │
└──────────────────────────────────────────────────────┘
```

### Trend Lines

Weekly and monthly spending trend line charts comparing actual vs predicted spending over time.

**Specifications:**
- X-axis: time periods (days for weekly view, weeks for monthly view, months for 3/6-month view)
- Y-axis: spending amount, auto-scaled
- **Actual spending line:** solid line in `#00D09C`, with data point dots at each interval
- **Predicted spending line:** dashed line in `#3B82F6`
- **Confidence interval:** shaded region around the prediction line in `#3B82F6` at 10% opacity, representing the prediction's uncertainty range
- **Toggle bar** at top: `Week | Month | 3 Month | 6 Month` — active tab highlighted with accent color
- Tooltip on tap: shows actual vs predicted amounts and delta
- Average line: thin horizontal dashed line in `#8899AA` showing the period average

**Layout mockup:**
```
┌──────────────────────────────────────────────────────┐
│  Spending Trends                                     │
│  [Week] [Month] [3 Month] [6 Month]                 │
│                                                      │
│  $300 ┤                                              │
│       │        ╱╲                                    │
│  $250 ┤───────╱──╲─────────── avg ─────              │
│       │  ●╱╲╱╱    ╲     ╱╲                           │
│  $200 ┤ ╱          ╲  ╱   ╲  ╱                       │
│       │╱            ╲╱     ●╱                        │
│  $150 ┤   ○· · · · · · ○· · · · ·○· · ·             │
│       │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░              │
│  $100 ┤                                              │
│       ├──────────────────────────────────             │
│       Mon  Tue  Wed  Thu  Fri  Sat  Sun              │
│                                                      │
│  ── Actual  ·· Predicted  ░ Confidence interval      │
└──────────────────────────────────────────────────────┘
```

### Category Comparison (Bar Chart)

A grouped bar chart comparing budgeted, actual, and predicted amounts per spending category.

**Specifications:**
- Grouped bars: three bars per category (budget, actual, predicted)
- **Budget bar:** outlined rectangle with no fill, border `#8899AA` (gray outline)
- **Actual bar:** solid fill using category color from the series palette
- **Predicted bar:** striped/hatched fill using category color at 50% opacity
- Categories sorted by largest overspend first (biggest gap between actual and budget at top)
- Horizontal layout (categories on Y-axis, amounts on X-axis) for readability with long category names
- Overspend indicator: red arrow or label showing "+$X over" when actual exceeds budget
- Tap a category group to see transaction details

**Layout mockup:**
```
┌──────────────────────────────────────────────────────┐
│  Budget vs Actual vs Predicted                       │
│                                                      │
│  Dining     ┤ ╔═══════════════╗ $250 budget          │
│             ┤ ████████████████████ $380 actual (+$130)│
│             ┤ ░░░░░░░░░░░░░░░░░ $340 predicted       │
│             │                                        │
│  Shopping   ┤ ╔═══════════╗ $200 budget               │
│             ┤ █████████████ $230 actual (+$30)        │
│             ┤ ░░░░░░░░░░░ $210 predicted              │
│             │                                        │
│  Transport  ┤ ╔══════════════╗ $300 budget            │
│             ┤ ████████████ $270 actual                │
│             ┤ ░░░░░░░░░░░░░ $280 predicted            │
│             │                                        │
│  Groceries  ┤ ╔════════════╗ $250 budget              │
│             ┤ ██████████ $220 actual                  │
│             ┤ ░░░░░░░░░░░ $230 predicted              │
│             ├────────────────────────────             │
│             $0   $100   $200   $300   $400            │
│                                                      │
│  ╔═╗ Budget   ██ Actual   ░░ Predicted               │
└──────────────────────────────────────────────────────┘
```

### Savings Growth Curve

A compound growth visualization showing current savings trajectory, goal targets, and projected future growth.

**Specifications:**
- X-axis: time (months, extending 6-12 months into the future)
- Y-axis: savings balance in dollars
- **Current savings line:** solid line in `#00D09C` showing actual savings balance over time
- **Goal line:** horizontal dashed line in `#FFB020` for each savings goal (e.g., "Emergency Fund: $1,000")
- **Projected growth curve:** dotted line in `#3B82F6` extending from current balance forward, calculated using current savings rate + compound interest (if applicable)
- **Milestone markers:** diamond-shaped markers along the projected curve where savings intersect goal amounts, labeled with goal name and estimated date
- **Fill gradient:** area between current line and projected curve filled with a gradient from `#00D09C` (10% opacity) to `#3B82F6` (10% opacity)
- **Annotations:** key milestones labeled inline (e.g., "Emergency Fund $1,000 — est. May 2026")

**Layout mockup:**
```
┌──────────────────────────────────────────────────────┐
│  Savings Growth                                      │
│                                                      │
│  $5,000 ┤                                    ·····   │
│         │                              ····          │
│         │                         ····               │
│  $3,000 ┤╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌◇╌╌╌╌╌╌ Vacation       │
│         │                  ··                        │
│         │              ···                           │
│  $1,000 ┤╌╌╌╌╌╌╌╌╌◇╌╌╌╌╌╌╌╌╌╌╌ Emergency Fund      │
│         │       ··╱░░░░░░░░░░░░░░░░░░░░░░░           │
│    $620 ┤──●──·╱░░░░░░░░░░░░░░░░░░░░░░░░░            │
│         │  ╱╱░░░░░░░░░░░░░░░░░░░░░░░░░░░             │
│      $0 ┤╱───────────────────────────────             │
│         Jan  Feb  Mar  Apr  May  Jun  Jul  Aug       │
│                     2026                             │
│                                                      │
│  ── Actual   ··· Projected   ◇ Milestone             │
│  ╌╌ Goal line   ░ Growth fill                        │
└──────────────────────────────────────────────────────┘
```

### Chart Interaction Guidelines

- **Touch targets:** minimum 44x44pt tap areas for all interactive elements
- **Animations:** charts animate in on first render (0.5s ease-out), data transitions animate smoothly (0.3s)
- **Empty states:** when no data is available, show illustration with message "Start tracking to see your data here"
- **Loading states:** skeleton shimmer placeholders matching chart dimensions
- **Accessibility:** all charts include VoiceOver/TalkBack descriptions summarizing the data trends in plain language
- **Responsive:** charts resize gracefully across phone sizes; key labels never truncate

---

## 12. Push Notifications

### Notification Categories & Templates

#### Upcoming Event Spending Alerts

Triggered **24 hours before** a calendar event that has a predicted spending amount.

| Trigger | Template |
|---|---|
| Standard event reminder | "Coffee meetup with Sarah tomorrow: ~$15 predicted \| You have $45 left in your coffee budget" |
| Event with high predicted cost | "Team lunch at noon: ~$25 predicted \| Tap to see alternatives" |
| Event with location match | "Dinner at Earls tomorrow evening: ~$55 predicted based on your history there" |
| Multiple events in one day | "You have 3 events tomorrow with ~$75 total predicted spending. Tap to review." |

**Behavior:**
- Only triggers for events with a predicted spend above $5 (skip trivial predictions)
- Includes remaining category budget in the notification body
- Tap action: opens the event detail screen with prediction breakdown
- If the user has set a custom prediction rule for this event type, use the rule amount instead

#### Budget Threshold Warnings

Triggered when cumulative spending in a budget category crosses key thresholds.

| Threshold | Template |
|---|---|
| 50% used | "Heads up: You've used half your [category] budget with [X] days left" |
| 80% used | "[Category] budget is at 80%. You have $[remaining] left for [Y] days" |
| 100% exceeded | "You've exceeded your [category] budget by $[amount]" |
| Burn rate warning | "At your current pace, you'll exceed your monthly budget by $[amount]" |

**Behavior:**
- Each threshold triggers only once per budget period (no repeated alerts at the same level)
- 50% notification only sent if pace is ahead of schedule (burn rate > 1.0)
- Burn rate warning sent when projected overspend exceeds 10% of budget
- Tap action: opens the budget detail view for the relevant category

#### Challenge Updates

Notifications related to active savings challenges.

| Event | Template |
|---|---|
| Challenge started | "'No Eating Out Week' starts today! You've got this!" |
| Daily progress | "Day [X]/[Y] of [challenge name] -- keeping strong!" |
| Near completion | "One more day! Don't break your streak now!" |
| Completed | "Challenge complete! You saved $[amount] this week! +[XP] XP" |
| Failed | "Challenge ended. You made it [X] of [Y] days. Try again?" |
| Friend progress | "[Name] just completed Day [X] of your shared challenge!" |

**Behavior:**
- Daily progress notifications sent at the user's preferred notification time (default: 9am)
- Completion notification includes shareable card deep link
- Failed challenge notification includes a "Restart" quick action button
- Group challenge notifications aggregate if multiple friends make progress: "[X] friends made progress today"

#### Social Nudges

Notifications driven by social interactions and friend activity.

| Event | Template |
|---|---|
| Friend achievement | "[Name] just hit a [X]-day streak! Send a high-five?" |
| Circle update | "Your [circle name] circle saved $[amount] this week -- you contributed $[user_amount]!" |
| Friend joined via referral | "[Name] just joined FutureSpend from your invite! +200 XP" |
| Incoming nudge | "[Name] sent you encouragement: 'You got this!'" |
| Challenge invitation | "[Name] invited you to [challenge name]. Tap to join!" |

**Behavior:**
- Friend achievement notifications only sent for significant milestones (7, 14, 30, 60, 90, 180, 365 days)
- Circle weekly summary sent on Sundays at 6pm
- Incoming nudge notifications are always delivered immediately (not batched)
- Challenge invitation includes Accept/Decline action buttons inline

#### Streak Reminders

Notifications to protect and celebrate the user's check-in streaks.

| Event | Template |
|---|---|
| Evening reminder | "Don't forget to check in today! Your [X]-day streak is on the line" |
| Streak milestone | "You're on a [X]-day streak! [Badge name] milestone unlocked!" |
| Streak broken | "Your streak ended at [X] days. Start a new one today?" |
| Streak recovery (if available) | "Use a Streak Shield to save your [X]-day streak? You have [Y] shields left." |

**Behavior:**
- Evening reminder sent only if the user has not opened the app that day
- Reminder time: 2 hours before quiet hours begin (default: 8pm)
- Streak milestone notifications coincide with badge unlocks (7, 14, 30, 60, 90 days)
- Streak broken notification sent the morning after the streak lapses
- Streak Shield is a premium/earned item that forgives one missed day

### Smart Timing

- **Learn user's typical app usage times:**
  - Track app open times over a 14-day rolling window
  - Identify peak usage windows (e.g., 8-9am, 12-1pm, 7-8pm)
  - Schedule non-urgent notifications to coincide with these windows
- **Default quiet hours:** 10:00 PM - 8:00 AM (user's local timezone)
  - Notifications generated during quiet hours are queued and delivered at quiet hours end
  - Exception: streak-at-risk reminders can be sent up to 30 minutes into quiet hours if the user hasn't checked in
- **Batch non-urgent notifications:**
  - Low-priority notifications (social updates, achievements) batched into a single summary notification if more than 2 are pending
  - Summary format: "You have 3 updates: [Name] hit a milestone, your circle saved $200, and more"
- **Priority system:**
  - **High:** budget exceeded, streak about to break, challenge near completion — delivered immediately
  - **Medium:** spending predictions, challenge daily updates, burn rate warnings — delivered during usage windows
  - **Low:** social nudges, friend achievements, circle summaries — batched or delivered during usage windows
- **Fatigue prevention:**
  - Maximum 5 push notifications per day across all categories
  - If cap is reached, remaining notifications are available in the in-app notification center only
  - High-priority notifications can exceed the cap (up to 2 additional)
  - Weekly notification volume tracked; if user dismisses >70% of notifications, reduce frequency and suggest preference adjustment

### Notification Preferences

- **Per-category toggle:**
  - Spending alerts: on/off
  - Budget warnings: on/off
  - Challenge updates: on/off
  - Social nudges: on/off
  - Streak reminders: on/off
  - Each category independently controllable
- **Quiet hours customization:**
  - Start time picker (default: 10:00 PM)
  - End time picker (default: 8:00 AM)
  - Per-day override (e.g., weekends quiet until 10:00 AM)
- **Frequency cap adjustment:**
  - Slider or picker: 3 / 5 / 10 / Unlimited notifications per day
  - Default: 5 per day
- **Do Not Disturb mode:**
  - Manual toggle to suppress all notifications immediately
  - Scheduled DND for specific time ranges (e.g., "DND during work hours 9-5")
  - Auto-DND integration with device Focus modes (iOS) or DND (Android) where supported
- **Notification sound & vibration:**
  - Custom notification sound selection (from preset library)
  - Vibration pattern: on/off
  - Silent delivery option (notification appears in tray but no sound/vibration)

### Technical Implementation Notes

- **Delivery service:** Firebase Cloud Messaging (FCM) for Android, Apple Push Notification service (APNs) for iOS
- **Notification payload:** includes `category`, `priority`, `deep_link`, and `action_buttons` fields
- **Deep links:** every notification includes a deep link that navigates to the relevant screen in the app
- **Analytics tracking:** track delivery, open, dismiss, and action rates per notification type
- **Token management:** device tokens stored in Supabase `push_tokens` table, cleaned up on logout or token refresh
- **Scheduling:** server-side notification scheduler runs every 15 minutes, evaluates triggers, respects quiet hours and caps, and enqueues notifications for delivery



## 13. Database Schema

Full Supabase PostgreSQL schema for FutureSpend. All tables use `gen_random_uuid()` for primary keys and `now()` for timestamp defaults. Row Level Security (RLS) is enabled on every table.

### 13.1 Custom Types (Enums)

```sql
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
```

### 13.2 Core Tables

```sql
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

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


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
  type                TEXT NOT NULL,       -- e.g. 'depository', 'credit', 'investment'
  subtype             TEXT,                -- e.g. 'checking', 'savings', 'credit card'
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
  amount                FLOAT NOT NULL,              -- positive = spending, negative = income
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
```

### 13.3 Prediction Tables

```sql
-- ============================================================
-- SPENDING PREDICTIONS
-- AI-generated spending predictions linked to calendar events
-- ============================================================
CREATE TABLE spending_predictions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  calendar_event_id   UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  predicted_category  event_category NOT NULL,
  predicted_amount    FLOAT NOT NULL,
  prediction_low      FLOAT NOT NULL,
  prediction_high     FLOAT NOT NULL,
  confidence_score    FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  confidence_label    confidence_label NOT NULL DEFAULT 'medium',
  model_version       TEXT NOT NULL DEFAULT 'v1.0',
  explanation         TEXT,
  actual_amount       FLOAT,
  was_accurate        BOOLEAN,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- PREDICTION FEEDBACK
-- User corrections to improve prediction accuracy
-- ============================================================
CREATE TABLE prediction_feedback (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prediction_id       UUID NOT NULL REFERENCES spending_predictions(id) ON DELETE CASCADE,
  feedback_type       feedback_type NOT NULL,
  corrected_category  event_category,
  corrected_amount    FLOAT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, prediction_id)
);
```

### 13.4 Budget Tables

```sql
-- ============================================================
-- BUDGETS
-- Monthly budgets per spending category
-- ============================================================
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category        event_category NOT NULL,
  monthly_limit   FLOAT NOT NULL CHECK (monthly_limit > 0),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (period_end > period_start),
  UNIQUE (user_id, category, period_start)
);


-- ============================================================
-- BUDGET SNAPSHOTS
-- Daily snapshots of budget status for trend tracking
-- ============================================================
CREATE TABLE budget_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  budget_id           UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  spent_amount        FLOAT NOT NULL DEFAULT 0,
  predicted_remaining FLOAT NOT NULL DEFAULT 0,
  burn_rate           FLOAT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (budget_id, date)
);
```

### 13.5 Gamification Tables

```sql
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
  challenge_type  TEXT NOT NULL,           -- e.g. 'no_spend', 'savings_goal', 'budget_streak'
  duration_days   INTEGER NOT NULL CHECK (duration_days > 0),
  goal            JSONB NOT NULL,          -- e.g. {"target_amount": 200, "category": "dining"}
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
```

### 13.6 Social Tables

```sql
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
```

### 13.7 Row Level Security Policies

```sql
-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PROFILES POLICIES
-- Users can read their own profile and accepted friends' profiles.
-- Users can only update their own profile.
-- ============================================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_friends"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT CASE
        WHEN user_id = auth.uid() THEN friend_id
        ELSE user_id
      END
      FROM friendships
      WHERE status = 'accepted'
        AND (user_id = auth.uid() OR friend_id = auth.uid())
    )
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ============================================================
-- CALENDAR CONNECTIONS POLICIES
-- Users can only CRUD their own calendar connections.
-- ============================================================
CREATE POLICY "calendar_connections_all_own"
  ON calendar_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- CALENDAR EVENTS POLICIES
-- Users can only access their own calendar events.
-- ============================================================
CREATE POLICY "calendar_events_all_own"
  ON calendar_events FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- PLAID CONNECTIONS POLICIES
-- Users can only access their own Plaid connections.
-- ============================================================
CREATE POLICY "plaid_connections_all_own"
  ON plaid_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- ACCOUNTS POLICIES
-- Users can only access their own bank accounts.
-- ============================================================
CREATE POLICY "accounts_all_own"
  ON accounts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- TRANSACTIONS POLICIES
-- Users can only access their own transactions.
-- ============================================================
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- RECURRING TRANSACTIONS POLICIES
-- Users can only access their own recurring transactions.
-- ============================================================
CREATE POLICY "recurring_transactions_all_own"
  ON recurring_transactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- SPENDING PREDICTIONS POLICIES
-- Users can only access their own predictions.
-- ============================================================
CREATE POLICY "spending_predictions_select_own"
  ON spending_predictions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "spending_predictions_insert_own"
  ON spending_predictions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "spending_predictions_update_own"
  ON spending_predictions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- PREDICTION FEEDBACK POLICIES
-- Users can only access and submit their own feedback.
-- ============================================================
CREATE POLICY "prediction_feedback_all_own"
  ON prediction_feedback FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- BUDGETS POLICIES
-- Users can only access their own budgets.
-- ============================================================
CREATE POLICY "budgets_all_own"
  ON budgets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- BUDGET SNAPSHOTS POLICIES
-- Users can only access their own budget snapshots.
-- ============================================================
CREATE POLICY "budget_snapshots_all_own"
  ON budget_snapshots FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- BADGES POLICIES
-- All authenticated users can read badge definitions.
-- Only service role can insert/update badge definitions.
-- ============================================================
CREATE POLICY "badges_select_all"
  ON badges FOR SELECT
  USING (true);


-- ============================================================
-- USER BADGES POLICIES
-- Users can see their own badges and friends' badges.
-- ============================================================
CREATE POLICY "user_badges_select_own"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_badges_select_friends"
  ON user_badges FOR SELECT
  USING (
    user_id IN (
      SELECT CASE
        WHEN user_id = auth.uid() THEN friend_id
        ELSE user_id
      END
      FROM friendships
      WHERE status = 'accepted'
        AND (user_id = auth.uid() OR friend_id = auth.uid())
    )
  );

CREATE POLICY "user_badges_insert_own"
  ON user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- CHALLENGES POLICIES
-- All authenticated users can see template challenges.
-- Users can see challenges they created or participate in.
-- ============================================================
CREATE POLICY "challenges_select_templates"
  ON challenges FOR SELECT
  USING (is_template = true);

CREATE POLICY "challenges_select_own"
  ON challenges FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "challenges_select_participating"
  ON challenges FOR SELECT
  USING (
    id IN (
      SELECT challenge_id FROM challenge_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "challenges_insert_own"
  ON challenges FOR INSERT
  WITH CHECK (creator_id = auth.uid());


-- ============================================================
-- CHALLENGE PARTICIPANTS POLICIES
-- Users can see participants in challenges they are part of.
-- Users can join challenges (insert themselves).
-- Users can update their own participation.
-- ============================================================
CREATE POLICY "challenge_participants_select_in_challenge"
  ON challenge_participants FOR SELECT
  USING (
    challenge_id IN (
      SELECT challenge_id FROM challenge_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "challenge_participants_insert_self"
  ON challenge_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "challenge_participants_update_own"
  ON challenge_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- STREAK HISTORY POLICIES
-- Users can only access their own streaks.
-- ============================================================
CREATE POLICY "streak_history_all_own"
  ON streak_history FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- XP TRANSACTIONS POLICIES
-- Users can only read their own XP transactions.
-- ============================================================
CREATE POLICY "xp_transactions_select_own"
  ON xp_transactions FOR SELECT
  USING (user_id = auth.uid());


-- ============================================================
-- FRIENDSHIPS POLICIES
-- Users can see friendships they are part of.
-- Users can insert friendships where they are one of the parties.
-- Users can update friendships they are part of (accept/block).
-- Users can delete friendships they are part of.
-- ============================================================
CREATE POLICY "friendships_select_own"
  ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_insert_own"
  ON friendships FOR INSERT
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_update_own"
  ON friendships FOR UPDATE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_delete_own"
  ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());


-- ============================================================
-- FRIEND CIRCLES POLICIES
-- Users can see circles they belong to.
-- Users can create circles.
-- ============================================================
CREATE POLICY "friend_circles_select_member"
  ON friend_circles FOR SELECT
  USING (
    id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "friend_circles_insert_own"
  ON friend_circles FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "friend_circles_update_admin"
  ON friend_circles FOR UPDATE
  USING (
    id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "friend_circles_delete_creator"
  ON friend_circles FOR DELETE
  USING (creator_id = auth.uid());


-- ============================================================
-- CIRCLE MEMBERS POLICIES
-- Users can see members of circles they belong to.
-- Admins can add/remove members.
-- ============================================================
CREATE POLICY "circle_members_select_in_circle"
  ON circle_members FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "circle_members_insert_admin"
  ON circle_members FOR INSERT
  WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "circle_members_delete_admin_or_self"
  ON circle_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- SOCIAL NUDGES POLICIES
-- Users can see nudges sent to them and nudges they sent.
-- Users can send nudges (insert as sender).
-- Recipients can mark nudges as read.
-- ============================================================
CREATE POLICY "social_nudges_select_recipient"
  ON social_nudges FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "social_nudges_select_sender"
  ON social_nudges FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "social_nudges_insert_sender"
  ON social_nudges FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "social_nudges_update_recipient"
  ON social_nudges FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());


-- ============================================================
-- NOTIFICATIONS POLICIES
-- Users can only access their own notifications.
-- ============================================================
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 13.8 Indexes

```sql
-- ============================================================
-- PERFORMANCE INDEXES
-- Indexes on foreign keys and frequently queried columns
-- ============================================================

-- Calendar connections
CREATE INDEX idx_calendar_connections_user_id
  ON calendar_connections(user_id);

-- Calendar events
CREATE INDEX idx_calendar_events_user_id_start_time
  ON calendar_events(user_id, start_time);
CREATE INDEX idx_calendar_events_connection_id
  ON calendar_events(calendar_connection_id);
CREATE INDEX idx_calendar_events_category
  ON calendar_events(user_id, category);

-- Plaid connections
CREATE INDEX idx_plaid_connections_user_id
  ON plaid_connections(user_id);

-- Accounts
CREATE INDEX idx_accounts_user_id
  ON accounts(user_id);
CREATE INDEX idx_accounts_plaid_connection_id
  ON accounts(plaid_connection_id);

-- Transactions
CREATE INDEX idx_transactions_user_id_date
  ON transactions(user_id, date);
CREATE INDEX idx_transactions_account_id
  ON transactions(account_id);
CREATE INDEX idx_transactions_category
  ON transactions(user_id, category);
CREATE INDEX idx_transactions_recurring_group
  ON transactions(recurring_group_id)
  WHERE recurring_group_id IS NOT NULL;
CREATE INDEX idx_transactions_pending
  ON transactions(user_id, pending)
  WHERE pending = true;

-- Recurring transactions
CREATE INDEX idx_recurring_transactions_user_id
  ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_next_date
  ON recurring_transactions(next_expected_date)
  WHERE is_active = true;

-- Spending predictions
CREATE INDEX idx_spending_predictions_user_id_event
  ON spending_predictions(user_id, calendar_event_id);
CREATE INDEX idx_spending_predictions_created
  ON spending_predictions(user_id, created_at);

-- Prediction feedback
CREATE INDEX idx_prediction_feedback_prediction
  ON prediction_feedback(prediction_id);
CREATE INDEX idx_prediction_feedback_user
  ON prediction_feedback(user_id);

-- Budgets
CREATE INDEX idx_budgets_user_id_period
  ON budgets(user_id, period_start, period_end);
CREATE INDEX idx_budgets_user_category
  ON budgets(user_id, category);

-- Budget snapshots
CREATE INDEX idx_budget_snapshots_budget_date
  ON budget_snapshots(budget_id, date);
CREATE INDEX idx_budget_snapshots_user
  ON budget_snapshots(user_id);

-- User badges
CREATE INDEX idx_user_badges_user_id
  ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id
  ON user_badges(badge_id);

-- Challenges
CREATE INDEX idx_challenges_creator
  ON challenges(creator_id);
CREATE INDEX idx_challenges_template
  ON challenges(is_template)
  WHERE is_template = true;

-- Challenge participants
CREATE INDEX idx_challenge_participants_challenge_user
  ON challenge_participants(challenge_id, user_id);
CREATE INDEX idx_challenge_participants_user
  ON challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_status
  ON challenge_participants(status)
  WHERE status = 'active';

-- Streak history
CREATE INDEX idx_streak_history_user
  ON streak_history(user_id);
CREATE INDEX idx_streak_history_active
  ON streak_history(user_id, streak_type)
  WHERE is_active = true;

-- XP transactions
CREATE INDEX idx_xp_transactions_user
  ON xp_transactions(user_id, created_at);

-- Friendships
CREATE INDEX idx_friendships_user_status
  ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend_status
  ON friendships(friend_id, status);

-- Friend circles
CREATE INDEX idx_friend_circles_creator
  ON friend_circles(creator_id);

-- Circle members
CREATE INDEX idx_circle_members_circle
  ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user
  ON circle_members(user_id);

-- Social nudges
CREATE INDEX idx_social_nudges_recipient
  ON social_nudges(recipient_id, is_read, created_at);
CREATE INDEX idx_social_nudges_sender
  ON social_nudges(sender_id, created_at);

-- Notifications
CREATE INDEX idx_notifications_user_read_sent
  ON notifications(user_id, is_read, sent_at);
CREATE INDEX idx_notifications_category
  ON notifications(user_id, category);
```

### 13.9 Realtime Subscriptions

```sql
-- ============================================================
-- SUPABASE REALTIME
-- Enable realtime subscriptions on tables that need live updates
-- ============================================================

-- Enable realtime on notification-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE social_nudges;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_participants;

-- Realtime use cases:
-- 1. notifications    -> Instant push notification delivery to the client.
--                        Client subscribes to INSERT events filtered by user_id.
-- 2. social_nudges    -> Real-time nudge delivery between friends.
--                        Client subscribes to INSERT events filtered by recipient_id.
-- 3. challenge_participants -> Live leaderboard updates and progress tracking.
--                        Client subscribes to UPDATE events filtered by challenge_id
--                        to see progress changes from all participants in real time.
```

---

## 14. API Design

All endpoints require a valid Supabase JWT in the `Authorization: Bearer <token>` header unless stated otherwise. Responses follow a consistent envelope format:

```json
{
  "data": { ... },
  "error": null,
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-02-28T12:00:00Z"
  }
}
```

Error responses:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": { ... }
  },
  "meta": { ... }
}
```

Standard HTTP status codes: `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `422` Unprocessable Entity, `429` Rate Limited, `500` Internal Server Error.

### 14.1 Auth Module

Authentication is handled natively by Supabase Auth. These endpoints are provided by the Supabase client SDK (`@supabase/supabase-js`) and do not require custom Edge Functions.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/v1/signup` | Register with email and password | No |
| `POST` | `/auth/v1/token?grant_type=password` | Login with email and password | No |
| `POST` | `/auth/v1/logout` | Invalidate current session | Yes |
| `GET`  | `/auth/v1/user` | Get current authenticated user | Yes |
| `POST` | `/auth/v1/token?grant_type=refresh_token` | Refresh access token | No (refresh token) |
| `POST` | `/auth/v1/recover` | Send password reset email | No |

**POST /auth/v1/signup**

```
Request:
{
  "email": "student@sfu.ca",
  "password": "securePassword123!",
  "data": {
    "display_name": "Alex Chen"
  }
}

Response (201):
{
  "id": "a1b2c3d4-...",
  "email": "student@sfu.ca",
  "created_at": "2026-02-28T08:00:00Z",
  "user_metadata": {
    "display_name": "Alex Chen"
  }
}
```

### 14.2 Calendar Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/calendar/connect` | Initiate OAuth flow for calendar provider | Yes |
| `GET`  | `/api/calendar/events` | List synced events | Yes |
| `POST` | `/api/calendar/sync` | Force calendar sync | Yes |
| `POST` | `/api/calendar/import-ical` | Upload .ics file | Yes |
| `DELETE` | `/api/calendar/disconnect/:connectionId` | Remove calendar connection | Yes |

**POST /api/calendar/connect**

Initiates the OAuth2 flow for a calendar provider. Returns the authorization URL to redirect the user.

```
Request:
{
  "provider": "google",
  "redirect_uri": "futurespend://callback/calendar"
}

Response (200):
{
  "data": {
    "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&scope=https://www.googleapis.com/auth/calendar.readonly&redirect_uri=...",
    "state": "random-state-token"
  }
}
```

**GET /api/calendar/events**

```
Query Parameters:
  - start_date (ISO 8601, required): "2026-03-01"
  - end_date (ISO 8601, required): "2026-03-31"
  - category (optional): "dining"
  - limit (optional, default 50): 20
  - offset (optional, default 0): 0

Response (200):
{
  "data": {
    "events": [
      {
        "id": "evt-uuid-1",
        "title": "Team dinner at Earls",
        "description": "End of sprint celebration",
        "location": "Earls Kitchen + Bar, Burnaby",
        "start_time": "2026-03-05T18:30:00-08:00",
        "end_time": "2026-03-05T21:00:00-08:00",
        "is_all_day": false,
        "attendee_count": 6,
        "category": "dining",
        "prediction": {
          "predicted_amount": 45.00,
          "confidence_label": "high"
        }
      }
    ],
    "total": 1,
    "has_more": false
  }
}
```

**POST /api/calendar/sync**

```
Request:
{
  "connection_id": "conn-uuid-1"   // optional; syncs all if omitted
}

Response (200):
{
  "data": {
    "synced_count": 23,
    "new_events": 5,
    "updated_events": 3,
    "last_sync_at": "2026-02-28T12:34:56Z"
  }
}
```

**POST /api/calendar/import-ical**

```
Content-Type: multipart/form-data
Body: file=<.ics file>

Response (201):
{
  "data": {
    "imported_count": 12,
    "skipped_duplicates": 2,
    "events": [ ... ]
  }
}
```

**DELETE /api/calendar/disconnect/:connectionId**

```
Response (200):
{
  "data": {
    "disconnected": true,
    "events_removed": 45
  }
}
```

### 14.3 Finance Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/plaid/create-link-token` | Get Plaid Link initialization token | Yes |
| `POST` | `/api/plaid/exchange-token` | Exchange public token for access token | Yes |
| `GET`  | `/api/accounts` | List connected bank accounts | Yes |
| `GET`  | `/api/transactions` | List transactions with filters | Yes |
| `POST` | `/api/transactions/:id/review` | Mark transaction as reviewed | Yes |
| `GET`  | `/api/recurring` | List detected recurring transactions | Yes |
| `GET`  | `/api/balances` | Get current balances for all accounts | Yes |

**POST /api/plaid/create-link-token**

```
Request:
{
  "products": ["transactions"],
  "country_codes": ["CA"],
  "language": "en"
}

Response (200):
{
  "data": {
    "link_token": "link-sandbox-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "expiration": "2026-02-28T16:00:00Z"
  }
}
```

**POST /api/plaid/exchange-token**

```
Request:
{
  "public_token": "public-sandbox-xxxxxxxx-xxxx",
  "institution": {
    "name": "Royal Bank of Canada",
    "institution_id": "ins_xxxxx"
  }
}

Response (201):
{
  "data": {
    "connection_id": "plaid-conn-uuid",
    "institution_name": "Royal Bank of Canada",
    "accounts_linked": 2
  }
}
```

**GET /api/transactions**

```
Query Parameters:
  - start_date (ISO 8601, optional): "2026-02-01"
  - end_date (ISO 8601, optional): "2026-02-28"
  - category (optional): "dining"
  - account_id (UUID, optional): "acct-uuid"
  - pending (boolean, optional): false
  - limit (optional, default 50): 25
  - offset (optional, default 0): 0

Response (200):
{
  "data": {
    "transactions": [
      {
        "id": "txn-uuid-1",
        "amount": 12.50,
        "currency": "CAD",
        "merchant_name": "Tim Hortons",
        "category": "dining",
        "subcategory": "coffee_shop",
        "date": "2026-02-27",
        "pending": false,
        "is_recurring": true,
        "reviewed": false,
        "account": {
          "id": "acct-uuid",
          "name": "Chequing"
        }
      }
    ],
    "total": 142,
    "has_more": true
  }
}
```

**GET /api/balances**

```
Response (200):
{
  "data": {
    "accounts": [
      {
        "id": "acct-uuid-1",
        "name": "Chequing",
        "institution": "Royal Bank of Canada",
        "type": "depository",
        "subtype": "checking",
        "current_balance": 2340.50,
        "available_balance": 2290.50,
        "currency": "CAD",
        "last_updated": "2026-02-28T10:00:00Z"
      },
      {
        "id": "acct-uuid-2",
        "name": "Visa Infinite",
        "institution": "Royal Bank of Canada",
        "type": "credit",
        "subtype": "credit card",
        "current_balance": -485.30,
        "available_balance": 4514.70,
        "currency": "CAD",
        "last_updated": "2026-02-28T10:00:00Z"
      }
    ],
    "total_balance": 1855.20,
    "net_worth": 1855.20
  }
}
```

### 14.4 Budget Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/budgets` | List all budgets for current period | Yes |
| `POST` | `/api/budgets` | Create or update a budget | Yes |
| `GET`  | `/api/budgets/:category/status` | Budget status with burn rate and predictions | Yes |
| `GET`  | `/api/budgets/overview` | Dashboard summary with all budget metrics | Yes |

**POST /api/budgets**

```
Request:
{
  "category": "dining",
  "monthly_limit": 300.00,
  "period_start": "2026-03-01",
  "period_end": "2026-03-31"
}

Response (201):
{
  "data": {
    "id": "budget-uuid",
    "category": "dining",
    "monthly_limit": 300.00,
    "period_start": "2026-03-01",
    "period_end": "2026-03-31",
    "created_at": "2026-02-28T12:00:00Z"
  }
}
```

**GET /api/budgets/overview** (Example Request/Response)

```
Query Parameters:
  - period (optional, default "current"): "current" | "2026-02"

Response (200):
{
  "data": {
    "period": {
      "start": "2026-02-01",
      "end": "2026-02-28",
      "days_elapsed": 28,
      "days_remaining": 0
    },
    "total_budget": 1500.00,
    "total_spent": 1187.45,
    "total_predicted_remaining": 0.00,
    "overall_status": "on_track",
    "categories": [
      {
        "category": "dining",
        "budget_limit": 300.00,
        "spent": 267.50,
        "predicted_remaining": 0.00,
        "burn_rate": 9.55,
        "status": "warning",
        "percent_used": 89.2,
        "trend": "increasing"
      },
      {
        "category": "groceries",
        "budget_limit": 400.00,
        "spent": 312.80,
        "predicted_remaining": 0.00,
        "burn_rate": 11.17,
        "status": "on_track",
        "percent_used": 78.2,
        "trend": "stable"
      },
      {
        "category": "entertainment",
        "budget_limit": 150.00,
        "spent": 45.00,
        "predicted_remaining": 0.00,
        "burn_rate": 1.61,
        "status": "under_budget",
        "percent_used": 30.0,
        "trend": "decreasing"
      }
    ],
    "upcoming_predictions": {
      "total_predicted": 85.00,
      "by_category": {
        "dining": 45.00,
        "entertainment": 40.00
      }
    },
    "financial_health_score": 72,
    "savings_rate": 0.21
  }
}
```

### 14.5 Prediction Module

Edge Functions act as a gateway to the internal AI microservice. The Edge Function authenticates the user, fetches context from the database, calls the AI service, stores the result, and returns it.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/predictions` | List upcoming predictions | Yes |
| `GET`  | `/api/predictions/:eventId` | Get prediction for specific event | Yes |
| `POST` | `/api/predictions/batch` | Trigger batch prediction for date range | Yes |
| `POST` | `/api/predictions/:id/feedback` | Submit prediction feedback | Yes |
| `GET`  | `/api/predictions/accuracy` | Get prediction accuracy statistics | Yes |

**GET /api/predictions** (Example Request/Response)

```
Query Parameters:
  - start_date (optional): "2026-03-01"
  - end_date (optional): "2026-03-07"
  - category (optional): "dining"
  - min_confidence (optional, 0-1): 0.5

Response (200):
{
  "data": {
    "predictions": [
      {
        "id": "pred-uuid-1",
        "calendar_event": {
          "id": "evt-uuid-1",
          "title": "Team dinner at Earls",
          "start_time": "2026-03-05T18:30:00-08:00",
          "location": "Earls Kitchen + Bar, Burnaby",
          "attendee_count": 6
        },
        "predicted_category": "dining",
        "predicted_amount": 45.00,
        "prediction_low": 32.00,
        "prediction_high": 65.00,
        "confidence_score": 0.82,
        "confidence_label": "high",
        "explanation": "Based on your past dining history at similar restaurants with groups of 5-8 people, you typically spend $40-$55. Earls average entree price is $22-$28.",
        "model_version": "v1.0",
        "created_at": "2026-02-28T10:00:00Z"
      },
      {
        "id": "pred-uuid-2",
        "calendar_event": {
          "id": "evt-uuid-2",
          "title": "Uber to Airport",
          "start_time": "2026-03-07T06:00:00-08:00",
          "location": "YVR Airport",
          "attendee_count": 1
        },
        "predicted_category": "transport",
        "predicted_amount": 38.00,
        "prediction_low": 28.00,
        "prediction_high": 52.00,
        "confidence_score": 0.71,
        "confidence_label": "medium",
        "explanation": "Estimated Uber fare from your home area to YVR. Surge pricing possible at 6 AM. Your past rides to YVR averaged $35.",
        "model_version": "v1.0",
        "created_at": "2026-02-28T10:00:00Z"
      }
    ],
    "total": 2,
    "total_predicted_spend": 83.00
  }
}
```

**POST /api/predictions/:id/feedback**

```
Request:
{
  "feedback_type": "wrong_amount",
  "corrected_amount": 52.30,
  "corrected_category": null
}

Response (200):
{
  "data": {
    "feedback_id": "fb-uuid-1",
    "prediction_id": "pred-uuid-1",
    "xp_earned": 10,
    "message": "Thanks for the feedback! This helps improve future predictions."
  }
}
```

**GET /api/predictions/accuracy**

```
Query Parameters:
  - period (optional): "30d" | "90d" | "all" (default "30d")

Response (200):
{
  "data": {
    "period": "30d",
    "total_predictions": 47,
    "accurate_count": 34,
    "accuracy_rate": 0.723,
    "mean_absolute_error": 8.45,
    "by_category": {
      "dining": { "accuracy": 0.81, "count": 18, "avg_error": 5.20 },
      "transport": { "accuracy": 0.72, "count": 12, "avg_error": 7.80 },
      "entertainment": { "accuracy": 0.65, "count": 8, "avg_error": 12.10 },
      "shopping": { "accuracy": 0.56, "count": 9, "avg_error": 15.30 }
    },
    "trend": "improving",
    "feedback_count": 22
  }
}
```

### 14.6 AI Chat Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/chat` | Send message to AI assistant (streaming) | Yes |
| `GET`  | `/api/chat/history` | Get conversation history | Yes |
| `GET`  | `/api/chat/suggestions` | Get contextual suggested questions | Yes |

**POST /api/chat** (Example Request/Response)

The chat endpoint streams responses using Server-Sent Events (SSE) for real-time token delivery.

```
Request:
{
  "message": "Can I afford to go out for dinner this weekend?",
  "context": {
    "include_budget": true,
    "include_predictions": true
  }
}

Response (200, text/event-stream):
data: {"type": "start", "message_id": "msg-uuid-1"}

data: {"type": "token", "content": "Based "}
data: {"type": "token", "content": "on your "}
data: {"type": "token", "content": "current budget, "}
...
data: {"type": "token", "content": "you have $32.50 remaining in your dining budget this month. "}
data: {"type": "token", "content": "You have a team dinner at Earls on Wednesday (predicted: $45), "}
data: {"type": "token", "content": "which would put you $12.50 over budget. "}
data: {"type": "token", "content": "Consider a more affordable option this weekend, "}
data: {"type": "token", "content": "or adjust your dining budget if you have room in other categories."}

data: {"type": "end", "message_id": "msg-uuid-1", "usage": {"prompt_tokens": 892, "completion_tokens": 64}}

data: {"type": "suggestions", "items": [
  "What if I skip the team dinner?",
  "Show me my cheapest dining options this month",
  "Can I move budget from entertainment to dining?"
]}
```

**GET /api/chat/suggestions**

```
Response (200):
{
  "data": {
    "suggestions": [
      "How am I doing on my budget this month?",
      "What upcoming events will cost the most?",
      "Help me save $100 this month",
      "What are my biggest spending categories?"
    ],
    "context": "mid_month_budget_check"
  }
}
```

### 14.7 Gamification Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/profile/stats` | Get XP, level, streaks, badges | Yes |
| `GET`  | `/api/badges` | List all badges with earned status | Yes |
| `GET`  | `/api/challenges` | List available and active challenges | Yes |
| `POST` | `/api/challenges` | Create custom challenge | Yes |
| `POST` | `/api/challenges/:id/join` | Join a challenge | Yes |
| `GET`  | `/api/challenges/:id/leaderboard` | Challenge leaderboard | Yes |
| `POST` | `/api/streaks/checkin` | Perform daily check-in | Yes |

**GET /api/profile/stats**

```
Response (200):
{
  "data": {
    "xp": 2450,
    "level": 8,
    "xp_to_next_level": 550,
    "xp_for_next_level": 3000,
    "streak": {
      "current": 14,
      "longest": 21,
      "type": "daily_checkin"
    },
    "badges_earned": 12,
    "badges_total": 35,
    "recent_badges": [
      {
        "name": "Budget Boss",
        "tier": "silver",
        "icon_url": "/badges/budget-boss-silver.png",
        "earned_at": "2026-02-25T09:00:00Z"
      }
    ],
    "active_challenges": 2,
    "financial_health_score": 72
  }
}
```

**POST /api/challenges**

```
Request:
{
  "title": "No-Spend Weekend Warriors",
  "description": "Zero non-essential spending for one full weekend",
  "challenge_type": "no_spend",
  "duration_days": 3,
  "goal": {
    "max_spend": 0,
    "excluded_categories": ["groceries", "bills", "transport"]
  },
  "reward_xp": 200,
  "starts_at": "2026-03-07T00:00:00-08:00"
}

Response (201):
{
  "data": {
    "id": "chal-uuid-1",
    "title": "No-Spend Weekend Warriors",
    "invite_code": "NSWW2026",
    "starts_at": "2026-03-07T00:00:00-08:00",
    "ends_at": "2026-03-09T23:59:59-08:00",
    "participants": 1,
    "created_at": "2026-02-28T12:00:00Z"
  }
}
```

**GET /api/challenges/:id/leaderboard**

```
Response (200):
{
  "data": {
    "challenge": {
      "id": "chal-uuid-1",
      "title": "March Savings Sprint",
      "ends_at": "2026-03-31T23:59:59-08:00"
    },
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": "user-uuid-1",
          "display_name": "Alex C.",
          "avatar_url": "/avatars/alex.jpg",
          "level": 8
        },
        "progress": {
          "saved": 245.00,
          "goal": 300.00,
          "percent": 81.7
        },
        "status": "active"
      },
      {
        "rank": 2,
        "user": {
          "id": "user-uuid-2",
          "display_name": "Jordan M.",
          "avatar_url": "/avatars/jordan.jpg",
          "level": 6
        },
        "progress": {
          "saved": 198.50,
          "goal": 300.00,
          "percent": 66.2
        },
        "status": "active"
      }
    ],
    "your_rank": 1,
    "total_participants": 5
  }
}
```

**POST /api/streaks/checkin**

```
Response (200):
{
  "data": {
    "streak_count": 15,
    "xp_earned": 15,
    "bonus_xp": 5,
    "bonus_reason": "15-day milestone! Bonus XP earned.",
    "next_milestone": 21,
    "checked_in_at": "2026-02-28T08:30:00Z"
  }
}
```

### 14.8 Social Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/friends` | List friends with status | Yes |
| `POST` | `/api/friends/add` | Send friend request by friend code | Yes |
| `POST` | `/api/friends/:id/accept` | Accept a friend request | Yes |
| `DELETE` | `/api/friends/:id` | Remove a friend | Yes |
| `GET`  | `/api/circles` | List friend circles | Yes |
| `POST` | `/api/circles` | Create a friend circle | Yes |
| `POST` | `/api/circles/:id/invite` | Invite user to circle | Yes |
| `GET`  | `/api/circles/:id/leaderboard` | Circle leaderboard | Yes |
| `POST` | `/api/nudge` | Send a social nudge | Yes |
| `GET`  | `/api/leaderboard` | Global/friends/circle leaderboard | Yes |

**POST /api/friends/add**

```
Request:
{
  "friend_code": "A3F8K2M1"
}

Response (201):
{
  "data": {
    "friendship_id": "fs-uuid-1",
    "friend": {
      "display_name": "Jordan M.",
      "avatar_url": "/avatars/jordan.jpg",
      "level": 6
    },
    "status": "pending",
    "message": "Friend request sent to Jordan M."
  }
}
```

**POST /api/nudge**

```
Request:
{
  "recipient_id": "user-uuid-2",
  "nudge_type": "encouragement",
  "content": "You're so close to your savings goal! Keep it up! 💪"
}

Response (201):
{
  "data": {
    "nudge_id": "nudge-uuid-1",
    "sent_to": "Jordan M.",
    "xp_earned": 5,
    "created_at": "2026-02-28T14:00:00Z"
  }
}
```

**GET /api/leaderboard**

```
Query Parameters:
  - scope (required): "friends" | "circle" | "global"
  - circle_id (required if scope=circle): "circle-uuid"
  - metric (optional, default "xp"): "xp" | "savings" | "streak" | "accuracy"
  - period (optional, default "monthly"): "weekly" | "monthly" | "all_time"
  - limit (optional, default 20): 10

Response (200):
{
  "data": {
    "scope": "friends",
    "metric": "xp",
    "period": "monthly",
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": "user-uuid-1",
          "display_name": "Alex C.",
          "avatar_url": "/avatars/alex.jpg",
          "level": 8
        },
        "value": 2450,
        "change": 3
      },
      {
        "rank": 2,
        "user": {
          "id": "user-uuid-2",
          "display_name": "Jordan M.",
          "avatar_url": "/avatars/jordan.jpg",
          "level": 6
        },
        "value": 1980,
        "change": -1
      }
    ],
    "your_position": {
      "rank": 1,
      "value": 2450,
      "percentile": 95
    },
    "total_participants": 8
  }
}
```

### 14.9 Notification Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET`  | `/api/notifications` | List notifications | Yes |
| `POST` | `/api/notifications/:id/read` | Mark notification as read | Yes |
| `PUT`  | `/api/notifications/preferences` | Update notification preferences | Yes |
| `POST` | `/api/notifications/register-token` | Register push notification token | Yes |

**GET /api/notifications**

```
Query Parameters:
  - unread_only (boolean, optional): true
  - category (optional): "social" | "budget" | "prediction" | "challenge" | "system"
  - limit (optional, default 20): 20
  - offset (optional, default 0): 0

Response (200):
{
  "data": {
    "notifications": [
      {
        "id": "notif-uuid-1",
        "title": "Budget Alert",
        "body": "You've used 90% of your dining budget with 3 days remaining.",
        "category": "budget",
        "priority": "high",
        "data": {
          "budget_id": "budget-uuid",
          "category": "dining",
          "percent_used": 90,
          "action": "view_budget"
        },
        "is_read": false,
        "sent_at": "2026-02-28T12:00:00Z"
      },
      {
        "id": "notif-uuid-2",
        "title": "New Badge Earned!",
        "body": "You earned the 'Budget Boss' silver badge. +50 XP!",
        "category": "challenge",
        "priority": "medium",
        "data": {
          "badge_id": "badge-uuid",
          "badge_name": "Budget Boss",
          "tier": "silver",
          "action": "view_badge"
        },
        "is_read": true,
        "sent_at": "2026-02-25T09:00:00Z",
        "read_at": "2026-02-25T09:05:00Z"
      }
    ],
    "unread_count": 3,
    "total": 24,
    "has_more": true
  }
}
```

**PUT /api/notifications/preferences**

```
Request:
{
  "budget_alerts": true,
  "prediction_ready": true,
  "social_nudges": true,
  "challenge_updates": true,
  "weekly_summary": true,
  "marketing": false,
  "quiet_hours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00",
    "timezone": "America/Vancouver"
  }
}

Response (200):
{
  "data": {
    "preferences_updated": true,
    "updated_at": "2026-02-28T12:00:00Z"
  }
}
```

**POST /api/notifications/register-token**

```
Request:
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "device_id": "device-uuid"
}

Response (200):
{
  "data": {
    "registered": true
  }
}
```

### 14.10 AI Service API (Internal FastAPI Microservice)

These endpoints are internal-only, called by Supabase Edge Functions. They are not exposed to the client. Authentication is via a shared service API key in the `X-Service-Key` header.

Base URL: `http://ai-service:8000` (internal Docker network)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/ml/predict` | Single event spending prediction | Service Key |
| `POST` | `/ml/batch-predict` | Batch event predictions | Service Key |
| `POST` | `/ml/classify-event` | Classify event category only | Service Key |
| `GET`  | `/ml/model/status` | Model health check and version info | Service Key |
| `POST` | `/ml/feedback` | Submit training feedback data | Service Key |

**POST /ml/predict**

```
Request:
{
  "event": {
    "title": "Team dinner at Earls",
    "description": "End of sprint celebration",
    "location": "Earls Kitchen + Bar, Burnaby",
    "start_time": "2026-03-05T18:30:00-08:00",
    "duration": 150,
    "attendees": 6,
    "recurrence": null
  },
  "user_context": {
    "user_id": "user-uuid-1",
    "historical_avg": {
      "dining": 42.50,
      "dining_group": 55.00,
      "earls": 48.00
    },
    "budget_status": {
      "dining": {
        "limit": 300.00,
        "spent": 267.50,
        "remaining": 32.50
      }
    },
    "similar_events": [
      {
        "title": "Team lunch at Cactus Club",
        "amount": 38.50,
        "attendees": 5,
        "date": "2026-01-20"
      },
      {
        "title": "Birthday dinner at Earls",
        "amount": 62.00,
        "attendees": 8,
        "date": "2025-12-15"
      }
    ]
  }
}

Response (200):
{
  "category": "dining",
  "amount": 45.00,
  "confidence": 0.82,
  "interval": {
    "low": 32.00,
    "high": 65.00
  },
  "explanation": "Based on your past dining history at similar restaurants with groups of 5-8 people, you typically spend $40-$55. Earls average entree price is $22-$28. Predicted $45 with high confidence.",
  "model_version": "v1.0",
  "features_used": [
    "merchant_history",
    "group_size",
    "time_of_day",
    "day_of_week",
    "location_price_level"
  ]
}
```

**POST /ml/batch-predict**

```
Request:
{
  "events": [
    { "title": "Team dinner at Earls", ... },
    { "title": "Uber to Airport", ... },
    { "title": "Grocery run", ... }
  ],
  "user_context": { ... }
}

Response (200):
{
  "predictions": [
    { "event_index": 0, "category": "dining", "amount": 45.00, "confidence": 0.82, ... },
    { "event_index": 1, "category": "transport", "amount": 38.00, "confidence": 0.71, ... },
    { "event_index": 2, "category": "groceries", "amount": 65.00, "confidence": 0.68, ... }
  ],
  "total_predicted": 148.00,
  "processing_time_ms": 245
}
```

**POST /ml/classify-event**

```
Request:
{
  "title": "Yoga class at YYoga",
  "description": "Weekly hot yoga session",
  "location": "YYoga Burnaby"
}

Response (200):
{
  "category": "fitness",
  "confidence": 0.94,
  "alternatives": [
    { "category": "health", "confidence": 0.04 },
    { "category": "entertainment", "confidence": 0.02 }
  ]
}
```

**GET /ml/model/status**

```
Response (200):
{
  "status": "healthy",
  "model_version": "v1.0",
  "last_trained": "2026-02-27T03:00:00Z",
  "total_predictions": 15432,
  "accuracy_30d": 0.723,
  "uptime_seconds": 86400,
  "memory_usage_mb": 512
}
```

**POST /ml/feedback**

```
Request:
{
  "prediction_id": "pred-uuid-1",
  "user_id": "user-uuid-1",
  "feedback_type": "wrong_amount",
  "predicted_amount": 45.00,
  "actual_amount": 52.30,
  "predicted_category": "dining",
  "actual_category": "dining"
}

Response (200):
{
  "received": true,
  "feedback_id": "fb-uuid-1",
  "retraining_queued": false,
  "feedback_count_since_retrain": 18,
  "retrain_threshold": 50
}
```

### 14.11 WebSocket Events (Supabase Realtime)

Clients subscribe to Supabase Realtime channels to receive live updates. All channels require authentication.

| Channel | Event | Payload | Trigger |
|---------|-------|---------|---------|
| `notifications:{user_id}` | `notification:new` | Full notification object | New row inserted into `notifications` |
| `nudges:{user_id}` | `nudge:received` | Nudge object with sender info | New row inserted into `social_nudges` |
| `challenges:{challenge_id}` | `challenge:progress` | Participant progress update | Row updated in `challenge_participants` |
| `challenges:{challenge_id}` | `leaderboard:update` | Updated rankings array | Computed on `challenge_participants` changes |
| `predictions:{user_id}` | `prediction:updated` | Updated prediction object | Prediction refined after new data |

**Client subscription example (TypeScript):**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to real-time notifications
const notificationChannel = supabase
  .channel(`notifications:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      const notification = payload.new;
      // Show push notification / update badge count
      showToast(notification.title, notification.body);
      incrementUnreadCount();
    }
  )
  .subscribe();

// Subscribe to challenge leaderboard updates
const challengeChannel = supabase
  .channel(`challenges:${challengeId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'challenge_participants',
      filter: `challenge_id=eq.${challengeId}`
    },
    (payload) => {
      const updated = payload.new;
      // Update leaderboard UI in real time
      updateLeaderboardEntry(updated.user_id, updated.progress);
    }
  )
  .subscribe();

// Subscribe to social nudges
const nudgeChannel = supabase
  .channel(`nudges:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'social_nudges',
      filter: `recipient_id=eq.${userId}`
    },
    (payload) => {
      const nudge = payload.new;
      // Show nudge notification with sender info
      showNudgeNotification(nudge);
    }
  )
  .subscribe();

// Cleanup on unmount
const cleanup = () => {
  supabase.removeChannel(notificationChannel);
  supabase.removeChannel(challengeChannel);
  supabase.removeChannel(nudgeChannel);
};
```

### 14.12 Rate Limiting

Rate limits are enforced at the Edge Function layer using Supabase's built-in rate limiting or a custom token bucket implementation.

| Endpoint Group | Rate Limit | Window |
|----------------|------------|--------|
| Auth endpoints | 10 requests | 1 minute |
| Calendar sync | 5 requests | 1 minute |
| Predictions (single) | 30 requests | 1 minute |
| Predictions (batch) | 5 requests | 1 minute |
| Chat (AI) | 10 requests | 1 minute |
| Social / Nudges | 20 requests | 1 minute |
| General read endpoints | 60 requests | 1 minute |
| General write endpoints | 30 requests | 1 minute |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
X-RateLimit-Reset: 1709125260
```

When rate limited, the API returns:

```json
{
  "data": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again in 45 seconds.",
    "details": {
      "retry_after": 45
    }
  }
}
```

HTTP Status: `429 Too Many Requests`



---

## 15. Screen-by-Screen UI Specification

All screens use the FutureSpend dark theme: `#0A1628` background, `#0F2847` card surfaces, `#00D09C` teal accent, `#FFFFFF` primary text, `#8899AA` secondary text, `#FF6B6B` destructive/over-budget red, `#FFD93D` warning yellow. Typography: Inter/SF Pro. Border radius: 16px cards, 12px buttons. All screens assume safe-area insets for iOS notch/Dynamic Island and Android status bar.

---

### Screen 1: Onboarding -- Welcome

**Layout Description:**
Full-screen splash with vertically centered content. App logo (stylized crystal ball with calendar grid overlay) animates in with a subtle glow pulse at the top third of the screen. Below the logo, the tagline fades in word by word. Three feature highlight cards are stacked vertically with staggered entrance animations. A prominent CTA button sits at the bottom with a secondary text link beneath it.

**Key Components:**
- `AnimatedLogo` -- Lottie animation of the FutureSpend logo with teal glow pulse effect
- `TaglineText` -- "See Tomorrow, Save Today, Share Success" with sequential word fade-in
- `FeatureHighlightRow` -- Three horizontal cards, each with an icon and short label:
  - Calendar icon + "Calendar Intelligence" -- "Your schedule predicts your spending"
  - Brain/sparkle icon + "Smart Predictions" -- "AI-powered expense forecasting"
  - People icon + "Social Savings" -- "Save more together with friends"
- `PrimaryButton` -- "Get Started" (`#00D09C` background, `#0A1628` text, full width minus 32px margin, 56px height, 12px border radius)
- `SecondaryLink` -- "Already have an account? Log In" (`#8899AA` text, tappable)

**Data Requirements:**
- None (static screen). Check AsyncStorage for existing session token to auto-redirect returning users.

**User Actions:**
- Tap "Get Started" --> Navigate to Sign Up screen
- Tap "Log In" --> Navigate to Login screen
- Logo animation loops until user interacts

---

### Screen 2: Onboarding -- Connect Calendar

**Layout Description:**
Top section has a progress indicator (4 dots, second dot active). Below that, a large calendar illustration (stylized calendar with event blocks glowing teal). Header and subtext are center-aligned. Connection options are presented as full-width cards stacked vertically with 12px gaps. Skip option is a subtle text link at the bottom.

**Key Components:**
- `ProgressDots` -- Four dots in a horizontal row, dots 1-2 filled (`#00D09C`), dots 3-4 unfilled (`#1A2A44`)
- `IllustrationGraphic` -- Calendar illustration with animated event blocks (Lottie or static SVG)
- `HeaderText` -- "Connect Your Calendar" (24px, bold, `#FFFFFF`)
- `SubText` -- "We'll analyze your schedule to predict upcoming expenses" (16px, `#8899AA`, center-aligned)
- `ConnectionCard: Google Calendar` -- Card with Google "G" logo, "Connect Google Calendar" label, tap initiates OAuth 2.0 flow. Card background `#0F2847`, border `#1A3A5C`, 16px radius
- `ConnectionCard: Upload .ics` -- Card with upload icon, "Upload Calendar File (.ics)" label, tap opens device file picker filtered to `.ics` files
- `ConnectionCard: Demo Data` -- Card with sparkle icon, "Use Demo Data" label, badge: "Quick Start", loads pre-built calendar events for demo persona
- `SkipLink` -- "Skip for now" (`#8899AA`, underlined)

**Data Requirements:**
- Google OAuth client ID from environment config
- Demo calendar dataset (pre-loaded JSON with 30 days of synthetic events)
- User auth token (from previous sign-up step)

**User Actions:**
- Tap Google Calendar card --> Launch OAuth consent screen, on success store refresh token in Supabase, sync events, advance to next step
- Tap Upload .ics --> Open native file picker, parse .ics file client-side, upload events to Supabase, advance
- Tap Demo Data --> Seed user account with synthetic events, advance
- Tap Skip --> Advance to next step, set `calendar_connected: false` flag

---

### Screen 3: Onboarding -- Connect Bank

**Layout Description:**
Same structural layout as Screen 2 for visual consistency. Progress dots show step 3 of 4. A shield/lock illustration conveys security. The Plaid Link button is the primary CTA. Security trust badges are displayed in a horizontal row below the main action area.

**Key Components:**
- `ProgressDots` -- Dots 1-3 filled, dot 4 unfilled
- `IllustrationGraphic` -- Shield with bank building icon, animated lock closing (Lottie)
- `HeaderText` -- "Link Your Accounts" (24px, bold, `#FFFFFF`)
- `SubText` -- "Securely connect your bank to track spending automatically" (16px, `#8899AA`)
- `PlaidLinkButton` -- Large teal button "Connect Your Bank", tap opens Plaid Link modal (WebView-based). Uses `react-native-plaid-link-sdk`
- `SupportedBanksRow` -- Horizontal scroll of bank logos: RBC (highlighted with teal border), TD, Scotiabank, BMO, CIBC, Chase. RBC logo is slightly larger with a "Featured" micro-badge
- `SecurityBadges` -- Three inline badges with lock/shield icons:
  - "Bank-level 256-bit encryption"
  - "Read-only access"
  - "Your data stays private"
- `DemoDataCard` -- "Use Sandbox Data" card for testing with Plaid sandbox credentials
- `SkipLink` -- "Skip for now"

**Data Requirements:**
- Plaid Link token (generated server-side via `/api/plaid/create-link-token`)
- Plaid public key and environment config (sandbox for hackathon)
- User auth token

**User Actions:**
- Tap "Connect Your Bank" --> Open Plaid Link modal, user selects bank and authenticates, on success exchange public token for access token server-side, sync initial transactions, advance
- Tap "Use Sandbox Data" --> Create Plaid sandbox connection with test credentials, seed with mock transactions, advance
- Tap Skip --> Advance, set `bank_connected: false` flag
- Tap any bank logo --> Informational tooltip about that bank's support status

---

### Screen 4: Onboarding -- Set Budget

**Layout Description:**
Progress dots show step 4 of 4. A large numeric input dominates the top third for the total monthly budget. Below it, an animated pie chart preview shows the suggested category breakdown. Category sliders are in a scrollable list below the chart. The completion button is fixed at the bottom.

**Key Components:**
- `ProgressDots` -- All 4 dots filled (`#00D09C`)
- `HeaderText` -- "Set Your Monthly Budget" (24px, bold)
- `BudgetInput` -- Large numeric input field (48px font, `#FFFFFF`, center-aligned), "$" prefix, formatted with commas. Default value suggested based on income if provided, otherwise blank with placeholder "$2,000"
- `PieChartPreview` -- Animated donut chart (`react-native-svg` or Victory Native) showing category breakdown. Updates in real-time as sliders adjust. Each segment color-coded per category. Center text shows total budget amount
- `CategorySliderList` -- Scrollable list of category rows, each containing:
  - Category icon (emoji or custom SVG)
  - Category name (e.g., "Dining", "Transport", "Entertainment", "Shopping", "Coffee", "Groceries", "Subscriptions", "Health", "Other")
  - Slider (`#00D09C` track) from $0 to budget max
  - Dollar amount label updating in real-time
  - Percentage of total budget
- `SuggestedBreakdown` -- "Use Suggested Split" button that auto-fills sliders based on common ratios (30% dining, 15% transport, 15% entertainment, 15% shopping, 10% coffee, 10% groceries, 5% other)
- `CompletionButton` -- "Looks Good!" (`#00D09C`, full width, 56px height), with confetti animation on tap

**Data Requirements:**
- User income (if provided during sign-up)
- Transaction history (if bank connected) to suggest realistic category budgets
- Default category list and suggested ratios
- Category icon mapping

**User Actions:**
- Type/adjust total budget amount --> Pie chart and slider maximums update
- Drag category sliders --> Real-time pie chart update, remaining unallocated budget shown
- Tap "Use Suggested Split" --> Auto-populate sliders with recommended ratios
- Tap "Looks Good!" --> Save budget config to Supabase, trigger initial prediction pipeline, navigate to Dashboard with celebration animation
- Budget validation: total of category budgets must not exceed total budget (show warning if over)

---

### Screen 5: Dashboard (Metrics Hub)

**Layout Description:**
Vertically scrolling screen with fixed top bar and fixed bottom tab bar. Content sections stack vertically with 16px spacing. This is a clean, metrics-only view — the primary screen users see on every app open. The budget summary card with trajectory chart is the hero element at the top. Category budget circles scroll horizontally below it. The Financial Health Score ring and key metric cards (spending velocity, savings rate, CCI) round out the view. No transaction review, no predictions list, no recurring expenses — those have moved to the Plan tab.

**Key Components:**

*Top Bar (fixed, 56px height):*
- `AppTitle` -- "FutureSpend" left-aligned (18px, bold, `#FFFFFF`)
- `NotificationBell` -- Bell icon (right of center) with red badge circle showing unread count, tap opens notification list
- `ProfileAvatar` -- 36px circular avatar (top-right corner), tap opens Profile/Settings screen. Profile avatar icon appears in the top-right of the header bar on ALL screens — this is the global entry point to Profile/Settings, replacing the old Profile tab

*Budget Summary Card (`#0F2847` background, 16px radius, 16px padding):*
- `BudgetHeadline` -- "$X left" in large text (32px, `#00D09C` if healthy, `#FFD93D` if <20% remaining, `#FF6B6B` if over), "of $Y budget" subtitle (14px, `#8899AA`)
- `SpendingTrajectoryChart` -- Line chart (Victory Native) showing:
  - Solid teal line: actual spending cumulative curve (day 1 to today)
  - Gray dashed line: budget limit (horizontal)
  - Teal dashed line: predicted future spending trajectory (today to month end)
  - Shaded confidence interval around prediction
  - X-axis: days of month, Y-axis: dollar amount
- `BurnRateIndicator` -- Small text: "Spending at 1.08x pace" with directional arrow

*Category Budget Circles (horizontal ScrollView):*
- `CategoryCircle` -- For each budget category:
  - Circular progress indicator (64px diameter, `react-native-svg`)
  - Category icon in center
  - Progress ring color: `#00D09C` (under 70%), `#FFD93D` (70-100%), `#FF6B6B` (over 100%)
  - "$X left" or "$X over" label below (12px)
  - Category name below that (10px, `#8899AA`)
  - Tap --> navigate to Budget Detail View for that category

*Financial Health Score Ring:*
- `HealthScoreRing` -- Large circular gauge (120px diameter, `react-native-svg`) displaying the user's overall Financial Health Score (0-100)
  - Ring color gradient: `#FF6B6B` (0-40), `#FFD93D` (40-70), `#00D09C` (70-100)
  - Score number displayed in center (36px, bold, `#FFFFFF`)
  - Label below: "Financial Health" (12px, `#8899AA`)
  - Tap --> navigate to Insights screen for full breakdown

*Key Metric Cards (horizontal row of 3 cards):*
- `MetricCard: Spending Velocity` -- Current daily spending rate vs budget pace, with directional trend arrow. Shows "Spending at X.XXx pace"
- `MetricCard: Savings Rate` -- Percentage of income saved this month, with comparison to last month
- `MetricCard: CCI (Calendar Correlation Index)` -- Score showing how closely actual spending correlates with calendar-predicted spending, percentage with trend indicator

*Bottom Tab Bar (fixed, 80px height including safe area):*
- Five tabs with icons and labels: Dashboard (grid icon), Calendar (calendar icon), Plan (target/crosshair icon), Arena (trophy icon), Insights (lightbulb/chart icon)
- Active tab: teal icon + teal label
- Inactive tabs: `#8899AA` icon + label

**Data Requirements:**
- User budget configuration (total + per category)
- Current month transactions (aggregated by category)
- Financial Health Score (computed from budget adherence, savings rate, spending patterns)
- Spending velocity and burn rate calculations
- Savings rate for current month
- Calendar Correlation Index (CCI) score
- Notification count
- User profile (avatar, name)

**User Actions:**
- Pull to refresh --> Re-sync transactions, recalculate metrics
- Tap profile avatar (top-right) --> Profile/Settings screen
- Tap notification bell --> Notification list
- Tap budget card --> Expanded budget analysis view
- Tap category circle --> Budget Detail View
- Tap Financial Health Score ring --> Insights screen with full breakdown
- Tap any metric card --> Detailed metric view
- Tab bar navigation to any of the 5 main sections: Dashboard, Calendar, Plan, Arena, Insights

---

### Screen 6: Calendar View

**Layout Description:**
Top section contains a month calendar grid that takes roughly 40% of the screen. Below it, a bottom sheet (draggable) shows details for the selected day. The calendar can toggle between month and week views via a segmented control. Future days have a distinct visual treatment showing predictions.

**Key Components:**

*View Toggle:*
- `SegmentedControl` -- "Month" | "Week" toggle (pill-shaped, teal active indicator)
- Month/Year header with left/right arrows for navigation

*Calendar Grid (Month View):*
- `CalendarGrid` -- 7-column grid (S M T W T F S headers in `#8899AA`)
- `DayCell` -- Each day cell contains:
  - Day number (14px)
  - Spending intensity background: gradient from transparent (no spending) to deeper shades of teal (more spending). Scale: $0=transparent, $10=faint, $50=medium, $100+=full intensity
  - Past days: solid teal tint based on actual spending
  - Future days: dashed teal border with predicted spending tint, slightly transparent
  - Today: teal ring border, slightly elevated (shadow)
  - Event dot indicators below the number (up to 3 dots, colored by category)
  - Days with predictions show a small crystal ball micro-icon

*Calendar Grid (Week View):*
- `WeekTimeline` -- Horizontal day columns, vertical time rows (7am-11pm)
- Event blocks positioned by time and duration
- Each block shows event title, predicted spend overlay
- Color-coded by predicted expense category

*Day Detail Bottom Sheet (draggable, snap points at 40% and 85% height):*
- `DayHeader` -- Selected date (e.g., "Tuesday, March 15"), day-of-week spending comparison badge
- `DayTotalCard` -- Total actual/predicted spend for the day, comparison to typical same-day-of-week average (e.g., "23% more than usual Tuesday")
- `EventList` -- Scrollable list of events for selected day:
  - `EventCard` -- Each event:
    - Time range (e.g., "12:00 PM - 1:30 PM")
    - Event title (bold)
    - Location (if available, `#8899AA`)
    - Predicted spend amount with confidence badge
    - Category tag pill
    - Chevron to expand for more detail
  - Past events show actual spend with prediction accuracy indicator (e.g., "Predicted $25, Actual $22 -- 88% accurate")
- `DaySummary` -- "Typical [Day] spend: $X" comparison metric

**Data Requirements:**
- Calendar events for visible month (from Supabase, synced from Google Calendar)
- Transaction data mapped to dates
- Predictions for future events (amount, confidence, category)
- Historical daily spending averages by day of week
- Spending intensity thresholds for heatmap coloring

**User Actions:**
- Tap day cell --> Load day detail in bottom sheet
- Swipe left/right on calendar --> Navigate months
- Toggle Month/Week view
- Tap event card --> Expand to show prediction details, AI explanation
- Tap expanded event --> Navigate to full prediction detail
- Drag bottom sheet up --> See more event details
- Long press on future day --> Quick-add manual event/prediction

---

### Screen 7: Budget Detail View

**Layout Description:**
Full-screen view focused on a single budget category. Header area shows the category identity with a large progress bar. Below it, a trend chart shows historical spending. The bottom section is a transaction list. An "Adjust Budget" FAB floats at the bottom right.

**Key Components:**

*Category Header:*
- `BackButton` -- Top left, chevron left arrow
- `CategoryIcon` -- Large icon (40px) for the category (e.g., fork-and-knife for Dining)
- `CategoryName` -- Category name (24px, bold, `#FFFFFF`)
- `BudgetAmount` -- "Budget: $X/month" (14px, `#8899AA`)

*Progress Section:*
- `BudgetProgressBar` -- Full-width rounded progress bar (12px height):
  - Fill color: `#00D09C` (0-70%), `#FFD93D` (70-100%), `#FF6B6B` (>100%)
  - "$X spent of $Y" label above
  - Percentage label right-aligned
  - Animated fill on screen load
- `RemainingText` -- "$Z remaining" or "$Z over budget" (with color matching the bar)

*Key Metrics Row (3 metric cards in a horizontal row):*
- `MetricCard: Avg/Transaction` -- Average dollar amount per transaction in this category
- `MetricCard: Frequency` -- Transactions per week in this category
- `MetricCard: MoM Change` -- Month-over-month percentage change with up/down arrow (green for decrease, red for increase)

*Spending Trend Chart:*
- `TrendLineChart` -- Line chart (Victory Native) showing last 6 months of spending in this category
- X-axis: month labels, Y-axis: dollar amounts
- Budget limit shown as horizontal dashed line
- Current month shown as partially filled (with prediction dashed extension)
- Tap data points for exact values

*Transaction List:*
- `SectionHeader` -- "Transactions" with count badge and sort toggle (Date/Amount)
- `TransactionRow` -- Each transaction:
  - Merchant name (14px, bold)
  - Date (12px, `#8899AA`)
  - Amount (14px, `#FFFFFF`, right-aligned)
  - Linked calendar event indicator (small calendar icon if matched)
  - Tap --> navigate to Transaction Review Screen
- Scrollable, most recent first
- Pull to load more (paginated, 20 per page)

*Floating Action:*
- `AdjustBudgetFAB` -- Circular teal button with pencil icon, bottom-right, tap opens budget adjustment modal with slider

**Data Requirements:**
- Category budget configuration
- All transactions for this category in the current month
- Transaction history for the last 6 months (aggregated monthly for chart)
- Average transaction amount, frequency, month-over-month delta
- Linked calendar events for transactions (if any)

**User Actions:**
- Tap back arrow --> Return to Dashboard
- Tap transaction row --> Open Transaction Review Screen
- Tap "Adjust Budget" FAB --> Modal with slider to change budget, save updates budget in Supabase
- Scroll transaction list --> Paginated loading
- Tap chart data points --> Tooltip with exact month/amount
- Toggle sort order on transaction list

---

### Screen 8: Transaction Review Screen

**Layout Description:**
Card-based layout centered on a single transaction. The main transaction card is prominent at the top. Below it, action buttons are in a horizontal row. Category and notes fields follow. The screen supports swipe gestures for quick actions.

**Key Components:**

*Transaction Card (`#0F2847`, 16px radius, elevated shadow):*
- `MerchantName` -- Merchant name (24px, bold, `#FFFFFF`)
- `TransactionAmount` -- Amount (40px, bold, `#FFFFFF` or `#FF6B6B` if flagged)
- `TransactionDate` -- Full date and time (14px, `#8899AA`)
- `CategoryTag` -- Pill-shaped tag with category icon and name, colored by category
- `AccountSource` -- "Chase Checking ••7735" with bank icon (12px, `#8899AA`)

*Actions Row (4 buttons, horizontally spaced):*
- `ActionButton: Exclude` -- X icon, "Exclude" label -- marks transaction as excluded from budget calculations
- `ActionButton: Split` -- Scissors icon, "Split" label -- opens split transaction modal (divide amount across categories or people)
- `ActionButton: Recurring` -- Repeat icon, "Recurring" label -- toggles recurring flag, opens frequency picker
- `ActionButton: Review` -- Checkmark icon, "Review" label -- marks as reviewed

*Category Override:*
- `CategoryPicker` -- Current category shown as selected pill. Tap opens a scrollable grid of category options. Selecting a different category re-assigns the transaction

*Notes Field:*
- `NotesInput` -- Text input field with placeholder "Add a note...", `#0F2847` background, `#8899AA` placeholder text. Saves on blur

*Calendar Event Link:*
- `LinkedEventCard` -- If transaction is matched to a calendar event:
  - Event title, date/time, location
  - Prediction accuracy: "Predicted $25, Actual $22"
  - Tap --> navigate to Calendar View for that event
- If not matched: "Link to Event" button --> search/select from recent events

*Swipe Gestures:*
- Swipe left --> Mark as reviewed (green flash confirmation)
- Swipe right --> Flag for later review (yellow flash confirmation)
- Swipe indicators visible as user begins gesture

**Data Requirements:**
- Full transaction details (merchant, amount, date, account, category, notes, flags)
- Linked calendar event (if any)
- Prediction data for linked event (predicted amount, confidence)
- Available categories for override picker
- Account metadata (bank name, last 4 digits)

**User Actions:**
- Tap Exclude --> Confirm dialog, then exclude from budget
- Tap Split --> Modal: enter split amounts or percentages, assign categories
- Tap Recurring --> Toggle recurring, pick frequency (weekly/monthly/yearly)
- Tap Review --> Mark reviewed, animate card, show next unreviewed or return
- Change category --> Update transaction category in Supabase
- Edit notes --> Save note to transaction record
- Tap linked event --> Navigate to calendar event detail
- Swipe gestures for quick review workflow

---

### Screen 9: Plan Screen

**Layout Description:**
Vertically scrolling screen serving as the proactive planning hub. Fixed top bar with profile avatar (top-right) and "Plan" title. Content sections stack vertically: upcoming spending predictions (moved from old Dashboard), budget planning tools, Smart Savings Rules, upcoming recurring expenses (moved from old Dashboard), and transaction review queue (moved from old Dashboard). This is where users go to adjust budgets, set savings goals, and manage their financial future.

**Key Components:**

*Top Bar (fixed, 56px height):*
- `AppTitle` -- "Plan" left-aligned (18px, bold, `#FFFFFF`)
- `NotificationBell` -- Bell icon with unread count badge
- `ProfileAvatar` -- 36px circular avatar (top-right), tap opens Profile/Settings screen

*Upcoming Spending Predictions Section:*
- `SectionHeader` -- "Upcoming Predictions" with "See All" link
- `PredictionCard` (x3) -- For each of the next 3 predicted events:
  - Event title (14px, bold)
  - Event time and date (12px, `#8899AA`)
  - Predicted amount (16px, `#FFFFFF`)
  - Confidence badge: "High" (`#00D09C`), "Medium" (`#FFD93D`), "Low" (`#FF6B6B`), with filled circle indicator
  - Calendar icon with event type indicator
  - Tap --> navigate to Calendar View focused on that day

*Budget Planning Tools Section:*
- `SectionHeader` -- "Budget Planning" with edit icon
- `BudgetAdjustmentCard` -- For each budget category:
  - Category icon and name
  - Current budget amount with slider to adjust
  - Spent so far vs remaining (progress bar)
  - "Suggested adjustment" hint from AI (e.g., "Consider increasing Dining by $50 based on upcoming events")
- `SetSavingsGoalButton` -- "Set Savings Goal" teal outline button --> opens goal creation modal (target amount, target date, auto-calculate monthly contribution)
- `GoalProgressCard` -- If goal exists: goal name, progress bar, projected completion date, on-track/behind indicator

*Smart Savings Rules Section:*
- `SectionHeader` -- "Smart Savings Rules"
- `SaveTheDifferenceToggle` -- Toggle switch with explanation: "Automatically save the difference when you spend less than predicted"
  - When enabled: shows settings for rounding rules, minimum save amount, destination account
- `SavingsRuleCard` -- Configurable rules:
  - "Round up transactions to nearest $X and save the difference"
  - "Save $X on low-spend days (when daily spending is below $Y)"
  - "Auto-save percentage of income on payday"
  - Each rule has an enable/disable toggle and configuration options

*Upcoming Recurring Expenses Section:*
- `SectionHeader` -- "Upcoming Recurring" with "Manage" link
- Horizontal scroll of `RecurringChip` items:
  - Service logo/icon (Netflix, Hulu, Spotify, etc.)
  - Service name (12px)
  - Amount (12px, bold)
  - Days until charge (e.g., "in 3 days")
  - Subtle border color indicates time proximity

*Transaction Review Queue Section:*
- `SectionHeader` -- "To Review" with count badge
- `ReviewCard` -- Card showing the latest unreviewed transaction:
  - Merchant name (16px, bold), amount (16px, `#FFFFFF`, right-aligned)
  - Category tag pill (e.g., "Dining" with category color)
  - Date and account source (12px, `#8899AA`)
  - "Mark as Reviewed" button (small, teal outline)
  - Tap card to expand to full Transaction Review screen
- If no unreviewed transactions: "All caught up!" with checkmark animation

**Data Requirements:**
- Spending predictions for upcoming events
- User budget configuration (total + per category) with adjustment history
- Savings goals and progress
- Smart savings rule configurations
- Recurring transaction schedule
- Unreviewed transaction queue
- User profile (avatar, name)

**User Actions:**
- Tap prediction card --> Calendar day view with prediction detail
- Adjust budget sliders --> Save updated budgets to Supabase
- Tap "Set Savings Goal" --> Goal creation flow
- Toggle "Save the Difference" --> Enable/disable automatic savings
- Configure savings rules --> Update rule settings
- Tap recurring chip --> Subscription management view
- Tap "Mark as Reviewed" --> Mark transaction, card slides away, next appears
- Tap review card --> Full Transaction Review screen
- Pull to refresh --> Re-sync predictions and transaction queue

---

### Screen 10: Arena — Gamification & Social Hub

**Layout Description:**
Vertically scrolling screen with internal navigation tabs at the top. The Arena combines all gamification and social features into a single competitive/social hub. Four internal tabs organize the content: "My Progress" (streaks, badges, XP/level), "Challenges" (active + browse), "Leaderboard" (rankings by scope and metric), and "Friends & Circles" (friend codes, circle management, nudges). A prominent "Check In" button floats when the user hasn't checked in today. Fixed top bar with profile avatar (top-right).

**Key Components:**

*Top Bar (fixed, 56px height):*
- `AppTitle` -- "Arena" left-aligned (18px, bold, `#FFFFFF`)
- `NotificationBell` -- Bell icon with unread count badge
- `ProfileAvatar` -- 36px circular avatar (top-right), tap opens Profile/Settings screen

*Internal Tab Bar:*
- `ArenaTabBar` -- Four tabs: "My Progress" | "Challenges" | "Leaderboard" | "Friends & Circles"
  - Active tab: teal underline, `#FFFFFF` text
  - Inactive: no underline, `#8899AA` text
  - Horizontally scrollable if needed on smaller screens

*My Progress Tab:*

- *Level Header (`#0F2847` gradient card):*
  - `UserLevel` -- "Level 12" (28px, bold, `#00D09C`)
  - `LevelTitle` -- Title based on level (e.g., "Money Manager") (16px, `#FFD93D`)
  - `XPProgressBar` -- Horizontal bar showing progress to next level (e.g., "2,450 / 3,000 XP"), teal fill, animated on load
  - `XPToNext` -- "550 XP to Level 13" (12px, `#8899AA`)

- *Stats Row (3 metric cards):*
  - `StatCard: Streak` -- Fire icon, current streak count (e.g., "14 days"), "Daily Streak" label
  - `StatCard: Total XP` -- Star icon, total XP earned (e.g., "12,450 XP")
  - `StatCard: Badges` -- Trophy icon, badges earned count (e.g., "8 / 24")

- *Streaks Section:*
  - `SectionHeader` -- "Streaks" with flame icon
  - `StreakCard: Daily Check-In` -- Current streak count with flame animation (Lottie), best streak record, "Check In" button if not done today
  - `StreakCard: Weekly Budget` -- Weeks in a row staying under budget, progress indicators for each day of current week
  - `StreakCard: Savings` -- Consecutive months meeting savings goal, monthly checkmarks
  - Visual flame grows larger with longer streaks (small flame <7 days, medium 7-30, large 30+)

- *Badges Section:*
  - `SectionHeader` -- "My Badges" with "View All" link
  - `BadgeGrid` -- 4-column grid showing:
    - `EarnedBadge` -- Full-color badge icon with name below, subtle glow animation, tap for detail modal
    - `LockedBadge` -- Grayed out silhouette with "?" or lock overlay, name below in `#8899AA`, tap shows requirements
  - Badge detail modal: badge icon (large), name, description, date earned, XP reward, rarity percentage
  - Example badges:
    - "First Prediction" -- Made your first prediction review
    - "Steadfast" -- 14-day check-in streak
    - "Budget Boss" -- Under budget for 3 months straight
    - "Social Butterfly" -- Added 5 friends
    - "Crystal Clear" -- 90%+ prediction accuracy for a week
    - "Frugal February" -- Lowest spending month
    - "Challenge Champion" -- Won a group challenge

*Challenges Tab:*

- *Active Challenges Section:*
  - `SectionHeader` -- "Active Challenges" with count badge
  - `ChallengeCard` -- For each active challenge:
    - Challenge name (e.g., "Coffee Savings Sprint") (16px, bold)
    - Description (12px, `#8899AA`)
    - Progress bar with current/goal (e.g., "3 / 7 days")
    - Days remaining badge
    - Participants count with mini avatar stack
    - XP reward preview
  - `BrowseChallengesButton` -- "Browse Challenges" teal outline button --> Challenge catalog

- *Browse Challenges Section:*
  - Scrollable catalog of available challenges grouped by type (solo, circle, global)
  - Each challenge card shows: name, description, duration, XP reward, participant count, difficulty level
  - "Join" button on each card

*Leaderboard Tab:*
- This is the leaderboard view (previously standalone Screen 11). It is now accessed via the Arena tab's "Leaderboard" section.
- `LeaderboardScopeSelector` -- Three sub-tabs: "Friends" | "Inner Circle" | "Global"
  - Active tab: teal underline, `#FFFFFF` text
  - Inactive: no underline, `#8899AA` text
- `CircleSelector` -- Dropdown (visible only on "Inner Circle" tab) to select which circle to view. Lists user's circles with member counts
- *Filter Row:*
  - `MetricSelector` -- Dropdown/segmented control: "Savings Rate" | "Streak" | "Health Score" | "Challenge Wins"
  - `PeriodSelector` -- Pill toggle: "This Week" | "This Month"
- *Podium Section:*
  - `PodiumDisplay` -- Three pedestals of varying height (2nd | 1st | 3rd):
    - 1st place: tallest pedestal (center), crown icon, gold `#FFD93D` accent
    - 2nd place: medium pedestal (left), silver `#C0C0C0` accent
    - 3rd place: short pedestal (right), bronze `#CD7F32` accent
    - Each position shows: circular avatar (48px), display name, metric value, rank medal icon
    - Animated entrance (pedestals rise from bottom)
- *Ranked List (below podium):*
  - `RankRow` -- For positions 4 and beyond:
    - Rank number (bold, `#8899AA`)
    - Avatar (36px)
    - Display name
    - Metric value (right-aligned, `#FFFFFF`)
    - Trend arrow (up/down/stable vs last period)
    - Highlight row if it's the current user
  - Scrollable, lazy-loaded
- *Your Position (sticky bottom card):*
  - `YourRankCard` -- Fixed at bottom of screen (`#0F2847` card, elevated):
    - "Your Position" label
    - Rank number (large, `#00D09C`)
    - Metric value
    - Trend vs last period
    - Points/percentage to next rank: "12 points behind #5"

*Friends & Circles Tab:*
- This consolidates the old standalone Social/Friends screen into the Arena hub.

- *Your Friend Code Card (`#0F2847`, 16px radius):*
  - `FriendCode` -- User's unique 8-character alphanumeric code displayed in large monospace font (e.g., "SAVE-7X2K"), `#00D09C` color
  - `CopyButton` -- Copy icon button, tap copies code to clipboard with "Copied!" toast
  - `ShareButton` -- Share icon, opens native share sheet with pre-filled message: "Add me on FutureSpend! My friend code: SAVE-7X2K"
  - `QRCodeDisplay` -- Small QR code encoding the friend code, tap to enlarge to full-screen modal for scanning

- *Add Friend Section:*
  - `AddFriendInput` -- Text input for entering a friend code, with "Add" button
  - `ScanQRButton` -- Camera icon button to scan QR code
  - Validation feedback: "Friend found! [Name]" with confirm button, or "Code not found" error

- *Friends List:*
  - `SectionHeader` -- "Friends" with count (e.g., "Friends (12)")
  - `FriendRow` -- Each friend:
    - Avatar (40px)
    - Display name (14px, bold)
    - Streak badge (fire icon + count)
    - Last active (e.g., "Active 2h ago") (12px, `#8899AA`)
    - Chevron right for profile view
    - Swipe left to remove friend (with confirmation)
  - Nudge button on each friend row: send encouragement or competitive nudge

- *Pending Requests (conditional):*
  - `SectionHeader` -- "Pending Requests" with count badge
  - `RequestRow` -- Each request:
    - Avatar, name of requester
    - "Accept" button (`#00D09C`) and "Decline" button (`#FF6B6B`)
    - Time since request

- *Your Circles Section:*
  - `SectionHeader` -- "Your Circles" with "Create Circle" button
  - `CircleCard` -- Each circle:
    - Circle name (e.g., "SFU Roommates") (16px, bold)
    - Member count and mini avatar stack (up to 5 avatars overlapping)
    - Circle type badge (e.g., "Friends", "Work", "Family")
    - Tap --> Circle detail screen
  - `CircleDetail` (separate screen/modal):
    - Circle name and description
    - Member list with roles (admin/member)
    - Circle leaderboard (mini version)
    - "Start Challenge" button --> Create challenge for this circle
    - "Invite to Circle" --> Share circle invite code
    - "Leave Circle" (red, with confirmation)

- *Discover Friends:*
  - `DiscoverButton` -- "Discover Friends" button
    - Options: sync contacts (with permission), share invite link, search by username

*Check-In Button (conditional, floating):*
- `CheckInFAB` -- Large teal pulsing button: "Check In" with sparkle icon, centered at bottom. Only visible if user hasn't checked in today. Tap triggers confetti animation, increments streak, awards XP

**Data Requirements:**
- User level, XP, title from Supabase `user_profiles` table
- Streak data: daily_streak, weekly_budget_streak, savings_streak from `streaks` table
- Badges: earned badges with dates, all available badges with requirements from `badges` and `user_badges` tables
- Active challenges: progress, participants, deadlines from `challenges` and `challenge_participants` tables
- Today's check-in status
- Leaderboard data for selected scope (friends/circle/global), metric, and period
- User's friend list and circle memberships
- Aggregated metrics: savings rate (%), streak count, financial health score, challenge wins
- User's own rank and metric value
- Trend data (comparison to previous period)
- User's friend code from `user_profiles`
- Friends list with profiles, streaks, last active timestamps
- Pending friend requests (sent and received)
- User's circles with member data
- QR code generation for friend code

**User Actions:**
- Switch internal tabs --> Load corresponding Arena section
- Tap "Check In" --> Record check-in, increment streak, award XP, confetti animation
- Tap earned badge --> Detail modal with badge info
- Tap locked badge --> Requirements modal showing what's needed
- Tap challenge card --> Challenge detail screen with full leaderboard
- Tap "Browse Challenges" --> Challenge catalog with joinable challenges
- Tap "View All" badges --> Full badge collection screen
- Switch leaderboard tabs --> Load corresponding leaderboard data
- Select circle --> Filter leaderboard to that circle's members
- Change metric/period --> Re-sort leaderboard
- Tap user row --> View that user's public profile (limited stats)
- Copy friend code --> Clipboard with confirmation toast
- Share friend code --> Native share sheet
- Enter friend code --> Validate and send friend request
- Scan QR code --> Camera permission, scan, auto-add
- Accept/decline friend requests
- Tap friend --> View friend's public profile
- Send nudge to friend --> Encouragement or competitive message
- Tap circle --> Circle detail screen
- Create circle --> Name, description, invite first members
- Start challenge in circle --> Challenge creation flow
- Remove friend (swipe)
- Leave circle
- Pull to refresh --> Update all Arena data

---

### Screen 11: Leaderboard (Sub-View within Arena)

**Note:** The Leaderboard is no longer a standalone screen. It is accessed via the Arena tab's "Leaderboard" internal tab (see Screen 10: Arena). The full leaderboard specification — including scope tabs (Friends, Inner Circle, Global), metric and period selectors, podium layout, ranked list, and sticky "Your Position" card — is documented within Screen 10's "Leaderboard Tab" section above.

**Navigation:** Users access the Leaderboard by tapping the Arena tab in the bottom tab bar, then selecting the "Leaderboard" internal tab within the Arena screen.

---

### Screen 12: Insights Screen

**Layout Description:**
Vertically scrolling screen serving as the AI-powered analysis hub. Fixed top bar with profile avatar (top-right) and "Insights" title. Content sections stack vertically: Financial Health Score with breakdown, spending trend charts, category breakdown, AI-generated insights and recommendations, Calendar Correlation Index visualization, savings projections, and spending comparisons. This is where all the smart analysis lives.

**Key Components:**

*Top Bar (fixed, 56px height):*
- `AppTitle` -- "Insights" left-aligned (18px, bold, `#FFFFFF`)
- `NotificationBell` -- Bell icon with unread count badge
- `ProfileAvatar` -- 36px circular avatar (top-right), tap opens Profile/Settings screen

*Financial Health Score Section:*
- `HealthScoreCard` (`#0F2847` background, 16px radius, 16px padding) -- Hero card at top:
  - Large circular gauge (140px diameter, `react-native-svg`) with score (0-100)
  - Ring color gradient: `#FF6B6B` (0-40), `#FFD93D` (40-70), `#00D09C` (70-100)
  - Score number in center (48px, bold)
  - Label: "Financial Health Score" (14px, `#8899AA`)
  - Breakdown rows below the ring:
    - "Budget Adherence" -- progress bar + score
    - "Savings Consistency" -- progress bar + score
    - "Spending Predictability" -- progress bar + score
    - "Debt Management" -- progress bar + score
  - Trend indicator: "Up 5 pts from last month" with arrow

*Spending Trend Charts Section:*
- `SectionHeader` -- "Spending Trends"
- `PeriodToggle` -- Segmented control: "Weekly" | "Monthly" | "6-Month"
- `TrendLineChart` -- Line chart (Victory Native) showing spending over selected period:
  - Solid teal line: actual spending
  - Gray dashed line: budget limit
  - Shaded area between lines when over budget (red tint) or under (green tint)
  - Tap data points for exact values
  - X-axis: time periods, Y-axis: dollar amounts

*Category Breakdown Section:*
- `SectionHeader` -- "Category Breakdown"
- `DonutChart` -- Animated donut chart showing spending distribution by category
  - Each segment color-coded per category
  - Center text shows total spend for period
  - Tap segment to highlight and show category detail
- `CategoryLegend` -- Below donut, a list of categories with color swatch, name, amount, and percentage

*AI-Generated Insights & Recommendations Section:*
- `SectionHeader` -- "AI Insights" with sparkle icon
- `InsightCard` (x3-5) -- AI-generated insight cards:
  - Insight icon (lightbulb, trend arrow, warning, etc.)
  - Insight title (14px, bold) -- e.g., "Dining spending is accelerating"
  - Insight body (12px, `#8899AA`) -- detailed explanation with data points
  - Action button if applicable: "Adjust Budget", "Set Alert", "View Details"
  - Powered by Claude analysis of user's financial patterns
- `AIRecommendationsSection` -- "AI Recommendations" sub-header:
  - Actionable suggestion cards with specific dollar amounts and projected impact
  - E.g., "Cancel unused Adobe CC subscription -- save $54.99/month ($660/year)"
  - E.g., "Brown-bag one team lunch per week -- save ~$105/month"
  - Each recommendation has "Apply" or "Dismiss" buttons

*Calendar Correlation Index (CCI) Visualization:*
- `SectionHeader` -- "Calendar Correlation"
- `CCIScoreCard` -- Shows CCI score (percentage) with trend
  - Visual: scatter plot or paired bar chart comparing predicted vs actual spending by day/week
  - Highlights days where predictions were most/least accurate
  - Explanation text: "Your spending correlates X% with your calendar predictions"

*Savings Projections Section:*
- `SectionHeader` -- "Savings Projections"
- `CompoundGrowthChart` -- Area chart showing projected savings growth over 3/6/12 months
  - Based on current savings rate
  - Shows optimistic, baseline, and conservative scenarios
  - Goal milestones marked on the timeline if savings goals are set
  - Animated fill on load

*Spending Comparison Section:*
- `SectionHeader` -- "Month-over-Month"
- `ComparisonCard` -- Side-by-side comparison of this month vs last month:
  - Total spending (with percentage change, green for decrease, red for increase)
  - Per-category comparison bars
  - "Best improvement" highlight (e.g., "Coffee spending down 22%")
  - "Needs attention" flag (e.g., "Dining up 15%")

**Data Requirements:**
- Financial Health Score (composite calculation from budget adherence, savings rate, spending predictability, debt management)
- Transaction data aggregated by day/week/month for trend charts
- Category spending breakdowns for current and previous periods
- AI-generated insights from Claude API (based on spending patterns, calendar data, budget status)
- Calendar Correlation Index calculated from prediction accuracy data
- Savings data and projections
- Month-over-month comparison metrics
- User profile (avatar, name)

**User Actions:**
- Tap Financial Health Score --> Expand breakdown detail
- Toggle spending trend period (Weekly/Monthly/6-Month) --> Chart updates
- Tap donut chart segment --> Highlight category, show detail
- Tap AI insight action button --> Navigate to relevant screen or apply recommendation
- Tap "Apply" on recommendation --> Implement suggestion (e.g., adjust budget, set alert)
- Tap "Dismiss" on recommendation --> Remove from list, note preference
- Tap CCI visualization --> Detailed prediction accuracy breakdown
- Tap savings projection --> Goal detail or savings settings
- Tap comparison card --> Full month-over-month analysis view
- Pull to refresh --> Re-generate insights and recalculate metrics

---

### Screen 13: Settings & Profile

**Navigation:** This screen is accessed by tapping the profile avatar icon in the top-right corner of the header bar on ANY screen. It is NOT a tab in the bottom tab bar. The profile avatar is a persistent element present on every screen's top bar.

**Layout Description:**
Standard settings list layout with grouped sections. Each section has a header and contains rows of settings items. Toggles, navigation arrows, and status indicators are used throughout. Destructive actions are at the bottom in red.

**Key Components:**

*Profile Section:*
- `ProfileHeader` -- Large avatar (80px) with camera overlay icon (tap to change photo), display name (20px, bold), email (14px, `#8899AA`), "Edit Profile" button
- Edit profile modal: change display name, avatar, email

*Connected Accounts Section:*
- `SectionHeader` -- "Connected Accounts"
- `CalendarConnectionRow` -- Calendar icon, "Google Calendar" label, sync status badge ("Connected" in green or "Disconnected" in red), last sync timestamp, tap to re-sync or disconnect
- `BankConnectionRow` -- Bank icon, bank name + last 4 digits (e.g., "RBC ••4521"), connection status, last sync timestamp, "Manage" chevron --> Plaid account management
- `AddAccountButton` -- "+ Add Account" to connect additional calendars or banks

*Budget Settings:*
- `BudgetSettingsRow` -- Budget icon, "Budget Settings" label, current total budget preview (e.g., "$2,000/mo"), chevron --> Budget editor (same as onboarding Screen 4 but editable)

*Notification Preferences:*
- `SectionHeader` -- "Notifications"
- Toggle rows for each notification type:
  - "Spending Predictions" -- Daily prediction summaries
  - "Budget Alerts" -- Approaching/exceeding budget warnings
  - "Streak Reminders" -- Daily check-in reminders
  - "Social Updates" -- Friend requests, challenge updates, nudges
  - "Weekly Reports" -- Weekly spending summary
  - "Transaction Alerts" -- New transaction notifications
- Each row: label, description (12px, `#8899AA`), toggle switch (`#00D09C` when on)

*Privacy Settings:*
- `SectionHeader` -- "Privacy"
- Toggle rows for visibility controls:
  - "Show on Leaderboards" -- Allow friends to see your rankings
  - "Share Streak Data" -- Show streaks to friends
  - "Savings Rate Visible" -- Allow savings rate to appear on leaderboards
  - "Activity Status" -- Show "last active" to friends
- `DataExportButton` -- "Export My Data" --> Generate and download JSON/CSV of all user data

*App Preferences:*
- `SectionHeader` -- "Preferences"
- `ThemeSelector` -- "Theme" with options: "Dark" (default), "Light", "System". Dark is `#0A1628` base, Light provides an alternative light theme
- `CurrencySelector` -- "Currency" with current value (e.g., "CAD $"), tap to change
- `TimezoneSelector` -- "Timezone" with current value (e.g., "Pacific Time"), auto-detected with override option

*About Section:*
- `SectionHeader` -- "About"
- `AppVersion` -- "FutureSpend v1.0.0 (Build 1)"
- `TermsLink` -- "Terms of Service" --> WebView or external link
- `PrivacyPolicyLink` -- "Privacy Policy" --> WebView or external link
- `OpenSourceLink` -- "Open Source Licenses" --> Licenses list

*Destructive Actions:*
- `SignOutButton` -- "Sign Out" (full-width, `#8899AA` text, tap triggers confirmation dialog, then clears session and navigates to Welcome screen)
- `DeleteAccountButton` -- "Delete Account" (`#FF6B6B` text, tap triggers multi-step confirmation: type "DELETE" to confirm, then permanently removes all user data from Supabase, revokes Plaid tokens, signs out)

**Data Requirements:**
- User profile (name, email, avatar URL)
- Connected accounts status (calendar OAuth tokens validity, Plaid connection status, last sync times)
- Current budget configuration
- Notification preference flags
- Privacy setting flags
- App preference values (theme, currency, timezone)
- App version from `app.json`

**User Actions:**
- Edit profile --> Update name, email, avatar in Supabase
- Change avatar --> Image picker, upload to Supabase Storage, update profile
- Manage calendar connection --> Re-authenticate OAuth, disconnect, or force sync
- Manage bank connection --> Plaid re-link flow, disconnect
- Edit budget --> Navigate to budget editor
- Toggle notifications --> Update preferences in Supabase
- Toggle privacy settings --> Update visibility flags
- Change theme --> Apply theme immediately, persist preference
- Change currency/timezone --> Update and recalculate displays
- Export data --> Generate download
- Sign out --> Clear session, navigate to Welcome
- Delete account --> Multi-step confirmation, full data deletion

---

### Global Overlay: Floating AI Chat Assistant

**Note:** This is NOT a standalone screen or tab. It is a global overlay component available on every screen in the app. The AI Chat is no longer a dedicated tab — it is a floating assistant accessible from anywhere.

**Layout Description:**
A small circular teal button (floating action button style) sits in the bottom-right corner of every screen, above the tab bar. Tapping it opens a slide-up bottom sheet containing the full AI chat interface. The chat is context-aware, adjusting its suggested questions and behavior based on which screen the user is currently viewing.

**Key Components:**

*Floating Chat Button:*
- `FloatingChatFAB` -- Circular teal (`#00D09C`) button, 56px diameter, with chat bubble icon (white)
- Positioned 16px from right edge, 90px from bottom (above the bottom tab bar)
- Subtle drop shadow for elevation
- `PulseAnimation` -- Subtle pulse/glow animation on the button when the AI has proactive insights to share (e.g., budget alert, spending anomaly detected). Pulse is a gentle teal glow that expands and contracts
- Button can be dismissed/minimized by swiping it to the edge of the screen (snaps to edge, shows only half the button). Tap to restore full position
- Button is present on ALL screens: Dashboard, Calendar, Plan, Arena, Insights, and sub-screens

*Bottom Sheet Chat Interface (slide-up, ~80% screen height):*
- `BottomSheetHandle` -- Drag handle at top of sheet (40px wide, 4px tall, `#8899AA`, centered)
- Sheet slides up with spring animation on FAB tap, covers ~80% of screen height
- Background: `#0A1628` with rounded top corners (16px radius)

- *Chat Header (within sheet):*
  - `AIAvatar` -- Small FutureSpend bot avatar (crystal ball icon), 32px
  - `HeaderTitle` -- "AI Assistant" (18px, bold, `#FFFFFF`)
  - `HeaderSubtitle` -- "Powered by Claude" (12px, `#8899AA`)
  - `CloseButton` -- X icon (top-right of sheet), closes/minimizes the sheet

- *Context-Aware Suggested Questions (horizontal scroll, below header):*
  - Suggested question chips change based on the current screen:
    - On Dashboard: "How are my metrics looking?", "Explain my health score", "Am I on track?"
    - On Calendar: "What will I spend this week?", "Which day is most expensive?", "Compare this week to last"
    - On Plan: "Help me adjust my budget", "How much can I save this month?", "Suggest a savings rule"
    - On Arena: "Suggest a challenge for my circle", "How do I earn more XP?", "Who's winning this month?"
    - On Insights: "Explain my spending trend", "Why did my health score change?", "Compare to last month"
  - `SuggestionChip` -- Pill-shaped buttons (`#0F2847` background, `#FFFFFF` text, 12px radius), tap to auto-send

- *Message List (ScrollView, inverted for bottom-anchoring):*
  - `AIMessage` -- Left-aligned:
    - Bot avatar (32px, circular) on the left
    - Message bubble (`#0F2847` background, 12px radius, rounded corners except bottom-left)
    - Message text (14px, `#FFFFFF`)
    - Supports markdown rendering: bold, lists, code blocks
    - Supports inline charts/cards for financial data
    - Timestamp below bubble (10px, `#8899AA`)
  - `UserMessage` -- Right-aligned:
    - Message bubble (`#00D09C` background, 12px radius, rounded corners except bottom-right)
    - Message text (14px, `#0A1628`)
    - Timestamp below bubble
  - `TypingIndicator` -- Three pulsing dots in an AI message bubble, shown while Claude generates response

- *Input Area (fixed at bottom of sheet):*
  - `TextInput` -- Rounded input field (`#0F2847` background, `#8899AA` placeholder: "Ask about your finances...")
  - `SendButton` -- Teal circular button with arrow-up icon, enabled when text is non-empty
  - Keyboard avoidance: input area moves up with keyboard

**Behavior:**
- Chat history persists across screens — opening the chat on Dashboard and then closing and reopening on Calendar retains the conversation
- Chat session is stored in Supabase `chat_messages` table for cross-session persistence
- Minimizing the sheet (swipe down on handle or tap close) returns to the floating button
- The floating button reappears in its previous position when the sheet is minimized
- Context is automatically injected into Claude API calls: current screen, relevant data for that screen, user's budget status, recent activity

**Data Requirements:**
- Chat history for current session (stored in Supabase for persistence across sessions)
- User context for Claude API: current budget status, recent transactions, upcoming predictions, calendar events, spending patterns
- Current screen identifier for context-aware suggestions
- Proactive insight flags (triggers pulse animation on floating button)

**User Actions:**
- Tap floating button --> Slide-up chat sheet opens
- Swipe down on sheet handle --> Minimize chat, return to floating button
- Tap close button --> Minimize chat
- Swipe floating button to edge --> Minimize button to half-visible state
- Tap minimized button --> Restore to full position
- Type message and tap send --> Send to Claude API with financial context, display response
- Tap suggestion chip --> Auto-send that context-aware question
- Scroll up in chat --> View chat history
- Tap on financial data cards in AI responses --> Navigate to relevant screen (e.g., tap budget card in response --> Budget Detail View)

---

## 16. Demo Scenarios

### Persona 1: Sarah Chen -- University Student

**Background:**
- Age 21, third-year SFU Computer Science student
- Works part-time as a Starbucks barista (weekends, occasional weekday closings)
- Monthly income: ~$1,200 (variable based on shift availability)
- Monthly spending budget: $1,000
- Lives in a shared apartment near SFU with 2 roommates
- Has an RBC student chequing account and a Visa student credit card

**Calendar Profile:**
| Day | Recurring Events |
|-----|-----------------|
| Monday | CMPT 310 Lecture (9:30am-10:20am), Study Group at JJ Bean (2:00pm-4:00pm) |
| Tuesday | CMPT 371 Lecture (10:30am-12:20pm), Gym - SFU Fitness (5:00pm-6:30pm) |
| Wednesday | CMPT 310 Lecture (9:30am-10:20am), CMPT 310 Lab (1:30pm-3:20pm), Study Group at Waves Coffee (3:30pm-5:30pm) |
| Thursday | CMPT 371 Lecture (10:30am-12:20pm), Gym - SFU Fitness (5:00pm-6:30pm) |
| Friday | CMPT 310 Lecture (9:30am-10:20am), Gym - SFU Fitness (12:00pm-1:30pm) |
| Saturday | Starbucks Shift (8:00am-4:00pm) |
| Sunday | Starbucks Shift (8:00am-4:00pm), Grocery Run (5:00pm) |
| Occasional | Friday Night Out (varies), Brunch with Roommates (Sat/Sun), SFU Hack Night (monthly) |

**Financial Pain Points:**
- Coffee shop study sessions cost $6-10 each (2x/week = $50-80/month)
- Friday night outings with friends: $30-60 per outing, hard to say no due to FOMO
- Eating near campus when short on time between classes: $12-18 per meal vs $4-5 cooking at home
- Inconsistent paycheck timing makes budgeting difficult
- Subscription creep: Spotify ($10), Netflix shared ($5), Adobe CC student ($15), iCloud ($1)

**FutureSpend Value Proposition:**
- Predicts $60-80/week in discretionary food spending based on class and study group schedule
- Identifies that Wednesday is her most expensive day (coffee + food near campus between lecture and lab)
- Suggests thermos + packed lunch on Wednesdays to save ~$15/week
- Alerts 2 days before expensive social weekends (Friday night + Saturday brunch = ~$60-90)
- Tracks spending against Starbucks pay schedule, warns when spending outpaces income
- Gamification with roommate circle creates positive peer pressure to cook together

---

**Demo Flow for Sarah (step-by-step walkthrough):**

**Step 1: Dashboard View (Metrics Hub)**
- Open app. Dashboard loads showing:
  - Hero card: "$340 left of $1,000 budget" (Day 18 of month)
  - Spending trajectory chart: solid line showing actual spending ($660 so far), dashed prediction line curving to ~$920 by month end (under budget)
  - Burn rate: "Spending at 0.97x pace" (green, healthy)
- Category circles (horizontal scroll): Dining ($180/$250, 72%, yellow), Transport ($45/$80, 56%, green), Entertainment ($60/$100, 60%, green), Coffee ($45/$50, 90%, red), Groceries ($65/$120, 54%, green)
- Financial Health Score ring: 72 (green)
- Key metrics: Spending Velocity 0.97x, Savings Rate 34%, CCI 81%

**Step 2: Calendar Predictions**
- Tap Calendar tab. Month view shows:
  - Today (Day 18, Wednesday) highlighted with teal ring
  - Heatmap: Fridays and Wednesdays are darker (higher spending days)
  - Next 3 days highlighted with prediction badges
- Tap Thursday (Day 19): Bottom sheet shows
  - "CMPT 371 Lecture" (10:30am) -- $0 predicted
  - "Gym - SFU Fitness" (5:00pm) -- $0 predicted (membership)
  - Day total: "$0 predicted. Typical Thursday: $8" -- "Good day to stay frugal!"
- Tap Friday (Day 20): Bottom sheet shows
  - "CMPT 310 Lecture" (9:30am) -- $0
  - "Gym" (12:00pm) -- $0
  - "Friday Night Karaoke at Fantacity" (8:00pm) -- "$35 predicted" (Medium confidence, based on 4 similar past events: $28, $32, $38, $45)
  - Day total: "$35 predicted. Typical Friday: $42"
- Tap Saturday (Day 21): Bottom sheet shows
  - "Starbucks Shift" (8:00am) -- $0 (earning, not spending)
  - "Brunch with Roommates at Cafe Medina" (12:00pm) -- "$28 predicted" (High confidence)
  - Day total: "$28 predicted"
- Weekend total prediction card: "$63 for the weekend"

**Step 3: AI Chat Interaction (Floating Assistant)**
- Tap the floating AI chat button (teal circle, bottom-right corner). Chat sheet slides up with greeting: "Hi Sarah! You've got $340 left with 12 days to go. What would you like to know?"
- Context-aware suggested chips (based on Calendar screen context): "What will I spend this week?", "Can I afford this weekend?", "Which day is most expensive?"
- Sarah taps "Can I afford this weekend?"
- AI responds:

> "Great question! Let me break down your weekend:
>
> **Friday Night Karaoke:** ~$35 (drinks + entry)
> **Saturday Brunch:** ~$28 (Cafe Medina typical)
> **Weekend Total:** ~$63
>
> With $340 left and 12 days remaining, you'd need to average $23/day after the weekend. That's tight but doable since your weekdays average $18.
>
> **Tip:** Fantacity has $5 cover before 9pm instead of $10. If you eat before going out, you could bring this weekend down to ~$45. Want me to set a weekend spending target?"

- Sarah types: "Yes, set a $50 weekend target"
- AI confirms and creates a mini-challenge

**Step 4: Smart Notification (simulated)**
- Notification banner slides in: "Study group tomorrow: ~$8 predicted at JJ Bean. You've spent $45 on coffee this month (budget: $50). Bring a thermos?"
- Tap notification --> opens prediction detail for tomorrow's study group event

**Step 5: Gamification & Social (Arena)**
- Tap Arena tab. Arena loads on "My Progress" internal tab.
- Level header: "Level 7 -- Savvy Saver" (1,850 / 2,500 XP)
- Streaks: 14-day daily check-in streak (medium flame animation), 2-week budget streak
- Badges earned: "First Steps" (completed onboarding), "Week Warrior" (7-day streak), "Steadfast" (14-day streak), "Prediction Pal" (reviewed 10 predictions)
- Switch to "Challenges" tab: Active challenge: "Coffee Savings Challenge" -- Circle: SFU Roommates -- "Spend under $40 on coffee this month" -- Progress: $45/$40 (over! but 12 days to recover by averaging down) -- Sarah is #2, roommate Alex is #1 at $32

**Step 6: Leaderboard (within Arena)**
- Switch to "Leaderboard" internal tab within Arena, select "Inner Circle" scope, circle: "SFU Roommates"
- Metric: Savings Rate, Period: This Month
- Podium: #1 Alex (78% savings rate), #2 Sarah (72%), #3 Jordan (65%)
- Sarah's position card: "#2 -- 72% savings rate -- 6% behind Alex"
- Switch to "Friends & Circles" tab: Friendly nudge option: "Send Alex a high-five" or "Challenge Alex to next month"

---

### Persona 2: Marcus Thompson -- Young Professional

**Background:**
- Age 26, junior full-stack developer at a Vancouver tech startup (Series A, 40 employees)
- Monthly income: $4,200 (after taxes)
- Monthly spending budget: $3,000
- Lives alone in a 1-bedroom apartment in Mount Pleasant
- Has TD chequing, RBC savings, and an Amex credit card
- Fitness enthusiast, social, enjoys board games and craft beer

**Calendar Profile:**
| Day | Recurring Events |
|-----|-----------------|
| Monday-Friday | Work Standup (10:00am, daily) |
| Tuesday | Team Lunch (12:00pm, rotating restaurants), Gym - Anytime Fitness (6:30pm) |
| Wednesday | Gym (6:30pm), Board Game Night (monthly, 1st Wednesday, at friend's place) |
| Thursday | Team Lunch (12:00pm), Gym (6:30pm) |
| Friday | Gym (6:30pm), Date Night (varies, 2-3x/month) |
| Saturday | Gym (10:00am), Brunch (occasional), Social plans (varies) |
| Sunday | Gym (10:00am), Meal Prep (2:00pm), Grocery shopping (4:00pm) |
| Quarterly | Work Offsite (full day, company-paid mostly but some personal expenses) |

**Subscriptions (12 active):**
| Service | Monthly Cost |
|---------|-------------|
| Netflix | $16.99 |
| Spotify Premium | $10.99 |
| Anytime Fitness | $49.99 |
| Adobe Creative Cloud | $54.99 |
| iCloud 200GB | $3.99 |
| YouTube Premium | $13.99 |
| ChatGPT Plus | $20.00 |
| Notion Personal Pro | $8.00 |
| Nintendo Switch Online | $4.99 |
| Audible | $14.95 |
| The Athletic | $8.99 |
| Headspace | $12.99 |
| **Total** | **$220.86** |

**Financial Pain Points:**
- Team lunches at trendy restaurants run $20-35 each, 2x/week = $160-280/month
- Dating expenses are unpredictable: nice dinner ($80-120), activity ($30-60), drinks ($20-40)
- 12 subscriptions totaling $220.86/month, some barely used (Adobe, Nintendo, Audible)
- Tendency to Uber ($15-25) instead of transit ($3) when running late to standup
- Craft beer hobby: $40-60/month at brewery events
- Weekend social events are hard to budget for (spontaneous invitations)

**FutureSpend Value Proposition:**
- Detects subscription bloat: flags Adobe CC (last opened 6 weeks ago), Nintendo Online (no recent play), Audible (3 unused credits)
- Predicts expensive weeks based on social calendar density -- e.g., week with 2 team lunches + date night + board game night = $200+ predicted
- Correlates late morning calendar blocks with Uber spending (standup at 10am, no morning buffer = Uber)
- Identifies team lunch as top discretionary expense with month-over-month increase chart
- Work circle competition motivates brown-bagging at least one team lunch day

---

**Demo Flow for Marcus (step-by-step walkthrough):**

**Step 1: Dashboard View (Metrics Hub)**
- Dashboard loads:
  - Hero card: "$1,450 left of $3,000 budget" (Day 15 of month, halfway point)
  - Spending trajectory: actual spending at $1,550, predicted to reach $3,240 by month end
  - Burn rate: "Spending at 1.08x pace" (yellow warning indicator)
  - Alert badge on prediction: "Projected $240 over budget"
- Category circles: Dining ($480/$600, 80%, yellow), Subscriptions ($220/$220, 100%, red), Transport ($125/$150, 83%, yellow), Entertainment ($180/$300, 60%, green), Groceries ($160/$200, 80%, yellow)
- Financial Health Score ring: 58 (yellow -- needs attention)
- Key metrics: Spending Velocity 1.08x (yellow), Savings Rate 22%, CCI 74%

**Step 2: Calendar Predictions -- Week Ahead**
- Calendar view, switch to Week view:
  - Tuesday: Team Lunch at Earls -- "$25 +/- $8" (High confidence, based on 12 similar events, mean $26.40, median $24.80)
  - Tuesday: Gym -- $0
  - Thursday: Team Lunch at Nuba -- "$28 +/- $10" (Medium confidence, first time at this restaurant, based on similar Middle Eastern restaurant events)
  - Friday: Date Night -- "Dinner at Nightingale" -- "$75 +/- $20" (Medium confidence, upscale restaurant, based on 6 date night dinners)
  - Saturday: Board Game Night -- "$15 +/- $5" (High confidence, consistent BYOB pattern, usually brings craft beer)
  - Week total: "$143 predicted discretionary spending"
- Tap "Team Lunch at Earls" prediction detail:
  - Confidence: High (87%)
  - Based on: 12 past "Team Lunch" events
  - Amount range: $18 - $38 (5th to 95th percentile)
  - Average: $26.40
  - AI note: "Your team lunch spending has increased 15% over the last 3 months. Consider the lunch special to save ~$8."

**Step 3: Budget Detail -- Dining Deep Dive**
- Tap Dining category circle on Dashboard
- Budget Detail View loads:
  - "Dining" header with fork-knife icon
  - Progress bar: $480 / $600 (80%), yellow
  - "$120 remaining with 15 days left"
  - Key metrics: Avg/transaction $24.50, Frequency 4.2x/week, MoM change +15% (red arrow up)
  - Trend chart (6 months): shows steady increase from $420 to $580 trajectory
  - Transaction list: Earls $32.50, Uber Eats $28.00, Nuba $26.00, Starbucks $6.50, etc.

**Step 4: AI Financial Advisor (Floating Assistant)**
- Tap the floating AI chat button (teal circle, bottom-right corner). Chat sheet slides up. Marcus types: "Help me cut costs this month"
- AI responds:

> "I've analyzed your spending patterns and found some opportunities:
>
> **1. Subscriptions ($220.86/mo):**
> - Adobe Creative Cloud ($54.99) -- You haven't opened any Adobe app in 6 weeks. Cancel and save $660/year.
> - Nintendo Switch Online ($4.99) -- No gaming activity detected in 3 months.
> - Audible ($14.95) -- You have 3 unused credits. Pause for a month.
> - **Potential savings: $74.93/month ($899/year)**
>
> **2. Team Lunches:**
> - You spend avg $26.40 per team lunch, 2x/week = $211/month
> - If you brown-bag one of the two weekly lunches: **save ~$105/month**
>
> **3. Transport:**
> - I noticed you Uber to work on mornings after late calendar events (6 times this month, avg $18.50)
> - Transit pass is $105/month unlimited. You'd break even at 6 Uber rides.
> - **Tip:** Set morning buffer in your calendar to avoid rushing
>
> **Total potential savings: ~$285/month**
>
> Want me to set up savings challenges for any of these?"

**Step 5: Gamification & Social (Arena)**
- Tap Arena tab. Arena loads on "My Progress" internal tab:
  - Level 12: "Money Manager" (5,200 / 6,000 XP to Level 13)
  - Stats: 22-day streak, 5,200 XP, 12 badges earned
  - Streaks: 22-day check-in streak (large flame), 3-week budget streak at risk (yellow warning)
  - Recent badge: "Subscription Slayer" -- Cancelled 2+ unused subscriptions
- Switch to "Challenges" tab: Active challenge: "$500 Monthly Savings Sprint" with work circle "Dev Team"
    - Goal: Save $500 this month (spend under $2,500 of $3,000 budget)
    - Marcus current savings: $410 on track, but projection shows potential overspend
    - Progress bar: 82% of goal, 15 days remaining
    - Participants: 6 dev team members

**Step 6: Leaderboard & Social (within Arena)**
- Switch to "Leaderboard" internal tab within Arena, select "Inner Circle" scope, circle: "Dev Team"
- Metric: Savings Rate, This Month
- Podium: #1 Priya (92% savings rate), #2 James (85%), #3 Marcus (78%)
- Full list: #4 Devon (72%), #5 Amir (68%), #6 Lin (61%)
- Marcus's card: "#3 -- 78% savings rate -- 7% behind James"
- Switch to "Friends & Circles" tab: Marcus sends a nudge to James: "Coming for that #2 spot!"
- Challenge leaderboard for "$500 Savings Sprint": Marcus at #4, needs to tighten spending to climb

---

### Presentation Demo Script (3-Minute Pitch)

**[0:00 - 0:30] Problem Statement**
- Open with: "Show of hands -- who here has ever been surprised by how much they spent in a month?"
- Display a cluttered Google Calendar side-by-side with a bank statement full of transactions
- "Your calendar already knows what you're going to spend. That coffee meeting, that team lunch, that Friday night out -- every event has a price tag. But no financial app connects these dots."
- "Meet FutureSpend: the app that predicts your spending before it happens."
- Flash tagline: "See Tomorrow, Save Today, Share Success"

**[0:30 - 1:00] Solution Overview & Onboarding**
- Quick montage of Sarah's onboarding (4 screens, 2 seconds each): Welcome --> Connect Calendar --> Connect Bank --> Set Budget
- "In under 60 seconds, FutureSpend connects to your calendar and bank. We use your schedule to build a predictive spending model unique to you."
- Show Sarah's Dashboard: "$340 left of $1,000 budget"
- "Sarah is an SFU student. She can see at a glance that she's on track -- but the real magic is what comes next."

**[1:00 - 1:30] Core Magic -- Calendar Predictions**
- Switch to Calendar View. Show the heatmap: "Every day is color-coded by spending intensity. Darker means more expensive."
- Tap Friday: "Friday Night Karaoke -- $35 predicted with medium confidence."
- Tap into prediction detail: "This prediction is based on 4 similar past events. We use NLP to classify the event, then our ML pipeline predicts the amount with a confidence interval."
- Zoom into the prediction: "Study Group at JJ Bean -- $8 predicted. Sarah has spent $45 of her $50 coffee budget. FutureSpend alerts her before she overspends."
- Key differentiator moment: "RBC NOMI tells you what you already spent. FutureSpend tells you what you're about to spend. That's the difference between a rearview mirror and a windshield."

**[1:30 - 2:00] Gamification & Social (Arena)**
- Switch to Marcus's phone. Tap Arena tab, "My Progress" internal tab: "Marcus is Level 12, on a 22-day streak."
- Show badges grid: "Every good financial habit earns XP and badges -- like Duolingo for your wallet."
- Switch to Arena's "Leaderboard" internal tab: "Inner Circle" scope showing "Dev Team"
- "Marcus competes with his coworkers on savings rate. Peer accountability drives real behavioral change."
- Switch to Arena's "Challenges" tab, show active challenge: "$500 Monthly Savings Sprint"
- "Group challenges turn saving money from a solo chore into a team sport. Our Opal-inspired gamification creates lasting habits."

**[2:00 - 2:30] AI Assistant (Floating Chat)**
- Tap the floating AI chat button (teal circle, bottom-right corner). Chat sheet slides up. Type: "Can I afford to go out this weekend?"
- AI responds with personalized budget analysis: shows remaining budget, weekend predictions, specific suggestions
- "Our Claude-powered AI assistant is always one tap away -- a floating button on every screen. It knows your calendar, your budget, and your spending history. It gives advice that's actually personalized."
- Type: "Help me save more" -- AI identifies subscription bloat ($220/month, 3 unused), suggests specific cuts totaling $285/month in savings
- "It doesn't just show numbers -- it coaches you to better decisions. And it's context-aware -- suggested questions change based on which screen you're viewing."

**[2:30 - 3:00] Technical Depth & Close**
- Flash architecture diagram (2 seconds): React Native --> Supabase --> FastAPI ML --> Plaid + Google Calendar + Claude
- "Under the hood: a 5-stage ML pipeline processes calendar events through NLP classification, amount prediction, and confidence scoring."
- "Built on React Native with Expo, Supabase for real-time backend, FastAPI for the ML service, and Claude for conversational intelligence."
- "We integrate with Plaid for bank data and Google Calendar for schedule intelligence."
- Final slide: FutureSpend logo, tagline "See Tomorrow, Save Today, Share Success"
- "FutureSpend bridges the gap between your schedule and your finances. We're not just tracking -- we're predicting. And with gamification and social features, we make financial wellness something you actually want to do."
- "Thank you. We're Team Racoonwork, and this is FutureSpend."
- Display: team members, GitHub repo, QR code to demo

---

## 17. 24-Hour Implementation Timeline

### Team Composition

| Role | Responsibilities | Primary Skills |
|------|-----------------|----------------|
| **Dev A -- Frontend Lead** | React Native UI, navigation, animations, component library | React Native, Expo, TypeScript, Victory Native |
| **Dev B -- Backend Lead** | Supabase setup, API routes, Edge Functions, Plaid integration | Supabase, PostgreSQL, TypeScript, Plaid SDK |
| **Dev C -- AI/ML Engineer** | FastAPI service, ML models, Claude integration, prediction pipeline | Python, FastAPI, scikit-learn, sentence-transformers, Claude API |
| **Dev D -- Full-Stack Flex** | UI/UX design, frontend support, integration, demo prep | Figma, React Native, testing, presentation skills |

### Hour-by-Hour Breakdown

| Hour | Dev A (Frontend) | Dev B (Backend) | Dev C (AI/ML) | Dev D (Flex) |
|------|-----------------|-----------------|---------------|--------------|
| **0-1** | Expo project init with TypeScript template. Install core deps: `react-navigation`, `react-native-svg`, `victory-native`, `expo-secure-store`. Set up navigation scaffold (bottom tabs + stack navigators). Configure dark theme constants (`colors.ts`, `typography.ts`, `spacing.ts`). | Create Supabase project. Design and deploy database schema: `users`, `accounts`, `transactions`, `calendar_events`, `predictions`, `budgets`, `streaks`, `badges`, `user_badges`, `challenges`, `circles`, `friends`. Set up Row Level Security policies for all tables. | FastAPI project scaffold with Poetry. Define API routes: `/predict`, `/classify`, `/insights`, `/chat`. Set up synthetic data generator for calendar events + transactions (100 events across both demo personas). Download `all-MiniLM-L6-v2` sentence transformer model. | Create Figma wireframes for all screens (13 screens + floating chat overlay). Define component library: buttons, cards, inputs, badges, charts. Export SVG icons and assets. Create color palette, typography scale, and spacing system documentation for Dev A. |
| **1-2** | Build auth screens: Login (email + password), Sign Up (name, email, password). Integrate Supabase Auth SDK (`@supabase/supabase-js`). Implement secure token storage with `expo-secure-store`. Build auth state context provider. | Supabase Auth configuration: enable email/password provider. Create `handle_new_user` trigger function to auto-create profile row on signup. Build Edge Functions scaffold: `create-link-token`, `exchange-token`, `sync-transactions`. Test auth flow end-to-end. | Build event embedding pipeline: text preprocessing (lowercase, remove special chars, extract key entities) --> sentence-transformer encoding --> 384-dim vector output. Create event classifier: map embeddings to spending categories using cosine similarity against category centroids. Train on synthetic dataset. | Build onboarding screens 1-4 (Welcome, Connect Calendar, Connect Bank, Set Budget). Implement progress dots component. Style all screens to match dark theme. Wire up navigation between onboarding steps. |
| **2-3** | Build Dashboard (Metrics Hub) layout: top bar component with profile avatar, budget summary card with placeholder data. Implement `SpendingTrajectoryChart` using Victory Native (line chart with solid + dashed lines). Build Financial Health Score ring and key metric cards. | Plaid sandbox integration: implement `create-link-token` Edge Function (calls Plaid API to generate link token). Implement `exchange-token` to swap public token for access token. Implement `sync-transactions` to pull transactions and upsert into `transactions` table. Test with Plaid sandbox credentials. | Train event-to-amount prediction model (XGBoost regressor). Features: event category embedding (10-dim PCA), day of week, time of day, event duration, location type, historical average for category. Train on synthetic data. Implement confidence scoring based on prediction interval width + training data density. | Build Calendar View: month grid component with day cells, heatmap coloring logic. Implement day selection with bottom sheet (`@gorhom/bottom-sheet`). Style event list items within the bottom sheet. |
| **3-4** | Build category budget circles component: horizontal `ScrollView` with circular progress indicators (SVG-based). Implement color thresholds (green/yellow/red). Build transaction card list component with merchant, amount, date, category tag. | Build transaction processing pipeline: categorization rules engine (merchant name matching + MCC codes), recurring transaction detection (identify same merchant + similar amount at regular intervals), transaction-to-event matching (time proximity + amount correlation). | Implement amount prediction with confidence intervals. Build the full 5-stage pipeline as a single `/predict` endpoint: (1) NLP preprocessing, (2) category classification, (3) amount regression, (4) confidence scoring, (5) insight generation via Claude. Test pipeline end-to-end with sample events. | Set up chart components library with Victory Native. Build reusable `LineChart`, `DonutChart`, `ProgressBar`, `ProgressCircle` components. Ensure all charts render correctly with dark theme colors. Build Budget Detail View screen layout. |
| **4-5** | Build Calendar View integration with backend data. Implement heatmap intensity calculation from transaction data. Build week view toggle. Implement day detail bottom sheet with event list and prediction cards. Wire up calendar navigation (month switching). | Google Calendar OAuth flow: implement OAuth consent redirect with `expo-auth-session`. Build `sync-calendar` Edge Function: fetch events from Google Calendar API, normalize to internal schema, upsert to `calendar_events` table. Implement iCal (.ics) file parser for upload option. | Integrate Claude API for insight generation (stage 5 of pipeline). Build context assembly: gather user's budget, recent transactions, spending patterns, and prediction results into a structured prompt. Implement `/insights` endpoint that returns natural language explanations for predictions. Test insight quality on both personas. | Build Arena screen: level header with XP progress bar, stats row, streaks section with flame animations (Lottie), badge grid with earned/locked states. Create badge icon assets (24 badges). Build challenge card component. Build internal tab navigation (My Progress, Challenges, Leaderboard, Friends & Circles). |
| **5-6** | Build prediction cards for Plan screen: upcoming predictions section with event title, time, predicted amount, confidence badge. Build recurring expenses strip (horizontal scroll). Build budget planning tools and savings rules UI. Connect Dashboard and Plan screen to live Supabase data via `useEffect` + Supabase client queries. | Build budget calculation engine: aggregate transactions by category and month, calculate remaining budget, compute burn rate (actual spending pace vs linear pace), project month-end spending. Create `calculate_budget_status` database function. Build prediction storage: save ML predictions to `predictions` table with event linkage. | Full prediction pipeline integration testing. Run pipeline on all synthetic events for both demo personas. Verify: category classification accuracy >80%, amount predictions within 30% of synthetic actuals, confidence scores correlate with prediction error. Tune hyperparameters as needed. | Build Arena's Friends & Circles tab: friend code card, QR code generation (using `react-native-qrcode-svg`), friend list, circle list. Build Arena's Leaderboard tab: scope tabs, podium layout for top 3, ranked list below. Build Plan screen layout with prediction list, budget tools, and savings rules. Build Insights screen with health score, trend charts, and AI recommendations. Style all components. |
| **6-8** | Build floating AI chat assistant: FAB button component, bottom sheet chat interface, message list with AI/user message bubbles, typing indicator animation, context-aware suggested questions carousel, text input with send button. Implement chat state management. Connect to chat API endpoint. Integrate markdown rendering in AI messages (`react-native-markdown-display`). Implement context detection for screen-aware suggestions. | Build chat API: `/api/chat` Edge Function that assembles user context (budget status, recent transactions, upcoming predictions, calendar events) into a Claude system prompt. Stream Claude responses back to client. Implement conversation history storage in `chat_messages` table. Build suggested questions logic based on user state. | Optimize prediction pipeline performance. Implement batch prediction: process all upcoming events for a user in a single API call. Add caching layer for embeddings (avoid re-computing for recurring events). Build `/batch-predict` endpoint. Target: <2s for 30 events. | Build remaining Arena social features: friend request flow (send, accept, decline), circle creation and management, circle detail view with member list and mini leaderboard. Build "Start Challenge" flow within circles. Wire up friend code sharing with native share sheet. Integrate nudge system into Friends & Circles tab. |
| **8-10** | Frontend-backend integration sprint. Connect all screens to live Supabase data: Dashboard (budget, transactions, predictions), Calendar (events, predictions, heatmap data), Budget Detail (category transactions, trends), Transaction Review (full transaction data). Implement pull-to-refresh on all data screens. Fix data loading states and error handling. | Build gamification engine: XP award system (define XP values for actions: check-in=10, review transaction=5, under budget day=20, complete challenge=100). Level calculation function. Streak tracking: daily check-in streak, weekly budget streak, savings streak. Badge award triggers (database triggers that check badge conditions on relevant events). Challenge progress tracking. | Fine-tune models on edge cases: events with no location, very short event titles, events at unusual times, first-time venues. Improve confidence scoring calibration. Add fallback to Claude API for predictions when ML model confidence is below threshold (<40%). Build `/health` and `/metrics` endpoints for monitoring. | Build notification system: Expo push notification setup, notification permission request flow, notification scheduling for predictions (day-before alerts), budget alerts (80% and 100% thresholds), streak reminders (evening if not checked in). Build notification preferences storage and toggle UI. |
| **10-12** | UI polish sprint: add entrance animations (fade in, slide up) to Dashboard cards. Implement skeleton loading screens for all data-dependent views. Add haptic feedback on button presses. Implement swipe gestures on Transaction Review screen. Polish chart animations. Ensure consistent spacing and typography across all screens. | Social features backend: friend code generation (unique 8-char codes), friend request system (send, accept, decline with proper status management), circle CRUD operations, leaderboard queries (optimized with database views for savings rate, streak, health score calculations). Social nudge system: store and deliver nudge messages between friends. | Prediction accuracy testing and calibration. Run full prediction suite on both demo personas. Generate accuracy report: MAE, RMSE, confidence interval coverage. Calibrate confidence scores so that "High" predictions are within 20% of actual 80%+ of the time. Document prediction quality metrics for presentation. | Integration testing: walk through complete user flows for both demo personas end-to-end. Test onboarding --> dashboard --> calendar --> plan --> arena --> insights --> floating chat. Identify and log bugs. Fix critical path issues. Test on both iOS and Android simulators. |
| **12-14** | Rest break. Optional: address critical bugs identified in testing. | Rest break. Optional: address critical bugs identified in testing. | Rest break. Optional: address critical bugs identified in testing. | Rest break. Optional: address critical bugs identified in testing. |
| **14-16** | Responsive layout fixes: test on iPhone SE (small), iPhone 15 (medium), iPhone 15 Pro Max (large). Fix any overflow, truncation, or misalignment issues. Implement proper loading states for slow network. Build error state screens (no connection, API error, empty states). Add "empty state" illustrations for screens with no data. | Leaderboard optimization: create materialized views for leaderboard calculations to avoid expensive real-time aggregations. Challenge progress tracking: automatic progress updates when relevant events occur (e.g., transaction below budget increments challenge progress). Index tuning: add indexes on frequently queried columns (user_id + date on transactions, user_id on predictions). | Prediction accuracy final testing. Run A/B comparison: ML pipeline predictions vs Claude-only predictions vs simple average baseline. Prepare accuracy metrics for presentation slides. Ensure all API endpoints return proper error codes and messages. Load test: verify API can handle concurrent requests for demo. | End-to-end flow testing for both demo personas. Verify every screen transition, data loading, and user action. Test edge cases: what happens with no calendar connected, no bank connected, new user with no history. Document any remaining issues and prioritize fixes. |
| **16-18** | Demo data flow: create a "demo mode" toggle that loads realistic pre-seeded data for Sarah and Marcus personas. Ensure all screens populate correctly with demo data. Build persona switcher for presentation (hidden gesture: triple-tap logo to switch between Sarah and Marcus). Seed realistic transaction and calendar data. | Performance audit: verify all Supabase queries complete in <200ms. Check Edge Function cold start times. Optimize any slow queries. Set up basic monitoring: Supabase dashboard for real-time query metrics. Ensure Plaid sandbox demo flow works smoothly end-to-end. | Generate final demo predictions for both personas. Ensure all predicted amounts are realistic and consistent with the persona narratives. Prepare fallback: if ML service is down during demo, serve pre-computed predictions from Supabase. Deploy ML service to production (Railway or Render). | Screenshot capture for presentation slides: take polished screenshots of every key screen for both personas. Record short screen recordings of key flows (onboarding, prediction detail, AI chat interaction, gamification). Start building the presentation slide deck. |
| **18-20** | Final UI micro-interactions: add confetti animation for "Looks Good!" onboarding completion, check-in celebration, and badge earn moments. Add subtle parallax effect on Dashboard scroll. Polish bottom sheet snap behavior. Ensure all tappable areas have proper hit zones (minimum 44x44). Final dark theme audit: verify no white flashes on screen transitions. | Edge case handling: gracefully handle expired OAuth tokens (auto-refresh or prompt re-auth), handle Plaid webhook failures (retry logic), handle duplicate transactions (dedup by transaction_id). Data validation: ensure all API inputs are sanitized and validated. Add rate limiting to chat endpoint. | Final model deployment verification. Run health check on deployed ML service. Verify all endpoints respond correctly. Test prediction pipeline with live Supabase data (not just synthetic). Ensure error handling returns meaningful messages to frontend. | Slide deck creation: title slide, problem statement, solution overview, demo screenshots, architecture diagram, technical depth slide, team slide. Use FutureSpend brand colors in slides. Write speaker notes for each slide. |
| **20-22** | Demo rehearsal with full team. Walk through the 3-minute pitch with live app. Identify any remaining UI issues during the demo flow. Fix critical visual bugs. Ensure demo mode switches between personas cleanly. Practice the "tap flow" -- exact sequence of taps for the presentation. | Demo rehearsal support. Ensure backend is stable during rehearsal run-throughs. Monitor for any API errors or slow responses. Fix any data inconsistencies. Verify Supabase realtime subscriptions work for live updates during demo. | Demo rehearsal: walk through prediction explanations that will be shown during the pitch. Ensure AI chat responses are high quality and consistent. Pre-cache common demo chat queries so responses are fast during presentation. Test prediction detail views with real ML confidence scores. | Demo rehearsal coordination: time the pitch (must be exactly 3 minutes). Adjust pacing. Rehearse transitions between team members if presenting together. Practice answering likely judge questions: "How accurate are predictions?", "How does this scale?", "What about privacy?", "How is this different from Mint/YNAB?". |
| **22-24** | Final bug sweep: fix any issues found during rehearsals. Verify app builds cleanly with `expo build`. Ensure demo mode is the default on launch. Clear any development warnings or console errors. Final screenshot updates if UI changed. | Final stability check: restart Supabase Edge Functions, verify all services healthy. Create a "break glass" plan: if Supabase goes down, switch to local SQLite fallback. Ensure all environment variables are properly set in production. | Final ML service health verification. Ensure the deployed service is warm (no cold start during demo). Pre-warm prediction cache for demo events. Verify Claude API key has sufficient credits for demo chat interactions. | Final presentation practice (2-3 full run-throughs). Submit all required hackathon deliverables (demo video if required, GitHub repo link, project description). Prepare backup plan: pre-recorded demo video in case of live demo failure. Final team huddle. |

### Critical Path Dependencies

```
Hour 0-1: Supabase Schema + Auth ─────────────────┐
    │                                               │
    ├── Hour 1-2: Auth Screens (Frontend) ──────────┤
    │                                               │
    ├── Hour 2-4: Calendar Sync + Events ───────────┼── Hour 4-6: Predictions UI
    │       │                                       │       │
    │       └── Hour 2-6: ML Pipeline ──────────────┘       │
    │               │                                       │
    │               └── Hour 6-8: AI Chat ──────────────────┤
    │                                                       │
    ├── Hour 5-10: Gamification System ─────────────────────┤
    │                                                       │
    └── Hour 8-12: Integration + Polish ────────────────────┤
                                                            │
                        Hour 16-24: Demo Prep + Practice ───┘
```

**Bottleneck Analysis:**
1. **Supabase schema (Hour 0)** -- Everything depends on the database being ready. Dev B must complete this first.
2. **Calendar event data (Hour 2-4)** -- ML predictions cannot work without events. Calendar sync and synthetic data generation must be parallel.
3. **ML pipeline (Hour 2-6)** -- The core differentiator. If ML models underperform, Claude API serves as a reliable fallback.
4. **Frontend-backend integration (Hour 8-10)** -- This is where things typically break. Allocate extra buffer time.

### MVP Cut Line

**Must-Have (ship or fail):**
- Calendar integration (at minimum pre-loaded demo data with realistic events)
- Spending predictions for calendar events (ML pipeline or Claude API fallback)
- Dashboard with budget summary, spending trajectory, and category breakdowns
- Basic gamification: daily check-in streak, at minimum 5 earnable badges, XP and level display
- Floating AI Chat assistant with financial context (budget-aware, calendar-aware, context-aware per screen)
- At least one demo persona (Sarah) fully working end-to-end with realistic data

**Nice-to-Have (stretch goals, in priority order):**
- Plaid live bank integration (fallback: realistic mock transaction data loaded at startup)
- Social features: friend circles, leaderboards, friend codes (fallback: show static mockup)
- Push notifications for predictions and budget alerts
- Challenge system with progress tracking and circle competitions
- Multiple calendar provider support (Outlook, Apple Calendar via iCal)
- Savings automation rules and goal tracking
- Second demo persona (Marcus) fully working
- Week view in Calendar screen
- Transaction splitting feature
- Data export functionality

### Risk Mitigation Matrix

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Google Calendar OAuth rejected/delayed | Medium | High | Pre-built synthetic data generator produces 30 days of realistic events for both personas. iCal file upload as alternative path. Demo uses pre-seeded data regardless. |
| Plaid sandbox instability | Medium | Medium | Pre-built mock transaction dataset (200+ realistic transactions per persona). Plaid is nice-to-have; core demo works without it. |
| ML model accuracy too low | Medium | High | Claude API as intelligent fallback for predictions. Pre-compute all demo predictions and cache in Supabase. Even 60% accuracy is demonstrable with proper confidence scoring. |
| Time pressure -- features incomplete | High | High | Strict MVP cut line. Focus on demo flow quality, not feature quantity. One fully polished persona beats two half-finished ones. Build demo mode first (Hour 16-18). |
| Cross-platform React Native bugs | Medium | Medium | Demo on iOS simulator only. Avoid platform-specific APIs. Use Expo managed workflow to minimize native code issues. |
| Supabase rate limits or downtime | Low | Critical | Local SQLite fallback for demo. Pre-cache all demo data on device. Edge Functions have 30s timeout -- keep queries simple. |
| Claude API rate limits during demo | Low | High | Pre-cache common chat responses. Implement response timeout with graceful fallback message. Ensure API key has sufficient quota before presentation. |
| Team member unavailable | Low | High | Each team member documents their work. Shared GitHub repo with clear PR descriptions. Any team member can present any section. |

---

## Appendix: Competition Alignment Checklist

| Requirement | How FutureSpend Addresses It | Section Reference |
|------------|------------------------------|-------------------|
| Multi-calendar integration | Google Calendar OAuth 2.0 for primary calendar sync. iCal (.ics) file upload for any calendar provider (Outlook, Apple Calendar). Multi-calendar merge algorithm deduplicates events across sources. Synthetic data generator as fallback ensures demo works regardless of OAuth status. | SS6 |
| Spending prediction | 5-stage ML pipeline: (1) NLP preprocessing and entity extraction, (2) Event classification via sentence-transformer embeddings + cosine similarity, (3) Amount prediction via XGBoost regressor with temporal and categorical features, (4) Confidence scoring based on prediction interval width and training data density, (5) Natural language insight generation via Claude API. | SS4 |
| Savings optimization | Smart Savings Rules engine analyzes spending patterns and suggests actionable cuts. Compound savings projections show long-term impact of small changes. AI-recommended strategies personalized to user's calendar and spending history. Subscription bloat detection identifies unused services. Budget pacing alerts warn before overspending. | SS5 |
| Gamification | Opal-inspired gamification system with daily/weekly/savings streaks (flame animations scale with streak length). 24 earnable badges across financial behavior categories. XP and leveling system with titled ranks. Group challenges with progress tracking and deadlines. Daily check-in mechanic for habit formation. | SS8 |
| Social/Community | Friend system with unique friend codes and QR sharing. Inner Circles for small groups (roommates, coworkers). Multi-metric leaderboards (savings rate, streaks, health score, challenge wins). Shared challenges within circles. Social nudges for peer accountability. Privacy controls for all shared data. | SS9 |
| Behavioral change | Streaks create daily engagement habits (check-in, budget review). Peer accountability through circle leaderboards and shared challenges. Nudge system delivers timely, contextual push notifications (pre-event spending alerts, streak reminders, budget warnings). Badge progression rewards sustained positive behavior. AI coaching provides personalized behavioral recommendations. | SS8, SS9 |
| RBC NOMI extension | NOMI provides backward-looking transaction analysis and reactive insights ("You spent more on dining this month"). FutureSpend provides forward-looking prediction and proactive intervention ("Your calendar shows 3 restaurant events this week -- predicted spend: $85"). FutureSpend is the predictive complement to NOMI's descriptive analytics, bridging the gap between "what happened" and "what will happen." | SS1 |
| Technical innovation | Calendar-to-spending ML pipeline is a novel approach not found in existing personal finance apps. Calendar Correlation Index (CCI) metric quantifies the relationship between schedule density and spending behavior. Sentence-transformer embeddings enable semantic understanding of calendar events beyond keyword matching. Confidence-scored predictions with explainable AI provide transparency. | SS4, SS5 |
| User experience | Copilot.money-inspired dark theme UI (`#0A1628` background, `#00D09C` teal accent) provides a premium, modern aesthetic. Opal-inspired gamification (streaks, badges, levels) makes financial management engaging. Claude-powered AI chat assistant provides conversational financial coaching. 13 fully specified screens cover the complete user journey from onboarding to social competition. | SS11, SS15 |

---

*Built with love for RBC Tech @ SFU Mountain Madness 2026*
*Team Racoonwork*

