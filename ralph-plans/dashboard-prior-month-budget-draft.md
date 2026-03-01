You are iterating on the FutureSpend React Native + Expo app to add month navigation to the dashboard, allowing users to view prior months' budget data. The app is at `/workspace/app`.

On every entry (cold start or re-entry), before making any changes:
1. Run `cd /workspace/app && npx tsc --noEmit` to verify the project compiles.
2. Run `git log --oneline -10` to see which phase commits already exist.
3. Check phase completion:
   - Phase 1 done if: `app/src/stores/dashboardMonthStore.ts` exists
   - Phase 2 done if: `app/src/stores/budgetStore.ts` contains "DEMO_BUDGET_VARIATIONS"
   - Phase 3 done if: `app/src/components/DashboardMonthSelector.tsx` exists
   - Phase 4a done if: `app/app/(tabs)/dashboard.tsx` imports "DashboardMonthSelector"
   - Phase 4b done if: `app/app/(tabs)/dashboard.tsx` contains "Month complete" or "monthComplete"
   - Phase 5 done if: git log shows commit matching "polish dashboard month navigation"
4. Skip all completed phases. Resume at the first incomplete phase.
5. Read the key files for the current phase to orient yourself before making changes.

## Requirements

1. Add left/right arrow navigation to the dashboard to switch between months (current month and 3 prior months)
2. The FULL dashboard updates when switching months: Hero Budget Card, Stats Row (SPENT/BUDGET/REMAINING), Category Circles, Health Score Ring, Key Metrics (Spending Velocity, Savings Rate, CCI Score), Rank Widget, DailyBriefCard and WrappedWidget (hidden for past months)
3. For past (completed) months: show the SpendingTrajectoryChart with a full completed line (pass `daysElapsed = totalDays`, `predicted = spent`), and replace the "N days left" badge with a "Month complete" indicator
4. Demo budget limits vary slightly by month to show budget evolution
5. Demo mode only — this is for a hackathon presentation
6. Demo transactions already span Dec 2025 – Feb 2026 in the loaded transaction data

## Architecture

**Approach: New Dashboard Month Store** — Create a dedicated Zustand store for dashboard month selection, a new MonthSelector component wired to it, parameterize the budget store for month-aware computation, and wire the dashboard to use selected-month data.

### Implementation Map

| File | Action | Complexity |
|------|--------|------------|
| `app/src/stores/dashboardMonthStore.ts` | CREATE — new Zustand store | Small (~45 lines) |
| `app/src/stores/budgetStore.ts` | MODIFY — parameterize `computeFromTransactions`, `fetchBudgets`, and `makeDefaultBudgets` with month; add `DEMO_BUDGET_VARIATIONS` | Medium |
| `app/src/components/DashboardMonthSelector.tsx` | CREATE — month selector component for dashboard | Small (~50 lines) |
| `app/app/(tabs)/dashboard.tsx` | MODIFY — wire month store, recompute all data per selected month, handle past-month display | Large |
| `app/src/components/RankWidget.tsx` | MODIFY — accept optional `monthLabel` prop | Small |

## Phases

### Phase 1: Create dashboardMonthStore

Create `/workspace/app/src/stores/dashboardMonthStore.ts` modeled on the existing `insightsMonthStore.ts` at `/workspace/app/src/stores/insightsMonthStore.ts`.

NOTE: `insightsMonthStore.goBack()` has NO lower bound — it decrements forever. Your new store MUST add bound-checking logic to `goBack()` that does not exist in the template. Similarly, `canGoBack`/`canGoForward` are new helpers that don't exist in the template — you are creating them fresh.

