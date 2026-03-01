# Wave 4: P3 Scheduled Briefs & Advanced Visualizations — Plan Metadata

## Task Type
Feature implementation (P3 priority — scheduled notifications, metric polish, challenge templates)

## Summary
Schedule daily morning brief notifications at 8 AM using expo-notifications, polish Insights screen metric cards with trend arrows/progress rings/traffic lights, and add 5 new hidden cost challenge templates (challenge-11 through challenge-15) to the gamification system.

## Codebase Context
- Waves 1-3 complete: full hidden cost pipeline, daily brief, metrics, badges, notifications, accuracy tracking
- notificationStore has hiddenCostAlerts preference from Wave 3
- Insights screen has 4 metric cards from Wave 2
- gamificationService has 10 existing challenge templates

## Chosen Approach
- expo-notifications for local notification scheduling (no server push)
- Basic React Native Views for metric visualizations (no charting libraries)
- Challenge templates follow existing buildDemoChallenges() pattern

### Rationale
- expo-notifications is the standard Expo solution for local notifications
- View-based visualizations keep the dependency footprint minimal
- Following existing challenge template pattern ensures consistency

## Recommended --max-iterations
**5 iterations** — 3 phases, moderate complexity. Metric visualization polish is the most involved.

## Context Budget Estimate
- **Pressure rating**: Low (19.8%)
- **Peak iteration tokens**: ~39,600 / 200,000
- **File breakdown**: 3 source files + 2 config files (all small)
- **Estimated cost range**: $1.00 - $3.00
- **Disclaimer**: Estimates are approximate.

## Unresolved Warnings
None.
