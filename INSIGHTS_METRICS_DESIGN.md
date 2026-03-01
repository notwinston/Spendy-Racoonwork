# Insights Screen — Metric Selection & Visualization Design

### Which Metrics Matter Most, and How to Make Them Hit

> The MVP.md defines 10 metrics. The current `insights.tsx` implements basic versions of 5. This document selects the **6 best metrics** for the Insights screen, designs their visualizations, and specifies exactly how they should look and behave.

---

## Metric Selection: The Final Six

From the 10 metrics in MVP.md Section 5, these 6 are selected for maximum demo impact, user value, and technical differentiation:

| # | Metric | Why Selected | Current State |
|---|--------|-------------|---------------|
| 1 | **Financial Health Score** | Hero metric — the "credit score for spending habits." Judges see one number and instantly understand. | Implemented (basic ring + grade). Needs SVG gauge upgrade + animated breakdown. |
| 2 | **Burn Rate** | Most viscerally urgent metric. "Are you overspending?" answered in one glance. | Calculated but not visually displayed as its own component. |
| 3 | **Calendar Correlation Index (CCI)** | Our **novel metric** — the one no other app has. This is what makes us technically differentiated. | Not implemented at all. |
| 4 | **Category Spending Breakdown** | Answers "where is my money going?" — the most asked personal finance question. | Implemented (horizontal bars). Needs donut chart + month-over-month delta. |
| 5 | **Spending Velocity + Trend** | Answers "am I getting better or worse?" — the second most asked question. | Weekly bars exist. Needs velocity number + directional trend line. |
| 6 | **Savings Projection** | The hopeful metric — "what does this all add up to?" Turns sacrifice into motivation. | Implemented (basic numbers). Needs compound growth curve with scenarios. |

**Cut from the Insights screen** (still used elsewhere):
- *Predictive Budget* — lives on Dashboard and Plan screen, not Insights
- *Risk/Volatility (CV)* — too technical for users; used internally to size prediction intervals
- *Savings Efficiency* — too granular; folded into Health Score breakdown
- *Smart Savings Rules* — action-oriented, belongs on Plan screen

---

## Screen Layout: Top to Bottom

```
┌─────────────────────────────────────────┐
│  Insights                    🔔  (👤)   │  ← Fixed header
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     FINANCIAL HEALTH SCORE      │    │  Section 1: Hero Score
│  │         ◉ 72 / B               │    │  (big ring, breakdown bars,
│  │    [═══════] [═══════]          │    │   trend arrow)
│  │    [═══════] [═══════]          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ BURN RATE│  │ VELOCITY │            │  Section 2: Twin Gauges
│  │  ◉ 0.94x │  │  $42/day │            │  (side-by-side cards)
│  │  On Track │  │  ↓ 8%   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     CALENDAR CORRELATION        │    │  Section 3: CCI (novel)
│  │     ◉ 74%  "Good"              │    │  (score + accuracy scatter
│  │     ┊ ● ● ● ● ● ● ┊           │    │   + per-category bars)
│  │     pred vs actual              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     SPENDING TRENDS             │    │  Section 4: Trend Line
│  │     [W] [M] [6M]               │    │  (line chart with budget
│  │     ╱‾‾╲___╱‾‾╲                │    │   ceiling + fill color)
│  │     ───────────── budget        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     CATEGORY BREAKDOWN          │    │  Section 5: Donut + Legend
│  │        ◉ donut                  │    │  (animated donut, tap to
│  │     cat1 ████████ $280  32%     │    │   drill down, MoM deltas)
│  │     cat2 ██████   $210  24%     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     AI INSIGHTS                 │    │  Section 6: Claude-powered
│  │     💡 "Dining is 22% above.." │    │  (3-5 insight cards with
│  │     💡 "Cancel Adobe CC.."     │    │   action buttons)
│  │     💡 "Pack lunch Tues.."     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     SAVINGS PROJECTION          │    │  Section 7: Growth Curve
│  │     ╱‾‾‾ optimistic            │    │  (3-scenario area chart
│  │    ╱──── expected               │    │   with milestone markers)
│  │   ╱───── conservative           │    │
│  │   3mo  6mo  12mo               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     MONTH OVER MONTH            │    │  Section 8: Comparison
│  │     This month vs last          │    │  (side-by-side bars
│  │     Dining:  ▓▓▓▓▓ vs ▓▓▓      │    │   with % change badges)
│  │     Coffee:  ▓▓ vs ▓▓▓▓ ↓22%  │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Section 1: Financial Health Score (Hero)

### What it shows
A single composite score (0-100) with letter grade, component breakdown, and week-over-week trend.

### Formula (from MVP.md 5.8)
```
HealthScore = 0.30 × BudgetAdherence
            + 0.25 × SavingsRate
            + 0.20 × SpendingStability
            + 0.15 × CalendarCorrelation
            + 0.10 × StreakBonus