The store must have:
- `selectedMonth: { year: number; month: number }` initialized to current month (JS 0-indexed: January = 0)
- `goBack()` — decrements month, stops at current month minus 3 (must enforce this bound)
- `goForward()` — increments month, stops at current month (no future navigation — unlike insightsMonthStore which allows +3 forward)
- `resetToCurrent()` — resets to current month
- Export helper functions: `isCurrentMonth(selected)` and `getDisplayLabel(selected)` (same pattern as insightsMonthStore)
- Export a `canGoBack(selected)` helper that returns false when at the 3-month-back limit
- Export a `canGoForward(selected)` helper that returns false when at current month

Verify: `cd /workspace/app && npx tsc --noEmit` passes.

Git: Commit with message "feat: add dashboardMonthStore for month navigation"

### Phase 2: Parameterize budgetStore for month-aware computation

Modify `/workspace/app/src/stores/budgetStore.ts`:

1. **Add `DEMO_BUDGET_VARIATIONS`** constant after `DEFAULT_BUDGETS` (around line 42). This maps month keys to per-category limit overrides:
   ```typescript
   const DEMO_BUDGET_VARIATIONS: Record<string, Partial<Record<EventCategory, number>>> = {
     '2025-12': { dining: 350, groceries: 420, entertainment: 250, shopping: 300 },
     '2026-01': { dining: 280, groceries: 380, transport: 160, entertainment: 180, shopping: 230, health: 110 },
     // '2026-02' and current month fall through to DEFAULT_BUDGETS
   };
   ```
   IMPORTANT: The month key format is `"YYYY-MM"` with 1-indexed, zero-padded months (January = "01"). But `selectedMonth.month` from the Zustand store is JS 0-indexed (January = 0). When constructing the lookup key, you MUST convert: `` `${year}-${String(month + 1).padStart(2, '0')}` ``.

2. **Parameterize `makeDefaultBudgets`** — add optional `month?: { year: number; month: number }` parameter. When provided, use that month for `periodStart`/`periodEnd` and look up `DEMO_BUDGET_VARIATIONS` for limit overrides (falling through to DEFAULT_BUDGETS for unlisted categories). When not provided, use current month (preserving backward compatibility).

3. **Update the `BudgetState` interface** (around line 12-31) — you MUST update BOTH the interface declaration AND the implementation. Add optional `month` parameter to BOTH:
   - Interface: `computeFromTransactions: (transactions: Transaction[], predictions?: ..., month?: { year: number; month: number }) => void;`
   - Interface: `fetchBudgets: (userId: string, month?: { year: number; month: number }) => Promise<void>;`

4. **Parameterize `computeFromTransactions`** (implementation around line 205) — add optional `month?: { year: number; month: number }` parameter. When provided:
   - Compute `monthStart` as `new Date(month.year, month.month, 1)` instead of `new Date()`
   - Compute `monthEnd` as `new Date(month.year, month.month + 1, 0)` (last day of month)
   - Filter transactions to `>= monthStart` AND `<= monthEnd` (both bounds, unlike current which only uses `>= monthStart`)
   When not provided, use current behavior (backward compatible).

5. **Parameterize `fetchBudgets`** (implementation around line 106) — add optional `month?: { year: number; month: number }` parameter. In the demo-mode branch, pass `month` through to `makeDefaultBudgets(userId, month)`. This is critical: `makeDefaultBudgets` is called INSIDE `fetchBudgets`, so if `fetchBudgets` doesn't pass the month, the per-month budget limit variations will never take effect.

IMPORTANT: `login.tsx` at `/workspace/app/app/(auth)/login.tsx` also calls `computeFromTransactions` and `fetchBudgets`. All parameter changes MUST remain backward-compatible (optional with defaults) to avoid breaking login.

Verify: `cd /workspace/app && npx tsc --noEmit` passes.

Git: Commit with message "feat: parameterize budgetStore for month-aware computation"

### Phase 3: Create DashboardMonthSelector component

Create `/workspace/app/src/components/DashboardMonthSelector.tsx` modeled on the existing `MonthSelector` at `/workspace/app/src/components/insights/MonthSelector.tsx`.

