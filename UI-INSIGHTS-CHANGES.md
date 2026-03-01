# FutureSpend — UI & Insights Changes Reference

> **Purpose:** Consolidated reference document for all planned UI and Insights tab changes. Used as a ralph-loop planning reference.
>
> **Persona for Examples:** Sarah — $1,000 monthly budget, $660 spent, day 18 of 30, 14-day streak, ~34% savings rate, top category: Dining at ~30%.

---

## Table of Contents

### SECTION 1: INSIGHTS TAB — CHANGES & NEW METRICS
- [1.1 Overview: Current State vs Target State](#11-overview-current-state-vs-target-state)
- [1.2 Financial Health Score (Hero Metric)](#12-financial-health-score-hero-metric)
- [1.3 Twin Gauges: Burn Rate + Spending Velocity](#13-twin-gauges-burn-rate--spending-velocity)
- [1.4 Calendar Correlation Index (CCI) — Novel Metric](#14-calendar-correlation-index-cci--novel-metric)
- [1.5 Spending Trends (Upgraded)](#15-spending-trends-upgraded)
- [1.6 Category Breakdown (Donut Chart)](#16-category-breakdown-donut-chart)
- [1.7 AI Insights (Claude-Powered)](#17-ai-insights-claude-powered)
- [1.8 Savings Projection (Growth Curve)](#18-savings-projection-growth-curve)
- [1.9 Month-over-Month Comparison](#19-month-over-month-comparison)
- [1.10 SVG Components to Build](#110-svg-components-to-build)
- [1.11 Data Dependencies & Store Changes](#111-data-dependencies--store-changes)

### SECTION 2: OVERALL UI CHANGES ACROSS THE APP
- [2.1 Global Design System Changes](#21-global-design-system-changes)
- [2.2 Global Components](#22-global-components)
- [2.3 Onboarding: Welcome Screen](#23-onboarding-welcome-screen)
- [2.4 Onboarding: Connect Calendar](#24-onboarding-connect-calendar)
- [2.5 Onboarding: Connect Bank](#25-onboarding-connect-bank)
- [2.6 Onboarding: Set Budget](#26-onboarding-set-budget)
- [2.7 Dashboard (Metrics Hub)](#27-dashboard-metrics-hub)
- [2.8 Calendar View](#28-calendar-view)
- [2.9 Budget Detail View](#29-budget-detail-view)
- [2.10 Transaction Review](#210-transaction-review)
- [2.11 Plan Screen](#211-plan-screen)
- [2.12 Arena (Gamification & Social Hub)](#212-arena-gamification--social-hub)
- [2.13 Insights Screen (cross-ref Section 1)](#213-insights-screen-cross-ref-section-1)
- [2.14 Settings & Profile](#214-settings--profile)
- [2.15 Floating AI Chat (Global Overlay)](#215-floating-ai-chat-global-overlay)
- [2.16 Navigation Changes](#216-navigation-changes)

### APPENDICES
- [A. Source Document Cross-Reference](#appendix-a-source-document-cross-reference)
- [B. New File Manifest](#appendix-b-new-file-manifest)
- [C. Implementation Priority Order](#appendix-c-implementation-priority-order)

---

## SECTION 1: INSIGHTS TAB — CHANGES & NEW METRICS

### 1.1 Overview: Current State vs Target State

**Current State** (`app/app/(tabs)/insights.tsx` — 354 lines):

The Insights tab currently implements five basic sections using simple React Native `View` and `Text` components with no SVG-based visualizations:

| Section | Current Implementation | Visual Treatment |
|---------|----------------------|-----------------|
| Financial Health Score | Circular `View` with `borderColor: Colors.accent` (not an SVG arc) displaying letter grade inside. Score shown as `X / 100` text below. | Static border ring — no gradient, no arc fill proportional to score, no animation. |
| Score Breakdown | Four horizontal progress bars (Burn Rate, Budget Adherence, Consistency, Savings Rate) with color-coded fills. Each shows `score/maxScore`. | Functional but uses a 4-component breakdown instead of the target 5-component model. Missing `CalendarCorrelation` as a component. |
| Weekly Spending Trend | Six vertical bars representing the last 6 weeks of spending. Current week highlighted in accent color. Dollar labels below each bar. | Simple bar chart using `View` elements — no line chart, no budget ceiling overlay, no fill shading, no period toggle (Weekly/Monthly/6Mo). |
| Category Breakdown | Horizontal bars with Ionicons, category name, bar fill, dollar amount, and percentage. Top 6 categories shown. | No donut chart. No month-over-month delta indicators. No tap interaction. |
| AI Recommendations | Rule-based text recommendations (burn rate warning, top category alert, streak congratulation) displayed in `Card` components with a lightbulb icon. | Not Claude-powered. Static rule-based strings — not personalized AI insights with action buttons. |
| Savings Projection | Simple linear multiplication: `monthlySavings * months` for 1, 3, 6, 12 months. Displayed as four number pills. | No compound interest formula. No three-scenario growth curve chart. No "You are here" marker. No milestone flags. |

**Target State** (from `INSIGHTS_METRICS_DESIGN.md`):

The redesigned Insights screen implements **8 sections** stacked vertically in a `ScrollView`, each with rich SVG-based visualizations built using `react-native-svg`:

1. **Financial Health Score** (Hero) — SVG arc ring with gradient fill, 5-component breakdown, week-over-week trend arrow
2. **Twin Gauges: Burn Rate + Spending Velocity** — Side-by-side cards with semi-circle gauge and big-number velocity display
3. **Calendar Correlation Index (CCI)** — Novel metric with score badge, prediction accuracy dots, per-category CCI bars
4. **Spending Trends** — SVG line chart with budget ceiling, under/over fill shading, period toggle (Weekly/Monthly/6Mo)
5. **Category Breakdown** — SVG donut chart with tap interaction, legend, month-over-month delta indicators
6. **AI Insights** — Claude-powered personalized insight cards with action buttons, sorted by urgency
7. **Savings Projection** — Three-scenario compound growth curve with milestone markers and summary pills
8. **Month-over-Month Comparison** — Side-by-side month totals, best improvement card, needs attention card

**Gap Summary:**

| Gap Area | Scope |
|----------|-------|
| Missing sections | CCI (entirely new), Twin Gauges (Burn Rate + Velocity as separate cards), Month-over-Month Comparison |
| Needs SVG upgrade | Health Score ring, Spending Trends (bar chart to line chart), Category Breakdown (bars to donut), Savings Projection (numbers to growth curve) |
| New calculations | CCI formula, 7-day spending velocity, month-over-month category deltas, compound interest projections, 5-component health score (add CalendarCorrelation + SpendingStability) |
| AI upgrade | Replace rule-based recommendations with Claude API-powered insights with action buttons |

---

### 1.2 Financial Health Score (Hero Metric)

#### What & Why

The Financial Health Score is the hero metric — the single number a user (or hackathon judge) sees first when opening the Insights tab. It functions as a "credit score for spending habits," distilling five behavioral dimensions into a composite 0-100 score with a letter grade. Its purpose is to give users an instant, emotionally resonant answer to "How am I doing financially?" and to motivate improvement by making the breakdown of component scores immediately visible.

#### Formula

From MVP.md Section 5.8:

```
HealthScore = w1 * BudgetAdherence + w2 * SavingsRate + w3 * SpendingStability + w4 * CalendarCorrelation + w5 * StreakBonus
```

**Weight Distribution:**

| Weight | Component | Range (0-100) | Description |
|--------|-----------|---------------|-------------|
| `w1 = 0.30` | BudgetAdherence | 0-100 | 100 if under budget, scaled down linearly as overspend increases. `score = max(0, 100 - (overspend_pct * 2))` |
| `w2 = 0.25` | SavingsRate | 0-100 | `min(100, (monthly_saved / monthly_income) * 500)` — targets 20% savings rate as "perfect" |
| `w3 = 0.20` | SpendingStability | 0-100 | `max(0, 100 - (avg_CV_across_categories * 100))` — lower volatility = higher score |
| `w4 = 0.15` | CalendarCorrelation | 0-100 | `CCI * 100` — rewards users whose spending is predictable via calendar |
| `w5 = 0.10` | StreakBonus | 0-100 | `min(100, current_streak_days * 3.33)` — 30-day streak = full marks |

**Grade Mapping:**

| Score Range | Grade | Dashboard Color | Label |
|-------------|-------|----------------|-------|
| 90 - 100 | A+ | `#22C55E` (bright green) | Outstanding |
| 80 - 89 | A | `#4ADE80` (green) | Excellent |
| 70 - 79 | B | `#86EFAC` (light green) | Good |
| 60 - 69 | C | `#FACC15` (yellow) | Fair |
| 50 - 59 | D | `#F97316` (orange) | Needs Improvement |
| 0 - 49 | F | `#EF4444` (red) | At Risk |

**Weekly Trend:**

```
HealthTrend = HealthScore(this_week) - HealthScore(last_week)
```

#### Numeric Example (Sarah Persona)

Sarah's data: $1,000 monthly budget, $660 spent, day 18 of 30, 14-day streak, ~34% savings rate.

**Step 1 — BudgetAdherence:**
Sarah is under budget ($660 spent vs $1,000 limit), so overspend_pct = 0%.
```
BudgetAdherence = max(0, 100 - (0 * 2)) = 100
```

**Step 2 — SavingsRate:**
Sarah saves ~$340/month out of, say, $1,000 income equivalent. savings_rate = 0.34.
```
SavingsRate = min(100, 0.34 * 500) = min(100, 170) = 100
```
(Capped at 100 since she exceeds the 20% target.)

**Step 3 — SpendingStability:**
Assume Sarah has a moderate average coefficient of variation across categories of 0.35.
```
SpendingStability = max(0, 100 - (0.35 * 100)) = max(0, 65) = 65
```

**Step 4 — CalendarCorrelation:**
Assume Sarah's CCI is 0.74 (Good range).
```
CalendarCorrelation = 0.74 * 100 = 74
```

**Step 5 — StreakBonus:**
Sarah has a 14-day streak.
```
StreakBonus = min(100, 14 * 3.33) = min(100, 46.62) = 46.62
```

**Step 6 — Composite:**
```
HealthScore = 0.30 * 100 + 0.25 * 100 + 0.20 * 65 + 0.15 * 74 + 0.10 * 46.62
           = 30 + 25 + 13 + 11.1 + 4.662
           = 83.76
           ≈ 84
```

**Grade: A** (80-89 range), color `#4ADE80`.

#### User Scenario

Sarah opens the Insights tab after her morning coffee. The first thing she sees is a large teal-green ring with **84** displayed in bold at the center and the letter **A** below it in bright green. Below the ring, a small green arrow reads "**+5 from last week**" — she smiles, remembering she packed lunch three times this week instead of ordering delivery.

Below the ring, five horizontal bars break down her score. She can immediately see that **Budget Adherence** and **Savings Rate** are maxed out at 30/30 and 25/25 respectively — she's killing it there. **Spending Stability** shows 13/20, which tells her that her daily spending amounts have been a bit erratic. The **Calendar Correlation** bar sits at 11/15, meaning her spending predictions from calendar events are mostly accurate but not perfect. Her weakest component is **Streak Bonus** at only 5/10 — she knows she missed logging in a few days last month. Sarah taps the ring and a tooltip appears: "Your financial health is Excellent! Focus on building your streak and smoothing out daily spending to push toward A+."

#### UI Visualization

**Ring:**
- 140px diameter SVG arc drawn with `react-native-svg`.
- Arc fills proportionally to the score (84% filled for a score of 84).
- Gradient along the arc: red (`#EF4444`) at 0, transitioning to yellow (`#FACC15`) at 40, transitioning to green (`#22C55E`) at 70-100.
- Unfilled portion of the arc rendered in `#1E3054` (dark navy).

**Center Text:**
- Score number: 48px, bold, white.
- Letter grade: 24px, colored by grade tier (e.g., `#4ADE80` for grade A).

**Trend Arrow:**
- Positioned below the ring.
- Format: "▲ +5 from last week" in green or "▼ -3" in red.
- Only displayed if at least 2 weeks of data exist.

**Breakdown Bars:**
- Five horizontal progress bars stacked vertically below the ring.
- Each bar has:
  - Left label: component name (14px, `#94A3B8`).
  - Right label: `score/maxScore` (14px, `#64748B`).
  - Bar background: `#1E3054`.
  - Bar fill: colored by ratio — green (`#22C55E`) if >= 70%, yellow (`#FACC15`) if >= 40%, red (`#EF4444`) if < 40%.

**Tap Interaction:**
- Tapping the ring expands a tooltip card explaining the score meaning and personalized improvement tips.

**Animation:**
- On mount, the arc animates from 0 to the target fill percentage over 600ms with an easing curve.

#### Current State & Gaps

**What exists now** (insights.tsx lines 184-214):
- A `View`-based circular border (`width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: Colors.accent`) displaying the letter grade inside. This is NOT an SVG arc — it is a static bordered circle with no proportional fill.
- The score is shown as `{healthScore} / 100` in text below the ring.
- A 4-component breakdown (Burn Rate 35%, Budget Adherence 30%, Consistency 15%, Savings Rate 20%) using `View`-based progress bars. The weights and component names differ from the target formula.

**What needs to change:**

| Gap | Action Required |
|-----|----------------|
| Ring is a `View` border, not SVG | Replace with `HealthScoreRing` SVG component using arc paths and gradient fill |
| No proportional arc fill | Arc length must correspond to score percentage |
| No gradient coloring on arc | Implement SVG `linearGradient` or segmented arcs (red/yellow/green) |
| Wrong component weights | Switch from current 4-component model (0.35/0.30/0.15/0.20) to target 5-component model (0.30/0.25/0.20/0.15/0.10) |
| Missing CalendarCorrelation component | Add CCI-based component (w4 = 0.15) to the breakdown |
| Missing SpendingStability component | Add CV-based stability component (w3 = 0.20) to replace Consistency |
| No week-over-week trend arrow | Add `HealthTrend` calculation and display arrow with delta |
| No tap-to-expand tooltip | Add `Pressable` wrapper with animated tooltip card |
| `calculateHealthScore` function uses different formula | Update `budgetStore.ts:calculateHealthScore` to match the 5-component formula from MVP.md 5.8 |

---

### 1.3 Twin Gauges: Burn Rate + Spending Velocity

#### What & Why

The Twin Gauges are two side-by-side cards that answer the two most urgent financial questions at a glance: "Am I on pace to stay within budget?" (Burn Rate — a ratio) and "How fast am I spending in absolute dollars per day?" (Spending Velocity). Displaying them together lets users see both the relative and absolute perspective simultaneously. A user can be "on track" by ratio but still spending more dollars per day than they are comfortable with — or vice versa.

#### Formula

**Burn Rate** (from MVP.md Section 5.4):
```
BurnRate = (CurrentSpending / ElapsedDays) * TotalDays / TotalBudget
```

| Variable | Definition |
|----------|-----------|
| `CurrentSpending` | Total amount spent so far this budget period (month) |
| `ElapsedDays` | Number of days elapsed in the current budget period |
| `TotalDays` | Total days in the budget period (28-31 for monthly) |
| `TotalBudget` | User's set budget for this period |

**Color Coding:**

| BurnRate Range | Color | Hex Code | Label |
|---------------|-------|----------|-------|
| < 0.80 | Green | `#22C55E` | Excellent |
| 0.80 - 1.00 | Yellow | `#FACC15` | On Track |
| 1.00 - 1.20 | Orange | `#F97316` | Caution |
| > 1.20 | Red | `#EF4444` | Over Budget |

**Spending Velocity** (from MVP.md Section 5.3):
```
V(t) = ΔSpending / ΔTime    (rolling 7-day window)
BudgetVelocity = TotalMonthlyBudget / DaysInMonth
SpendingRatio = V(t) / BudgetVelocity
```

**Smoothed Velocity (EWMA):**
```
V_smooth(t) = α * V(t) + (1 - α) * V_smooth(t-1)
```
Where `α = 0.3`.

**Overspend Detection:**

| SpendingRatio | Status | Action |
|--------------|--------|--------|
| < 0.8 | Under-spending | Show positive reinforcement, suggest savings transfer |
| 0.8 - 1.0 | On track | Normal dashboard display |
| 1.0 - 1.2 | Caution | Yellow warning indicator |
| > 1.2 | Alert threshold | Push notification about overspending |

**Projected Overspend Date** (when V(t) > BudgetVelocity):
```
DaysUntilBudgetExhausted = RemainingBudget / V(t)
OverspendDate = today + DaysUntilBudgetExhausted
```

#### Numeric Example (Sarah Persona)

**Burn Rate:**
Sarah has spent $660 in 18 days of a 30-day month against a $1,000 budget.
```
BurnRate = ($660 / 18) * 30 / $1,000
         = $36.67 * 30 / $1,000
         = $1,100 / $1,000
         = 1.10
```
Status: **Caution** (1.00-1.20 range). Color: Orange `#F97316`.
Sarah is spending 10% faster than the pace needed to stay within budget. At this rate she would spend $1,100 by month-end, overshooting by $100.

**Spending Velocity:**
Suppose Sarah's last 7 days of spending totaled $294.
```
V(t) = $294 / 7 = $42/day
BudgetVelocity = $1,000 / 30 = $33.33/day
SpendingRatio = $42 / $33.33 = 1.26
```
Status: **Alert threshold** (> 1.2). Her recent 7-day velocity is higher than her burn rate suggests because she had a couple of larger purchases this week.

**Projected Overspend Date:**
```
RemainingBudget = $1,000 - $660 = $340
DaysUntilBudgetExhausted = $340 / $42 = 8.1 days
OverspendDate = day 18 + 8 = day 26
```
At her current velocity, Sarah will exhaust her budget by day 26 — four days before month-end.

**Week-over-week velocity change:**
Suppose last week's velocity was $45.65/day.
```
Change = ($42 - $45.65) / $45.65 = -8.0%
```
Trending down 8% — a good sign, displayed with a green down-arrow.

#### User Scenario

Sarah scrolls past her Health Score and sees two cards side by side. The left card shows a **semi-circle speedometer gauge** with a needle pointing at **1.10x**. The arc is colored orange in that zone, and below it a small orange dot accompanies the text "Caution." She immediately knows she is spending faster than her budget pace — not critically so, but enough to pay attention.

The right card shows a bold **$42** with "per day" below it in muted text. Underneath, a reference line reads "budget pace: $33/day" — making the gap visually obvious. A green down-arrow with "8% vs last wk" tells her the good news: her spending velocity is actually *decreasing* this week compared to last week. The earlier part of the month was worse. Sarah takes this as validation that her effort to cut back on takeout is working, even though the accumulated burn rate still shows caution.

#### UI Visualization

**Layout:** Two cards in a `flexDirection: 'row'` container. Each card is `flex: 1` with `gap: 12` between them.

**Burn Rate Card:**
- **Semi-circle gauge** (speedometer style): SVG arc from 0.5x to 1.5x range. The needle rotates to point at the current burn rate value.
- Arc color zones: green for < 0.80, yellow for 0.80-1.00, orange for 1.00-1.20, red for > 1.20.
- Center text: burn rate value in 24px bold with "x" suffix (e.g., "1.10x").
- Status label below gauge: "Excellent" / "On Track" / "Caution" / "Over Budget" with a small colored dot matching the zone color.
- **Subtle pulse animation** when in orange or red zone (opacity oscillation between 0.8 and 1.0 over 1.5s cycle).

**Velocity Card:**
- **Big number** layout: daily spend rate in 28px bold white (e.g., "$42").
- "per day" label in 12px, `#64748B`.
- Comparison line: "budget pace: $33/day" in 14px, `#94A3B8`.
- **Trend indicator:** Directional arrow with percentage — "▼ 8% vs last wk" — green arrow if velocity is decreasing (good), red if increasing (bad). Note: for velocity, *decreasing* is positive (you want to spend less), which is the opposite color logic from income metrics.
- Status dot and label matching burn rate color coding logic.

#### Current State & Gaps

**What exists now:**
- `calculateBurnRate` function exists in `budgetStore.ts` (line 215-219) and is called in `insights.tsx` (line 78-81). However, the burn rate value is only used internally as an input to the Health Score calculation — it is **not displayed as its own visual component** on the Insights screen.
- `getBurnRateColor` function exists (line 221-227) but is never used in the Insights tab.
- There is **no Spending Velocity calculation** anywhere in the codebase. No 7-day rolling sum, no EWMA smoothing, no `BudgetVelocity` comparison.

**What needs to change:**

| Gap | Action Required |
|-----|----------------|
| No dedicated Burn Rate visual | Build `BurnRateGauge` SVG semi-circle component |
| No Spending Velocity calculation | Add `calculateSpendingVelocity()` to `transactionStore` or a new utility — 7-day rolling sum of transaction amounts / 7 |
| No EWMA smoothing | Implement `V_smooth(t) = 0.3 * V(t) + 0.7 * V_smooth(t-1)` |
| No velocity trend (week-over-week) | Compare current 7-day velocity vs previous 7-day velocity |
| No projected overspend date | Add `calculateOverspendDate()` when velocity > budget velocity |
| No side-by-side card layout | Add `flexDirection: 'row'` container with two `flex: 1` children |
| No pulse animation for caution/over zone | Add `Animated.loop` opacity animation triggered by burn rate > 1.0 |

---

### 1.4 Calendar Correlation Index (CCI) — Novel Metric

#### What & Why

The Calendar Correlation Index is **FutureSpend's original metric** — the feature that makes it technically differentiated from every other personal finance app. CCI answers: "How accurately does your calendar predict your actual spending?" A high CCI means the user's schedule is a reliable financial signal; a low CCI means spending is more spontaneous. For hackathon judges, this is the "lean forward" moment — it proves the ML prediction pipeline is real and working, and that the calendar-finance connection is producing measurable value.

#### Formula

From MVP.md Section 5.6:

```
CCI = Σ(predicted_events_with_actual_spend) / Σ(total_predicted_events) * accuracy_weight
```

```
accuracy_weight = 1 - |predicted_amount - actual_amount| / max(predicted_amount, actual_amount)
```

**Component Breakdown:**

| Component | Definition |
|-----------|-----------|
| `predicted_events_with_actual_spend` | Count of calendar events where the system predicted a spend AND the user actually spent money within +/-2 hours of the event time |
| `total_predicted_events` | Total count of calendar events for which the system made a spend prediction |
| `accuracy_weight` | A penalty factor from 0.0 to 1.0 that reduces the CCI when the predicted amount differs significantly from the actual amount |

**CCI Scoring:**

| CCI Range | Interpretation |
|-----------|---------------|
| 0.8 - 1.0 | Excellent — calendar is a strong spending predictor |
| 0.6 - 0.8 | Good — calendar captures most spending triggers |
| 0.4 - 0.6 | Moderate — some spending is calendar-driven, some is spontaneous |
| 0.2 - 0.4 | Weak — user's spending is mostly unrelated to calendar events |
| 0.0 - 0.2 | Poor — calendar data is not predictive; rely on other signals |

**Adaptive Weighting (CCI feeds back into Predictive Budget):**
```
calendar_weight = min(0.6, CCI * 0.7)
historical_weight = 1.0 - calendar_weight
```

#### Numeric Example (Sarah Persona)

Over the past month, FutureSpend predicted spending for 20 of Sarah's calendar events. Here is a sample of 5 recent events:

| Event | Predicted | Actual | Match? | accuracy_weight |
|-------|-----------|--------|--------|----------------|
| Dinner w/ Alex | $45 | $42 | Yes | 1 - |45-42|/max(45,42) = 1 - 3/45 = 0.933 |
| Team Lunch | $25 | $31 | Yes | 1 - |25-31|/max(25,31) = 1 - 6/31 = 0.806 |
| Karaoke Night | $35 | $38 | Yes | 1 - |35-38|/max(35,38) = 1 - 3/38 = 0.921 |
| Study Group | $12 | $0 | No | N/A (no actual spend) |
| Coffee Meetup | $8 | $9 | Yes | 1 - |8-9|/max(8,9) = 1 - 1/9 = 0.889 |

Across all 20 events:
- 15 events had actual associated spending (hit rate = 15/20 = 0.75)
- Average `accuracy_weight` across those 15 events = 0.82

```
CCI = 0.75 * 0.82 = 0.615
```

Expressed as a percentage for display: **CCI = 62%**, which falls in the "Good" range (0.6-0.8). Sarah's calendar predicts most of her spending triggers, but there is room for improvement — particularly around work events where predictions are less accurate.

**Per-Category CCI:**
- Social: 85% (she always spends when meeting friends)
- Dining: 72% (restaurant predictions are mostly accurate)
- Coffee: 68% (coffee meetups are predictable)
- Work: 31% (work meetings rarely trigger spending)

#### User Scenario

Sarah scrolls down and sees a section with a subtle "Novel" badge in the top-right corner — a small teal pill reading "Novel" that signals this is a FutureSpend-original metric. The main display shows a circular badge with **62%** in the center, colored in the green-yellow transition zone, with the label "Good" below it. To the right of the badge, explanatory text reads: *"Your calendar predicted 62% of your spending accurately this month."*

Below the badge, Sarah sees a **Prediction Accuracy** list — her five most recent predicted events, each showing the predicted amount, an arrow connector, the actual amount, and a check/tilde/cross accuracy indicator. She sees that "Dinner w/ Alex" was spot-on ($45 predicted, $42 actual — green check), but "Study Group" was a miss ($12 predicted, $0 actual — red cross). She realizes she never buys anything at study groups and makes a mental note to mark those as "no-spend" events.

Further down, a **By Category** section shows horizontal bars: Social leads at 85%, then Dining at 72%, Coffee at 68%, and Work at a low 31%. Sarah instantly understands the insight: her social life is financially predictable, but work events are wild cards. This is the "show your work" moment — the ML pipeline's predictions are transparently validated against reality.

#### UI Visualization

**"Novel" Badge:**
- Small pill in the top-right of the section header: "Novel" in accent color (`#00D09C`).
- Subtle styling to signal innovation to judges without being garish.

**CCI Score Badge:**
- Circular badge, 80px diameter, with the CCI percentage in the center (28px bold).
- Ring fill uses the same gradient approach as the Health Score ring (red below 40%, yellow 40-70%, green above 70%).
- Label below badge: "Poor" / "Weak" / "Moderate" / "Good" / "Excellent" based on CCI range.
- Explanation text to the right of the badge (14px, `#94A3B8`): "Your calendar predicted X% of your spending accurately this month."

**Prediction Accuracy Dots:**
- A list of the 5 most recent predicted events.
- Each row: colored dot + accuracy indicator (green check if within 20%, yellow tilde if 20-50% off, red cross if > 50% off or missed), predicted amount, dash connector, actual amount, event name.
- This is the "proof" — showing predicted vs actual side by side.

**Per-Category CCI Bars:**
- Horizontal progress bars showing CCI by spending category, sorted descending.
- Bar fills colored by the CCI threshold (green >= 0.7, yellow >= 0.4, red < 0.4).
- Category label left, percentage right.

#### Current State & Gaps

**What exists now:**
- The `predictionStore` tracks `SpendingPrediction` objects that include `predicted_amount`, `actual_amount`, `was_accurate`, and `predicted_category` fields. The `submitFeedback` method can mark predictions as reviewed. However, **no CCI calculation exists** anywhere in the codebase.
- The predictions array in the store has the raw data needed for CCI computation (predicted vs actual amounts), but there is no aggregation, no hit-rate calculation, no accuracy-weight formula applied.
- There is **no UI component** for CCI on the Insights tab at all.

**What needs to change:**

| Gap | Action Required |
|-----|----------------|
| No CCI calculation | Implement `calculateCCI()` function that iterates over predictions, computes hit rate and average accuracy_weight, returns composite CCI score |
| No prediction accuracy tracking | Add a `predictionAccuracy` computed array or method to `predictionStore` that pairs predictions with actual transaction outcomes |
| No per-category CCI | Group predictions by category and compute CCI per group |
| No CCI UI section | Build entire section: score badge (SVG ring), prediction accuracy dot list, per-category horizontal bars |
| No "Novel" badge component | Create a small styled pill component for the section header |
| CCI not fed into Health Score | Wire CCI value into the `calculateHealthScore` function as the CalendarCorrelation component (w4 = 0.15) |

---

### 1.5 Spending Trends (Upgraded)

#### What & Why

The Spending Trends section answers "How has my spending changed over time, and am I staying within budget?" It replaces the current simple vertical bar chart with a rich SVG line chart that overlays actual spending against the budget ceiling, using color-filled areas to instantly show periods of under-spending (green) and over-spending (red). The addition of a period toggle (Weekly / Monthly / 6-Month) lets users zoom in and out to see short-term fluctuations or long-term patterns.

#### Formula

No single metric formula — this section visualizes spending aggregations over time. The underlying data is:

```
Weekly Total = Σ |transaction.amount| for all transactions in a 7-day window
Monthly Total = Σ |transaction.amount| for all transactions in a calendar month
Budget Ceiling = totalBudget (displayed as a dashed horizontal reference line)
```

Summary statistics displayed below the chart:
```
Average = Σ(period_totals) / count(periods)
High = max(period_totals) with label identifying which period
```

#### Numeric Example (Sarah Persona)

Sarah's weekly spending over the last 6 weeks:

| Week | Amount | vs Budget ($250/wk) | Fill Color |
|------|--------|---------------------|------------|
| W1 | $180 | Under by $70 | Green tint |
| W2 | $210 | Under by $40 | Green tint |
| W3 | $230 | Under by $20 | Green tint |
| W4 | $280 | **Over by $30** | Red tint |
| W5 | $260 | **Over by $10** | Red tint |
| W6 (current) | $220 | Under by $30 | Green tint |

```
Weekly Budget = $1,000 / 4 ≈ $250/week
Average: ($180 + $210 + $230 + $280 + $260 + $220) / 6 = $230/week
High: $280 (W4)
```

#### User Scenario

Sarah scrolls to the Spending Trends section and sees a clean line chart. A solid teal line traces her weekly spending across six weeks. A dashed gray horizontal line marks her $250/week budget pace. For weeks 1 through 3, the area between her spending line and the budget line is filled with a soft green tint — she was under budget. But in week 4, the line spikes above the budget line and the fill switches to a soft red tint. She immediately recalls that week — a birthday dinner and a concert pushed her over.

The good news: weeks 5 and 6 show the line trending back down, with week 6 dipping below the budget line again (green fill). At the top-right, she notices a **[Weekly] [Monthly] [6Mo]** toggle. She taps "Monthly" and sees a broader view showing her last 6 months of spending, confirming that February and March were her best months. Below the chart, a summary reads: "Avg: $230/wk | High: $280 (W4)."

She taps the data point on W4 and a small tooltip appears: "$280 — Birthday dinner + concert week."

#### UI Visualization

**Period Toggle:**
- Segmented control at top-right: Weekly / Monthly / 6-Month.
- Active segment styled in accent color (`#00D09C`); inactive segments in `#1E3054` with `#64748B` text.

**Line Chart (SVG):**
- Solid teal line (`#00D09C`) connecting data points for actual spending.
- Dashed gray line (`#64748B`) horizontal at the budget level.
- **Fill shading** between actual line and budget line:
  - Green tint (`rgba(34, 197, 94, 0.15)`) when spending is under budget.
  - Red tint (`rgba(255, 71, 87, 0.15)`) when spending is over budget.
- Small circles at each data point. Tapping a point shows an exact-value tooltip.
- X-axis: period labels (W1-W6, or month names, or month abbreviations for 6-month view).
- Y-axis: dollar amounts with grid lines.

**Summary Row:**
- Below the chart: "Avg: $X/period" and "High: $X (period label)".
- Text in 14px, `#94A3B8`.

**Built using `react-native-svg`** — manual `Path` drawing for the line, `Polygon` or `Path` for the filled areas, `Circle` for data points, `Line` for the budget dashed line.

#### Current State & Gaps

**What exists now** (insights.tsx lines 217-239):
- A simple 6-column vertical bar chart built with `View` elements. Each bar's height is proportional to `val / maxWeekly`. The current week bar is highlighted in `Colors.accent`, others in `Colors.cardBorder`. Dollar amounts and "W1"-"W6" labels appear below each bar.
- The `weeklyTrend` calculation (lines 131-149) computes weekly totals for the last 6 weeks.
- There is **no budget ceiling overlay**, **no line chart**, **no fill shading**, **no period toggle**, and **no summary statistics**.

**What needs to change:**

| Gap | Action Required |
|-----|----------------|
| Bar chart, not line chart | Replace View-based bars with `TrendLineChart` SVG component using `Path` elements |
| No budget ceiling reference line | Add dashed `Line` SVG element at the budget level |
| No under/over fill shading | Compute intersection points between spending line and budget line, fill above/below regions with appropriate rgba colors |
| No period toggle | Add segmented control component with Weekly/Monthly/6Mo options; recompute data aggregation on toggle |
| No monthly aggregation | Add monthly spending calculation (current code only does weekly) |
| No 6-month aggregation | Add 6-month lookback with monthly buckets |
| No data point tooltips | Add `Pressable` circles at data points that show value on tap |
| No summary statistics | Compute and display average and max below the chart |

---

### 1.6 Category Breakdown (Donut Chart)

#### What & Why

The Category Breakdown answers the most frequently asked personal finance question: "Where is my money going?" The current horizontal bar implementation works but lacks visual impact and month-over-month context. The upgraded version replaces the bars with a SVG donut chart (visually striking, immediately parseable) and adds month-over-month delta indicators so users can see not just *where* money went but *how that compares to last month*.

#### Formula

No specific metric formula — this is an aggregation visualization:

```
Category Percentage = (Category Spend / Total Spend) * 100
MoM Change = ((This Month Category Spend - Last Month Category Spend) / Last Month Category Spend) * 100
```

#### Numeric Example (Sarah Persona)

Sarah's current month spending breakdown (total: $660):

| Category | Amount | Percentage | Last Month | MoM Change |
|----------|--------|-----------|------------|------------|
| Dining | $198 | 30% | $172 | +15% |
| Transport | $119 | 18% | $129 | -8% |
| Entertainment | $99 | 15% | $96 | +3% |
| Shopping | $79 | 12% | $79 | 0% |
| Coffee | $59 | 9% | $76 | -22% |
| Other | $106 | 16% | $110 | -4% |

**Donut center:** "$660 total"

**MoM traffic light classification:**
- Dining: +15% -> Red dot (> +10%)
- Transport: -8% -> Green dot (decrease)
- Entertainment: +3% -> Yellow dot (+1% to +10%)
- Shopping: 0% -> No dot (flat)
- Coffee: -22% -> Green dot (decrease)

#### User Scenario

Sarah scrolls to the Category Breakdown and is immediately drawn to a colorful **donut chart** with "$660 total" in the center. Six colored arcs represent her spending categories. The largest arc — a warm red for **Dining** at 30% — dominates nearly a third of the ring. She taps the Dining arc and it scales up slightly with a glow effect, dimming the other segments. A tooltip appears: "Dining: $198 (30%)."

Below the donut, a legend lists each category with its color swatch, name, dollar amount, and percentage. Further below, a "**vs Last Month**" section shows each category with directional arrows and percentage changes. Dining has a red up-arrow and "+15%" with a red traffic light dot — it needs attention. But Coffee has a green down-arrow and "-22%" with a green dot — her Coffee Savings Challenge is paying off. Shopping shows a flat line with "0%" and no dot. Sarah can see at a glance which categories are improving and which are slipping.

#### UI Visualization

**Donut Chart:**
- 160px diameter SVG donut with 30px stroke width.
- Each category is a colored arc segment. Colors use `CATEGORY_COLORS` from existing code (e.g., dining: `#FF6B6B`, transport: `#45B7D1`, etc.).
- Center text: total spend (20px bold white) + "total" label (12px, `#64748B`).
- **Tap interaction:** Tapping a segment highlights it (slight scale + glow), dims others (reduced opacity), and shows a tooltip with the full amount and percentage.
- **Mount animation:** Segments grow from 0 to their final arc length over 600ms with easing.

**Legend:**
- To the right of the donut (or below on smaller screens): category list with color swatch circle, name, dollar amount, percentage.

**Month-over-Month Deltas:**
- Below the donut + legend: "vs Last Month" header.
- Each category row shows:
  - Directional arrow: "▲" (increase, colored red) / "▼" (decrease, colored green) / "──" (flat, gray).
  - Percentage change value.
  - Horizontal comparison bar showing budget vs actual.
  - Traffic light dot: red (> +10% increase), yellow (+1% to +10%), green (decrease or flat).

#### Current State & Gaps

**What exists now** (insights.tsx lines 243-273):
- Horizontal bars with Ionicon category icons, category name text, a `View`-based progress bar fill, dollar amount, and percentage. Top 6 categories are shown, sorted by amount descending.
- `CATEGORY_COLORS` and `CATEGORY_ICONS` mappings are defined (lines 20-52) and can be reused.
- The `categorySpending` calculation (lines 110-128) correctly aggregates current month transactions by category.
- There is **no donut chart**, **no month-over-month comparison**, **no tap interaction**, and **no animation**.

**What needs to change:**

| Gap | Action Required |
|-----|----------------|
| Horizontal bars, not donut | Build `DonutChart` SVG component with arc segments per category |
| No center total text | Add SVG `Text` elements at the center of the donut |
| No tap interaction | Wrap each arc `Path` in a `Pressable` with `onPress` handler; manage highlighted segment state |
| No mount animation | Use `Animated` or `react-native-reanimated` to animate arc lengths from 0 to target |
| No month-over-month deltas | Add calculation comparing current month category totals vs previous month; requires filtering transactions to previous month |
| No previous month data | Extend `categorySpending` to also compute last month's values |
| No traffic light dots | Add conditional dot coloring based on MoM percentage change thresholds |
| Reuse CATEGORY_COLORS | Yes — the existing color map can be used directly for donut segment colors |

---

### 1.7 AI Insights (Claude-Powered)

#### What & Why

The AI Insights section replaces the current rule-based recommendations with personalized, context-aware insight cards powered by the Claude API. Instead of generic strings like "Your spending is ahead of pace," Claude generates specific, actionable insights that reference the user's actual numbers, calendar events, and spending patterns. Each insight card has a type (warning, opportunity, win), a one-line title, a 2-3 sentence body with concrete data, and action buttons. This is the section that demonstrates the "AI-first" nature of FutureSpend.

#### Formula

No metric formula — AI Insights are generated by Claude based on structured prompts that include the user's spending data, predictions, budget status, and calendar events. The system passes a context object:

```
InsightContext = {
  predictions: SpendingPrediction[],
  transactions: Transaction[],
  budgets: CategoryBudget[],
  burnRate: number,
  healthScore: number,
  categorySpending: { category, amount, percentage, momChange }[],
  calendarEvents: CalendarEvent[],
  streak: number
}
```

Claude returns 3-5 structured insights sorted by urgency:
1. **Warnings** (red accent) — things getting worse
2. **Opportunities** (blue accent) — ways to save
3. **Wins** (green accent) — things going well

#### Numeric Example (Sarah Persona)

Based on Sarah's data, Claude might generate:

**Insight 1 (Warning):** "Dining is accelerating. You've spent $198 on dining (30% of total). That's 15% more than last month. 3 team lunches remain this week."
- Action button: [Adjust Budget ->]

**Insight 2 (Opportunity):** "Subscription opportunity. You're paying for Adobe CC ($54.99/mo) but haven't used it in 6 weeks. Cancel to save $660/year."
- Action buttons: [Dismiss] [Mark for Review]

**Insight 3 (Win):** "Coffee spending down 22%. Your Coffee Savings Challenge is working! You've saved $17 this month by brewing at home 3x/week. Keep it up."
- No action button needed — positive reinforcement.

#### User Scenario

Sarah scrolls to the AI Insights section and sees a header with a subtle "Powered by Claude" badge. Three insight cards are stacked vertically, each with a colored left border indicating type.

The first card has a **red left border** and a warning triangle icon. The title reads "Dining is accelerating" in bold white text. Below it, in muted text: "You've spent $198 on dining (30% of total). That's 15% more than last month. 3 team lunches remain this week." At the bottom-right, a teal outline button reads "Adjust Budget." Sarah considers tapping it — maybe she should increase her dining budget or pre-set a lower limit for team lunches.

The second card has a **blue left border** with a money bag icon: "Subscription opportunity." It calls out her unused Adobe CC subscription. She taps "Mark for Review" — she wants to think about it but appreciates the nudge.

The third card has a **green left border** with a chart-up icon: "Coffee spending down 22%." She feels a sense of pride — the Coffee Challenge she started two weeks ago is actually working. The card specifically mentions "$17 saved this month by brewing at home 3x/week," which matches her experience. No action needed; it is pure positive reinforcement.

#### UI Visualization

**Section Header:**
- "AI Insights" title with a small "Powered by Claude" pill badge in the top-right.

**Insight Cards:**
- Each card has a 4px colored left border:
  - Red (`#EF4444`) for warnings.
  - Blue (`#3B82F6`) for opportunities/tips.
  - Green (`#22C55E`) for wins.
- **Icon:** Top-left, type-specific:
  - Warning: triangle alert icon.
  - Opportunity: money/lightbulb icon.
  - Win: chart-up/trophy icon.
- **Title:** 14px bold white. One-line summary.
- **Body:** 13px, `#94A3B8`. 2-3 sentences with specific numbers from user data.
- **Action buttons:** Right-aligned at the card bottom. Teal outline style. Examples: "Adjust Budget," "Mark for Review," "Dismiss," "View Details."
- Maximum 5 insights shown, sorted by urgency (warnings first, then opportunities, then wins).

#### Current State & Gaps

**What exists now** (insights.tsx lines 160-177, 276-282):
- A `recommendations` array generated by `useMemo` with three simple rule-based strings:
  1. If `burnRate > 1.1`: "Your spending is ahead of pace..."
  2. If top category > 30%: "{Category} is X% of your spending..."
  3. If streak > 0: "Great job keeping a {X}-day streak!"
  4. Fallback: "You're doing great!"
- Cards are displayed with a lightbulb `Ionicons` icon and the recommendation text.
- There is **no Claude API integration**, **no structured insight types**, **no action buttons**, **no urgency sorting**, and **no specific data references** beyond basic percentage.

**What needs to change:**

| Gap | Action Required |
|-----|----------------|
| Rule-based, not AI-powered | Integrate Claude API calls via the existing `predictionStore.generateInsight()` method or a new dedicated insight generation service |
| No structured insight format | Define `InsightCard` type with `type` (warning/opportunity/win), `title`, `body`, `actions[]` fields |
| No colored left borders by type | Add conditional `borderLeftColor` styling based on insight type |
| No type-specific icons | Map insight type to icon name (warning triangle, money bag, chart-up) |
| No action buttons | Add tappable button components at the bottom of each card |
| No urgency sorting | Sort insights: warnings first, opportunities second, wins third |
| No "Powered by Claude" badge | Add styled pill similar to the "Novel" badge on CCI section |
| Generic text, no specific numbers | Ensure the Claude prompt includes full user context so responses reference actual dollar amounts, category names, and calendar events |

---

### 1.8 Savings Projection (Growth Curve)

#### What & Why

The Savings Projection section transforms the current simple linear multiplication into a motivational compound growth curve that shows users what their savings will grow to over time under three scenarios. It answers the hopeful question: "What does all this discipline add up to?" By showing the compounding effect and milestone markers, it turns daily sacrifice into visible future reward. The three-scenario spread (conservative, expected, optimistic) gives honest uncertainty while still being encouraging.

#### Formula

From MVP.md Section 5.2:

```
FV = PV(1 + r)^n + PMT * ((1 + r)^n - 1) / r
```

| Variable | Definition | Typical Value |
|----------|-----------|---------------|
| `FV` | Future Value — projected total savings at end of period | Calculated |
| `PV` | Present Value — current savings balance | User's linked savings account balance |
| `r` | Monthly interest rate (annual rate / 12) | 0.00375 (4.5% APY / 12) |
| `n` | Number of months in the projection | 3, 6, 12, 24 |
| `PMT` | Monthly contribution — derived from user's average monthly savings or a user-set goal | From Plaid data or user input |

**Three Scenarios:**
1. **Conservative** — using `PMT * 0.8` (assumes user saves 20% less than average)
2. **Expected** — using actual `PMT`
3. **Optimistic** — using `PMT * 1.2` plus "Save the Difference" contributions

#### Numeric Example (Sarah Persona)

Sarah currently has $2,000 in savings (PV), earns 4.5% APY (r = 0.00375/month), and saves approximately $340/month (PMT).

**Expected scenario at 12 months (n=12):**
```
FV = $2,000 * (1.00375)^12 + $340 * ((1.00375)^12 - 1) / 0.00375
   = $2,000 * 1.04594 + $340 * (0.04594 / 0.00375)
   = $2,091.88 + $340 * 12.251
   = $2,091.88 + $4,165.34
   = $6,257.22
```

**Conservative scenario at 12 months (PMT * 0.8 = $272/month):**
```
FV = $2,000 * 1.04594 + $272 * 12.251
   = $2,091.88 + $3,332.27
   = $5,424.15
```

**Optimistic scenario at 12 months (PMT * 1.2 = $408/month):**
```
FV = $2,000 * 1.04594 + $408 * 12.251
   = $2,091.88 + $4,998.41
   = $7,090.29
```

**Summary across time horizons (expected scenario):**

| Horizon | FV |
|---------|-----|
| 3 months | $3,046 |
| 6 months | $4,113 |
| 12 months | $6,257 |
| 24 months | $10,619 |

#### User Scenario

Sarah scrolls to the Savings Projection and sees a header reading: "If you maintain $340/month savings:" Below it, a line chart shows three curves diverging over time — a dashed gray line for conservative, a solid teal line for expected, and a dashed blue line for optimistic. The area between conservative and optimistic is filled with a very light teal tint, showing the range of possibility.

A dot on the Y-axis at $2,000 marks "You are here" with a horizontal dashed line extending rightward. Sarah traces the solid expected line and sees it climbing through $4,113 at 6 months and reaching $6,257 at 12 months. If she has a savings goal — say, an emergency fund target of $5,000 — a small flag icon appears on the expected line at around the 9-month mark, labeled "Emergency Fund: $5,000."

Below the chart, four summary pills show: **3 mo: $3.0k** | **6 mo: $4.1k** | **12 mo: $6.3k** | **24 mo: $10.6k**. The numbers are in bold accent color. Sarah taps the "12 mo" pill and the corresponding point on the chart highlights with a small callout.

The chart animates on mount — the three lines draw from left to right over 800ms, creating a satisfying reveal.

#### UI Visualization

**Three-line area chart (SVG):**
- **Conservative line:** Dashed, `#64748B` (muted gray). PMT * 0.8.
- **Expected line:** Solid, `#00D09C` (accent teal). Actual PMT.
- **Optimistic line:** Dashed, `#3B82F6` (blue). PMT * 1.2.
- Area between conservative and optimistic lines: filled with `rgba(0, 208, 156, 0.1)`.

**"You are here" marker:**
- Dot on the Y-axis at the user's current savings balance.
- Horizontal dashed line extending rightward from the dot.

**Milestone markers:**
- If user has savings goals, small flag icons appear on the expected line at the month where the goal is reached.
- Label: goal name + amount (e.g., "Emergency Fund: $5,000").

**Summary pills:**
- Four horizontal pills below the chart showing projected values at 3/6/12/24 months.
- Expected scenario value in bold accent color (`#00D09C`).
- Tapping a pill highlights the corresponding point on the chart.

**Animation:**
- Lines draw from left to right over 800ms on mount.

#### Current State & Gaps

**What exists now** (insights.tsx lines 153-158, 284-302):
- A simple linear calculation: `monthlySavings * months` for 1, 3, 6, 12 months. No compound interest, no interest rate, no present value.
- Displayed as four `View` pills in a row with the amount in accent color and the month label below.
- There is **no chart**, **no three-scenario projection**, **no compound interest formula**, **no "You are here" marker**, **no milestone flags**, and **no animation**.

**What needs to change:**

| Gap | Action Required |
|-----|----------------|
| Linear projection, not compound | Implement `FV = PV(1 + r)^n + PMT * ((1 + r)^n - 1) / r` formula |
| No interest rate variable | Add configurable `r` (default 0.00375 for 4.5% APY) |
| No present value (PV) | Source from linked savings account or user input; default to 0 if unknown |
| No three scenarios | Compute FV for PMT * 0.8, PMT, and PMT * 1.2 |
| No chart | Build `GrowthCurveChart` SVG component with three `Path` lines |
| No area fill between scenarios | Add `Path` fill between conservative and optimistic lines |
| No "You are here" marker | Add `Circle` + dashed `Line` at PV point on Y-axis |
| No milestone markers | Query user savings goals and compute the month where expected FV >= goal; place flag icon on chart |
| No mount animation | Animate line drawing from left to right over 800ms |
| Current displays 1mo instead of 24mo | Change time horizons to 3/6/12/24 months |

---

### 1.9 Month-over-Month Comparison

#### What & Why

The Month-over-Month Comparison section provides a direct, simple comparison between this month and last month — both in total and per-category. It highlights the single biggest improvement and the single biggest area of concern, with brief explanations. This section is deliberately minimal and chart-free: the power is in the specificity and emotional clarity of the callouts ("Your Coffee Challenge is paying off!" or "3 more team lunches than usual"). It is the section that turns data into a narrative the user can act on.

#### Formula

```
Total MoM Change = ((This Month Total - Last Month Total) / Last Month Total) * 100
Category MoM Change = ((This Month Category - Last Month Category) / Last Month Category) * 100
Best Improvement = category with the largest negative MoM Change (biggest decrease)
Needs Attention = category with the largest positive MoM Change (biggest increase)
```

#### Numeric Example (Sarah Persona)

**Total comparison:**
- This month (February, through day 18): $660
- Last month (January, full month): $980 (prorated to day 18: $588)

Using prorated comparison for fair comparison mid-month:
```
Prorated Last Month = $980 * (18/31) = $569
Total MoM Change = ($660 - $569) / $569 = +16%
```

However, for simplicity in the UI, some implementations compare current month-to-date against last month's full total. The design doc shows full month comparison:
- February: $1,180 (projected or last complete month)
- January: $1,340
```
MoM Change = ($1,180 - $1,340) / $1,340 = -12% ($160 less)
```

**Best improvement:**
Coffee: $59 this month vs $76 last month = -22% ($17 saved).
Explanation: "Your Coffee Challenge is paying off!"

**Needs attention:**
Dining: $198 this month vs $172 last month = +15% ($26 more).
Explanation: "3 more team lunches than usual" (correlated to calendar data if available).

#### User Scenario

Sarah reaches the bottom of the Insights tab and sees the Month-over-Month section. Two side-by-side boxes show **February: $1,180** and **January: $1,340**. Between them, a green badge reads "**$160 less (12%)**" with a down arrow and a green background tint — she spent less this month overall. A small sense of accomplishment.

Below, a card with a **green left border** is titled "Best improvement" and highlights: "Coffee: 22% decrease ($17 saved). Your Coffee Challenge is paying off!" Sarah remembers starting the challenge — seeing the result quantified is motivating.

Directly below, a card with a **red left border** is titled "Needs attention" and shows: "Dining: 15% increase ($26 more). 3 more team lunches than usual." The calendar correlation is the key detail — it is not just that she spent more on dining, it is *why*. She can look at next month's calendar and plan accordingly.

#### UI Visualization

**Total Comparison:**
- Two side-by-side boxes (cards) showing month names and dollar amounts.
- Delta shown between them: directional arrow, dollar difference, percentage, colored dot.
- Green background tint on the delta badge if spending decreased; red if increased.

**Best Improvement Card:**
- Single highlight card with green left border (4px, `#22C55E`).
- Category emoji/icon + category name + percentage decrease + dollar amount saved.
- One-line explanation text (13px, `#94A3B8`).

**Needs Attention Card:**
- Single highlight card with red left border (4px, `#EF4444`).
- Category emoji/icon + category name + percentage increase + dollar amount more.
- One-line explanation, ideally correlated to calendar data ("3 more team lunches").

**Design philosophy:** Clean, minimal — no chart needed. The power is in the specificity of the callouts.

#### Current State & Gaps

**What exists now:**
There is **no Month-over-Month comparison section** in the current `insights.tsx`. This is an entirely new section that needs to be built from scratch.

**What needs to change:**

| Gap | Action Required |
|-----|----------------|
| No MoM section at all | Build entire section from scratch |
| No previous month transaction aggregation | Filter transactions to previous calendar month, aggregate by category |
| No MoM delta calculation | Compute percentage change per category between current and previous month |
| No best improvement / needs attention detection | Find category with largest negative change and largest positive change |
| No explanation generation | For "needs attention," attempt to correlate with calendar events (e.g., count of events in that category); for "best improvement," reference active challenges or behavioral changes |
| No side-by-side month total boxes | Build two-box layout with delta badge |
| No highlight cards | Build cards with colored left borders and category-specific content |

---

### 1.10 SVG Components to Build

Since the project does not use Victory Native or any chart library, all visualizations must be built with `react-native-svg`. Each component should be self-contained in `app/src/components/charts/`.

#### 1. `HealthScoreRing`

**Purpose:** Circular arc gauge for the Financial Health Score hero metric.

```typescript
interface HealthScoreRingProps {
  score: number;            // 0-100
  grade: string;            // "A+", "A", "B", "C", "D", "F"
  gradeColor: string;       // Hex color for the grade text
  trend?: number;           // Week-over-week change (e.g., +5 or -3); omit if < 2 weeks data
  size?: number;            // Diameter in px (default: 140)
  strokeWidth?: number;     // Arc stroke width (default: 10)
  animated?: boolean;       // Whether to animate on mount (default: true)
}
```

**SVG elements:** `Circle` (background track), `Path` or `Circle` with `strokeDasharray`/`strokeDashoffset` for the filled arc, `LinearGradient` or segmented arcs for red-yellow-green coloring, `Text` for center score and grade.

#### 2. `BurnRateGauge`

**Purpose:** Semi-circle speedometer gauge for the Burn Rate card.

```typescript
interface BurnRateGaugeProps {
  rate: number;             // Burn rate value (e.g., 1.10)
  min?: number;             // Gauge minimum (default: 0.5)
  max?: number;             // Gauge maximum (default: 1.5)
  size?: number;            // Width of the gauge (default: 120)
  showLabel?: boolean;      // Whether to show status label below (default: true)
}
```

**SVG elements:** Semi-circle `Path` with colored zones (green/yellow/orange/red segments), needle `Line` rotated to the correct angle, center `Text` for the rate value, `Circle` at the needle pivot.

#### 3. `DonutChart`

**Purpose:** Segmented donut ring for Category Breakdown.

```typescript
interface DonutChartSegment {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutChartSegment[];
  totalAmount: number;
  size?: number;            // Outer diameter (default: 160)
  strokeWidth?: number;     // Ring thickness (default: 30)
  onSegmentPress?: (segment: DonutChartSegment) => void;
  animated?: boolean;       // Whether to animate segments on mount (default: true)
}
```

**SVG elements:** Multiple `Path` arcs (one per category), center `Text` for total, `G` groups per segment for tap targets. Animation via `strokeDashoffset` transitions.

#### 4. `TrendLineChart`

**Purpose:** Line chart with budget ceiling overlay and under/over fill shading for Spending Trends.

```typescript
interface TrendLineChartProps {
  data: { label: string; value: number }[];
  budgetLine: number;       // Y-value for the budget reference line
  height?: number;          // Chart height (default: 200)
  width?: number;           // Chart width (default: container width)
  onPointPress?: (index: number, value: number) => void;
  animated?: boolean;
}
```

**SVG elements:** `Path` for the spending line, dashed `Line` for budget ceiling, `Path` fills for under-budget (green tint) and over-budget (red tint) regions, `Circle` elements for data points, `Text` for axis labels.

#### 5. `GrowthCurveChart`

**Purpose:** Multi-line area chart for Savings Projection with three scenarios.

```typescript
interface GrowthCurveChartProps {
  conservative: { month: number; value: number }[];
  expected: { month: number; value: number }[];
  optimistic: { month: number; value: number }[];
  currentSavings: number;   // "You are here" Y-value
  milestones?: { label: string; amount: number }[];
  height?: number;          // Chart height (default: 220)
  width?: number;
  onPillPress?: (months: number) => void;
  animated?: boolean;
}
```

**SVG elements:** Three `Path` lines (one solid, two dashed), `Path` fill between conservative and optimistic, `Circle` + dashed `Line` for "You are here" marker, `G` + `Text` for milestone flags, animated line drawing via `strokeDashoffset`.

#### 6. `CCIBadge`

**Purpose:** Circular score badge for the Calendar Correlation Index.

```typescript
interface CCIBadgeProps {
  score: number;            // 0-100 (CCI * 100)
  label: string;            // "Poor" | "Weak" | "Moderate" | "Good" | "Excellent"
  size?: number;            // Diameter (default: 80)
}
```

**SVG elements:** `Circle` background track, `Circle` with `strokeDasharray` for fill arc, `Text` for percentage and label.

---

### 1.11 Data Dependencies & Store Changes

#### Budget Store (`app/src/stores/budgetStore.ts`)

**Existing functions to modify:**

1. **`calculateHealthScore()`** (line 229-247)
   - **Current:** Takes `burnRate`, `budgetAdherence`, `streakDays`, `savingsRate` (4 params). Weights: 0.35/0.30/0.15/0.20.
   - **Target:** Add `calendarCorrelation` (CCI) and `spendingStability` (CV-based) parameters. Weights: 0.30/0.25/0.20/0.15/0.10 matching MVP.md Section 5.8.
   - **New signature:**
     ```typescript
     calculateHealthScore(
       budgetAdherence: number,
       savingsRate: number,
       spendingStability: number,
       calendarCorrelation: number,
       streakDays: number
     ): number
     ```

**New functions/computed values to add:**

2. **`calculateSpendingStability(transactions: Transaction[]): number`**
   - Compute the average coefficient of variation across spending categories over the last 30 days.
   - Returns a 0-100 score: `max(0, 100 - (avgCV * 100))`.

3. **`calculateBudgetAdherenceMVP(budgets: CategoryBudget[]): number`**
   - Current formula in `insights.tsx` (line 83-87) computes adherence as percentage of categories under budget.
   - Target formula from MVP.md: `max(0, 100 - (overspend_pct * 2))`.
   - These may need to be reconciled or the MVP formula adopted.

#### Transaction Store (`app/src/stores/transactionStore.ts`)

**New functions/computed values to add:**

1. **`calculateSpendingVelocity(transactions: Transaction[]): number`**
   - Rolling 7-day sum of absolute transaction amounts / 7.
   - Returns dollars per day.

2. **`calculateVelocityTrend(transactions: Transaction[]): number`**
   - Compare current 7-day velocity vs previous 7-day velocity.
   - Returns percentage change (e.g., -8% means velocity is decreasing).

3. **`getCategoryMoM(transactions: Transaction[]): { category: string; thisMonth: number; lastMonth: number; change: number }[]`**
   - Filter transactions to current month and previous month.
   - Aggregate by category for each month.
   - Compute percentage change per category.
   - Return sorted array.

4. **`getWeeklyTotals(transactions: Transaction[], weeks: number): { label: string; value: number }[]`**
   - Already partially implemented in `insights.tsx` (lines 131-149) but should be extracted to a reusable utility.

5. **`getMonthlyTotals(transactions: Transaction[], months: number): { label: string; value: number }[]`**
   - New: aggregate transactions by calendar month for the Monthly view of Spending Trends.

#### Prediction Store (`app/src/stores/predictionStore.ts`)

**New functions/computed values to add:**

1. **`calculateCCI(predictions: SpendingPrediction[]): number`**
   - Count predictions where `actual_amount > 0` (hit) vs total predictions.
   - Compute `accuracy_weight = 1 - |predicted_amount - actual_amount| / max(predicted_amount, actual_amount)` for each hit.
   - Return `hitRate * avgAccuracyWeight`.

2. **`getCCIByCategory(predictions: SpendingPrediction[]): { category: string; cci: number }[]`**
   - Group predictions by `predicted_category`.
   - Compute CCI per group.
   - Return sorted descending.

3. **`getRecentPredictionAccuracy(predictions: SpendingPrediction[], count: number): PredictionAccuracyRow[]`**
   - Return the `count` most recent predictions with predicted amount, actual amount, event name, and accuracy indicator (check/tilde/cross).

4. **`predictionAccuracy` (computed/derived array)**
   - Add a derived state or method that pairs each prediction with its actual transaction outcome for CCI computation.

#### New Utility: Savings Projection

**`calculateSavingsProjection(pv: number, r: number, pmt: number, n: number): number`**
- Implements `FV = PV(1 + r)^n + PMT * ((1 + r)^n - 1) / r`.
- Could live in `budgetStore.ts` or a new `src/utils/financialCalcs.ts`.

**`getProjectionScenarios(pv: number, r: number, pmt: number, months: number[]): { conservative: number; expected: number; optimistic: number }[]`**
- Calls `calculateSavingsProjection` for each month in `months` array with PMT * 0.8, PMT, and PMT * 1.2.

#### Auth Store (existing, no changes needed)

- `user.streakCount` is already available and used for the StreakBonus component of the Health Score.

#### Summary of All New Calculations

| Calculation | Location | Inputs | Output |
|------------|----------|--------|--------|
| CCI | predictionStore | predictions[] | number (0-1) |
| CCI by category | predictionStore | predictions[] | { category, cci }[] |
| Prediction accuracy rows | predictionStore | predictions[] | { event, predicted, actual, status }[] |
| Spending Velocity | transactionStore | transactions[] | number ($/day) |
| Velocity trend | transactionStore | transactions[] | number (% change) |
| Category MoM | transactionStore | transactions[] | { category, thisMonth, lastMonth, change }[] |
| Monthly totals | transactionStore | transactions[] | { label, value }[] |
| Spending Stability | budgetStore | transactions[] | number (0-100) |
| Health Score (updated) | budgetStore | 5 component scores | number (0-100) |
| Compound savings FV | utility | PV, r, PMT, n | number |
| 3-scenario projections | utility | PV, r, PMT, months[] | { conservative, expected, optimistic }[] |

---

## SECTION 2: OVERALL UI CHANGES ACROSS THE APP

This section provides a comprehensive comparison of the current FutureSpend codebase UI against the target UI specified in MVP.md Section 15 (Screen-by-Screen UI Specification) and the IMPLEMENTATION-PLAN.md component lists. For every screen and shared system, it details what exists today, what the MVP spec requires, and the exact changes needed to close the gap.

---

### 2.1 Global Design System Changes

#### Current State

**Colors** (`/workspace/app/src/constants/colors.ts`, 56 lines):
- Background: `#0A1628`, Card: `#132039`, CardBorder: `#1E3054`
- Accent: `#00D09C`, AccentDark: `#00A87D`
- Status: positive `#22C55E`, warning `#FFB020`, danger `#FF4757`, info `#3B82F6`
- Burn rate colors: burnExcellent `#22C55E`, burnOnTrack `#FACC15`, burnCaution `#F97316`, burnOver `#EF4444`
- Text: textPrimary `#FFFFFF`, textSecondary `#94A3B8`, textMuted `#64748B`
- Tab bar: tabBarBackground `#0D1B2A`, tabBarBorder `#1E3054`, tabActive `#00D09C`, tabInactive `#64748B`
- Badge tiers: bronze `#CD7F32`, silver `#C0C0C0`, gold `#FFD700`, diamond `#B9F2FF`
- Health score grades: gradeAPlus through gradeF
- Overlays: overlay `rgba(10,22,40,0.8)`, overlayLight `rgba(10,22,40,0.5)`

**Typography** (`/workspace/app/src/constants/typography.ts`, 25 lines):
- Sizes: xs=10, sm=12, md=14, lg=16, xl=18, 2xl=22, 3xl=28, 4xl=34, 5xl=42
- Weights: regular 400, medium 500, semibold 600, bold 700
- Line heights: tight 1.2, normal 1.5, relaxed 1.75

**Spacing** (`/workspace/app/src/constants/spacing.ts`, 11 lines):
- xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32, 4xl=40, 5xl=48

#### Target State (MVP.md Section 15)

MVP.md specifies: `#0A1628` background, `#0F2847` card surfaces, `#00D09C` teal accent, `#FFFFFF` primary text, `#8899AA` secondary text, `#FF6B6B` destructive/over-budget red, `#FFD93D` warning yellow. Typography: Inter/SF Pro. Border radius: 16px cards, 12px buttons.

#### Changes Needed

| Token | Current | Target | Action |
|-------|---------|--------|--------|
| `card` | `#132039` | `#0F2847` | Update to match MVP spec |
| `textSecondary` | `#94A3B8` | `#8899AA` | Update to match MVP spec |
| `danger` | `#FF4757` | `#FF6B6B` | Update to match MVP spec |
| `warning` | `#FFB020` | `#FFD93D` | Update to match MVP spec |
| `cardBorder` | `#1E3054` | `#1A3A5C` | Update (referenced in Screen 2 spec) |

**New tokens needed:**
- `warningYellow: '#FFD93D'` -- used in multiple budget warning contexts
- `destructiveRed: '#FF6B6B'` -- used for over-budget states
- `chartPredictionDashed: '#00D09C'` -- for dashed prediction lines on charts
- `chartConfidenceFill: 'rgba(0,208,156,0.15)'` -- shaded confidence intervals

**Typography additions needed:**
- Add font family specification: `fontFamily: 'Inter'` or `'System'` (Inter/SF Pro as spec calls for)
- No new size tokens needed; current scale covers all spec requirements

**Spacing additions needed:**
- No gaps identified; current spacing scale is sufficient

---

### 2.2 Global Components

New shared/reusable components that need to be built, as specified in IMPLEMENTATION-PLAN.md component lists across Cycles 9, 10, 12, 13, 16, 17, and 20.

#### Components to Build

| Component | Description | Key Props | Referenced In |
|-----------|-------------|-----------|---------------|
| `SpendingTrajectoryChart` | Victory Native line chart: solid actual line, dashed budget limit, dashed prediction line, shaded confidence interval | `spent: number`, `budget: number`, `predictions: DailyPrediction[]`, `daysInMonth: number` | Cycle 9 (Dashboard) |
| `HealthScoreRing` | Large SVG circular gauge (120-140px), color gradient ring (red/yellow/green), score number center, letter grade | `score: number`, `size?: number`, `showGrade?: boolean` | Cycle 9 (Dashboard), Cycle 17 (Insights) |
| `BurnRateGauge` | Circular gauge with color-coded indicator for spending pace | `burnRate: number`, `size?: number` | Cycle 9 (Dashboard) |
| `MetricCard` | Small card showing label, value, sub-label with trend arrow | `label: string`, `value: string`, `subLabel?: string`, `trend?: 'up' \| 'down' \| 'stable'`, `color?: string` | Cycle 9 (Dashboard) |
| `AnimatedNumber` | Number that animates from 0 to target value on mount | `value: number`, `prefix?: string`, `suffix?: string`, `duration?: number` | Multiple screens |
| `ProgressRing` | SVG circular progress indicator (64px) for category budgets | `progress: number`, `size?: number`, `strokeColor?: string`, `children?: ReactNode` | Cycle 9 (Dashboard) |
| `StatusBadge` | Pill-shaped badge with icon and label, colored by status | `label: string`, `variant: 'success' \| 'warning' \| 'danger' \| 'info'`, `icon?: string` | Multiple screens |
| `SkeletonLoader` | Skeleton loading placeholder for all data views | `width?: number`, `height?: number`, `borderRadius?: number` | Cycle 20 (Polish) |
| `CategoryDonut` | Animated donut chart (Victory Native or react-native-svg) | `data: { category: string, amount: number, color: string }[]` | Cycle 17 (Insights) |
| `CCIVisualization` | Calendar Correlation Index gauge/scatter plot | `cciScore: number`, `dataPoints?: { predicted: number, actual: number }[]` | Cycle 17 (Insights) |
| `MonthComparison` | Side-by-side comparison of this month vs last month | `currentMonth: MonthData`, `previousMonth: MonthData` | Cycle 17 (Insights) |
| `SavingsProjection` | Compound growth area chart with goal markers | `monthlySavings: number`, `months: number[]`, `goals?: Goal[]` | Cycle 17 (Insights) |
| `Podium` | Top-3 display with pedestals and crown/medal icons | `entries: LeaderboardEntry[]` | Cycle 16 (Arena) |
| `NotificationBell` | Bell icon with red unread count badge | `unreadCount: number`, `onPress: () => void` | Dashboard, Plan, Arena, Insights headers |
| `DemoSwitcher` | Hidden persona switcher (triple-tap logo) | `onSwitch: (persona: string) => void` | Cycle 19 (Demo) |
| `ConfettiAnimation` | Full-screen confetti burst for celebrations | `trigger: boolean`, `onComplete?: () => void` | Arena check-in, level-up, budget set |
| `DayDetailSheet` | Draggable bottom sheet for calendar day details | `date: Date`, `events: CalendarEvent[]`, `predictions: Map`, `snapPoints: number[]` | Cycle 10 (Calendar) |

---

### 2.3 Onboarding: Welcome Screen

**Current State**: `/workspace/app/app/onboarding/welcome.tsx` (138 lines)
- Displays "FutureSpend" logo text, tagline, 3 feature cards (Calendar Intelligence, Smart Predictions, Social Savings), progress dots, "Get Started" button
- Uses Ionicons for feature icons
- Simple static layout with no animations

**Target State** (MVP.md Screen 1):
- Full-screen splash with animated logo (stylized crystal ball with calendar grid overlay, Lottie animation with teal glow pulse)
- Tagline fades in word by word ("See Tomorrow, Save Today, Share Success")
- Three feature highlight cards with staggered entrance animations
- Primary CTA "Get Started" button (56px height, full width minus 32px margin)
- Secondary link: "Already have an account? Log In"

**Changes Needed**:
- Add animated logo component (Lottie or animated SVG) replacing plain text logo
- Add word-by-word tagline fade-in animation
- Add staggered entrance animations on the 3 feature cards
- Add "Already have an account? Log In" secondary link below the CTA button
- Increase CTA button height to 56px (currently 48px via Button component minHeight)
- Add session token check in AsyncStorage to auto-redirect returning users

**New Components**:
- `AnimatedLogo` -- Lottie animation with teal glow pulse (or `Animated.View` with scale/opacity)
- `StaggeredEntrance` -- Wrapper that animates children with delays

**Data Requirements**:
- Check AsyncStorage for existing session token on mount

---

### 2.4 Onboarding: Connect Calendar

**Current State**: `/workspace/app/app/onboarding/connect-calendar.tsx` (245 lines)
- Shows calendar icon, title "Connect Your Calendar", subtitle
- Four connection options as Card-wrapped buttons: Apple Calendar, Google Calendar, Upload .ics File, Use Demo Data
- Progress dots (dot 2 active), skip link
- Connected success state with event count and summary card

**Target State** (MVP.md Screen 2):
- Progress indicator (4 dots, dot 2 active) -- matches current
- Large calendar illustration (animated event blocks, Lottie or static SVG)
- Connection cards: Google Calendar (with Google "G" logo), Upload .ics (with upload icon), Demo Data (with sparkle icon and "Quick Start" badge)
- No Apple Calendar option in spec (spec lists Google Calendar, Upload .ics, Demo Data)

**Changes Needed**:
- Replace plain Ionicon calendar icon with a stylized calendar illustration (animated event blocks)
- Add Google "G" logo to Google Calendar connection card
- Add upload icon to the .ics upload card
- Add "Quick Start" badge to the Demo Data card
- Consider removing Apple Calendar option (not in spec) or keeping as bonus feature
- Style connection cards as full-width cards with `#0F2847` background, `#1A3A5C` border, 16px radius (currently using Card component which has `#132039` background)

**New Components**:
- `ConnectionCard` -- Styled card with logo, label, optional badge
- `IllustrationGraphic` -- Calendar illustration component

**Data Requirements**:
- Google OAuth client ID from environment config (already referenced in calendarStore)
- Demo calendar dataset (already implemented via loadDemoData)

---

### 2.5 Onboarding: Connect Bank

**Current State**: `/workspace/app/app/onboarding/connect-bank.tsx` (238 lines)
- Shows wallet icon, title "Connect Your Bank", subtitle
- Security badges (Bank-level encryption, Read-only access)
- "Connect Your Bank" primary button, "Use Demo Data" secondary button, "Skip for now" outline button
- Connected success state showing transaction count, recurring count, account count
- Progress dots (dot 3 active)

**Target State** (MVP.md Screen 3):
- Shield/lock illustration (animated lock closing, Lottie)
- Header: "Link Your Accounts" (not "Connect Your Bank")
- Plaid Link button (opens Plaid Link modal via `react-native-plaid-link-sdk`)
- Supported banks row: horizontal scroll of bank logos (RBC highlighted with teal border and "Featured" badge, TD, Scotiabank, BMO, CIBC, Chase)
- Three security badges: "Bank-level 256-bit encryption", "Read-only access", "Your data stays private" (currently has 2 of 3)
- "Use Sandbox Data" card for testing

**Changes Needed**:
- Update title text from "Connect Your Bank" to "Link Your Accounts"
- Replace wallet icon with shield/lock animated illustration
- Add supported banks row with horizontal scroll of bank logos, RBC highlighted
- Add third security badge: "Your data stays private"
- Update "Use Demo Data" label to "Use Sandbox Data"
- Integrate `react-native-plaid-link-sdk` for production Plaid Link modal (currently simulated with Alert)

**New Components**:
- `SupportedBanksRow` -- Horizontal scroll of bank logos with featured highlight
- `SecurityBadge` -- Row of trust badges with icons

**Data Requirements**:
- Plaid Link token (from server-side Edge Function)
- Bank logo assets

---

### 2.6 Onboarding: Set Budget

**Current State**: `/workspace/app/app/onboarding/set-budget.tsx` (168 lines)
- Shows pie-chart icon, title "Set Your Budget", subtitle
- Budget display: `$` + amount + `/month`
- Preset chips: $500, $1000, $1500, $2000, $3000, $5000
- Progress dots (dot 4 active), "Looks Good!" button

**Target State** (MVP.md Screen 4):
- Large numeric input field (48px font, editable) with "$" prefix
- Animated donut/pie chart preview showing suggested category breakdown, updating in real-time
- Category slider list: each category has icon, name, slider ($0 to budget max), dollar amount, percentage
- "Use Suggested Split" button that auto-fills sliders with recommended ratios (30% dining, 15% transport, etc.)
- "Looks Good!" button with confetti animation on tap
- Budget validation: category total must not exceed total budget

**Changes Needed**:
- Replace preset chips with an editable numeric input field (48px font, center-aligned)
- Add animated donut chart preview (Victory Native or react-native-svg) showing category breakdown
- Add scrollable category slider list with per-category budget sliders
- Add "Use Suggested Split" button with recommended ratios
- Add confetti animation on "Looks Good!" button tap
- Add budget validation (category total vs total budget warning)
- Significant UI overhaul -- this screen needs the most work among onboarding screens

**New Components**:
- `BudgetInput` -- Large editable numeric input with dollar prefix
- `PieChartPreview` -- Animated donut chart updating in real-time
- `CategorySliderList` -- Scrollable list of category rows with sliders
- `ConfettiAnimation` -- Full-screen confetti burst

**Data Requirements**:
- User income (if provided during sign-up) for suggested budget
- Transaction history (if bank connected) for realistic category suggestions
- Default category list with suggested ratios
- Budget store: `fetchBudgets`, `createBudgets` per category

---

### 2.7 Dashboard (Metrics Hub)

**Current State**: `/workspace/app/app/(tabs)/dashboard.tsx` (431 lines)
- Header with "Dashboard" title and profile avatar (via Header component)
- Hero Budget Card: "Monthly Budget" label, "$X left" amount, "of $Y budget" subtitle, linear progress bar (actual + predicted), legend, day progress
- Category Budgets: horizontal scroll of category circles with border-based progress (not SVG circular gauge), icon, name, percentage
- Metrics section: 2 metric cards (Burn Rate, Health Score) in a row
- Recent Transactions: list of last 5 transactions with icon, merchant, date, amount
- FloatingChatButton at bottom

**Target State** (MVP.md Screen 5):
- Top bar: "FutureSpend" title (not "Dashboard"), NotificationBell with unread count badge, ProfileAvatar
- Hero Budget Summary Card: "$X left" in large text (32px, color-coded by health), "of $Y budget" subtitle, SpendingTrajectoryChart (Victory Native line chart with actual solid line, budget dashed line, prediction dashed line, shaded confidence interval), BurnRateIndicator text
- Category Budget Circles: circular SVG progress indicators (64px), category icon center, progress ring color-coded, "$X left" or "$X over" label, tap to Budget Detail
- Financial Health Score Ring: large SVG circular gauge (120px), score 0-100, color gradient ring, letter grade center, tap to Insights
- Key Metric Cards: row of 3 cards -- Spending Velocity, Savings Rate, CCI (Calendar Correlation Index)
- NO Recent Transactions section (moved to Plan tab)
- NO "Metrics" section label (metrics integrated naturally)

**Changes Needed**:
- Change header title from "Dashboard" to "FutureSpend"
- Add NotificationBell component to header with unread count badge
- Replace linear progress bar with SpendingTrajectoryChart (Victory Native line chart showing actual spending curve, budget limit line, predicted trajectory, confidence interval)
- Replace border-based category circles with SVG circular progress indicators (64px, `react-native-svg`)
- Add "$X left" or "$X over" label below each category circle
- Add large Financial Health Score Ring component (120px SVG gauge with color gradient)
- Replace 2 metric cards with 3 metric cards: Spending Velocity, Savings Rate, CCI
- Remove Recent Transactions section entirely (moved to Plan tab)
- Remove "Category Budgets" and "Metrics" section title labels

**New Components**:
- `SpendingTrajectoryChart` -- Victory Native line chart with dual lines and confidence interval
- `ProgressRing` -- SVG circular progress (64px) for categories (replacing CSS border trick)
- `HealthScoreRing` -- Large SVG gauge (120px) with gradient ring and grade center
- `MetricCard` (enhanced) -- With trend arrow indicator
- `NotificationBell` -- Bell icon with red badge

**Data Requirements**:
- All current data requirements remain
- Add: CCI (Calendar Correlation Index) score computation
- Add: Savings rate computation (income - spending / income)
- Add: Notification unread count from notificationStore
- Add: Daily spending data points for trajectory chart
- Add: Prediction data points for future trajectory

---

### 2.8 Calendar View

**Current State**: `/workspace/app/app/(tabs)/calendar.tsx` (1124 lines)
- Header with "Calendar" title and profile avatar
- Month/Week toggle (pill-shaped segmented control)
- Month view: calendar grid with spending heatmap coloring (green/yellow/red tint), event dots, prediction "$" badge, today/selected highlighting
- Week view: list of days with events showing time, title, predicted amount
- Day detail modal (slide-up, 80% height): date header, today badge, event cards with category icon, time, location, prediction section (amount, range, confidence badge, explanation)
- Quick summary below calendar for selected day events
- Loading state and predicting banner
- FloatingChatButton

**Target State** (MVP.md Screen 6):
- View toggle: "Month" | "Week" (pill-shaped, teal active) -- matches current
- Calendar grid (month view): day cells with spending intensity gradient background (transparent to deeper teal shades), past days solid teal tint, future days dashed border + transparent predicted tint, today with teal ring + shadow, event dot indicators (up to 3, colored by category), crystal ball micro-icon for prediction days
- Week view: horizontal day columns with vertical time rows (7am-11pm), event blocks positioned by time/duration, color-coded by category
- Day Detail Bottom Sheet (draggable, snap at 40% and 85% height): DayHeader with day-of-week spending comparison badge, DayTotalCard (total actual/predicted spend + comparison to typical same-day average), EventList with time, title, location, predicted spend + confidence badge + category tag + chevron to expand, past events show prediction accuracy
- Long press on future day for quick-add manual event

**Changes Needed**:
- Replace spending heatmap colors from fixed thresholds to gradient teal intensity scale ($0=transparent, $10=faint, $50=medium, $100+=full)
- Add dashed border treatment for future days (currently no dashed border)
- Add shadow/elevation to today cell
- Replace event dot with up to 3 dots colored by category (currently single dot)
- Add crystal ball micro-icon for prediction days (currently uses "$" badge)
- Replace week view list layout with proper time-slot grid layout (vertical time rows 7am-11pm, event blocks positioned by time/duration)
- Convert day detail from Modal to a draggable bottom sheet with snap points (40% and 85%)
- Add DayTotalCard with total spend and comparison to typical same-day-of-week average
- Add prediction accuracy display for past events ("Predicted $25, Actual $22 -- 88% accurate")
- Add category tag pills to event cards
- Add chevron/expand functionality on event cards
- Add long-press gesture on future days for quick-add

**New Components**:
- `DayDetailSheet` -- Draggable bottom sheet with snap points (replacing Modal)
- `DayTotalCard` -- Total spend card with day-of-week comparison
- `WeekTimeline` -- Time-slot grid layout replacing list layout
- `PredictionAccuracyBadge` -- Shows predicted vs actual for past events

**Data Requirements**:
- Historical daily spending averages by day of week (for comparison metrics)
- Spending intensity thresholds for heatmap coloring
- Category colors for multi-dot indicators
- Transaction data mapped to dates for past event accuracy

---

### 2.9 Budget Detail View

**Current State**: `/workspace/app/app/budget-detail.tsx` (338 lines)
- Custom header with back button, category name + "Budget"
- Progress card: category icon (56px circle), "$X / $Y" amount, linear progress bar (color-coded), "$X remaining" or "$X over budget" text
- Stats row: Burn Rate, Daily Avg, Projected (3 metric cards)
- Monthly Trend: bar chart with 6 hardcoded months (Oct-Mar), current month highlighted
- Transactions list: merchant name, date, amount, limited to 10 items

**Target State** (MVP.md Screen 7):
- Category header: back button, large category icon (40px), category name (24px bold), "Budget: $X/month" subtitle
- Progress section: full-width rounded progress bar (12px height), color-coded fill, "$X spent of $Y" above, percentage right-aligned, animated fill on load, "$Z remaining" or "$Z over budget" below
- Key Metrics Row: 3 cards -- Avg/Transaction, Frequency (transactions/week), MoM Change (month-over-month %)
- Spending Trend Chart: Victory Native line chart showing last 6 months, budget limit horizontal dashed line, current month partially filled with prediction extension
- Transaction List: section header with count badge and sort toggle (Date/Amount), transaction rows with merchant, date, amount, linked calendar event indicator, scrollable with pull-to-load-more (paginated, 20 per page)
- "Adjust Budget" FAB: circular teal button with pencil icon, bottom-right, opens budget adjustment modal with slider

**Changes Needed**:
- Change stats row metrics from (Burn Rate, Daily Avg, Projected) to (Avg/Transaction, Frequency, MoM Change)
- Replace bar chart with Victory Native line chart showing 6-month trend with budget limit dashed line
- Add animated fill on progress bar load
- Add sort toggle (Date/Amount) to transaction list header
- Add linked calendar event indicator (small calendar icon) to transaction rows
- Add pagination (pull to load more, 20 per page) to transaction list
- Add "Adjust Budget" FAB (circular teal button, pencil icon) with slider modal
- Remove hardcoded month data and use real historical data

**New Components**:
- `AdjustBudgetFAB` -- Floating action button with budget slider modal
- `TrendLineChart` -- Victory Native line chart for 6-month trend
- `SortToggle` -- Date/Amount sort toggle for transaction list

**Data Requirements**:
- Average transaction amount per category
- Transaction frequency (per week) per category
- Month-over-month spending delta per category
- 6 months of historical category spending data (currently hardcoded)
- Linked calendar events for transactions
- Paginated transaction data

---

### 2.10 Transaction Review

**Current State**: `/workspace/app/app/transaction-review.tsx` (668 lines)
- Custom header with back button, "Review Transactions" title
- Progress bar showing reviewed/total count
- Transaction cards: icon, merchant (large), date, amount (red), category badge (tappable), recurring badge
- Action buttons row: "Looks Good" (primary), "Category", "Recurring", "Exclude"
- Category picker modal (slide-up): scrollable list of 14 categories with icons
- Empty state: "All caught up!" with checkmark
- Loading state

**Target State** (MVP.md Screen 8):
- Transaction card: merchant name (24px bold), amount (40px bold), full date/time, category tag pill, account source ("Chase Checking ****7735" with bank icon)
- Actions row (4 buttons): Exclude (X icon), Split (scissors icon -- divide amount across categories/people), Recurring (repeat icon with frequency picker), Review (checkmark)
- Category Override: category picker with scrollable grid
- Notes field: text input with "Add a note..." placeholder
- Calendar Event Link: if matched, show event title/date/location and prediction accuracy; if not matched, "Link to Event" button
- Swipe gestures: swipe left to mark reviewed (green flash), swipe right to flag for later (yellow flash)

**Changes Needed**:
- Increase merchant name font to 24px and amount font to 40px
- Add account source line ("Chase Checking ****7735" with bank icon)
- Add "Split" action button (scissors icon) that opens split transaction modal
- Add notes text input field below category section
- Add Calendar Event Link section: show linked event with prediction accuracy or "Link to Event" search button
- Add swipe gestures: left to review (green flash), right to flag (yellow flash)
- Rename "Looks Good" to "Review" with checkmark icon

**New Components**:
- `SplitTransactionModal` -- Modal to divide amount across categories or people
- `NotesInput` -- Text input for transaction notes
- `LinkedEventCard` -- Shows matched calendar event with prediction accuracy
- `SwipeableRow` -- Swipe gesture handler with color flash feedback

**Data Requirements**:
- Account metadata (bank name, last 4 digits) from Plaid connection
- Linked calendar event data (if transaction is matched to an event)
- Prediction data for linked events (predicted vs actual amount)
- Notes field in transaction model

---

### 2.11 Plan Screen

**Current State**: `/workspace/app/app/(tabs)/plan.tsx` (886 lines)
- Header with "Plan" title and profile avatar
- Upcoming Predictions section: summary card (total predicted spend, event count), prediction cards with icon, event title, date, amount, confidence bar + label
- Scan a Receipt section: Camera/Gallery buttons, parsed receipt display with save
- Savings Rules section: monthly goal display, "Round up transactions" toggle, "Save the difference" toggle
- Recurring Expenses section: summary card (est. monthly recurring), recurring expense cards with icon, merchant, frequency, next date, amount
- Transaction Review section: "Review Transactions" card linking to transaction-review screen
- FloatingChatButton

**Target State** (MVP.md Screen 9):
- Top bar: "Plan" title, NotificationBell with badge, ProfileAvatar
- Upcoming Spending Predictions: section header with "See All" link, 3 prediction cards (event title, time/date, predicted amount, confidence badge with color, calendar icon)
- Budget Planning Tools: category budget adjustment cards with slider, spent/remaining progress bar, AI-suggested adjustment hint; "Set Savings Goal" button; Goal progress card
- Smart Savings Rules: "Save the Difference" toggle with settings (rounding rules, minimum save, destination account); configurable rules cards (round up, save on low-spend days, auto-save % on payday)
- Upcoming Recurring Expenses: horizontal scroll of RecurringChip items (service logo, name, amount, "in X days" countdown, border color by proximity)
- Transaction Review Queue: latest unreviewed transaction card with "Mark as Reviewed" button; "All caught up!" state

**Changes Needed**:
- Add NotificationBell to header
- Add "See All" link to Upcoming Predictions section header
- Add Budget Planning Tools section: per-category adjustment cards with sliders, AI suggestion hints, "Set Savings Goal" button, goal progress card
- Enhance Smart Savings Rules: add rounding amount config, minimum save amount, destination account selector, additional rule types (save on low-spend days, auto-save % on payday)
- Replace vertical recurring expense cards with horizontal scroll of compact RecurringChip items showing days-until-charge countdown
- Enhance Transaction Review section: show latest unreviewed transaction inline with "Mark as Reviewed" button (currently just links to separate screen)
- Remove "Scan a Receipt" section (not in MVP.md spec for Plan screen -- receipt scanning is a separate concern)

**New Components**:
- `BudgetAdjustmentCard` -- Category budget card with slider + AI hint
- `SetSavingsGoalModal` -- Goal creation flow (target amount, date, monthly contribution)
- `GoalProgressCard` -- Goal progress bar with projected completion
- `RecurringChip` -- Compact horizontal chip for recurring expense
- `InlineReviewCard` -- Inline transaction review with "Mark as Reviewed"

**Data Requirements**:
- Budget adjustment history
- Savings goals and progress
- Smart savings rule configurations (more than current round-up and save-difference)
- Recurring transaction schedule with days-until-charge calculation
- AI-generated budget adjustment suggestions (from Claude)

---

### 2.12 Arena (Gamification & Social Hub)

**Current State**: `/workspace/app/app/(tabs)/arena.tsx` (411 lines)
- Header with "Arena" title and profile avatar
- 4-tab internal navigation: "My Progress", "Challenges", "Leaderboard", "Friends"
- My Progress tab: level card (level, XP, XP bar, XP remaining), streak card (flame icon, streak count, best streak, check-in button), badges section (grid of earned/locked badges)
- Challenges tab: active challenges list, browse challenges catalog with join button
- Leaderboard tab: ranked list with rank, avatar, name, level, XP
- Friends tab: friend code display, add friend input, pending requests with accept button, friends list, circles list

**Target State** (MVP.md Screen 10):
- Top bar: "Arena" title, NotificationBell, ProfileAvatar
- Internal tabs: "My Progress" | "Challenges" | "Leaderboard" | "Friends & Circles"
- My Progress: Level header card with level title (e.g., "Money Manager"), XP progress bar + "X XP to next level"; Stats row (3 cards: Streak/Total XP/Badges count); Multiple streak types (daily, weekly budget, savings) with flame animation growing by streak length; Badge grid (4-column) with earned (colorful + glow) and locked (silhouette + lock) badges, tap for detail modal; Floating CheckIn button (pulsing, conditional)
- Challenges tab: Active challenges with progress bar, days remaining, participant mini avatar stack, XP reward; Browse catalog grouped by type (solo/circle/global) with difficulty level
- Leaderboard tab: Scope selector (Friends | Inner Circle | Global), circle dropdown, metric selector (Savings Rate | Streak | Health Score | Challenge Wins), period toggle (This Week | This Month); Podium display (3 pedestals with crown/medal icons, animated entrance); Ranked list (positions 4+) with trend arrows; Sticky "Your Position" card at bottom
- Friends & Circles tab: Friend code in large monospace + copy + share + QR code; Add friend input + scan QR; Friends list with avatar, name, streak badge, last active, nudge button; Pending requests; Circles with member count, mini avatar stack, type badge, tap for circle detail; Circle detail screen with mini leaderboard and "Start Challenge" button; Discover Friends button

**Changes Needed**:
- Add NotificationBell to header
- Rename "Friends" tab to "Friends & Circles"
- My Progress tab:
  - Add level title (e.g., "Money Manager") based on level
  - Add Stats Row (3 metric cards: Streak, Total XP, Badges count) -- currently missing
  - Add multiple streak types (weekly budget, savings) -- currently only daily check-in
  - Add flame animation that grows with streak length (small <7, medium 7-30, large 30+)
  - Add glow animation on earned badges
  - Add badge detail modal (icon, name, description, date earned, XP reward, rarity %)
  - Make CheckIn button floating and pulsing (currently inline)
- Challenges tab:
  - Add progress bar, days remaining badge, participant mini avatar stack to challenge cards
  - Add difficulty level to challenge catalog
  - Group browse challenges by type (solo/circle/global)
- Leaderboard tab:
  - Replace simple ranked list with Podium display (top 3 with pedestals, crown/medal icons)
  - Add scope selector (Friends | Inner Circle | Global) with sub-tabs
  - Add circle dropdown (visible on Inner Circle tab)
  - Add metric selector (Savings Rate | Streak | Health Score | Challenge Wins)
  - Add period toggle (This Week | This Month)
  - Add trend arrows to ranked list entries
  - Add sticky "Your Position" card at bottom of screen
- Friends & Circles tab:
  - Add QR code display + scan QR button
  - Add share button (native share sheet)
  - Add streak badge and last active timestamp to friend rows
  - Add nudge button on each friend row
  - Add circle type badge and mini avatar stack to circle cards
  - Add circle detail screen with mini leaderboard and "Start Challenge"
  - Add "Discover Friends" button with contacts sync

**New Components**:
- `LevelTitle` -- Title based on level (from level titles mapping)
- `StatsRow` -- 3 metric cards (Streak, Total XP, Badges)
- `FlameAnimation` -- Lottie flame that grows with streak length
- `BadgeDetailModal` -- Detail modal for badge info
- `PodiumDisplay` -- Top-3 pedestals with crown/medal icons
- `LeaderboardScopeSelector` -- Friends/Inner Circle/Global tabs
- `MetricSelector` -- Dropdown for metric selection
- `PeriodToggle` -- This Week/This Month pill toggle
- `YourRankCard` -- Sticky bottom card showing user's position
- `QRCodeDisplay` -- QR code for friend code
- `ScanQRButton` -- Camera QR scanner
- `NudgeButton` -- Send encouragement to friend
- `CircleDetail` -- Full circle detail screen
- `DiscoverFriendsButton` -- Contacts sync, share link, username search

**Data Requirements**:
- Level titles mapping (level -> title name)
- Multiple streak types (daily, weekly_budget, savings)
- Badge detail info (description, date earned, XP reward, rarity %)
- Leaderboard data for multiple scopes, metrics, and periods
- User's rank and trend data
- QR code generation from friend code
- Friend last-active timestamps
- Nudge rate limiting (3/friend/day)
- Circle type metadata

---

### 2.13 Insights Screen (cross-ref Section 1)

> **See Section 1 for detailed metrics, calculations, and AI-generated insight specifications.** This sub-section covers screen-level UI changes only.

**Current State**: `/workspace/app/app/(tabs)/insights.tsx` (354 lines)
- Header with "Insights" title and profile avatar
- Financial Health Score: score card with label, score ring (100x100, border-based circle, letter grade center), score value
- Score Breakdown: 4 rows (Burn Rate, Budget Adherence, Consistency, Savings Rate) with progress bars and score/max labels
- Weekly Spending Trend: simple bar chart (6 weeks) with amounts and week labels
- Category Breakdown: horizontal bar chart rows with category icon, name, bar, amount, percentage
- AI Recommendations: insight cards with bulb icon and text
- Savings Projection: savings label, 4 projection items (1/3/6/12 months) with amounts

**Target State** (MVP.md Screen 12):
- Top bar: "Insights" title, NotificationBell, ProfileAvatar
- Financial Health Score Card (hero): large SVG circular gauge (140px), color gradient ring (red 0-40, yellow 40-70, green 70-100), score number center (48px bold), "Financial Health Score" label, 4 breakdown rows (Budget Adherence, Savings Consistency, Spending Predictability, Debt Management) with progress bars + scores, trend indicator ("Up 5 pts from last month")
- Spending Trend Charts: period toggle (Weekly | Monthly | 6-Month), Victory Native line chart with actual solid teal line, budget limit gray dashed line, shaded over/under areas, tappable data points
- Category Breakdown: animated donut chart with color-coded segments, center text shows total, tap segment to highlight; category legend below with color swatch, name, amount, percentage
- AI-Generated Insights & Recommendations: insight cards with icon, title (14px bold), body (12px), action button ("Adjust Budget", "Set Alert", "View Details"); actionable recommendation cards with specific dollar amounts and projected impact ("Cancel unused Adobe CC -- save $54.99/month ($660/year)"), "Apply" and "Dismiss" buttons
- Calendar Correlation Index (CCI) Visualization: CCI score card with scatter plot or paired bar chart (predicted vs actual), highlight most/least accurate days
- Savings Projections: compound growth area chart with optimistic/baseline/conservative scenarios, goal milestones marked on timeline
- Spending Comparison: side-by-side this month vs last month, total spending change %, per-category comparison bars, "Best improvement" and "Needs attention" highlights

**Changes Needed**:
- Add NotificationBell to header
- Replace border-based score ring with SVG circular gauge (140px) with color gradient
- Increase score number font to 48px
- Change breakdown rows from (Burn Rate, Budget Adherence, Consistency, Savings Rate) to (Budget Adherence, Savings Consistency, Spending Predictability, Debt Management)
- Add trend indicator ("Up X pts from last month") to health score card
- Replace simple bar chart with Victory Native line chart with period toggle (Weekly/Monthly/6-Month)
- Replace horizontal bar chart category breakdown with animated donut chart + legend list
- Enhance AI Recommendations: add action buttons ("Adjust Budget", "Set Alert", "View Details", "Apply", "Dismiss"), add specific dollar amounts and projected impact to recommendations
- Add Calendar Correlation Index (CCI) section with score card and visualization (scatter plot or paired bar chart)
- Replace simple savings projection list with compound growth area chart with multiple scenarios and goal markers
- Add Month-over-Month comparison section with change %, per-category bars, best/worst highlights

**New Components**:
- `HealthScoreGauge` -- Large SVG circular gauge (140px) with gradient ring
- `SpendingTrendChart` -- Victory Native line chart with period toggle
- `CategoryDonut` -- Animated donut chart with interactive segments
- `AIInsightCard` -- Enhanced card with action buttons
- `AIRecommendationCard` -- Actionable card with Apply/Dismiss buttons
- `CCIVisualization` -- CCI score card with scatter/bar chart
- `SavingsGrowthChart` -- Compound growth area chart with scenarios
- `MonthComparison` -- Side-by-side month comparison card

**Data Requirements**:
- Spending Predictability score (new calculation)
- Debt Management score (new calculation, if applicable)
- Historical health score for trend indicator
- Period-based spending data (weekly, monthly, 6-month)
- Donut chart data (category amounts and colors)
- CCI calculation from prediction accuracy data
- Savings projection scenarios (optimistic/baseline/conservative)
- Month-over-month comparison metrics (total change, per-category)
- AI recommendation data from Claude with dollar amounts and impact projections

---

### 2.14 Settings & Profile

**Current State**: `/workspace/app/app/settings.tsx` (538 lines)
- Custom header with close button (X), "Settings" title
- Profile section: avatar (72px, person icon, accent border), editable display name (with pencil icon), email, friend code (with copy-to-clipboard)
- Connected Accounts: Google Calendar and Bank Account rows with connection status, chevron for management
- Notifications section: "View All" link to notifications screen, 5 toggle rows (Spending Alerts, Budget Warnings, Social Nudges, Challenge Updates, Streak Reminders)
- Privacy section: visibility selector (Public/Friends Only/Private), share spending toggle, anonymous leaderboard toggle
- Sign Out button (outline, danger border color)

**Target State** (MVP.md Screen 13):
- Profile header: large avatar (80px) with camera overlay icon (tap to change photo), display name (20px bold), email, "Edit Profile" button
- Connected Accounts: Calendar row (sync status + last sync timestamp + re-sync/disconnect), Bank row (bank name + last 4 digits + status + last sync + "Manage" chevron), "+ Add Account" button
- Budget Settings: row with budget icon, "Budget Settings" label, current total budget preview, chevron to budget editor
- Notification Preferences: toggle rows for Spending Predictions, Budget Alerts, Streak Reminders, Social Updates, Weekly Reports, Transaction Alerts (6 categories vs current 5)
- Privacy Settings: toggle rows for Show on Leaderboards, Share Streak Data, Savings Rate Visible, Activity Status; Data Export button
- App Preferences: Theme selector (Dark/Light/System), Currency selector, Timezone selector
- About Section: app version, Terms of Service, Privacy Policy, Open Source Licenses
- Delete Account button (red text, multi-step confirmation with "DELETE" typing)

**Changes Needed**:
- Increase avatar size from 72px to 80px
- Add camera overlay icon on avatar for photo change
- Add "Edit Profile" button (modal for name, avatar, email changes)
- Add last sync timestamps to calendar and bank connection rows
- Add "+ Add Account" button for additional calendar/bank connections
- Add Budget Settings row linking to budget editor
- Add "Weekly Reports" and "Transaction Alerts" notification toggles (2 new categories)
- Replace current privacy toggles with spec toggles: Show on Leaderboards, Share Streak Data, Savings Rate Visible, Activity Status
- Add "Export My Data" button (JSON/CSV download)
- Add App Preferences section: Theme selector (Dark/Light/System), Currency selector, Timezone selector
- Add About section: app version, Terms/Privacy links, Open Source Licenses
- Add "Delete Account" button with multi-step confirmation (type "DELETE" to confirm)

**New Components**:
- `AvatarPicker` -- Avatar with camera overlay, opens image picker
- `EditProfileModal` -- Modal for editing name, email, avatar
- `ThemeSelector` -- Dark/Light/System option selector
- `CurrencySelector` -- Currency picker
- `TimezoneSelector` -- Timezone picker with auto-detection
- `DataExportButton` -- Generate and download user data
- `DeleteAccountConfirmation` -- Multi-step deletion flow with text confirmation

**Data Requirements**:
- Last sync timestamps for calendar and bank connections
- Current budget total for preview
- App version from app.json
- Theme preference persistence
- Currency and timezone settings
- Data export generation capability

---

### 2.15 Floating AI Chat (Global Overlay)

**Current State**:

`FloatingChatButton` (`/workspace/app/src/components/FloatingChatButton.tsx`, 46 lines):
- Circular teal button (56px), chat bubble icon, positioned bottom-right (bottom: 90, right: 20)
- Conditionally renders based on `isOpen` state from chatStore
- Renders `ChatSheet` component
- Drop shadow with accent color

`ChatSheet` (`/workspace/app/src/components/ChatSheet.tsx`, 561 lines):
- Slide-up bottom sheet (70% screen height) with spring animation
- Drag handle + swipe-to-dismiss via PanResponder
- Header: sparkles icon, "AI Assistant" title, close button
- Message list: user bubbles (teal, right-aligned), assistant bubbles (card color, left-aligned), with timestamps
- Typing indicator: 3 animated pulsing dots
- Context-aware suggested chips (per-screen: dashboard, calendar, plan, arena, insights)
- Input bar: rounded text input, circular send button
- KeyboardAvoidingView support

**Target State** (MVP.md Global Overlay section):
- Floating button: same 56px teal circle with chat icon, positioned 16px from right, 90px from bottom
- Pulse/glow animation when AI has proactive insights (budget alert, spending anomaly)
- Button dismissible by swiping to edge (snaps to half-visible state)
- Bottom sheet: ~80% screen height (currently 70%)
- Header: AI avatar (crystal ball icon, 32px) + "AI Assistant" title + "Powered by Claude" subtitle (12px) + close button
- Context-aware chips change per screen (already implemented)
- Message list: supports markdown rendering (bold, lists, code blocks), supports inline charts/cards for financial data
- Inline financial data cards in AI responses that navigate to relevant screens on tap
- Chat session stored in Supabase for cross-session persistence

**Changes Needed**:
- Add pulse/glow animation on FloatingChatButton when proactive insights are available
- Add swipe-to-edge dismiss behavior on FloatingChatButton (snap to half-visible state, tap to restore)
- Increase sheet height from 70% to 80% of screen
- Replace sparkles icon with crystal ball AI avatar (32px)
- Add "Powered by Claude" subtitle below "AI Assistant"
- Add markdown rendering support in assistant message bubbles
- Add inline chart/card rendering capability in AI responses
- Add tap-to-navigate on financial data cards within AI responses
- Add cross-session chat persistence via Supabase `chat_messages` table

**New Components**:
- `PulseAnimation` -- Teal glow pulse on the FAB
- `MarkdownBubble` -- Markdown-capable message bubble (bold, lists, code blocks)
- `InlineFinancialCard` -- Embeddable financial data card in chat messages
- `SwipeToEdge` -- Gesture handler for FAB dismissal

**Data Requirements**:
- Proactive insight flags (from prediction/budget system to trigger pulse)
- Cross-session chat history (Supabase `chat_messages` table)
- Screen-specific financial context for Claude API calls (budget status, recent transactions, predictions, calendar events)

---

### 2.16 Navigation Changes

**Current State**: `/workspace/app/app/(tabs)/_layout.tsx` (67 lines)
- 5 bottom tabs: Dashboard, Calendar, Plan, Arena, Insights
- Tab icons (Ionicons): grid, calendar, navigate-circle, trophy, bulb
- Active: teal color (`Colors.tabActive`), inactive: gray (`Colors.tabInactive`)
- Tab bar: dark background (`Colors.tabBarBackground`), border top, 80px height, 20px bottom padding, 8px top padding
- Label style: xs font size, medium weight
- All tab screens have `headerShown: false`

Additional navigation routes (stack screens):
- `/settings` -- Settings/Profile screen
- `/budget-detail` -- Budget Detail screen (with `category` query param)
- `/transaction-review` -- Transaction Review screen
- `/notifications` -- Notifications screen
- `/onboarding/welcome` -- Welcome screen
- `/onboarding/connect-calendar` -- Connect Calendar
- `/onboarding/connect-bank` -- Connect Bank
- `/onboarding/set-budget` -- Set Budget

**Target State** (MVP.md):
- 5 bottom tabs: Dashboard, Calendar, Plan, Arena, Insights -- matches current
- Tab icons: grid, calendar, target/crosshair, trophy, lightbulb/chart -- Plan icon differs
- Same active/inactive color scheme
- Profile avatar in header on ALL tab screens provides navigation to Settings -- currently implemented via Header component
- NotificationBell in header on all tab screens for notification access -- not yet implemented
- Deep links from notifications to relevant screens

**Changes Needed**:
- Change Plan tab icon from `navigate-circle` to `target` or `crosshair` (MVP spec says "target/crosshair icon")
- Add NotificationBell to the shared Header component (currently Header only has title + profile avatar)
- Add deep link support for notifications (each notification navigates to relevant screen)
- Add circle detail screen route (for Arena circles)
- Add challenge detail screen route (for Arena challenges)
- Add badge collection full-screen route (for Arena "View All" badges)
- Add goal detail screen route (for Plan savings goals)
- Consider adding auth flow routes if not already handled (login, signup)

**New Routes to Add**:
| Route | Purpose |
|-------|---------|
| `/arena/circle-detail` | Circle detail with mini leaderboard |
| `/arena/challenge-detail` | Challenge detail with progress and leaderboard |
| `/arena/badges` | Full badge collection screen |
| `/plan/savings-goal` | Savings goal detail/editor |
| `/plan/budget-editor` | Full budget editor (same as onboarding Set Budget but editable) |

---

*End of Section 2*

---

## APPENDICES

### Appendix A: Source Document Cross-Reference

| Section | Primary Source | Secondary Source | Key Sections Referenced |
|---------|---------------|-----------------|------------------------|
| 1.1 Overview | `INSIGHTS_METRICS_DESIGN.md` | `insights.tsx` | Metric selection rationale, current implementation |
| 1.2 Financial Health Score | MVP.md Section 5.8 | `INSIGHTS_METRICS_DESIGN.md` Section 1 | Weight distribution, grade mapping, 5-component formula |
| 1.3 Twin Gauges | MVP.md Section 5.4 (Burn Rate), Section 5.3 (Velocity) | `INSIGHTS_METRICS_DESIGN.md` Section 2 | Burn rate formula, EWMA smoothing, overspend detection |
| 1.4 CCI | MVP.md Section 5.6 | `INSIGHTS_METRICS_DESIGN.md` Section 3 | CCI formula, accuracy_weight, adaptive weighting |
| 1.5 Spending Trends | `INSIGHTS_METRICS_DESIGN.md` Section 5 | `insights.tsx` lines 131-149, 217-239 | Weekly/monthly aggregation, budget ceiling overlay |
| 1.6 Category Breakdown | `INSIGHTS_METRICS_DESIGN.md` Section 4 | `insights.tsx` lines 110-128, 243-273 | Donut chart spec, MoM deltas, traffic lights |
| 1.7 AI Insights | `INSIGHTS_METRICS_DESIGN.md` Section 7 | MVP.md (Claude integration) | Insight types, urgency sorting, action buttons |
| 1.8 Savings Projection | MVP.md Section 5.2 | `INSIGHTS_METRICS_DESIGN.md` Section 6 | Compound interest formula, three-scenario model |
| 1.9 Month-over-Month | `INSIGHTS_METRICS_DESIGN.md` Section 8 | — | MoM delta formulas, best/worst highlights |
| 1.10 SVG Components | `INSIGHTS_METRICS_DESIGN.md` (all sections) | — | Component interfaces, SVG element specs |
| 1.11 Data Dependencies | `budgetStore.ts`, `transactionStore.ts`, `predictionStore.ts` | MVP.md Section 5 | Store method signatures, new calculations |
| 2.1 Design System | `colors.ts`, `typography.ts`, `spacing.ts` | MVP.md Section 15 | Color token diffs, new tokens |
| 2.2 Global Components | `IMPLEMENTATION-PLAN.md` (Cycles 9-20) | — | Component names, props, referenced cycles |
| 2.3-2.6 Onboarding | `welcome.tsx`, `connect-calendar.tsx`, `connect-bank.tsx`, `set-budget.tsx` | MVP.md Screens 1-4 | Screen specs, interaction patterns |
| 2.7 Dashboard | `dashboard.tsx` | MVP.md Screen 5, `IMPLEMENTATION-PLAN.md` Cycle 9 | Hero card, trajectory chart, category circles |
| 2.8 Calendar | `calendar.tsx` | MVP.md Screen 6, `IMPLEMENTATION-PLAN.md` Cycle 10 | Heatmap, bottom sheet, prediction overlay |
| 2.9 Budget Detail | `budget-detail.tsx` | MVP.md Screen 7, `IMPLEMENTATION-PLAN.md` Cycle 11 | Trend chart, transaction list, FAB |
| 2.10 Transaction Review | `transaction-review.tsx` | MVP.md Screen 8, `IMPLEMENTATION-PLAN.md` Cycle 12 | Swipe gestures, split, calendar link |
| 2.11 Plan | `plan.tsx` | MVP.md Screen 9, `IMPLEMENTATION-PLAN.md` Cycle 12 | Budget tools, savings rules, recurring chips |
| 2.12 Arena | `arena.tsx` | MVP.md Screen 10, `IMPLEMENTATION-PLAN.md` Cycles 14-16 | Podium, badges, circles, nudges |
| 2.13 Insights Screen | `insights.tsx` | MVP.md Screen 12, Section 1 of this doc | Cross-reference to Section 1 metrics |
| 2.14 Settings | `settings.tsx` | MVP.md Screen 13 | Profile editing, data export, delete account |
| 2.15 Floating Chat | `FloatingChatButton.tsx`, `ChatSheet.tsx` | MVP.md Global Overlay, `IMPLEMENTATION-PLAN.md` Cycle 13 | Pulse animation, markdown, persistence |
| 2.16 Navigation | `_layout.tsx` | MVP.md Navigation spec | New routes, icon changes, deep links |

---

### Appendix B: New File Manifest

Files that need to be **created** (do not exist yet in the codebase):

#### SVG Chart Components (`app/src/components/charts/`)
| File | Purpose | Section Ref |
|------|---------|-------------|
| `HealthScoreRing.tsx` | Circular arc gauge for Financial Health Score | 1.2, 1.10 |
| `BurnRateGauge.tsx` | Semi-circle speedometer for Burn Rate | 1.3, 1.10 |
| `DonutChart.tsx` | Segmented donut for Category Breakdown | 1.6, 1.10 |
| `TrendLineChart.tsx` | Line chart with budget ceiling and fill shading | 1.5, 1.10 |
| `GrowthCurveChart.tsx` | Multi-line area chart for Savings Projection | 1.8, 1.10 |
| `CCIBadge.tsx` | Circular score badge for CCI | 1.4, 1.10 |

#### Shared UI Components (`app/src/components/ui/`)
| File | Purpose | Section Ref |
|------|---------|-------------|
| `MetricCard.tsx` | Small metric card with trend arrow | 2.2, 2.7 |
| `AnimatedNumber.tsx` | Number that animates from 0 to value | 2.2 |
| `ProgressRing.tsx` | SVG circular progress for category budgets | 2.2, 2.7 |
| `StatusBadge.tsx` | Pill badge colored by status | 2.2 |
| `SkeletonLoader.tsx` | Loading placeholder | 2.2 |
| `NotificationBell.tsx` | Bell with red unread badge | 2.2, 2.7-2.14 |
| `ConfettiAnimation.tsx` | Full-screen confetti burst | 2.2, 2.6, 2.12 |

#### Screen-Specific Components
| File | Purpose | Section Ref |
|------|---------|-------------|
| `SpendingTrajectoryChart.tsx` | Dashboard hero line chart | 2.7 |
| `DayDetailSheet.tsx` | Calendar draggable bottom sheet | 2.8 |
| `WeekTimeline.tsx` | Calendar week time-slot grid | 2.8 |
| `AdjustBudgetFAB.tsx` | Budget detail floating action button | 2.9 |
| `SplitTransactionModal.tsx` | Transaction split modal | 2.10 |
| `BudgetAdjustmentCard.tsx` | Per-category budget slider card | 2.11 |
| `RecurringChip.tsx` | Compact recurring expense chip | 2.11 |
| `PodiumDisplay.tsx` | Arena top-3 pedestals | 2.12 |
| `BadgeDetailModal.tsx` | Arena badge info modal | 2.12 |
| `AIInsightCard.tsx` | Claude-powered insight card with actions | 1.7, 2.13 |
| `MonthComparison.tsx` | MoM side-by-side comparison | 1.9, 2.13 |

#### Utilities (`app/src/utils/`)
| File | Purpose | Section Ref |
|------|---------|-------------|
| `financialCalcs.ts` | Compound interest FV, projection scenarios | 1.8, 1.11 |

#### New Routes (`app/app/`)
| File | Purpose | Section Ref |
|------|---------|-------------|
| `arena/circle-detail.tsx` | Circle detail with mini leaderboard | 2.12, 2.16 |
| `arena/challenge-detail.tsx` | Challenge detail with progress | 2.12, 2.16 |
| `arena/badges.tsx` | Full badge collection | 2.12, 2.16 |
| `plan/savings-goal.tsx` | Savings goal detail/editor | 2.11, 2.16 |
| `plan/budget-editor.tsx` | Full budget editor | 2.11, 2.16 |

---

### Appendix C: Implementation Priority Order

Based on `IMPLEMENTATION-PLAN.md` dependency waves and the criticality of each section for demo readiness:

| Priority | Component/Section | Rationale | IMPL-PLAN Cycle |
|----------|-------------------|-----------|-----------------|
| **P0 — Foundation** | | | |
| 1 | Design system token updates (2.1) | All screens depend on correct tokens | Cycle 1 |
| 2 | `HealthScoreRing` SVG component (1.10) | Used by Dashboard AND Insights | Cycle 9, 17 |
| 3 | `BurnRateGauge` SVG component (1.10) | Used by Dashboard AND Insights | Cycle 9, 17 |
| 4 | `ProgressRing` component (2.2) | Used by Dashboard category circles | Cycle 9 |
| 5 | `MetricCard` component (2.2) | Used by Dashboard AND Insights | Cycle 9 |
| **P1 — Dashboard** | | | |
| 6 | Dashboard overhaul (2.7) | First screen users see; judges see | Cycle 9 |
| 7 | `SpendingTrajectoryChart` (2.7) | Dashboard hero visualization | Cycle 9 |
| 8 | `NotificationBell` (2.2) | Shared across all screen headers | Cycle 9 |
| **P2 — Insights Core** | | | |
| 9 | Health Score formula update (1.2, 1.11) | Core metric; feeds Dashboard too | Cycle 17 |
| 10 | CCI calculation + badge (1.4) | Novel differentiator; demo highlight | Cycle 17 |
| 11 | `DonutChart` SVG (1.6, 1.10) | Category breakdown upgrade | Cycle 17 |
| 12 | `TrendLineChart` SVG (1.5, 1.10) | Spending trends upgrade | Cycle 17 |
| 13 | AI Insights integration (1.7) | Claude-powered; demo wow factor | Cycle 17 |
| **P3 — Insights Advanced** | | | |
| 14 | Twin Gauges: Burn Rate + Velocity (1.3) | New Insights section | Cycle 17 |
| 15 | `GrowthCurveChart` SVG (1.8, 1.10) | Savings projection upgrade | Cycle 17 |
| 16 | Month-over-Month comparison (1.9) | New Insights section | Cycle 17 |
| 17 | Store calculation updates (1.11) | Data layer for all metrics | Cycle 17 |
| **P4 — Other Screens** | | | |
| 18 | Calendar view upgrades (2.8) | Time-slot grid, bottom sheet | Cycle 10 |
| 19 | Plan screen enhancements (2.11) | Budget tools, recurring chips | Cycle 12 |
| 20 | Arena enhancements (2.12) | Podium, badges, circles | Cycle 16 |
| 21 | Budget Detail upgrades (2.9) | Line chart, FAB, pagination | Cycle 11 |
| 22 | Transaction Review upgrades (2.10) | Swipe gestures, split, event link | Cycle 12 |
| **P5 — Polish** | | | |
| 23 | Onboarding screen upgrades (2.3-2.6) | Animations, illustrations | Cycle 1, 20 |
| 24 | Settings/Profile upgrades (2.14) | Theme selector, delete account | Cycle 20 |
| 25 | Chat overlay enhancements (2.15) | Markdown, pulse, persistence | Cycle 13 |
| 26 | Navigation changes (2.16) | New routes, icon update | Cycle 1 |

---

*Generated from: `INSIGHTS_METRICS_DESIGN.md`, `MVP.md`, `IMPLEMENTATION-PLAN.md`, and the current FutureSpend codebase.*
