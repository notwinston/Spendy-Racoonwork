You are iterating on the FutureSpend React Native (Expo) app to add the DailyBriefCard component, extend the Health Score to v2, and add new financial metrics to the Insights screen. This is Wave 2 (P1) of a 4-wave feature implementation. Wave 1 has already been completed — hidden cost types, prediction service, mock adapter, predictionStore extensions, HiddenCostBreakdown component, and calendar/plan integration are all in place.

Cold start: First, check if work has already begun by running `cd /workspace/app && git log --oneline -20`. If commits exist with messages matching this wave's phases, determine which phases are complete:
- Phase 1 done: `test -f /workspace/app/src/components/DailyBriefCard.tsx && echo "PHASE1_DONE"`
- Phase 2 done: `grep -q 'DailyBriefCard' /workspace/app/app/(tabs)/dashboard.tsx && echo "PHASE2_DONE"`
- Phase 3 done: `grep -q 'calculateCCI' /workspace/app/src/stores/budgetStore.ts && echo "PHASE3_DONE"`
- Phase 4 done: `grep -q 'Spending Velocity' /workspace/app/app/(tabs)/insights.tsx && echo "PHASE4_DONE"`

Skip any phase that prints DONE. Resume from the first incomplete phase.

Before starting any phase, verify Wave 1 artifacts exist:
- `grep -q 'HiddenCostTier' /workspace/app/src/types/index.ts && echo "WAVE1_TYPES_OK"`
- `grep -q 'predictHiddenCosts' /workspace/app/src/services/predictionService.ts && echo "WAVE1_SERVICE_OK"`
- `grep -q 'analyzeHiddenCosts' /workspace/app/src/stores/predictionStore.ts && echo "WAVE1_STORE_OK"`
- `test -f /workspace/app/src/components/HiddenCostBreakdown.tsx && echo "WAVE1_COMPONENT_OK"`

If ANY of these checks fail, stop and report: "BLOCKED: Wave 1 artifacts missing. Run Wave 1 first."

If no prior work exists, start from Phase 1. Read `/workspace/Segmentation_RBC_People.md` sections 4.1 (Morning Daily Brief), 6 (Metrics & Scoring System) for the spec. Then read `/workspace/app/src/stores/predictionStore.ts` to see the hiddenCosts, eventCostBreakdowns, and dailyBrief state from Wave 1. Read `/workspace/app/src/stores/budgetStore.ts` to understand the existing `calculateHealthScore()` function (search for `calculateHealthScore`). Read `/workspace/app/app/(tabs)/dashboard.tsx` to see the current layout. Read `/workspace/app/app/(tabs)/insights.tsx` for the current metrics display. Verify the app compiles with `cd /workspace/app && npx tsc --noEmit` before making any changes. If the app does NOT compile before your changes, stop and report: "BLOCKED: Pre-existing compilation failure. Cannot proceed."

## Subagent Instructions

You MAY use subagents (via the Task tool) for specific phases where parallel work is beneficial. Subagent guardrails:
- Subagents MUST NOT modify the same file simultaneously
- Subagents MUST complete and their changes verified BEFORE the next phase begins
- If a subagent fails or produces incorrect output, complete the work yourself

## Requirements

1. **DailyBriefCard component** — morning spending forecast card showing today's events with predicted + hidden costs, top warning, savings tip
2. **Dashboard integration** — DailyBriefCard inserted at the top of the dashboard ScrollView (before the hero budget card)
3. **Health Score v2** — extend calculateHealthScore() with CCI and HiddenCostAwareness factors. HiddenCostAwareness is calculated as: `(dismissed_count + viewed_count) / total_hidden_costs` where dismissed_count = hidden costs the user dismissed, viewed_count = hidden costs in expanded breakdowns, total_hidden_costs = all non-zero hidden costs. If total is 0, hiddenCostAwareness = 1.0 (no hidden costs = fully aware). This value ranges 0-1 and is passed directly to calculateHealthScore().
4. **New metrics** — CCI (Calendar Correlation Index), Spending Velocity, Surprise Spend Ratio, Event Cost Variance added to the Insights screen

## Phases

### Phase 1: Build DailyBriefCard component
1. Create `/workspace/app/src/components/DailyBriefCard.tsx`:
   - Import `Colors, Typography, Spacing` from constants, `Card` from `./ui/Card`, `Ionicons` from `@expo/vector-icons`
   - Import `HiddenCostBreakdown` from `./HiddenCostBreakdown`
   - Import `usePredictionStore` to get `dailyBrief` and `eventCostBreakdowns`
   - Named export: `export function DailyBriefCard()`
   - Layout:
     a. Header row: sun icon + "Today's Spending Forecast" + date
     b. Summary: "N events · Estimated $X - $Y"
     c. Warning row (if top_warning): warning icon + warning text (amber color)
     d. Tip row (if savings_opportunity): lightbulb icon + tip text (green color)
     e. For each event in today's daily brief, show a compact event row with:
        - Category icon + event title + time
        - Base cost + hidden cost total
        - `<HiddenCostBreakdown compact={true} />` inline
     f. "View Full Breakdown" link at bottom (navigates to Calendar tab with today selected)
   - Style: Dark theme, Card wrapper, consistent with existing dashboard cards
   - If `dailyBrief` is null or has no events, render nothing (return null)