The component must:
- Import from `../../stores/dashboardMonthStore` (NOT `insightsMonthStore`)
- Use `useDashboardMonthStore` for `selectedMonth`, `goBack`, `goForward`, `resetToCurrent`
- Use `canGoBack()` and `canGoForward()` from dashboardMonthStore to disable arrows at bounds
- Use the same visual pattern: back chevron, animated month label (Reanimated FadeIn/FadeOut), forward chevron
- Show "Tap to reset" hint when not on current month (same pattern as MonthSelector)
- Use styling constants: `Colors`, `Typography`, `Spacing` from `../../constants`
- Match the existing MonthSelector's styling patterns (same font sizes, chevron sizes, padding)

Verify: `cd /workspace/app && npx tsc --noEmit` passes.

Git: Commit with message "feat: add DashboardMonthSelector component"

### Phase 4a: Wire dashboard month navigation — core data flow

Modify `/workspace/app/app/(tabs)/dashboard.tsx`:

1. **Import new modules**:
   - `import { DashboardMonthSelector } from '../../src/components/DashboardMonthSelector';`
   - `import { useDashboardMonthStore, isCurrentMonth as isDashboardCurrentMonth, getDisplayLabel as getDashboardMonthLabel } from '../../src/stores/dashboardMonthStore';`

2. **Add month state subscription** near other store subscriptions (around line 67-79):
   ```typescript
   const selectedMonth = useDashboardMonthStore((s) => s.selectedMonth);
   const isCurrentMonthSelected = isDashboardCurrentMonth(selectedMonth);
   ```

3. **Re-trigger fetchBudgets when month changes**: Add a `useEffect` that calls `fetchBudgets(userId, selectedMonth)` when `selectedMonth` changes. This ensures demo budget limits reflect the selected month.

4. **Re-trigger computeFromTransactions when month changes**: Modify the existing `useEffect` that calls `computeFromTransactions` (around line 102-108) to include `selectedMonth` in its dependency array, passing the selected month as the third argument. The existing code passes `predictions.map((p) => ({ category: p.predicted_category, predicted_amount: p.predicted_amount }))` as the second argument — keep that, and add `selectedMonth` as the third:
   ```typescript
   computeFromTransactions(
     transactions,
     predictions.map((p) => ({
       category: p.predicted_category,
       predicted_amount: p.predicted_amount,
     })),
     selectedMonth,
   );
   ```
   IMPORTANT: When adding `selectedMonth` to the useEffect dependency array, do NOT also add store functions like `fetchBudgets` or `computeFromTransactions` — these are stable Zustand references and adding them can cause infinite re-render loops. If ESLint warns about missing deps, suppress with `// eslint-disable-next-line react-hooks/exhaustive-deps`.

5. **Replace hardcoded date math** (currently around lines 199-201):
   ```typescript
   const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
   const dayOfMonth = isCurrentMonthSelected ? new Date().getDate() : daysInMonth;
   ```

6. **Restructure the top of the ScrollView JSX** — apply BOTH the conditional hiding and the month selector insertion. The final JSX order must be:
   ```tsx
   {/* DailyBrief + Wrapped: only for current month */}
   {isCurrentMonthSelected && (
     <>
       <Animated.View entering={FadeIn.delay(0)}>
         <DailyBriefCard />
       </Animated.View>
       <Animated.View entering={FadeIn.delay(80)}>
         <WrappedWidget />
       </Animated.View>
     </>
   )}

   {/* Month Navigation — always visible */}
   <Animated.View entering={FadeIn.delay(120)}>
     <DashboardMonthSelector />
   </Animated.View>

   {/* Hero Budget Card */}
   <Animated.View entering={FadeIn.delay(160)}>
     ...existing Hero Budget Card...
   </Animated.View>
   ```
   This means: DailyBriefCard and WrappedWidget are conditionally rendered above the month selector, the month selector is always visible, and the Hero Budget Card follows below.

Verify: `cd /workspace/app && npx tsc --noEmit` passes.