```

### Visualization

```
┌─────────────────────────────────────────────────┐
│                                                   │
│               ╭─────────────╮                     │
│             ╭─╯             ╰─╮                   │
│           ╭─╯    ┌───────┐    ╰─╮                 │
│          ╭╯      │       │      ╰╮                │
│         ╭╯       │  72   │       ╰╮               │
│         │        │   B   │        │               │
│         ╰╮       └───────┘       ╭╯               │
│          ╰╮                     ╭╯                │
│           ╰─╮                 ╭─╯                 │
│             ╰─╮    ▲ +5     ╭─╯                   │
│               ╰─────────────╯                     │
│          Financial Health Score                    │
│                                                   │
│  Budget     ████████████░░░░░  26/30              │
│  Savings    ██████████░░░░░░░  18/25              │
│  Stability  █████████████░░░░  16/20              │
│  Calendar   ████████░░░░░░░░░   8/15              │
│  Streak     ██████░░░░░░░░░░░   4/10              │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Design details:**
- **Ring:** 140px diameter SVG arc. Arc fills proportionally to score (72% filled for score of 72). Gradient along the arc: red (0-40) to yellow (40-70) to green (70-100). Unfilled portion is `#1E3054`.
- **Center:** Score number (48px bold white) with letter grade below (24px, colored by grade tier).
- **Trend arrow:** Below the ring — "▲ +5 from last week" in green or "▼ -3" in red. Only shows if at least 2 weeks of data exist.
- **Breakdown bars:** Five horizontal progress bars in a column. Each bar has:
  - Left: component name (14px, `#94A3B8`)
  - Right: `score/maxScore` (14px, `#64748B`)
  - Bar: background `#1E3054`, fill colored by ratio (green >= 70%, yellow >= 40%, red < 40%)
- **Tap interaction:** Tapping the ring expands a tooltip explaining what the score means and how to improve.

