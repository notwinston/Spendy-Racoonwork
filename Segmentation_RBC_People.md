# FutureSpend — User Segmentation, Hidden Cost Prediction & Engagement Strategy

### Technical Specification Hybrid — Team Racoonwork
### RBC Tech @ SFU Mountain Madness 2026

---

## Table of Contents

1. [User Personas & Segmentation](#1-user-personas--segmentation)
2. [Hidden Cost Prediction Engine](#2-hidden-cost-prediction-engine)
3. [Data Signal Architecture](#3-data-signal-architecture)
4. [UX Surface Points — Where Hidden Costs Appear](#4-ux-surface-points)
5. [HiddenCostBreakdown Component Spec](#5-hiddencostbreakdown-component-spec)
6. [Metrics & Scoring System](#6-metrics--scoring-system)
7. [Engagement & Retention Loops](#7-engagement--retention-loops)
8. [RBC NOMI Integration Points](#8-rbc-nomi-integration-points)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. User Personas & Segmentation

FutureSpend targets two primary segments — university students and young professionals — equally. Both share the core problem: **multiple overlapping calendars create unpredictable spending patterns**, but their spending triggers, income patterns, and engagement hooks differ.

### Persona A: The University Student

| Attribute | Detail |
|---|---|
| **Name** | Sarah Chen, 21, SFU Computer Science |
| **Income** | $1,200/mo (part-time + occasional freelance), irregular pay schedule |
| **Calendars** | School (lectures, labs, office hours), Social (parties, coffee dates, club events), Work (shifts), Health (gym) |
| **Budget Pressure** | Tight — $300-500/mo discretionary after rent + tuition |
| **Spending Triggers** | Study groups → coffee, Friday nights → bars + Uber, exam weeks → UberEats, end of semester → moving/storage |
| **Hidden Cost Vulnerability** | HIGH — "Study group at Starbucks" seems free but costs $7. "Friend's birthday dinner" → dinner + drinks + gift + Uber = $90 |
| **Key Pain** | Runs out of money by week 3 of the month. Doesn't connect calendar busyness to spending spikes. |
| **Engagement Hook** | Social accountability — friends doing savings challenges together. Streaks for daily check-ins. |
| **Demo Persona** | Maps to `loadDemoData(userId, 'sarah')` in `transactionStore.ts:97` |

**Sarah's Hidden Cost Scenario:**
```
Calendar Event: "Birthday Dinner — Earls Kitchen, 7pm Friday"
├─ Base Prediction: $45 (dinner)          — Likely    ●
├─ Hidden Cost 1:  $28 (drinks after)     — Likely    ●
├─ Hidden Cost 2:  $15 (Uber home)        — Possible  ●
├─ Hidden Cost 3:  $25 (birthday gift)    — Likely    ●
└─ TOTAL PREDICTED: $113
   vs her mental budget of "$45 for dinner"
```

### Persona B: The Young Professional

| Attribute | Detail |
|---|---|
| **Name** | Marcus Rivera, 27, Junior Developer at a Vancouver startup |
| **Income** | $4,800/mo after tax, biweekly deposits |
| **Calendars** | Work (meetings, team lunches, conferences), Personal (gym, hobbies), Social (dates, friend dinners, weekend trips), Health (dentist, physio) |
| **Budget Pressure** | Moderate — $1,500-2,000/mo discretionary, but lifestyle inflation is real |
| **Spending Triggers** | Work lunches ($15-25 unplanned), after-work drinks, "quick" weekend trips that balloon, conference travel |
| **Hidden Cost Vulnerability** | MODERATE-HIGH — "Team offsite" = Uber + lunch + coffee + parking. "Whistler weekend" = gas + lift tickets + gear rental + dining out × 3 |
| **Key Pain** | Earns well but can't explain where $800/mo disappears. Calendar is packed, spending feels invisible. |
| **Engagement Hook** | Actionable AI insights — feels like having a smart financial advisor. Progress tracking via health score. |
| **Demo Persona** | Maps to `loadDemoData(userId, 'marcus')` in `transactionStore.ts:97` |

**Marcus's Hidden Cost Scenario:**
```
Calendar Event: "Whistler Weekend Trip, Sat-Sun"
├─ Base Prediction: $180 (lift tickets)   — Likely    ●
├─ Hidden Cost 1:  $65 (gas round trip)   — Likely    ●
├─ Hidden Cost 2:  $95 (2 dinners out)    — Likely    ●
├─ Hidden Cost 3:  $40 (gear rental)      — Possible  ●
├─ Hidden Cost 4:  $25 (coffee/snacks)    — Possible  ●
├─ Hidden Cost 5:  $150 (flat tire/tow)   — Unlikely  ●
└─ TOTAL PREDICTED: $405-555
   vs his mental budget of "$180 for lift tickets"
```

### Segmentation Decision Matrix

| Decision Point | Student (Sarah) | Professional (Marcus) |
|---|---|---|
| Default budget categories | dining, groceries, transport, entertainment, social, education | dining, transport, entertainment, shopping, fitness, professional, bills |
| Default budget limits | `$300-500/mo total` — maps to `DEFAULT_BUDGETS` in `budgetStore.ts:26-35` but scaled down | `$1,500-2,000/mo total` — uses current `DEFAULT_BUDGETS` values |
| Prediction confidence baseline | Lower — more spontaneous spending, less predictable patterns | Higher — more routine, recurring patterns emerge faster |
| Hidden cost emphasis | Social events, study sessions, end-of-term surprises | Work events, travel, lifestyle/convenience spending |
| Savings rules that work | Round-up (small amounts feel achievable), peer challenges | Save-the-difference (bigger deltas when predictions are under), auto-sweep |
| Onboarding flow | Quick setup — connect school calendar + bank, set $500 budget | Detailed — connect work + personal calendars, set per-category budgets |

---

## 2. Hidden Cost Prediction Engine

### Core Concept

Every calendar event has a **visible cost** (the thing you plan for) and **hidden costs** (the things that happen around the event). FutureSpend's key differentiator is predicting both.

```
┌─────────────────────────────────────────────────┐
│  EVENT: "Dinner at Earls, Friday 7pm"           │
│                                                   │
│  VISIBLE COST        HIDDEN COSTS                │
│  ┌──────────┐        ┌─────────────────────┐    │
│  │ Dinner   │        │ Drinks after   $28  │●   │
│  │ $45      │───────►│ Uber home      $15  │●   │
│  │          │        │ Birthday gift  $25  │●   │
│  └──────────┘        │ Parking        $8   │●   │
│                      └─────────────────────┘    │
│                                                   │
│  TOTAL: $45 visible + $76 hidden = $121          │
│  Your historical avg for similar events: $108    │
└─────────────────────────────────────────────────┘
```

### Three Layers of Unexpected Cost Detection

**Layer 1: Calendar-Triggered Hidden Costs (Per-Event)**

The AI analyzes each calendar event and predicts adjacent spending that isn't explicitly part of the event.

| Event Type | Base Cost | Common Hidden Costs | Detection Method |
|---|---|---|---|
| Restaurant dinner | Meal | Drinks after, Uber, parking, tip overshoot | Historical pattern matching on post-dinner transactions within 3 hours |
| Study group at cafe | Nothing (planned) | Coffee, snack, impulse pastry | Location-based spending correlation |
| Team lunch | Sometimes covered | Your share, coffee after, dessert | Workplace calendar + transaction pattern |
| Weekend road trip | Gas/tickets | Emergency repairs, extra meals, souvenirs, accommodation overrun | Event duration × historical daily spend rate + risk buffer |
| Gym class | Membership (paid) | Smoothie bar, parking, replacement gear | Post-gym transaction pattern within 1 hour |
| Concert/show | Ticket (pre-bought) | Drinks, merch, food, transportation, parking | Venue type + historical event spending |
| Date night | Restaurant | Activity after, drinks, flowers/gift, Uber | Attendee analysis + time-of-day + day-of-week |

**Layer 2: Recurring Pattern Anomalies (Lifestyle Surges)**

Detects when your calendar density changes your spending baseline.

```
Normal week:       2 social events → avg spend $180/week
Busy week:         5 social events → avg spend $340/week
                   Surge: +$160 (89% increase)

FutureSpend alert: "This week has 5 social events — historically
                    weeks like this cost you $160 more than usual.
                    Budget an extra $160 or skip 1-2 events."
```

**Implementation:** Compare weekly event count by category against historical spending-per-event-density. Stored in `predictionStore` predictions array, cross-referenced with `transactionStore` transactions.

**Layer 3: Seasonal / Cyclical Surprises**

Detects time-based spending patterns that repeat yearly, semesterly, or seasonally.

| Cycle | Trigger | Hidden Costs | Detection Window |
|---|---|---|---|
| Exam periods | Increased stress, less cooking time | UberEats spike (+40%), coffee spike (+25%) | 2 weeks before exam dates on academic calendar |
| End of semester | Moving, storage, travel home | Moving truck, storage unit, flights, deposits | 3 weeks before semester end |
| Holiday season | Gift-giving, parties, travel | Gifts, party outfits, flights, decorations | Nov 15 - Dec 31 |
| Summer | Vacations, activities, festivals | Travel, activities, dining out surge | Jun-Aug |
| Back to school | Textbooks, supplies, new clothes | Books, tech, wardrobe refresh | Aug-Sep |
| Tax season | Filing fees, unexpected bills | Accountant, software, potential owing | Mar-Apr |

### Prediction Confidence — Traffic Light System

All hidden cost predictions use a three-tier confidence system (no raw percentages shown to users):

| Tier | Color | Meaning | Threshold | Icon | Display |
|---|---|---|---|---|---|
| **Likely** | Green ● | > 70% probability based on historical data | `confidence >= 0.70` | Filled green circle | Always shown, included in total |
| **Possible** | Yellow ● | 30-70% probability | `0.30 <= confidence < 0.70` | Filled yellow circle | Shown expanded, included in range estimate |
| **Unlikely but costly** | Red ● | < 30% probability but > $50 potential cost | `confidence < 0.30 && amount >= 50` | Filled red circle | Shown expanded with "risk" label, adds to high range only |

**Maps to existing type:** Extends `ConfidenceLabel` in `types/index.ts:69` (currently `'high' | 'medium' | 'low'`) — same semantics, different display names for user-facing context.

---

## 3. Data Signal Architecture

### Signal Sources (All Signals Layered)

The hidden cost engine combines four signal types, weighted by reliability:

```
┌───────────────────────────────────────────────────────┐
│                HIDDEN COST PREDICTION                  │
│                                                         │
│  ┌─────────────┐  Weight: 40%                          │
│  │ HISTORICAL   │  Past transactions within 3hr window │
│  │ PATTERNS     │  of similar events. Grouped by       │
│  │              │  event category + time + location.    │
│  └──────┬──────┘                                       │
│         │                                               │
│  ┌──────▼──────┐  Weight: 30%                          │
│  │ EVENT        │  Time of day, day of week, duration, │
│  │ METADATA     │  location type, attendee count,      │
│  │              │  is_recurring, event description.     │
│  └──────┬──────┘                                       │
│         │                                               │
│  ┌──────▼──────┐  Weight: 20%                          │
│  │ SOCIAL       │  Who are the attendees? Historical   │
│  │ SIGNALS      │  spending when with specific people. │
│  │              │  "Events with Alex = +$40 avg."      │
│  └──────┬──────┘                                       │
│         │                                               │
│  ┌──────▼──────┐  Weight: 10%                          │
│  │ SEASONAL /   │  Time of year, academic calendar,    │
│  │ CONTEXTUAL   │  holidays, weather, local events.    │
│  └─────────────┘                                       │
│                                                         │
│  OUTPUT: List of HiddenCost items with amount +        │
│          confidence tier + explanation string           │
└───────────────────────────────────────────────────────┘
```

### Data Flow — Store Integration

```
calendarStore.events ──────┐
                           │
transactionStore           │     ┌────────────────────┐
  .transactions ───────────┼────►│ predictionService   │
  .recurringTransactions ──┘     │  .predictSpending() │
                                 │  .predictHiddenCosts │◄── NEW
socialStore                      │    ()                │
  .friends ────────────────────►│                      │
                                 └────────┬───────────┘
                                          │
                                          ▼
                                 ┌────────────────────┐
                                 │ predictionStore     │
                                 │  .predictions[]     │
                                 │  .hiddenCosts[]     │◄── NEW field
                                 │  .dailyBrief        │◄── NEW field
                                 └────────────────────┘
```

### New Types Needed

Add to `app/src/types/index.ts`:

```typescript
export type HiddenCostTier = 'likely' | 'possible' | 'unlikely_costly';

export interface HiddenCost {
  id: string;
  prediction_id: string;          // links to parent SpendingPrediction
  calendar_event_id: string;
  label: string;                   // "Drinks after dinner"
  description: string;             // "Based on 4 similar Friday dinners, you went to a bar 75% of the time"
  predicted_amount: number;
  amount_low: number;
  amount_high: number;
  tier: HiddenCostTier;
  confidence_score: number;        // 0-1 raw score (used internally for tier assignment)
  category: EventCategory;         // what category this hidden cost falls under
  signal_source: 'historical' | 'metadata' | 'social' | 'seasonal';
  is_dismissed: boolean;           // user can dismiss irrelevant predictions
}

export interface EventCostBreakdown {
  calendar_event_id: string;
  base_prediction: SpendingPrediction;
  hidden_costs: HiddenCost[];
  total_likely: number;            // sum of base + likely hidden costs
  total_possible: number;          // sum of base + likely + possible
  total_with_risk: number;         // sum of all including unlikely_costly
  historical_avg: number | null;   // avg total spend on similar past events
}

export interface DailyBrief {
  date: string;
  events: EventCostBreakdown[];
  total_predicted_low: number;
  total_predicted_high: number;
  top_warning: string | null;      // AI-generated one-liner: "Watch out for post-dinner drinks tonight"
  savings_opportunity: string | null; // "Skip Uber and walk — save $15"
}
```

### New Supabase Table

```sql
-- Migration: 012_create_hidden_costs.sql

CREATE TABLE hidden_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES spending_predictions(id) ON DELETE CASCADE,
  calendar_event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  predicted_amount DECIMAL(10,2) NOT NULL,
  amount_low DECIMAL(10,2) NOT NULL,
  amount_high DECIMAL(10,2) NOT NULL,
  tier hidden_cost_tier NOT NULL DEFAULT 'possible',
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  category event_category NOT NULL,
  signal_source TEXT NOT NULL CHECK (signal_source IN ('historical','metadata','social','seasonal')),
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  actual_amount DECIMAL(10,2),
  was_accurate BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE hidden_cost_tier AS ENUM ('likely', 'possible', 'unlikely_costly');

CREATE INDEX idx_hidden_costs_event ON hidden_costs(calendar_event_id);
CREATE INDEX idx_hidden_costs_user ON hidden_costs(user_id);

ALTER TABLE hidden_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own hidden costs" ON hidden_costs
  FOR ALL USING (auth.uid() = user_id);
```

---

## 4. UX Surface Points

Hidden costs appear in **three contexts**, each tailored to the moment:

### Surface 1: Morning Daily Brief (Push Notification + In-App)

**When:** 8:00 AM (configurable in settings)
**What:** Summary of today's events with total predicted spending including hidden costs.
**Where:** Push notification → opens a Daily Brief card at the top of the Dashboard.

```
┌─────────────────────────────────────────────────┐
│  ☀️  Today's Spending Forecast     Feb 28       │
│                                                   │
│  3 events · Estimated $120 - $185                │
│                                                   │
│  ⚠️  Watch out for: post-dinner drinks ($28)     │
│  💡  Tip: Pack lunch to save $18 on team lunch   │
│                                                   │
│  [View Full Breakdown →]                         │
└─────────────────────────────────────────────────┘
```

**Component:** New `DailyBriefCard` in `app/src/components/DailyBriefCard.tsx`, embedded in `dashboard.tsx` above the hero card.

**Data source:** `predictionStore.dailyBrief` (new field), populated by calling `predictionService.generateDailyBrief()` each morning.

### Surface 2: Calendar Event Cards (Inline Expandable)

**When:** User browses calendar or taps on an event in the day detail modal.
**What:** Each event card shows base cost + expandable hidden cost section.
**Where:** Inside the existing day detail modal in `calendar.tsx:379-527` and prediction cards in `plan.tsx:286-334`.

```
┌─────────────────────────────────────────────────┐
│  🍽️  Dinner at Earls                  7:00 PM   │
│  Granville St · 5 attendees                      │
│                                                   │
│  Base Cost                            $45.00     │
│  ─────────────────────────────────────────────   │
│  ▼ Hidden Costs (3)                   +$68.00    │
│  │                                               │
│  │  ● Drinks after dinner              $28.00   │
│  │    Based on 4 similar Friday dinners          │
│  │                                               │
│  │  ● Uber home                        $15.00   │
│  │    Late night + downtown location             │
│  │                                               │
│  │  ● Birthday gift                    $25.00   │
│  │    "Birthday" in event title                  │
│  │                                               │
│  ─────────────────────────────────────────────   │
│  TOTAL ESTIMATED              $113.00 - $135.00  │
│  Your avg for similar events: $108               │
│                                                   │
│  [Adjust Budget]  [Dismiss Hidden Costs]         │
└─────────────────────────────────────────────────┘
```

**Component:** New shared `HiddenCostBreakdown` component (see Section 5), embedded inside the existing `eventCard` in the calendar modal and `predictionCard` in the plan screen.

### Surface 3: Pre-Event Push Notification

**When:** 2-4 hours before the event starts (configurable).
**What:** Reminder with the full predicted cost including hidden items.
**Where:** System push notification via `notificationStore.ts`.

```
FutureSpend
Dinner at Earls in 3 hours
Budget $113 (not just $45!) — drinks & Uber likely.
You have $240 left in your dining budget.
[Open Event Details]
```

**Integration with existing code:** Uses the existing `Notification` type in `types/index.ts:361-372` and `notificationStore.ts`. Notification `category` = `'hidden_cost_reminder'`, `priority` = `'medium'`, `data` includes `{ calendar_event_id, total_predicted }`.

---

## 5. HiddenCostBreakdown Component Spec

### Component: `app/src/components/HiddenCostBreakdown.tsx`

A shared, reusable component embedded inside existing event cards wherever they appear (calendar modal, plan screen, daily brief).

### Props Interface

```typescript
interface HiddenCostBreakdownProps {
  eventCostBreakdown: EventCostBreakdown;
  defaultExpanded?: boolean;       // false in calendar, true in plan
  onDismissCost?: (costId: string) => void;
  onAdjustBudget?: (category: EventCategory, amount: number) => void;
  compact?: boolean;               // true for daily brief, false for detail views
}
```

### Visual States

**Collapsed (default in calendar view):**
```
Hidden Costs (3)  ● ● ●                    +$68 ▶
```
Shows count, tier dots (colored), total, and chevron.

**Expanded:**
```
▼ Hidden Costs (3)                          +$68
│
│  ● Drinks after dinner               $28.00
│    Based on 4 similar Friday dinners
│
│  ● Uber home                          $15.00
│    Late night + downtown location
│
│  ● Birthday gift                      $25.00
│    "Birthday" in event title
```

**Compact (daily brief):**
```
+3 hidden costs (~$68)  ● ● ●  [Details →]
```

### Tier Color Mapping

```typescript
const TIER_COLORS: Record<HiddenCostTier, string> = {
  likely: Colors.positive,         // green — #00D09C (from constants/colors.ts)
  possible: Colors.warning,        // yellow — #FFB020
  unlikely_costly: Colors.danger,  // red — #FF4757
};

const TIER_LABELS: Record<HiddenCostTier, string> = {
  likely: 'Likely',
  possible: 'Possible',
  unlikely_costly: 'Risk',
};
```

### Integration Points

**In `calendar.tsx` (day detail modal, around line 458-517):**
Insert `<HiddenCostBreakdown>` inside the existing `predictionSection` View, below the confidence row. Conditionally rendered when `eventCostBreakdown.hidden_costs.length > 0`.

**In `plan.tsx` (prediction cards, around line 286-334):**
Add below the existing confidence bar. Use `defaultExpanded={true}` since the Plan screen is the detail-oriented view.

**In `DailyBriefCard` (new component on dashboard):**
Use `compact={true}` variant. Tapping opens the full calendar event detail modal.

### Animation

- Expand/collapse: `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` on toggle.
- Hidden cost items fade in sequentially (50ms stagger) when expanding.
- Tier dots pulse once when first rendered (draws attention).

---

## 6. Metrics & Scoring System

### Existing Metrics in Codebase

These are already implemented and should be referenced (not duplicated):

| Metric | Location | Formula |
|---|---|---|
| **Burn Rate** | `budgetStore.ts:215-218` | `(spent / expectedSpent)` where `expectedSpent = (budget / daysInMonth) * dayOfMonth` |
| **Health Score** | `budgetStore.ts:229-247` | `0.35 × burnScore + 0.30 × adherenceScore + 0.15 × streakScore + 0.20 × savingsScore` |
| **Health Grade** | `budgetStore.ts:249-257` | A+ (≥90), A (≥80), B (≥70), C (≥60), D (≥50), F (<50) |
| **Budget Adherence** | `insights.tsx:83-87` | `(categories under budget / total categories) × 100` |
| **Category Spending %** | `insights.tsx:110-128` | Per-category amount / total monthly spending |
| **Weekly Trend** | `insights.tsx:131-149` | Last 6 weeks rolling totals |
| **XP / Level** | `gamificationStore.ts:116-124` | `xpThresholdForLevel()` + progress calculation |
| **Streak Count** | `gamificationStore.ts:35-41` | `profile.streakCount`, `profile.longestStreak` |
| **Prediction Confidence** | `predictionStore.ts` + `predictionService.ts:159-163` | `≥ 0.75 = high, ≥ 0.5 = medium, < 0.5 = low` |

### New Metrics to Add

#### 6.1 Calendar Correlation Index (CCI) — Novel Metric

**What:** How accurately your calendar predicts your actual spending. This is FutureSpend's **signature metric** — no other finance app has this.

**Formula (from INSIGHTS_METRICS_DESIGN.md):**
```
CCI = (predicted_events_with_actual_spend / total_predicted_events) × accuracy_weight
accuracy_weight = 1 - |predicted_amount - actual_amount| / max(predicted, actual)
```

**Implementation location:** New function in `budgetStore.ts` or a dedicated `metricsService.ts`:

```typescript
export function calculateCCI(
  predictions: SpendingPrediction[],
  transactions: Transaction[],
): { score: number; label: string; perCategory: Record<string, number> } {
  // Match predictions to actual transactions by event_id + date window
  // Calculate per-prediction accuracy
  // Aggregate into overall CCI score (0-100)
  // Return breakdown by category
}
```

**Display:** See INSIGHTS_METRICS_DESIGN.md Section 3 for full visualization spec. Score badge + prediction accuracy dots + per-category bars.

#### 6.2 Hidden Cost Accuracy

**What:** How well did the hidden cost predictions match reality? Builds trust over time.

**Formula:**
```
HiddenCostAccuracy = Σ(hidden costs where |predicted - actual| < 30%) / total_hidden_costs
```

**Display:** Inside the HiddenCostBreakdown component — after an event passes, show actual vs predicted:
```
● Drinks after dinner    Predicted: $28  →  Actual: $32  ✓ Close
● Uber home              Predicted: $15  →  Actual: $0   ✗ Didn't happen
● Birthday gift          Predicted: $25  →  Actual: $30  ✓ Close
```

#### 6.3 Spending Velocity

**What:** How fast you're spending in $/day, compared to your budget pace.

**Formula (from INSIGHTS_METRICS_DESIGN.md):**
```
Velocity = Σ(last 7 days spending) / 7
BudgetVelocity = TotalMonthlyBudget / DaysInMonth
SpendingRatio = Velocity / BudgetVelocity
```

**Implementation:** Computed in `insights.tsx` from `transactionStore.transactions`. 7-day rolling window.

#### 6.4 Surprise Spend Ratio

**What:** What percentage of your monthly spending was "unexpected" — not tied to any calendar event or recurring transaction?

**Formula:**
```
SurpriseRatio = (total_spend - calendar_predicted_spend - recurring_spend) / total_spend
```

**Why it matters:** Lower = better. Means the user's financial life is more predictable and manageable. Gives users a target to reduce.

#### 6.5 Event Cost Variance

**What:** Per-event-type metric showing how consistent spending is for similar events.

**Formula:**
```
Variance_category = stddev(actual_amounts) for events of that category
CV = Variance_category / mean(actual_amounts)  // coefficient of variation
```

**Display:** Traffic light per event type: Green (CV < 0.2, very predictable), Yellow (0.2-0.5), Red (> 0.5, highly variable). Helps users understand which parts of their life are predictable vs chaotic.

### Metric Scoring Summary (for Health Score v2)

Updated Health Score formula incorporating new metrics:

```
HealthScore v2 = 0.25 × BudgetAdherence
               + 0.20 × BurnRate (inverted — closer to 1.0 = better)
               + 0.20 × CalendarCorrelation (CCI)
               + 0.15 × SavingsRate
               + 0.10 × StreakBonus
               + 0.10 × HiddenCostAwareness (% of hidden costs acknowledged/prepared for)
```

This extends the existing `calculateHealthScore()` in `budgetStore.ts:229-247`.

---

## 7. Engagement & Retention Loops

### Design Philosophy: Easy In, Hard to Leave

The app must be **effortless to start using** (< 2 minutes to value) and create **compounding reasons to return** daily.

### Loop 1: Actionable AI Insights (Primary Retention Driver)

**Why it works:** The AI feels like a smart friend who knows your schedule. Every notification adds value.

| Trigger | Insight Type | Example | Frequency |
|---|---|---|---|
| Morning | Daily Brief | "3 events today, budget $120-185. Watch for post-dinner drinks." | Daily, 8am |
| Pre-event | Hidden Cost Alert | "Dinner in 3hrs — budget $113, not $45. Drinks & Uber likely." | Per event, 2-4hrs before |
| Week start | Weekly Preview | "Busy week ahead — 8 events, $340 predicted. That's $160 above your avg." | Monday 9am |
| Budget threshold | Overspend Warning | "Dining is at 80% with 12 days left. 3 more dinners predicted." | When any category hits 75% |
| Post-event | Accuracy Check | "Dinner last night cost $108. We predicted $113. How'd we do?" | Morning after event |
| End of week | Win Summary | "You saved $45 by packing lunch twice. 🎯 Keep going." | Sunday 6pm |

**Implementation:** Extends `predictionService.ts` with new prompt builder functions:
- `buildDailyBriefPrompt()` — takes today's events + hidden costs + budget status
- `buildWeeklyPreviewPrompt()` — takes week's events + historical pattern data
- Scheduled via `notificationStore.ts` using Expo Notifications scheduling

### Loop 2: Streaks & Rewards

**Why it works:** Habit formation through consistency. Low-effort daily actions compound.

**Daily Check-in (existing in `gamificationStore.ts:151-184`):**
- Open the app → tap "Check In" → +10 XP
- Streak multiplier: Day 7 = 2×, Day 14 = 3×, Day 30 = 5×
- Missing a day resets to 1× (but doesn't reset streak count for badge purposes)

**Transaction Review Streaks (new):**
- Review all transactions for the day → +5 XP
- Review hidden cost accuracy (post-event) → +15 XP
- 7-day review streak → unlock "Detail Detective" badge

**Badge Progression (extends existing badges in `gamificationStore.ts`):**

| Badge | Condition | Tier | XP |
|---|---|---|---|
| First Forecast | View your first hidden cost prediction | Bronze | 25 |
| Crystal Ball | 10 hidden cost predictions confirmed accurate | Silver | 100 |
| Budget Guardian | Stay under budget for 1 full month | Silver | 150 |
| Hidden Cost Hunter | Dismiss 0 hidden costs (all acknowledged) for 1 week | Gold | 200 |
| Prediction Master | CCI score > 80% for 1 month | Gold | 250 |
| Financial Sage | Health Score A+ for 2 consecutive weeks | Diamond | 500 |
| Social Saver | Complete 3 friend challenges | Silver | 150 |
| Streak Legend | 30-day check-in streak | Diamond | 300 |

### Loop 3: Social Accountability

**Why it works:** Peer comparison and support. You don't want to be the friend who overspends.

**Friend Challenges (extends existing `socialStore.ts` + `gamificationStore.ts`):**

| Challenge Type | Description | Duration | XP |
|---|---|---|---|
| No-Spend Weekend | $0 discretionary spending Sat-Sun | 2 days | 100 |
| Coffee Cutback | Reduce coffee spending by 30% this week | 7 days | 75 |
| Lunch Prep Week | Pack lunch every workday | 5 days | 80 |
| Hidden Cost Master | Acknowledge all hidden costs before events | 7 days | 120 |
| Savings Sprint | Save $100 more than usual this month | 30 days | 200 |

**Nudges (existing `SocialNudge` type in `types/index.ts:350-359`):**
- "Sarah saved $50 this week! Send her encouragement?"
- "Marcus is on a 14-day streak! You're at 3 — catch up?"
- "Your circle 'SFU Savers' has a new challenge: No-Spend Weekend"

### Loop 4: Beautiful, Effortless UI/UX

**Why it works:** If the app is pleasant to use and feels fast, people open it more.

**Design Principles (maps to `constants/colors.ts`, `typography.ts`, `spacing.ts`):**

1. **Dark theme by default** — current `Colors.background: '#0F1923'` is premium and easy on eyes
2. **One-tap value** — open app → immediately see today's forecast + budget status. No navigation required.
3. **Smooth animations** — expand/collapse hidden costs, chart transitions, streak celebrations
4. **Minimal input** — the AI does the work. User just reviews and confirms. Receipt scanning (existing in `plan.tsx`) reduces manual entry.
5. **Progressive disclosure** — base cost shown by default, hidden costs expand on tap. Don't overwhelm.
6. **Celebratory micro-interactions** — confetti on badge unlock, pulse on streak milestone, level-up animation
7. **Fast load** — all data from Zustand stores, SSR from Supabase. Demo data loads instantly via `loadDemoData()`.

**Onboarding (existing screens in `app/onboarding/`):**
1. `welcome.tsx` — Value prop: "See what your calendar really costs"
2. `connect-bank.tsx` — Plaid integration (or demo data)
3. `connect-calendar.tsx` — Apple/Google/Outlook calendar
4. `set-budget.tsx` — Quick budget setup with smart defaults by persona

**Target:** < 90 seconds from app install to seeing first hidden cost prediction on today's events.

---

## 8. RBC NOMI Integration Points

FutureSpend extends RBC NOMI's capabilities in three specific areas:

### 8.1 Calendar-Aware Predictions

**NOMI today:** Analyzes past spending to provide insights.
**FutureSpend adds:** Forward-looking predictions based on calendar events + hidden costs. NOMI could ingest FutureSpend's `EventCostBreakdown` data to enhance its cash flow forecasting.

### 8.2 Social Savings Layer

**NOMI today:** Individual automated savings (Find & Save).
**FutureSpend adds:** Social challenges, friend circles, and peer accountability. NOMI's automated savings could be triggered by challenge goals — e.g., "Save the difference" rule auto-sweeps when predictions come in under budget.

### 8.3 Proactive Notifications

**NOMI today:** Reactive insights ("You spent $X on dining this month").
**FutureSpend adds:** Proactive alerts before spending happens ("Budget $113 for tonight, not $45"). NOMI's notification pipeline could incorporate hidden cost alerts as a new insight type.

**Technical bridge:** FutureSpend's `DailyBrief` and `HiddenCost` data could be exposed via API endpoints that NOMI's insight engine consumes, adding calendar-correlation as a new signal to NOMI's existing ML pipeline.

---

## 9. Implementation Roadmap

### Priority Order (Hackathon Scope)

| Priority | Task | Files Affected | Effort |
|---|---|---|---|
| **P0** | Define `HiddenCost`, `EventCostBreakdown`, `DailyBrief` types | `types/index.ts` | 15 min |
| **P0** | Build `HiddenCostBreakdown` shared component | New: `components/HiddenCostBreakdown.tsx` | 1.5 hrs |
| **P0** | Add hidden cost prediction to `predictionService.ts` | `services/predictionService.ts` — new `predictHiddenCosts()` function + LLM prompt | 1.5 hrs |
| **P0** | Integrate `HiddenCostBreakdown` into calendar modal | `app/(tabs)/calendar.tsx` — inside `renderDayDetailModal()` | 30 min |
| **P0** | Integrate into plan screen prediction cards | `app/(tabs)/plan.tsx` — inside prediction card map | 30 min |
| **P1** | Build `DailyBriefCard` component for dashboard | New: `components/DailyBriefCard.tsx` + `dashboard.tsx` integration | 1 hr |
| **P1** | Add CCI calculation to metrics | `budgetStore.ts` or new `metricsService.ts` | 45 min |
| **P1** | Update CCI visualization in insights screen | `app/(tabs)/insights.tsx` — new section | 1 hr |
| **P1** | Add `hiddenCosts` field to `predictionStore.ts` | `stores/predictionStore.ts` | 30 min |
| **P2** | Pre-event push notifications | `stores/notificationStore.ts` + Expo Notifications | 45 min |
| **P2** | Hidden cost accuracy tracking (post-event) | `predictionStore.ts` + new UI in transaction-review | 1 hr |
| **P2** | New badges for hidden cost engagement | `gamificationService.ts` + `gamificationStore.ts` | 30 min |
| **P2** | Supabase migration for hidden_costs table | New: `supabase/migrations/012_create_hidden_costs.sql` | 15 min |
| **P3** | Morning daily brief notification scheduling | `notificationStore.ts` + Expo Notifications scheduling | 45 min |
| **P3** | Surprise Spend Ratio + Event Cost Variance metrics | `metricsService.ts` + `insights.tsx` | 1 hr |
| **P3** | Social challenge templates for hidden cost awareness | `gamificationService.ts` | 30 min |

### Estimated Total: ~12 hours

**Hackathon-critical (P0):** 4 hours — hidden cost prediction engine + component + integration into calendar and plan screens.

**Demo-polish (P1):** 3.25 hours — daily brief, CCI metric, insights screen upgrade.

**Nice-to-have (P2-P3):** 4.75 hours — notifications, accuracy tracking, badges, advanced metrics.

---

### LLM Prompt for Hidden Cost Prediction

Extension to the existing `buildSpendingPrompt()` in `predictionService.ts:48-96`:

```typescript
function buildHiddenCostPrompt(
  event: CalendarEvent,
  historicalTransactions: Transaction[],
  similarEventSpending: { event_title: string; total_spent: number; breakdown: string[] }[],
): string {
  return `You are a hidden cost prediction engine for a personal finance app.

Analyze this calendar event and predict HIDDEN COSTS — spending that will likely
happen AROUND or BECAUSE OF this event, but isn't the event itself.

### Event
Title: ${event.title}
Location: ${event.location || 'Not specified'}
Time: ${event.start_time} to ${event.end_time || 'unknown'}
Day: ${new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'long' })}
Attendees: ${event.attendee_count}
Category: ${event.category}
${event.description ? `Description: ${event.description}` : ''}

### Historical Context
Similar past events and what the user actually spent:
${similarEventSpending.map(s => `- "${s.event_title}": $${s.total_spent} (${s.breakdown.join(', ')})`).join('\n')}

### Recent Transaction Patterns
${historicalTransactions.slice(0, 20).map(t => `- ${t.merchant_name}: $${Math.abs(t.amount)} (${t.category}, ${t.date})`).join('\n')}

### Instructions
Predict 2-5 hidden costs. For each:
- label: short name (e.g., "Drinks after dinner")
- description: why you predict this (1 sentence)
- predicted_amount: dollar amount
- amount_low: lower bound
- amount_high: upper bound
- confidence: 0-1 (>0.7 = likely, 0.3-0.7 = possible, <0.3 = unlikely but costly)
- category: one of [dining, groceries, transport, entertainment, shopping, travel, health, education, fitness, social, professional, bills, personal, other]

Return ONLY valid JSON: { "hidden_costs": [...] }
Do NOT include the base event cost — only additional hidden spending.`;
}
```

---

*FutureSpend — See Tomorrow, Save Today, Share Success*
*User Segmentation & Hidden Cost Prediction Technical Spec — Team Racoonwork*
*RBC Tech @ SFU Mountain Madness 2026*