Git: Commit with message "feat: wire dashboard month navigation core data flow"

### Phase 4b: Adapt dashboard sections for past-month display

BEFORE STARTING: Re-read `/workspace/app/app/(tabs)/dashboard.tsx` in full to pick up all changes from Phase 4a.

Continue modifying `/workspace/app/app/(tabs)/dashboard.tsx`:

1. **Adapt Hero Budget Card for past months**:
   - When `!isCurrentMonthSelected`: replace the "days left" badge (`daysRemainingBadge`) with a "Month complete" badge (checkmark icon + "Complete" text, styled with `Colors.positive`)
   - SpendingTrajectoryChart: when past month, pass `daysElapsed={daysInMonth}` and `predicted={totalSpent}` so it draws a full completed line with no projection

2. **Adapt Key Metrics for selected month** — REPLACE the existing `useMemo` blocks (do NOT add duplicates):

   **Replace the existing `spendingVelocity` useMemo** (currently around line 214-217) with a month-aware version:
     ```typescript
     const spendingVelocity = useMemo(() => {
       if (isCurrentMonthSelected) {
         return calculateSpendingVelocity(transactions);
       }
       // Past month: average daily spend
       return daysInMonth > 0 ? totalSpent / daysInMonth : 0;
     }, [transactions, isCurrentMonthSelected, totalSpent, daysInMonth]);
     ```
   IMPORTANT: `calculateSpendingVelocity` is imported from `transactionStore` (returns `number`). There is a DIFFERENT `calculateSpendingVelocity` in `budgetStore.ts` that returns `{ daily, budgetPace, ratio }`. Do NOT change the import source. Do NOT import from budgetStore.

   **Replace the existing `velocityTrend` useMemo** (currently around line 219-222) with:
     ```typescript
     const velocityTrend = useMemo(() => {
       if (isCurrentMonthSelected) {
         return calculateVelocityTrend(transactions);
       }
       return 0; // Past month: no week-over-week trend
     }, [transactions, isCurrentMonthSelected]);
     ```

   **Replace the existing `cciScore` useMemo** (currently around line 230-233) with:
     ```typescript
     const cciScore = useMemo(() => {
       if (isCurrentMonthSelected) {
         return calculateCCI(predictions);
       }
       return 0; // Past month: predictions are forward-looking, CCI not meaningful
     }, [predictions, isCurrentMonthSelected]);
     ```
   IMPORTANT: `calculateCCI` is imported from `predictionStore` (takes only `predictions`, returns `number`). There is a DIFFERENT `calculateCCI` in `budgetStore.ts` that takes `(predictions, transactions)` and returns `{ score, label, perCategory }`. Do NOT change the import source.

   NOTE: Setting `cciScore = 0` for past months means `healthScoreV2` will also receive 0 for its CCI component. This is expected and acceptable for a demo — the health score will still compute from the other 4 components.

   **Replace the existing `spendingStability` useMemo** (currently around line 240-243) with:
     ```typescript
     const spendingStability = useMemo(() => {
       const refDate = isCurrentMonthSelected
         ? undefined
         : new Date(selectedMonth.year, selectedMonth.month + 1, 0); // end of selected month
       return calculateSpendingStability(transactions, refDate);
     }, [transactions, isCurrentMonthSelected, selectedMonth]);
     ```
   `calculateSpendingStability` in budgetStore.ts already accepts an optional `referenceDate?: Date` parameter.

   **`savingsRate`**: uses `totalSpent` which now comes from month-aware budget store — works automatically, no change needed.

3. **Adapt RankWidget**: Pass `monthLabel` prop when viewing a past month:
   ```tsx
   <RankWidget monthLabel={isCurrentMonthSelected ? undefined : getDashboardMonthLabel(selectedMonth)} />
   ```