**Why this design works:** The ring is a universally understood "progress toward 100" pattern (like Apple's Activity Rings). The breakdown immediately answers "what do I fix?" without leaving the screen. The trend arrow creates urgency or reward.

---

## Section 2: Twin Gauges — Burn Rate + Spending Velocity

### What they show
**Burn Rate:** Are you on pace to stay within budget this month? (ratio where 1.0 = exact pace)
**Spending Velocity:** How fast are you spending in absolute dollars/day, and is it trending up or down?

### Formulas (from MVP.md 5.3 + 5.4)
```
BurnRate = (CurrentSpending / ElapsedDays) × TotalDays / TotalBudget

Velocity = Σ(last 7 days spending) / 7
BudgetVelocity = TotalMonthlyBudget / DaysInMonth
SpendingRatio = Velocity / BudgetVelocity
```

### Visualization

```
┌──────────────────────┐  ┌──────────────────────┐
│                      │  │                      │
│    BURN RATE         │  │    VELOCITY          │
│                      │  │                      │
│     ╭───────╮        │  │      $42             │
│    ╱ · ·|· · ╲       │  │     per day          │
│   (   0.94x   )      │  │                      │
│    ╲_________╱       │  │  budget pace: $38    │
│                      │  │                      │
│    ● On Track        │  │    ▼ 8% vs last wk   │
│                      │  │    ● Slightly Above   │
│                      │  │                      │
└──────────────────────┘  └──────────────────────┘
```

**Burn Rate card:**
- **Semi-circle gauge** (speedometer style): Arc from 0.5x to 1.5x. Needle points to current burn rate.
- Arc color zones: green (< 0.80), yellow (0.80-1.00), orange (1.00-1.20), red (> 1.20).
- Center text: burn rate value (24px bold) with "x" suffix.
- Status label below: "Excellent" / "On Track" / "Caution" / "Over Budget" with matching colored dot.
- **Subtle pulse animation** when in orange or red zone.

**Velocity card:**
- **Big number** layout: daily spend rate in large text (28px bold white).
- "per day" label below (12px `#64748B`).
- Comparison line: "budget pace: $38/day" in smaller text (14px `#94A3B8`).
- **Trend indicator:** "▼ 8% vs last week" or "▲ 12% vs last week" with directional arrow colored green (decreasing = good) or red (increasing = bad).
- Status dot + label matching burn rate logic.

**Layout:** Two cards side-by-side in a `flexDirection: 'row'` container. Each card is `flex: 1` with `gap: 12`.

**Why this design works:** Side-by-side cards let users see both "am I on pace?" (ratio) and "how much am I spending?" (absolute) simultaneously. The gauge is instantly readable. The velocity trend answers "am I getting better?" without any chart.

---

## Section 3: Calendar Correlation Index (Our Novel Metric)

This is the section that makes judges lean forward. No other finance app has this.

### What it shows
How accurately your calendar predicts your actual spending. High CCI = your schedule is a reliable financial signal. Low CCI = your spending is more spontaneous.

### Formula (from MVP.md 5.6)
```
CCI = (predicted_events_with_actual_spend / total_predicted_events) × accuracy_weight
accuracy_weight = 1 - |predicted_amount - actual_amount| / max(predicted, actual)
```

### Visualization

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  Calendar Correlation              ✨ Novel       │
│                                                   │
│  ╭───────────╮                                    │
│  │           │                                    │
│  │   74%     │   Your calendar predicted           │
│  │   Good    │   74% of your spending              │
│  │           │   accurately this month             │
│  ╰───────────╯                                    │
│                                                   │
│  Prediction Accuracy by Event                     │
│                                                   │
│  ●  $45 ─── $42  ✓  Dinner w/ Alex               │
│  ●  $25 ─── $31  ~  Team Lunch                    │
│  ●  $35 ─── $38  ✓  Karaoke Night                │
│  ●  $12 ─── $0   ✗  Study Group                  │
│  ●  $8  ─── $9   ✓  Coffee Meetup                │
│                                                   │
│  By Category                                      │
│  Social    ████████████████░░░  85%               │
│  Dining    █████████████░░░░░░  72%               │
│  Coffee    ████████████░░░░░░░  68%               │
│  Work      █████░░░░░░░░░░░░░  31%               │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Design details:**

**CCI Score Badge:**
- Circular badge (80px) with the CCI percentage in the center (28px bold).
- Ring fill: same gradient approach as Health Score (red < 40, yellow 40-70, green > 70).
- Label below badge: "Poor" / "Weak" / "Moderate" / "Good" / "Excellent".
- Explanation text to the right of the badge (14px `#94A3B8`): "Your calendar predicted 74% of your spending accurately this month."
- **"Novel" badge:** Small pill in top-right of section header: `✨ Novel` in accent color, indicating this is a FutureSpend-original metric. Subtle but signals innovation to judges.

**Prediction Accuracy Dots:**
- A list of the 5 most recent predicted events.
- Each row: colored dot (green ✓ if within 20%, yellow ~ if 20-50% off, red ✗ if > 50% off or missed), predicted amount, dash connector, actual amount, accuracy indicator, event name.
- This is the "proof" — judges can see the ML pipeline working on real events.

**Per-Category CCI Bars:**
- Horizontal bars showing CCI by spending category.
- Sorted descending. Shows which parts of the user's life are most calendar-predictable.
- Fills colored by the CCI threshold (green/yellow/red).

**Why this design works:** It takes an abstract metric and makes it tangible. The prediction accuracy dots are the "show your work" moment — judges see predicted vs actual side by side and understand the ML pipeline is real. Per-category breakdown reveals the *insight* (e.g., "work events don't predict spending, but social events do").

---

## Section 4: Spending Trends (Upgraded)

### What it shows
How spending has changed over time, overlaid against the budget ceiling.

### Visualization

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  Spending Trends       [Weekly] [Monthly] [6Mo]  │
│                                                   │
│  $1200 ┤                                          │
│        │              ╱╲                          │
│  $1000 ┤ ─ ─ ─ ─ ─ ╱─ ─╲─ ─ ─ ─ budget ─ ─ ─   │
│        │          ╱╱     ╲                        │
│   $800 ┤       ╱╱╱        ╲╲                      │
│        │    ╱╱╱              ╲╲                    │
│   $600 ┤ ╱╱                    ╲                  │
│        │╱   ░░░░░░░░░░░░░░░░░░░                  │
│   $400 ┤    ░░░ under budget ░░░                  │
│        │    ░░░░░░░░░░░░░░░░░░░                  │
│   $200 ┤                                          │
│        │                                          │
│     $0 ┼────┬────┬────┬────┬────┬────             │
│        W1   W2   W3   W4   W5   W6               │
│                                                   │
│  Avg: $847/wk    High: $1,080 (W4)               │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Design details:**
- **Period toggle:** Segmented control at top-right: Weekly / Monthly / 6-Month. Active segment in accent color.
- **Line chart:** Solid teal (`#00D09C`) line for actual spending. Dashed gray (`#64748B`) horizontal line for budget.
- **Fill shading:** Area between actual line and budget line is filled:
  - Green tint (`rgba(34, 197, 94, 0.15)`) when under budget
  - Red tint (`rgba(255, 71, 87, 0.15)`) when over budget
- **Data points:** Small circles at each data point. Tap to show exact value tooltip.
- **Summary row:** Below the chart — average spend per period + highest period flagged.
- Built using **react-native-svg** (manual path drawing) since we don't have Victory Native installed.

---

## Section 5: Category Breakdown (Upgraded with Donut)

### What it shows
Where money is going, broken down by category, with month-over-month change indicators.

### Visualization

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  Category Breakdown                               │
│                                                   │
│          ╭─────────╮                              │
│        ╭─╯ ▓▓▓▓▓▓▓ ╰─╮     Dining    $380  32%  │
│       ╭╯ ▓▓       ░░░ ╰╮    Transport $210  18%  │
│      ╭╯▓▓    $1,180 ░░░╰╮   Entertain $175  15%  │
│      │▓▓     total    ░░│   Shopping  $142  12%  │
│      ╰╮▓▓           ░░╭╯   Coffee    $108   9%  │
│       ╰╮ ▒▒       ▒▒ ╭╯    Other     $165  14%  │
│        ╰─╮ ▒▒▒▒▒▒▒ ╭─╯                          │
│          ╰─────────╯                              │
│                                                   │
│  vs Last Month                                    │
│  Dining     ▲ +15%  ██████████████████ → 🔴      │
│  Transport  ▼ -8%   ████████████░░░░░░ → 🟢      │
│  Entertain  ▲ +3%   █████████░░░░░░░░ → 🟡      │
│  Shopping   ── 0%    ███████░░░░░░░░░░            │
│  Coffee     ▼ -22%  █████░░░░░░░░░░░░ → 🟢      │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Design details:**

**Donut chart:**
- 160px diameter SVG donut with 30px stroke width.
- Each category is a colored arc segment. Colors match `CATEGORY_COLORS` from the existing code.
- Center text: total spend (20px bold white) + "total" label (12px `#64748B`).
- **Tap interaction:** Tapping a segment highlights it (slight scale + glow), dims others, and shows a tooltip with the full amount + percentage.
- Animated on mount — segments grow from 0 to their final arc length over 600ms with easing.

**Legend with MoM deltas:**
- To the right of the donut: category list with color swatch, name, dollar amount, percentage.
- Below the donut: "vs Last Month" section showing each category with:
  - Directional arrow: ▲ (increase, red) / ▼ (decrease, green) / ── (flat)
  - Percentage change
  - Horizontal bar (budget vs actual)
  - Traffic light dot: red (> +10%), yellow (+1-10%), green (decrease or flat)

---

## Section 6: AI Insights (Claude-Powered)

### What it shows
3-5 actionable, personalized recommendations generated by Claude based on the user's spending patterns, calendar data, and budget status.

### Visualization

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  AI Insights                        ✨ Powered    │
│                                     by Claude     │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ ⚠️  Dining is accelerating                   │ │
│  │  You've spent $380 on dining (32% of total). │ │
│  │  That's 15% more than last month. 3 team     │ │
│  │  lunches remain this week.                    │ │
│  │                          [Adjust Budget →]   │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ 💰  Subscription opportunity                  │ │
│  │  You're paying for Adobe CC ($54.99/mo) but  │ │
│  │  haven't used it in 6 weeks. Cancel to save  │ │
│  │  $660/year.                                   │ │
│  │                  [Dismiss]  [Mark for Review] │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ 📈  Coffee spending down 22%                  │ │
│  │  Your Coffee Savings Challenge is working!   │ │
│  │  You've saved $24 this month by brewing at   │ │
│  │  home 3x/week. Keep it up.                   │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Design details:**
- Each insight is a `Card` with left-colored accent border (4px): red for warnings, green for wins, blue for tips.
- **Icon:** Type-specific icon top-left (warning triangle, money bag, chart up, lightbulb).
- **Title:** Bold 14px white. One-line summary.
- **Body:** 13px `#94A3B8`. 2-3 sentences with specific numbers pulled from user data.
- **Action buttons:** Right-aligned at bottom of card. "Adjust Budget", "Mark for Review", "Dismiss", "View Details". Teal outline style.
- Max 5 insights shown. Sorted by urgency (warnings first, then opportunities, then wins).

---

## Section 7: Savings Projection (Growth Curve)

### What it shows
What the user's savings will grow to over 3, 6, and 12 months under three scenarios.

### Formula (from MVP.md 5.2)
```
FV = PV(1 + r)^n + PMT × ((1 + r)^n - 1) / r
```

### Visualization

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  Savings Projection                               │
│  If you maintain $300/month savings:              │
│                                                   │
│  $6k ┤                              ╱ optimistic  │
│      │                           ╱╱╱              │
│  $5k ┤                        ╱╱╱   ╱ expected    │
│      │                     ╱╱╱   ╱╱╱              │
│  $4k ┤                  ╱╱╱   ╱╱╱                 │
│      │               ╱╱╱   ╱╱╱    ╱ conservative  │
│  $3k ┤            ╱╱╱   ╱╱╱    ╱╱╱                │
│      │         ╱╱╱   ╱╱╱    ╱╱╱                   │
│  $2k ┤──────╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  ← you are here     │
│      │   ╱╱╱                                      │
│  $1k ┤                                            │
│      │                                            │
│   $0 ┼────┬────┬────┬────┬────┬────               │
│      Now  2mo  4mo  6mo  8mo  12mo                │
│                                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ 3 mo │  │ 6 mo │  │ 12mo │  │ 24mo │          │
│  │$2.9k │  │$3.8k │  │$5.8k │  │$9.6k │          │
│  └──────┘  └──────┘  └──────┘  └──────┘          │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Design details:**
- **Three-line area chart:**
  - Conservative (dashed, `#64748B`): PMT × 0.8
  - Expected (solid, `#00D09C`): actual PMT
  - Optimistic (dashed, `#3B82F6`): PMT × 1.2 + save-the-difference
- Area between conservative and optimistic is lightly filled (`rgba(0, 208, 156, 0.1)`).
- **"You are here" marker:** Dot on the Y-axis at the user's current savings balance. Horizontal dashed line extending right.
- **Milestone markers:** If user has savings goals set, show flag icons on the expected line where the goal is reached. E.g., "Emergency Fund: $5,000" flag at the 10-month mark.
- **Summary pills:** Below the chart, four pills showing projected values at 3/6/12/24 months. Expected scenario value in bold accent color. Tapping a pill highlights that point on the chart.
- Animated on mount — lines draw from left to right over 800ms.

---

## Section 8: Month-over-Month Comparison

### What it shows
Direct comparison of this month vs last month — total and per-category.

### Visualization

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  Month over Month                                 │
│                                                   │
│  ┌───────────────────┐  ┌───────────────────┐    │
│  │    February        │  │     January       │    │
│  │    $1,180          │  │     $1,340        │    │
│  └───────────────────┘  └───────────────────┘    │
│              ▼ $160 less (12%)  🟢                │
│                                                   │
│  Best improvement                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │  ☕ Coffee  ▼ 22% ($24 saved)               │ │
│  │  Your Coffee Challenge is paying off!        │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Needs attention                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │  🍽️ Dining  ▲ 15% ($50 more)                │ │
│  │  3 more team lunches than usual              │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Design details:**
- **Total comparison:** Two side-by-side month boxes with dollar amounts. Delta shown between them with arrow and percentage. Green background tint if spending decreased, red if increased.
- **Best improvement:** Single highlight card with green left border. Shows the category with the biggest percentage decrease. Includes a one-line explanation.
- **Needs attention:** Single highlight card with red left border. Shows the category with the biggest percentage increase. Includes why (correlated to calendar if possible).
- Clean, minimal — no chart needed. The power is in the specificity of the callouts.

---

## Implementation Notes

### Data Dependencies
All metrics are computable from data already in the stores:
- `transactionStore` — spending amounts, categories, dates
- `budgetStore` — budget limits, burn rate calc, health score
- `predictionStore` — predicted amounts, confidence, accuracy
- `authStore` — streak count, user profile

### New Calculations Needed
1. **CCI calculation** — needs `predictionStore` to track predicted vs actual outcomes. Add a `predictionAccuracy` array to store.
2. **Spending Velocity** — 7-day rolling sum from `transactionStore`. Simple reduce.
3. **Month-over-month deltas** — compare current month transactions vs previous month. Filter + aggregate.
4. **Savings projection** — compound interest formula, already defined in MVP.md 5.2.

### SVG Components to Build
Since we don't have Victory Native, build these with `react-native-svg`:
1. `HealthScoreRing` — arc gauge with gradient
2. `BurnRateGauge` — semi-circle speedometer
3. `DonutChart` — segmented ring with tap interaction
4. `TrendLineChart` — SVG path with area fill
5. `GrowthCurveChart` — multi-line area chart

Each is a self-contained component in `src/components/charts/`.

### Performance
- All metric calculations are `useMemo`-wrapped with proper dependencies.
- Charts render once on mount with animation, then only re-render on data change.
- ScrollView with `removeClippedSubviews` for off-screen sections.

---

*Insights screen metric design for FutureSpend — Team Racoonwork*
*RBC Tech @ SFU Mountain Madness 2026*
