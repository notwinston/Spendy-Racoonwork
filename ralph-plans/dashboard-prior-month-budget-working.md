---
task_type: feature
workflow: feature-development
current_phase: F6
completed_phases: [F1, F2, F3, F4, F5]
context_pressure: moderate
context_budget:
  peak_iteration_tokens: 66980
  context_window: 200000
  pressure_pct: 33.5
  estimated_cost_range: "$2-5"
  file_count: 8
  file_categories:
    small: 8
    medium: 0
    large: 0
uat_fast_forward: false
session_name: dashboard-prior-month-budget
decomposed: false
---

## F1 Discovery Summary

**Task**: Add prior months' monthly budget view to the dashboard with arrow navigation.

**User requirements**:
- Show last 3 months of budget data
- Arrow navigation to switch between months
- Each month shows total budget vs actual spend PLUS per-category breakdown
- For demo mode (hackathon presentation)

## F2 Codebase Exploration Findings

### Dashboard Layout (`app/app/(tabs)/dashboard.tsx`, 677 lines)
- ScrollView with: DailyBriefCard → WrappedWidget → Hero Budget Card → Stats Row (SPENT/BUDGET/REMAINING) → Category Circles → Health Score → Key Metrics → Rank Widget
- Hero Budget Card shows `remainingDisplay` left of `totalBudget`, plus SpendingTrajectoryChart
- Stats row: 3 GlassCards for SPENT, BUDGET, REMAINING
- Category circles: top 6 categories in horizontal ScrollView with ProgressRing

### Budget Store (`app/src/stores/budgetStore.ts`)
- State: `totalBudget`, `totalSpent`, `totalPredicted`, `budgets: CategoryBudget[]`
- `CategoryBudget` extends `Budget` with `spent`, `predicted`, `remaining`, `percentUsed`
- `computeFromTransactions()` filters to CURRENT MONTH ONLY
- `fetchBudgets()` creates demo budgets for current month only
- DEFAULT_BUDGETS: 8 categories totaling $1,980/month

### Budget Types (`app/src/types/index.ts`)
- `Budget`: id, user_id, category, monthly_limit, period_start, period_end, created_at
- `BudgetSnapshot`: id, user_id, budget_id, date, spent_amount, predicted_remaining, burn_rate (DEFINED BUT NOT USED)

### Demo Transaction Data
- Sarah (212 txns) and Marcus (204 txns) spanning Dec 2025 - Feb 2026 (3 months)
- Loaded via `plaidService.ts`
- Sufficient for historical month analysis

### Existing Month Navigation
- `MonthSelector` component exists at `app/src/components/insights/MonthSelector.tsx`
- Uses `useInsightsMonthStore` (year, month, goForward, goBack, resetToCurrent)
- Only used in Insights screens, NOT on dashboard
- Could be reused or adapted

### Historical Analysis Functions (transactionStore.ts)
- `getMonthlyTotals(transactions, months=6)` — last N months totals
- `getCategoryMoM(transactions)` — month-over-month by category
- `suggestCategoryBudgets()` — 3-month average analysis

### Date Utilities
- `shiftDate(dateStr, days)` in gamificationService.ts
- Standard JS Date patterns for month start/end throughout codebase

### Key Gap
- No mechanism to fetch/store budgets from previous months in demo mode
- `computeFromTransactions()` is hardcoded to current month
- Need to either: add a month parameter to computation, or create a parallel historical computation