4. **Modify RankWidget** (`/workspace/app/src/components/RankWidget.tsx`): Add optional `monthLabel?: string` to the `RankWidgetProps` interface. Replace the hardcoded "this month" text on line 28 with: `{monthLabel ? `in ${monthLabel}` : 'this month'}`.

Verify: `cd /workspace/app && npx tsc --noEmit` passes.

Git: Commit with message "feat: adapt dashboard sections for past-month display"

### Phase 5: Polish and final verification

1. Read through dashboard.tsx end-to-end and verify all sections respond to month changes
2. Verify that `fetchBudgets` is called with `selectedMonth` when the month changes
3. Verify that for past months:
   - Hero card shows "Month complete" or "Complete" instead of "N days left"
   - SpendingTrajectoryChart receives full-month `daysElapsed` value
   - Stats row shows correct SPENT/BUDGET/REMAINING for that month
   - Category circles show correct per-category data
   - DailyBriefCard and WrappedWidget are hidden
   - Spending velocity is computed inline (not calling the transactionStore function)
4. Verify `calculateSpendingStability` is called with a `referenceDate` parameter for past months (end of selected month)
5. Verify no imports were changed from their original source stores (calculateCCI from predictionStore, calculateSpendingVelocity from transactionStore)
6. Verify current month still works exactly as before (regression check)
7. Run `cd /workspace/app && npx tsc --noEmit` — must produce 0 errors

Git: Commit with message "feat: polish dashboard month navigation"

## Scope Constraints

### Files you MAY modify:
- `app/src/stores/budgetStore.ts`
- `app/app/(tabs)/dashboard.tsx`
- `app/src/components/RankWidget.tsx`

### Files you MAY create:
- `app/src/stores/dashboardMonthStore.ts`
- `app/src/components/DashboardMonthSelector.tsx`

### Files you must NOT modify:
- `app/src/stores/insightsMonthStore.ts` — belongs to the Insights tab
- `app/src/components/insights/MonthSelector.tsx` — belongs to the Insights tab
- `app/src/stores/transactionStore.ts` — off-limits
- `app/src/stores/predictionStore.ts` — off-limits
- `app/src/stores/gamificationStore.ts` — off-limits
- `app/src/stores/socialStore.ts` — off-limits
- `app/src/services/*` — no service changes needed
- `app/src/types/index.ts` — no type changes needed
- `app/app/(tabs)/_layout.tsx` — tab layout configuration
- `package.json`, `tsconfig.json`, `app.json` — no config changes
- Any test files

## Rules

1. All changes must pass `cd /workspace/app && npx tsc --noEmit` with 0 errors
2. Use Zustand patterns consistent with existing stores (see `insightsMonthStore.ts` and `budgetStore.ts`)
3. Use styling constants from `app/src/constants` (Colors, Typography, Spacing) — never hardcode colors or font sizes
4. Use Reanimated for animations (FadeIn/FadeOut) — consistent with existing MonthSelector
5. All new parameters must be optional to maintain backward compatibility — `login.tsx` and other existing callers must not break
6. Do NOT modify the insightsMonthStore or Insights MonthSelector
7. Git: Commit after each phase with a descriptive message. Do NOT push to remote.
8. Keep dashboard.tsx changes minimal — prefer computing derived values via `useMemo` over adding new state
9. Demo budget variations should feel realistic — slight differences per month, not identical limits
10. CRITICAL: When modifying `computeFromTransactions` or `fetchBudgets` signatures, you MUST update BOTH the `BudgetState` interface declaration AND the implementation. TypeScript will reject a mismatch.
11. The `calculateSpendingVelocity()` and `calculateVelocityTrend()` functions in transactionStore.ts use hardcoded `new Date()` internally. For past months, compute velocity manually (totalSpent / daysInMonth). Do NOT call these functions for past months — they will return zero.
12. The `calculateCCI` imported from predictionStore takes only `(predictions: SpendingPrediction[])` — it does NOT accept transactions. For past months, set CCI to 0 rather than trying to make it month-aware.
13. DEMO_BUDGET_VARIATIONS keys use 1-indexed months ("2025-12", "2026-01") but `selectedMonth.month` is JS 0-indexed (January = 0). Convert with: `` `${year}-${String(month + 1).padStart(2, '0')}` ``
14. Do NOT rewrite entire files from scratch. Make targeted, surgical edits to existing files.
15. Do NOT delete existing tests or test assertions.
16. Do NOT install or remove any npm dependencies.
17. Do NOT change import sources for `calculateCCI`, `calculateSpendingVelocity`, or `calculateVelocityTrend`. These are imported from specific stores (`predictionStore`, `transactionStore` respectively) and must stay that way. There are DIFFERENT functions with the same names in `budgetStore.ts` — ignore those. Compute alternative values inline for past months.
18. When adding `selectedMonth` to useEffect dependency arrays, do NOT add Zustand store functions (`fetchBudgets`, `computeFromTransactions`) to the same dependency array. These are stable references; adding them risks infinite re-render loops. Suppress ESLint exhaustive-deps warnings with `// eslint-disable-next-line react-hooks/exhaustive-deps` if needed.