Verify: `cd /workspace/app && npx tsc --noEmit` compiles.
Git: Commit with message "feat(ui): add DailyBriefCard component"

### Phase 2: Integrate DailyBriefCard into dashboard
1. In `/workspace/app/app/(tabs)/dashboard.tsx`:
   - Import `DailyBriefCard` from `../../src/components/DailyBriefCard`
   - Import `usePredictionStore` to access `generateDailyBrief`
   - Add a `useEffect` that calls `generateDailyBrief({ events, transactions, budgets })` when the screen loads and predictions + hiddenCosts are available. Use calendarStore events, transactionStore transactions, and budgetStore budgets.
   - Insert `<DailyBriefCard />` immediately after `<ScrollView>` opens and BEFORE the Hero Budget Card comment (around line 115)
   - Import `useCalendarStore` if not already imported

Verify: `cd /workspace/app && npx tsc --noEmit` compiles. Test in Expo Go: open Dashboard tab, verify DailyBriefCard appears at top with today's events and hidden cost summaries.
Git: Commit with message "feat(dashboard): integrate DailyBriefCard"

### Phase 3: Add metric calculator functions and extend Health Score v2
1. In `/workspace/app/src/stores/budgetStore.ts`:
   - Add new exported pure functions AFTER the existing `getHealthGrade()` function:
     - `calculateCCI(predictions: SpendingPrediction[], transactions: Transaction[]): { score: number; label: string; perCategory: Record<string, number> }` — matches predictions to transactions by category + date window (same day ± 1 day). Note: Transaction does NOT have a calendar_event_id field, so match by category and date proximity. Computes accuracy_weight = 1 - |predicted - actual| / max(predicted, actual), returns overall CCI 0-100. If no predictions or transactions, return { score: 0, label: 'No data', perCategory: {} }.
     - `calculateSpendingVelocity(transactions: Transaction[]): { daily: number; budgetPace: number; ratio: number }` — last 7 days spending / 7, compared to totalBudget / daysInMonth
     - `calculateSurpriseSpendRatio(transactions: Transaction[], predictions: SpendingPrediction[], recurringTransactions: RecurringTransaction[]): number` — (total - predicted - recurring) / total, returns 0-1 (lower is better)
     - `calculateEventCostVariance(transactions: Transaction[], predictions: SpendingPrediction[]): Record<string, { mean: number; stddev: number; cv: number; rating: 'low' | 'medium' | 'high' }>` — per-category coefficient of variation. Rating: cv < 0.2 = low (green), 0.2-0.5 = medium (yellow), > 0.5 = high (red)
   - Extend `calculateHealthScore()` signature to accept 2 additional OPTIONAL parameters:
     `calculateHealthScore(burnRate, budgetAdherence, streakDays, savingsRate, cciScore?: number, hiddenCostAwareness?: number): number`
     - If cciScore and hiddenCostAwareness are provided, use the v2 formula:
       `0.25 * burnScore + 0.20 * adherenceScore + 0.20 * cciScore + 0.15 * savingsScore + 0.10 * streakScore + 0.10 * hiddenCostAwareness`
     - If not provided (undefined), use the existing v1 formula (backwards compatible)
   - Update the dashboard and insights screens to pass the new optional params when CCI data is available

Verify: `cd /workspace/app && npx tsc --noEmit` compiles. The existing health score calls in dashboard.tsx and insights.tsx still work (backwards compatible).
Git: Commit with message "feat(metrics): add CCI, velocity, surprise ratio, variance calculators and Health Score v2"

### Phase 4: Add new metric sections to Insights screen
1. In `/workspace/app/app/(tabs)/insights.tsx`:
   - Import the new calculator functions from budgetStore
   - Import `usePredictionStore` to access predictions and hiddenCosts
   - Import `useCalendarStore` if not already imported
   - Compute the new metrics via `useMemo`:
     - `cci` via `calculateCCI(predictions, transactions)`
     - `velocity` via `calculateSpendingVelocity(transactions)`
     - `surpriseRatio` via `calculateSurpriseSpendRatio(transactions, predictions, recurringTransactions)`
     - `costVariance` via `calculateEventCostVariance(transactions, predictions)`
   - Update the health score computation to use v2 (pass cci.score/100 and a hiddenCostAwareness value)
   - Update the Score Breakdown section to show 6 bars instead of 4 (add CCI and Hidden Cost Awareness)
   - After the Score Breakdown card (around line 214), add 4 new metric cards:
     a. **Calendar Correlation Index**: Score badge (0-100), color-coded (green >70, yellow 40-70, red <40). Per-category breakdown bars if available.
     b. **Spending Velocity**: Daily rate number, comparison to budget pace. Arrow up/down indicator. Color: green if ratio < 1, yellow if 1-1.2, red if > 1.2.
     c. **Surprise Spend Ratio**: Percentage with progress ring. Lower = better. Color inverted (green if < 20%, yellow 20-50%, red > 50%).
     d. **Event Cost Variance**: Per-category list with traffic light dots. Green (cv<0.2, "Very predictable"), Yellow (0.2-0.5, "Variable"), Red (>0.5, "Unpredictable").
   - Each metric card should use the `Card` component, consistent with existing sections

