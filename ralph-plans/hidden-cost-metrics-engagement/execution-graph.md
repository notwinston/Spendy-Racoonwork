# Execution Graph: Hidden Cost Metrics & Engagement

## Wave Structure

All 4 waves are **sequential** — each wave depends on the previous wave's output (shared files, types, store state).

```
Wave 1 (P0) ──→ Wave 2 (P1) ──→ Wave 3 (P2) ──→ Wave 4 (P3)
```

## Dependency Rationale

| Wave | Depends On | Why |
|------|-----------|-----|
| Wave 1 | — | Foundation: types, prediction service, mock adapter, store, component |
| Wave 2 | Wave 1 | Uses HiddenCostBreakdown component, predictionStore hiddenCosts/dailyBrief, EventCostBreakdown type |
| Wave 3 | Wave 1 + 2 | Extends notificationStore (Wave 2 dashboard useEffect), predictionStore (Wave 1 state), gamificationService (standalone but needs types) |
| Wave 4 | Wave 1-3 | Extends notificationStore (Wave 3 hiddenCostAlerts), insights.tsx (Wave 2 metrics), gamificationService (Wave 3 badges) |

## Per-Wave Summary

| Wave | Name | Files | Phases | Iterations | Est. Cost | Pressure |
|------|------|-------|--------|------------|-----------|----------|
| 1 | P0 Hidden Cost Core | 10 | 6 | 8 | $2.50-$6.00 | Moderate (34.6%) |
| 2 | P1 Daily Brief & Metrics | 4 | 4 | 6 | $1.50-$4.00 | Low (22.1%) |
| 3 | P2 Notifications, Badges & Migration | 6 | 4 | 6 | $1.50-$4.00 | Low (25.3%) |
| 4 | P3 Scheduled Briefs & Advanced | 5 | 3 | 5 | $1.00-$3.00 | Low (19.8%) |
| **Total** | | **25** | **17** | **25** | **$6.50-$17.00** | |

## Execution Commands

### Wave 1 (run first)
```
/ralph-loop:ralph-loop $(cat ralph-plans/hidden-cost-metrics-engagement/wave-1/p0-hidden-cost-core/prompt.md) --completion-promise "$(cat ralph-plans/hidden-cost-metrics-engagement/wave-1/p0-hidden-cost-core/promise.txt)" --max-iterations=8
```

### Wave 2 (run after Wave 1 completes)
```
/ralph-loop:ralph-loop $(cat ralph-plans/hidden-cost-metrics-engagement/wave-2/p1-daily-brief-metrics/prompt.md) --completion-promise "$(cat ralph-plans/hidden-cost-metrics-engagement/wave-2/p1-daily-brief-metrics/promise.txt)" --max-iterations=6
```

### Wave 3 (run after Wave 2 completes)
```
/ralph-loop:ralph-loop $(cat ralph-plans/hidden-cost-metrics-engagement/wave-3/p2-notifications-badges-migration/prompt.md) --completion-promise "$(cat ralph-plans/hidden-cost-metrics-engagement/wave-3/p2-notifications-badges-migration/promise.txt)" --max-iterations=6
```

### Wave 4 (run after Wave 3 completes)
```
/ralph-loop:ralph-loop $(cat ralph-plans/hidden-cost-metrics-engagement/wave-4/p3-scheduled-briefs-advanced/prompt.md) --completion-promise "$(cat ralph-plans/hidden-cost-metrics-engagement/wave-4/p3-scheduled-briefs-advanced/promise.txt)" --max-iterations=5
```

## Verification Between Waves

After each wave completes, verify before starting the next:
1. `cd /workspace/app && npx tsc --noEmit` — must compile clean
2. Check that the wave's promise items are satisfied
3. Quick visual check in Expo Go (optional but recommended)

## Notes

- Each wave is run in a **separate** ralph-loop session (separate context window)
- Waves cannot be parallelized due to shared file dependencies
- If a wave fails or gets stuck, fix the issues manually before starting the next wave
- Total estimated runtime: 25 iterations across 4 sessions