## Existing Functions to Reuse

- `insightsMonthStore.ts` — pattern template for `dashboardMonthStore` (adapt bounds, don't copy directly)
- `MonthSelector.tsx` — visual template for `DashboardMonthSelector` (swap store import)
- `computeFromTransactions()` in budgetStore.ts:205-253 — extend with month parameter (find the function by searching for `computeFromTransactions:`)
- `makeDefaultBudgets()` in budgetStore.ts:44-62 — extend with month parameter
- `fetchBudgets()` in budgetStore.ts:106-139 — extend with month parameter
- `calculateSavingsRate()` from financialCalcs.ts — works with month-aware totalSpent
- `calculateHealthScoreV2()`, `calculateBudgetAdherenceMVP()` from budgetStore — works with month-aware totals
- `calculateSpendingStability()` from budgetStore — accepts `referenceDate` param, pass end-of-selected-month

## Stuck-State Handling

### General Rules
- Before attempting any fix, ALWAYS read the full error message and identify the exact file and line number. Quote the error in your reasoning.
- If you have attempted the same approach 3 times without progress, STOP and try a fundamentally different approach. Do not retry the same fix with minor variations.
- If you find yourself oscillating between two states (applying a change, then reverting it, then applying it again), stop and analyze why both states fail. The root cause is likely something else entirely.
- Do NOT rewrite files from scratch. Make targeted, incremental edits. If a file has grown confusing, re-read it fully before making the next change.
- Do NOT add complexity to work around a type error. Fix the type error at its source (usually a missing interface update or wrong import).

### Task-Specific Tips
- If TypeScript compilation fails after a phase, read the error messages carefully. Most likely causes: missing imports, wrong type signatures, or the BudgetState interface not matching the implementation.
- When fixing type errors, always update both the interface declaration AND the implementation in the same edit.
- If `computeFromTransactions` doesn't update when month changes, check that `selectedMonth` is in the `useEffect` dependency array and that the month parameter is being passed correctly.
- If budget limit variations don't appear, verify: (1) `fetchBudgets` passes month to `makeDefaultBudgets`, (2) the DEMO_BUDGET_VARIATIONS key format uses 0-to-1-indexed conversion, (3) the `useEffect` calling `fetchBudgets` includes `selectedMonth` in its deps.
- If the chart still shows projections for past months, verify the `isCurrentMonthSelected` check controls which props are passed to `SpendingTrajectoryChart`.
- IMPORT SOURCES: The codebase has MULTIPLE functions with the same name in different stores. Dashboard imports `calculateCCI` from `predictionStore` (returns `number`), NOT from `budgetStore` (which returns `{ score, label, perCategory }`). Similarly, `calculateSpendingVelocity` is imported from `transactionStore` (returns `number`), NOT from `budgetStore` (which returns `{ daily, budgetPace, ratio }`). Do NOT change these import sources.
- USEEFFECT DEPENDENCY ARRAYS: When adding `selectedMonth` to useEffect dependency arrays, do NOT also add store functions like `fetchBudgets` or `computeFromTransactions`. These are stable Zustand references and adding them causes infinite re-render loops. If ESLint warns, suppress with `// eslint-disable-next-line react-hooks/exhaustive-deps`.
- Phase 4a/4b are the largest phases. If you have completed the core data flow (4a) but are struggling with display adaptations (4b steps 2-3), commit what works and move to Phase 5. The core deliverable is month navigation + budget data switching.

### Blocked Escape Hatch
If unable to make progress on ANY phase after 5 consecutive failed attempts, document exactly what is failing (error messages, file paths, line numbers) and move to the next phase. If all remaining phases are blocked, stop and report the blockers.

Do NOT output the promise tag until you have verified every condition below by running commands (tsc, grep, or git diff). Do not rely on your memory of what you wrote — verify each condition against the actual files on disk. If ANY single condition fails verification, do NOT output the promise tag. Fix the issue first and re-verify ALL conditions.

<promise>
All of the following conditions are met:
1. `cd /workspace/app && npx tsc --noEmit` exits with code 0 (zero TypeScript errors)
2. File `app/src/stores/dashboardMonthStore.ts` exists and exports: `useDashboardMonthStore`, `isCurrentMonth`, `getDisplayLabel`, `canGoBack`, `canGoForward`
3. `dashboardMonthStore.ts` exports `canGoBack` and its implementation (or the `goBack` function) contains numeric comparison logic that enforces a lower bound 3 months before the current month (grep for a pattern involving subtraction or comparison against a 3-month limit)
4. File `app/src/components/DashboardMonthSelector.tsx` exists, exports a React component, and imports from `dashboardMonthStore`
5. `budgetStore.ts` `computeFromTransactions` signature includes an optional `month` parameter in BOTH the BudgetState interface AND the implementation
6. `budgetStore.ts` `fetchBudgets` signature includes an optional `month` parameter and passes it to `makeDefaultBudgets`
7. `budgetStore.ts` contains a `DEMO_BUDGET_VARIATIONS` object with at least 2 month keys
8. `dashboard.tsx` contains `<DashboardMonthSelector` in its JSX
9. `dashboard.tsx` has a `useEffect` that includes `selectedMonth` in its dependency array
10. `dashboard.tsx` contains a conditional check on `isCurrentMonthSelected` (or equivalent) that renders text containing "Complete" or "Month complete" for past months
11. `dashboard.tsx` passes `daysElapsed={daysInMonth}` (or equivalent full-month value) to `SpendingTrajectoryChart` when viewing a past month
12. `dashboard.tsx` computes spending velocity inline for past months (contains `isCurrentMonthSelected` near `spendingVelocity` — does NOT call calculateSpendingVelocity for past months)
13. `RankWidget.tsx` accepts a `monthLabel` prop (the props interface or destructuring contains `monthLabel`)
14. `dashboard.tsx` hides DailyBriefCard and/or WrappedWidget when viewing past months (conditional rendering based on isCurrentMonthSelected)
15. `git diff HEAD -- app/src/stores/insightsMonthStore.ts app/src/components/insights/MonthSelector.tsx` produces empty output (no modifications to insight files)
16. `dashboard.tsx` sets `cciScore` to 0 for past months (grep for `isCurrentMonthSelected` near `cciScore` or `calculateCCI`)
17. `dashboard.tsx` sets `velocityTrend` to 0 for past months (grep for `velocityTrend` near `isCurrentMonthSelected`)
18. `dashboard.tsx` passes a `referenceDate` to `calculateSpendingStability` for past months (grep for `referenceDate` or `refDate` in dashboard.tsx near `spendingStability`)
</promise>