Verify: `cd /workspace/app && npx tsc --noEmit` compiles. Test in Expo Go: open Insights tab, scroll to see new metric sections. Verify all 4 new metrics render with data from demo mode.
Git: Commit with message "feat(insights): add CCI, spending velocity, surprise ratio, event cost variance sections"

## Scope Constraints

### Files you MUST modify:
- `/workspace/app/app/(tabs)/dashboard.tsx`
- `/workspace/app/src/stores/budgetStore.ts`
- `/workspace/app/app/(tabs)/insights.tsx`

### Files you MUST create:
- `/workspace/app/src/components/DailyBriefCard.tsx`

### Files you MUST NOT modify:
- `/workspace/app/src/types/index.ts` (Wave 1 already added all needed types)
- `/workspace/app/src/services/predictionService.ts` (Wave 1 scope)
- `/workspace/app/src/services/llm/mock.ts` (Wave 1 scope)
- `/workspace/app/src/stores/predictionStore.ts` (Wave 1 already extended)
- `/workspace/app/src/components/HiddenCostBreakdown.tsx` (Wave 1 created)
- `/workspace/app/app/(tabs)/calendar.tsx` (Wave 1 scope)
- `/workspace/app/app/(tabs)/plan.tsx` (Wave 1 scope)
- `/workspace/app/src/stores/notificationStore.ts` (Wave 3 scope)
- `/workspace/app/src/services/gamificationService.ts` (Wave 3 scope)
- Any file under `/workspace/supabase/` (Wave 3 scope)
- Any `.env` file or file containing API keys/secrets

Any file not listed in "MUST modify" or "MUST create" above should NOT be modified unless absolutely necessary for compilation. If you must modify an unlisted file, add a comment explaining why.

## Rules

1. Follow ALL existing codebase conventions: named function exports, StyleSheet.create(), Colors/Typography/Spacing constants, Ionicons, Card component.
2. `calculateHealthScore()` MUST remain backwards compatible — existing calls without the new params must produce the same result as before.
3. All new metric functions must be pure functions (no side effects, no store access inside them).
4. The DailyBriefCard must use the existing `HiddenCostBreakdown` component with `compact={true}` for event rows.
5. Git: Commit after each phase. Do NOT push to remote.
6. Verify TypeScript compilation after EVERY phase.
7. Metric calculations should handle edge cases: empty arrays (return 0 or default), division by zero (guard with checks).
8. Do NOT rewrite entire files from scratch. Make targeted edits: insert new code at specific locations, modify specific functions. Preserve existing code structure and formatting.
9. Search for insertion points by content (function names, text strings, keywords) — NOT by line numbers. Line numbers may have shifted from prior waves/phases.
10. If you encounter a situation where you cannot proceed (missing dependency, incompatible API, unresolvable type error after 2 attempts), report it as "BLOCKED: [reason]" and stop.
11. If `npx tsc --noEmit` returns the same error after 2 consecutive fix attempts, try a different fix strategy or skip with a TODO comment.
12. When importing `generateDailyBrief` from predictionStore, note that predictionService also exports a function of the same name. Use the store action (not the service function directly) from components.

## When Stuck

- If CCI calculation returns NaN: Check for division by zero when total_predicted_events is 0. Return 0 for empty input.
- If Health Score v2 gives unexpected results: Verify the optional params check. `cciScore !== undefined && hiddenCostAwareness !== undefined` should gate the v2 formula.
- If DailyBriefCard doesn't show: Check that `generateDailyBrief` was called in dashboard's useEffect and that `dailyBrief` in the store is populated.
- If you are stuck for more than 2 iterations on the same issue: Skip it, add a TODO comment, move to next phase.

<promise>
Wave 2 is complete when ALL of the following are true:
1. `cd /workspace/app && npx tsc --noEmit` compiles without errors
2. DailyBriefCard.tsx exists and renders today's events with hidden cost summaries
3. Dashboard shows DailyBriefCard above the hero budget card
4. calculateHealthScore() supports optional CCI and hiddenCostAwareness params (v2) while remaining backwards compatible
5. calculateCCI(), calculateSpendingVelocity(), calculateSurpriseSpendRatio(), calculateEventCostVariance() exist as pure functions in budgetStore.ts
6. Insights screen shows 4 new metric cards: CCI, Spending Velocity, Surprise Spend Ratio, Event Cost Variance
7. Score Breakdown in insights shows 6 factors instead of 4
8. App runs in Expo Go without crashes on Dashboard and Insights tabs
</promise>
