# Dummy & Placeholder Implementations Audit

**Generated**: 2026-03-01
**Scope**: FutureSpend React Native App — Hidden Cost Metrics & Engagement Feature

This document catalogs every dummy, hardcoded, placeholder, or unfinished implementation discovered after completing the 4-wave Hidden Cost Metrics & Engagement feature. Each entry includes the current state, why it's a problem, and exactly how to fix it.

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| **BLOCKING** | Feature is wired but never called — dead code that the user expects to work |
| **HIGH** | Hardcoded fallback or demo-only path masks real data |
| **MEDIUM** | Calculation bug or naive estimate that produces wrong numbers |
| **LOW** | Cosmetic or minor placeholder with limited user impact |

---

## Table of Contents

1. [BLOCKING: trackAccuracy() never called](#1-blocking-trackaccuracy-never-called)
2. [BLOCKING: scheduleMorningBrief() not called on app start](#2-blocking-schedulemorningbrief-not-called-on-app-start)
3. [BLOCKING: sendPreEventHiddenCostAlert() never wired](#3-blocking-sendpreeventhiddencostalert-never-wired)
4. [BLOCKING: 11+ badge evaluateCondition() cases always return false](#4-blocking-11-badge-evaluatecondition-cases-always-return-false)
5. [BLOCKING: UserStats interface missing hidden cost fields + (stats as any) casts](#5-blocking-userstats-interface-missing-hidden-cost-fields)
6. [HIGH: Hardcoded CCI fallback of 62](#6-high-hardcoded-cci-fallback-of-62)
7. [HIGH: Hardcoded velocity fallback of $42](#7-high-hardcoded-velocity-fallback-of-42)
8. [HIGH: healthTrend magic number 79](#8-high-healthtrend-magic-number-79)
9. [HIGH: 3 static AI Insight cards](#9-high-3-static-ai-insight-cards)
10. [HIGH: fetchNotifications() always uses demo data](#10-high-fetchnotifications-always-uses-demo-data)
11. [HIGH: historical_avg always null](#11-high-historical_avg-always-null)
12. [HIGH: budgetPace fallback of $33](#12-high-budgetpace-fallback-of-33)
13. [MEDIUM: savingsRate * 500 bug (5x inflation)](#13-medium-savingsrate--500-bug-5x-inflation)
14. [MEDIUM: Income estimated as totalBudget * 1.3](#14-medium-income-estimated-as-totalbudget--13)
15. [MEDIUM: financial_health_score hardcoded to 72](#15-medium-financial_health_score-hardcoded-to-72)
16. [LOW: submitFeedback() only logs to console](#16-low-submitfeedback-only-logs-to-console)
17. [LOW: Challenge progress not auto-tracked](#17-low-challenge-progress-not-auto-tracked)
18. [LOW: Demo leaderboard has only 3 entries](#18-low-demo-leaderboard-has-only-3-entries)

---

## 1. BLOCKING: trackAccuracy() never called

**File**: `src/stores/predictionStore.ts:244-306`

**Current state**: `trackAccuracy()` is fully implemented — it filters yesterday's predictions, calls `matchPredictionsToActuals()`, and updates `actual_amount`/`was_accurate` on both predictions and hidden costs. But nothing in the app ever calls it.

**Why it matters**: The CCI score, accuracy badges, and "Recent Predictions" section on the Insights screen will never show real hit/miss data. Everything stays `pending` forever.

**How to fix**: Call `trackAccuracy` once daily from the dashboard's mount effect.

```typescript
// In app/(tabs)/dashboard.tsx, add to existing useEffect or create new one:
const { trackAccuracy } = usePredictionStore();

useEffect(() => {
  if (transactions.length > 0) {
    trackAccuracy(transactions);
  }
}, [transactions.length]);
```

Alternatively, wire it into the daily check-in flow in `gamificationStore.performCheckin()` so accuracy is tracked alongside the check-in action.

---

## 2. BLOCKING: scheduleMorningBrief() not called on app start

**File**: `src/stores/notificationStore.ts:239-262`

**Current state**: `scheduleMorningBrief()` is only triggered when the user toggles `hiddenCostAlerts` in settings. If the user never touches that toggle (it defaults to `true`), the daily 8 AM notification is never scheduled.

**Why it matters**: Users who install the app and leave defaults will never receive the morning spending forecast notification.

**How to fix**: Schedule the notification on app startup if the preference is enabled.

```typescript
// In app/_layout.tsx or app/(tabs)/dashboard.tsx, add:
import { useNotificationStore } from '../src/stores/notificationStore';

// Inside the component:
const { preferences, scheduleMorningBrief } = useNotificationStore();

useEffect(() => {
  if (preferences.hiddenCostAlerts) {
    scheduleMorningBrief().catch(console.warn);
  }
}, []); // Run once on mount
```

---

## 3. BLOCKING: sendPreEventHiddenCostAlert() never wired

**File**: `src/stores/socialStore.ts:391-420`

**Current state**: The function is fully implemented — it creates a notification with the event's hidden cost breakdown, dispatches it via `createNotification()`, and handles demo mode. But nothing ever calls it.

**Why it matters**: Users never receive the pre-event "Budget $113 for dinner, not just $45" alerts that are the core UX promise of the hidden cost feature.

**How to fix**: Set up a periodic check or calendar-based trigger.

**Option A — useEffect with interval (simpler)**:
```typescript
// In app/(tabs)/dashboard.tsx or a dedicated hook:
useEffect(() => {
  const checkUpcomingEvents = () => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    events.forEach((event) => {
      const eventStart = new Date(event.start_time);
      if (eventStart > now && eventStart <= twoHoursFromNow) {
        const breakdown = eventCostBreakdowns[event.id];
        if (breakdown && breakdown.hidden_costs.length > 0) {
          sendPreEventHiddenCostAlert(userId, event, breakdown);
        }
      }
    });
  };

  const interval = setInterval(checkUpcomingEvents, 15 * 60 * 1000); // every 15 min
  checkUpcomingEvents(); // run immediately
  return () => clearInterval(interval);
}, [events, eventCostBreakdowns]);
```

**Option B — expo-notifications schedule per event (more robust)**:
Schedule a local notification at `event.start_time - 2 hours` for each event with hidden costs. Cancel and reschedule when predictions change.

---

## 4. BLOCKING: 11+ badge evaluateCondition() cases always return false

**File**: `src/services/gamificationService.ts:477-548`

**Current state**: The following badge condition types always return `false`:

| Line | Condition Type | Reason |
|------|---------------|--------|
| 489 | `budget_streak` | "skip for now" comment |
| 493 | `savings_total` | "skip for MVP" comment |
| 501-509 | `accurate_predictions`, `cci_streak`, `early_checkin`, `late_checkin`, `challenge_categories`, `challenge_wins`, `connections` | "skip for MVP" comment |
| 511 | `zero_spend_day` | Returns false |
| 528 | `budget_under_month` | TODO comment |
| 533 | `hidden_cost_acknowledged` | TODO comment |
| 541 | `health_score_streak` | TODO comment |

**Why it matters**: 16 of the 28 badges (57%) can never be earned. Users see locked badges with no path to unlocking them.

**How to fix**: Implement each condition. The data sources needed:

| Condition | Data Source | Implementation |
|-----------|------------|----------------|
| `budget_streak` | `budgetStore.budgets` — check if all categories have `percentUsed < 100` for N consecutive months | Requires monthly snapshots. Use `budget_snapshots` table or compute from transaction history |
| `savings_total` | `totalBudget - totalSpent` accumulated over months | Sum from transaction history: `SUM(budget - spent)` per month |
| `accurate_predictions` | `predictions.filter(p => p.was_accurate)` | Already trackable once `trackAccuracy()` is wired (see issue #1) |
| `cci_streak` | Weekly CCI scores from `calculateCCI()` | Store weekly CCI snapshots in a new array on predictionStore |
| `early_checkin` / `late_checkin` | `xp_transactions` where source='checkin' — check `created_at` hour | Query checkin timestamps, filter by hour |
| `challenge_categories` | `challenge_participants` joined with `challenges` — count distinct `challenge_type` | Extend `fetchUserStats()` to count unique categories |
| `challenge_wins` | `challenge_participants` where `status='completed'` | Already counted as `challenges_completed` — just reuse |
| `connections` | Check if plaid + calendar are both connected | `plaidStore.connections.length > 0 && calendarStore.events.length > 0` |
| `zero_spend_day` | Days where `SUM(transactions.amount) = 0` | Scan transaction history for gap days |
| `budget_under_month` | All categories under budget at month end | Same as `budget_streak` with `months: 1` |
| `hidden_cost_acknowledged` | Track daily dismissals/views | Add a `hiddenCostAcknowledgedDates: string[]` field to predictionStore |
| `health_score_streak` | Weekly health score >= threshold | Store weekly health score history |

---

## 5. BLOCKING: UserStats interface missing hidden cost fields

**File**: `src/services/gamificationService.ts:422-429`

**Current state**: The `UserStats` interface only has 6 fields. The hidden cost badge conditions at lines 518-543 use `(stats as any).hidden_cost_views`, `(stats as any).hidden_cost_accurate`, and `(stats as any).cci_score` — all unsafe casts that always resolve to `0` or `undefined`.

**Why it matters**: Even if the evaluateCondition logic were correct, the stats data is never populated.

**How to fix**:

```typescript
// Update UserStats interface at line 422:
interface UserStats {
  streak_count: number;
  longest_streak: number;
  level: number;
  challenges_completed: number;
  friends_count: number;
  xp: number;
  // New fields for hidden cost badges:
  hidden_cost_views: number;
  hidden_cost_accurate: number;
  cci_score: number;
  hidden_cost_acknowledged_days: number;
  health_score_weekly: number[];
  budget_under_months: number;
  zero_spend_days: number;
  savings_total: number;
}
```

Then update `getDemoStats()` (line 431) and `fetchUserStats()` (line 445) to populate these fields from the relevant stores/database.

For `getDemoStats()`:
```typescript
function getDemoStats(_userId: string): UserStats {
  // ... existing fields ...
  return {
    ...existingFields,
    hidden_cost_views: 0,       // TODO: track in predictionStore
    hidden_cost_accurate: 0,    // derive from predictions.filter(p => p.was_accurate)
    cci_score: 0,               // derive from calculateCCI(predictions)
    hidden_cost_acknowledged_days: 0,
    health_score_weekly: [],
    budget_under_months: 0,
    zero_spend_days: 0,
    savings_total: 0,
  };
}
```

---

## 6. HIGH: Hardcoded CCI fallback of 62

**File**: `app/(tabs)/insights.tsx:430,433`

**Current state**:
```typescript
<CCIBadge score={cciPercent > 0 ? cciPercent : 62} size={80} />
// and
Your calendar predicted {cciPercent > 0 ? cciPercent : 62}% of your spending
```

When `cciPercent` is 0 (no predictions with actual data), it shows "62%" instead of an empty/loading state.

**Why it matters**: Users see a fabricated CCI score that doesn't reflect reality.

**How to fix**: Replace the fallback with a proper empty state.

```typescript
// Replace line 430:
<CCIBadge score={cciPercent} size={80} />

// Replace line 433-434 with conditional:
{cciPercent > 0 ? (
  <Text style={styles.cciExplainText}>
    Your calendar predicted {cciPercent}% of your spending accurately this month.
  </Text>
) : (
  <Text style={styles.cciExplainText}>
    No prediction results yet. Link your calendar and spending data to see your
    Calendar Correlation Index.
  </Text>
)}
```

---

## 7. HIGH: Hardcoded velocity fallback of $42

**File**: `app/(tabs)/insights.tsx:397`

**Current state**:
```typescript
${velocity > 0 ? velocity.toFixed(0) : '42'}
```

When `velocity` is 0 (no transactions this week), it displays "$42/day" instead of "$0".

**Why it matters**: Shows a random number when there's no data.

**How to fix**:
```typescript
// Replace line 397:
${velocity.toFixed(0)}
```

If you want an empty state instead of "$0", wrap the entire velocity card in a conditional.

---

## 8. HIGH: healthTrend magic number 79

**File**: `app/(tabs)/insights.tsx:177-181`

**Current state**:
```typescript
const healthTrend = useMemo(() => {
  // TODO: Replace with actual week-over-week health score tracking
  const trend = transactions.length > 10 ? Math.round((healthScore - 79) * 10) / 10 : 5;
  return trend;
}, [healthScore, transactions.length]);
```

The trend is computed as `healthScore - 79`, so if your health score is 82, the trend shows "+3.0 from last week". The 79 is a hardcoded assumed-previous-score. If no transactions, it shows "+5".

**Why it matters**: The "from last week" label is a lie — it's comparing against a constant.

**How to fix**: Track weekly health scores over time.

```typescript
// Option A: Add to predictionStore or a new metricsStore:
interface MetricsHistory {
  weeklyHealthScores: { weekStart: string; score: number }[];
}

// On each dashboard load, record current week's score:
const currentWeekStart = getWeekStart(new Date()).toISOString().slice(0, 10);
const existingEntry = weeklyHealthScores.find(w => w.weekStart === currentWeekStart);
if (!existingEntry) {
  weeklyHealthScores.push({ weekStart: currentWeekStart, score: healthScore });
}

// Compute real trend:
const lastWeek = weeklyHealthScores[weeklyHealthScores.length - 2];
const healthTrend = lastWeek ? healthScore - lastWeek.score : 0;
```

**Quick interim fix** (if full tracking isn't ready): Hide the trend row when there's no historical data.

```typescript
const healthTrend = null; // No real data yet

// In JSX, conditionally render:
{healthTrend != null && (
  <View style={styles.trendRow}>...</View>
)}
```

---

## 9. HIGH: 3 static AI Insight cards

**File**: `app/(tabs)/insights.tsx:691-708`

**Current state**: Three `AIInsightCard` components are hardcoded with static text:
- "Dining Acceleration" — "increased 23%"
- "Subscription Savings" — "3 subscriptions totaling $47/month"
- "Coffee Savings Win" — "reduced by 35%... $28 saved"

These never change regardless of actual user data.

**Why it matters**: Users see "AI Insights" that don't reflect their spending at all.

**How to fix**: Generate insights from real transaction data.

```typescript
// Create a utility function:
function generateInsightCards(
  transactions: Transaction[],
  budgets: Budget[],
  categoryMoM: CategoryMoM[],
): { type: 'warning' | 'opportunity' | 'win'; title: string; body: string }[] {
  const insights = [];

  // Warning: categories growing fast
  for (const cat of categoryMoM) {
    if (cat.changePercent > 20 && cat.thisMonth > 50) {
      insights.push({
        type: 'warning' as const,
        title: `${capitalize(cat.category)} Acceleration`,
        body: `Your ${cat.category} spend has increased ${cat.changePercent.toFixed(0)}% compared to last month.`,
      });
    }
  }

  // Win: categories shrinking
  for (const cat of categoryMoM) {
    if (cat.changePercent < -20 && cat.lastMonth > 50) {
      const saved = cat.lastMonth - cat.thisMonth;
      insights.push({
        type: 'win' as const,
        title: `${capitalize(cat.category)} Savings Win`,
        body: `You've reduced ${cat.category} spending by ${Math.abs(cat.changePercent).toFixed(0)}% this month. That's $${saved.toFixed(0)} saved!`,
      });
    }
  }

  // Opportunity: over-budget categories
  for (const b of budgets) {
    if (b.percentUsed > 85) {
      insights.push({
        type: 'warning' as const,
        title: `${capitalize(b.category)} Budget Alert`,
        body: `You've used ${b.percentUsed.toFixed(0)}% of your ${b.category} budget with ${daysRemaining} days remaining.`,
      });
    }
  }

  return insights.slice(0, 3);
}
```

Then in JSX:
```typescript
{generatedInsights.map((insight, i) => (
  <AIInsightCard key={i} type={insight.type} title={insight.title} body={insight.body} />
))}
```

---

## 10. HIGH: fetchNotifications() always uses demo data

**File**: `src/stores/notificationStore.ts:208-217`

**Current state**:
```typescript
fetchNotifications: async (userId: string) => {
  set({ isLoading: true });
  try {
    const demoNotifications = generateDemoNotifications(userId);
    set({ notifications: demoNotifications, isLoading: false });
  } catch {
    set({ isLoading: false });
  }
},
```

There's no `isDemoMode()` check. Even in live mode, it always returns the 8 hardcoded demo notifications.

**Why it matters**: Real notifications from Supabase are never loaded.

**How to fix**:
```typescript
fetchNotifications: async (userId: string) => {
  set({ isLoading: true });
  try {
    if (isDemoMode()) {
      const demoNotifications = generateDemoNotifications(userId);
      set({ notifications: demoNotifications, isLoading: false });
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    set({ notifications: (data ?? []) as Notification[], isLoading: false });
  } catch {
    set({ isLoading: false });
  }
},
```

This requires importing `supabase` and `isDemoMode` from `../lib/supabase`.

---

## 11. HIGH: historical_avg always null

**File**: `src/services/predictionService.ts:513`

**Current state**: In `buildEventCostBreakdowns()`, every breakdown is built with:
```typescript
historical_avg: null,
```

The `HiddenCostBreakdown` component (line 250) checks for `historical_avg != null` and renders a "Historical Avg" row, but it never appears.

**Why it matters**: Users miss the context of "You typically spend $X on events like this" which anchors the hidden cost prediction.

**How to fix**: Compute from transaction history.

```typescript
// In buildEventCostBreakdowns(), replace historical_avg: null with:
function getHistoricalAvg(
  prediction: SpendingPrediction,
  transactions: Transaction[],
): number | null {
  const category = prediction.predicted_category;
  const categoryTxns = transactions.filter(
    (t) => t.category === category && Math.abs(t.amount) > 0,
  );
  if (categoryTxns.length < 3) return null; // Not enough data
  const sum = categoryTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  return Math.round((sum / categoryTxns.length) * 100) / 100;
}

// Update buildEventCostBreakdowns signature to accept transactions:
export function buildEventCostBreakdowns(
  predictions: SpendingPrediction[],
  hiddenCosts: HiddenCost[],
  transactions: Transaction[] = [], // NEW param
): Record<string, EventCostBreakdown> {
  // ... existing code ...
  // Replace historical_avg: null with:
  historical_avg: getHistoricalAvg(pred, transactions),
}
```

Then update all callers of `buildEventCostBreakdowns()` to pass transactions.

---

## 12. HIGH: budgetPace fallback of $33

**File**: `app/(tabs)/insights.tsx:194`

**Current state**:
```typescript
const budgetPace = totalBudget > 0 ? Math.round(totalBudget / daysInMonth) : 33;
```

If `totalBudget` is 0 (no budgets loaded yet), it shows "$33/day" as the budget pace.

**Why it matters**: Shows a misleading number during loading/empty states.

**How to fix**:
```typescript
const budgetPace = totalBudget > 0 ? Math.round(totalBudget / daysInMonth) : 0;
```

And in the JSX (line 401), handle the zero case:
```typescript
<Text style={styles.velocityPace}>
  {budgetPace > 0 ? `budget pace: $${budgetPace}/day` : 'Set a budget to see pace'}
</Text>
```

---

## 13. MEDIUM: savingsRate * 500 bug (5x inflation)

**File**: `app/(tabs)/insights.tsx:145`

**Current state**:
```typescript
return Math.min(100, (saved / totalBudget) * 500);
```

The multiplier should be `100` (to convert ratio to percentage), not `500`. With `* 500`, a user who saved 20% of their budget gets a score of 100 instead of 20.

**Why it matters**: The "Savings Rate" breakdown bar in the Health Score section is always maxed out, inflating the overall health score.

**How to fix**:
```typescript
return Math.min(100, (saved / totalBudget) * 100);
```

---

## 14. MEDIUM: Income estimated as totalBudget * 1.3

**File**: `app/(tabs)/dashboard.tsx:127`

**Current state**:
```typescript
// TODO: use real income from user profile when available
const estimatedMonthlyIncome = totalBudget * 1.3;
```

Income is estimated as 130% of total budget, making the savings rate a derivative of budget rather than actual income.

**Why it matters**: Savings rate is meaningless — it's always ~23% (1 - 1/1.3) when spending equals budget.

**How to fix**:

**Short term**: Add an `income` field to the user profile.

```typescript
// In src/types/index.ts, add to Profile:
monthly_income: number | null;

// In dashboard.tsx:
const monthlyIncome = user?.monthly_income ?? null;
const savingsRate = useMemo(() => {
  if (!monthlyIncome || monthlyIncome <= 0) return null;
  return calculateSavingsRate(monthlyIncome, totalSpent);
}, [monthlyIncome, totalSpent]);
```

**If income is null**, show a prompt: "Set your income in Settings to see savings rate."

**Long term**: Allow income auto-detection from recurring deposits in transaction history.

---

## 15. MEDIUM: financial_health_score hardcoded to 72

**Files**:
- `src/services/gamificationService.ts:132` (demoProfile)
- `src/services/gamificationService.ts:957` (resetDemoState)
- `src/services/socialService.ts:36` (demo profile)

**Current state**: The demo profile's `financial_health_score` is always `72`, regardless of actual computed health scores.

**Why it matters**: If anything reads from the profile's health score instead of computing it live, it gets a stale value.

**How to fix**: Update the demo profile score when health score is computed.

```typescript
// In gamificationService.ts, add an export:
export function updateDemoHealthScore(score: number) {
  if (isDemoMode()) {
    demoProfile.financial_health_score = score;
  }
}

// Call from dashboard.tsx after computing healthScoreV2:
useEffect(() => {
  updateDemoHealthScore(healthScoreV2);
}, [healthScoreV2]);
```

Or better: stop reading `financial_health_score` from the profile and always compute it live from `calculateHealthScoreV2()`.

---

## 16. LOW: submitFeedback() only logs to console

**File**: `src/stores/predictionStore.ts:175-200`

**Current state**: The function updates local state optimistically but the Supabase persistence is commented out:
```typescript
// In a real implementation we would also persist the feedback to Supabase:
// supabase.from('prediction_feedback').insert({ ... })
console.log('[PredictionStore] Feedback submitted:', { ... });
```

**Why it matters**: Feedback is lost on app restart. The `prediction_feedback` table exists in the schema but is never written to.

**How to fix**:
```typescript
// After the optimistic state update, add:
if (!isDemoMode()) {
  supabase.from('prediction_feedback').insert({
    prediction_id: predictionId,
    user_id: userId,
    feedback_type: feedbackType,
    corrected_category: correctedCategory ?? null,
    corrected_amount: correctedAmount ?? null,
  }).then(({ error }) => {
    if (error) console.warn('[PredictionStore] Feedback persist failed:', error);
  });
}
```

---

## 17. LOW: Challenge progress not auto-tracked

**Current state**: Challenge progress is only updated via manual `updateChallengeProgress()` calls. No automatic tracking exists — e.g., the "No Eating Out Week" challenge doesn't automatically check if the user had dining transactions.

**Why it matters**: Users must manually report progress, which defeats the purpose of automatic financial tracking.

**How to fix**: Add a daily challenge progress evaluator.

```typescript
// New function in gamificationService.ts:
export async function evaluateChallengeProgress(
  userId: string,
  transactions: Transaction[],
): Promise<void> {
  const active = await getActiveChallenges(userId);

  for (const participation of active) {
    const challenge = participation.challenge;
    if (!challenge) continue;

    const goal = challenge.goal as Record<string, unknown>;
    const goalType = goal.goal_type as string;

    // Auto-evaluate based on goal_type
    switch (goalType) {
      case 'spending_limit': {
        const category = goal.category as string;
        const todayTxns = transactions.filter(t =>
          t.category === category && isToday(t.date)
        );
        const dailySpend = todayTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
        if (dailySpend === 0) {
          const days = ((participation.progress as any).days_completed ?? 0) + 1;
          await updateChallengeProgress(userId, challenge.id, { days_completed: days });
        }
        break;
      }
      // ... handle other goal types
    }
  }
}
```

Call this from the dashboard or daily check-in flow.

---

## 18. LOW: Demo leaderboard has only 3 entries

**File**: `src/services/gamificationService.ts:782-811`

**Current state**: The demo leaderboard returns exactly 3 entries (You, Alex, Jordan). This looks sparse.

**Why it matters**: Minor cosmetic issue — the leaderboard screen looks empty.

**How to fix**: Add 5-8 more demo entries with varied XP/levels.

```typescript
const entries: LeaderboardEntry[] = [
  { user_id: 'demo-user', display_name: 'You', avatar_url: null, xp: demoProfile.xp, level: demoProfile.level, rank: 1 },
  { user_id: 'demo-friend-1', display_name: 'Alex', avatar_url: null, xp: 120, level: 2, rank: 2 },
  { user_id: 'demo-friend-2', display_name: 'Jordan', avatar_url: null, xp: 80, level: 1, rank: 3 },
  { user_id: 'demo-friend-3', display_name: 'Sarah', avatar_url: null, xp: 310, level: 3, rank: 4 },
  { user_id: 'demo-friend-4', display_name: 'Mike', avatar_url: null, xp: 95, level: 1, rank: 5 },
  { user_id: 'demo-friend-5', display_name: 'Taylor', avatar_url: null, xp: 220, level: 2, rank: 6 },
  { user_id: 'demo-friend-6', display_name: 'Casey', avatar_url: null, xp: 175, level: 2, rank: 7 },
  { user_id: 'demo-friend-7', display_name: 'Riley', avatar_url: null, xp: 50, level: 1, rank: 8 },
];
```

---

## Summary

| # | Severity | Issue | Effort |
|---|----------|-------|--------|
| 1 | BLOCKING | trackAccuracy() never called | Small — 1 useEffect |
| 2 | BLOCKING | scheduleMorningBrief() on start | Small — 1 useEffect |
| 3 | BLOCKING | sendPreEventHiddenCostAlert() unwired | Medium — timer + event check |
| 4 | BLOCKING | 11+ badge conditions always false | Large — per-condition data pipeline |
| 5 | BLOCKING | UserStats missing fields | Medium — interface + populators |
| 6 | HIGH | CCI fallback 62 | Small — remove fallback |
| 7 | HIGH | Velocity fallback $42 | Small — remove fallback |
| 8 | HIGH | healthTrend hardcoded 79 | Medium — weekly score history |
| 9 | HIGH | Static AI insight cards | Medium — data-driven generator |
| 10 | HIGH | fetchNotifications demo-only | Small — add isDemoMode check |
| 11 | HIGH | historical_avg always null | Medium — compute from txns |
| 12 | HIGH | budgetPace fallback $33 | Small — change to 0 |
| 13 | MEDIUM | savingsRate * 500 | Small — change to * 100 |
| 14 | MEDIUM | Income = budget * 1.3 | Medium — add income field |
| 15 | MEDIUM | Health score hardcoded 72 | Small — compute live |
| 16 | LOW | submitFeedback console-only | Small — add Supabase insert |
| 17 | LOW | Challenge progress no auto-track | Large — goal evaluator |
| 18 | LOW | Leaderboard 3 entries | Small — add demo entries |

**Recommended fix order**: 13 (bug), 1, 2, 6, 7, 12 (all small), then 3, 10, 5, 15, then 8, 9, 11, 14, then 4, 16, 17, 18.
