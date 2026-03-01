# Wave 3: P2 Notifications, Badges & Migration — Plan Metadata

## Task Type
Feature implementation (P2 priority — notifications, badges, accuracy tracking, database migration)

## Summary
Add hiddenCostAlerts notification preference toggle with demo data, pre-event hidden cost alert dispatch in socialStore, 8 new engagement badges (badge-21 through badge-28) with evaluateCondition() handlers, morning-after prediction accuracy tracking, and a Supabase migration for the hidden_costs table.

## Codebase Context
- Waves 1-2 complete: full hidden cost prediction pipeline, daily brief, metrics
- notificationStore has preference toggles and demo notification generation
- gamificationService has evaluateCondition() switch/case and buildDemoBadges() with 20 existing badges
- predictionStore has hiddenCosts state from Wave 1
- Supabase migrations follow header comment, IF NOT EXISTS, UUID PKs, RLS pattern

## Chosen Approach
- Notification preferences follow existing toggle pattern
- Badge definitions follow existing buildDemoBadges() template
- evaluateCondition() cases return false with TODO for untracked stats
- Accuracy tracking uses morning-after pattern with date guard
- SQL migration follows existing migration 011 conventions

### Rationale
- Following existing patterns minimizes risk and ensures consistency
- Placeholder evaluateCondition() cases keep structure ready for future stat tracking
- Morning-after pattern ensures predictions have time to settle before accuracy check

## Recommended --max-iterations
**6 iterations** — 4 phases touching independent files. Subagent opportunity for parallel badge work.

## Context Budget Estimate
- **Pressure rating**: Low (25.3%)
- **Peak iteration tokens**: ~50,600 / 200,000
- **File breakdown**: 6 files (all small — largest is gamificationService.ts at 1024 lines)
- **Estimated cost range**: $1.50 - $4.00
- **Disclaimer**: Estimates are approximate.

## Unresolved Warnings
None.
