# Wave 2: P1 Daily Brief & Metrics — Plan Metadata

## Task Type
Feature implementation (P1 priority — daily brief card, health score v2, new financial metrics)

## Summary
Build DailyBriefCard component showing today's spending forecast with hidden costs, integrate it into the dashboard, extend Health Score to v2 with CCI and HiddenCostAwareness factors (backwards compatible), and add 4 new financial metric cards (CCI, Spending Velocity, Surprise Spend Ratio, Event Cost Variance) to the Insights screen.

## Codebase Context
- Wave 1 complete: hidden cost types, prediction service, mock adapter, predictionStore extensions, HiddenCostBreakdown component, calendar/plan integration
- budgetStore has calculateHealthScore() pure function (v1: 4-factor formula)
- Insights screen has Score Breakdown with 4 bars
- Dashboard has hero budget card as first item in ScrollView

## Chosen Approach
- DailyBriefCard as a new component using existing HiddenCostBreakdown (compact mode)
- Pure calculator functions in budgetStore for all metrics
- Health Score v2 with optional params for backwards compatibility
- Card-based metric visualization in Insights consistent with existing styling

### Rationale
- Pure functions enable easy testing and reuse
- Optional params preserve backwards compatibility without conditional logic at call sites
- Reusing HiddenCostBreakdown component avoids duplication

## Recommended --max-iterations
**6 iterations** — 4 phases, moderate complexity. DailyBriefCard creation and Insights metric cards are straightforward.

## Context Budget Estimate
- **Pressure rating**: Low (22.1%)
- **Peak iteration tokens**: ~44,200 / 200,000
- **File breakdown**: 4 files (3 small, 1 medium — insights.tsx at 354 lines)
- **Estimated cost range**: $1.50 - $4.00
- **Disclaimer**: Estimates are approximate.

## Unresolved Warnings
None.
