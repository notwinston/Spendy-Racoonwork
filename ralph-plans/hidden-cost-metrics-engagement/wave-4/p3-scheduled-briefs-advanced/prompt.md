You are iterating on the FutureSpend React Native (Expo) app to add scheduled morning brief notifications, advanced metric visualizations, and hidden cost challenge templates. This is Wave 4 (P3), the final wave of a 4-wave feature implementation. Waves 1-3 are complete — hidden cost predictions, daily brief, metrics, badges, notifications, and accuracy tracking are all in place.

Cold start: First, check if work has already begun by running `cd /workspace/app && git log --oneline -20`. If commits exist with messages matching this wave's phases, determine which phases are complete:
- Phase 1 done: `grep -q 'scheduleMorningBrief' /workspace/app/src/stores/notificationStore.ts && echo "PHASE1_DONE"`
- Phase 2 done: `grep -q 'arrow-up\|arrow-down' /workspace/app/app/(tabs)/insights.tsx && echo "PHASE2_DONE"`
- Phase 3 done: `grep -q 'challenge-15' /workspace/app/src/services/gamificationService.ts && echo "PHASE3_DONE"`

Skip any phase that prints DONE. Resume from the first incomplete phase.

Before starting any phase, verify Waves 1-3 artifacts exist:
- `grep -q 'HiddenCostTier' /workspace/app/src/types/index.ts && echo "WAVE1_OK"`
- `grep -q 'calculateCCI' /workspace/app/src/stores/budgetStore.ts && echo "WAVE2_OK"`
- `grep -q 'hiddenCostAlerts' /workspace/app/src/stores/notificationStore.ts && echo "WAVE3_NOTIF_OK"`
- `grep -q 'badge-28' /workspace/app/src/services/gamificationService.ts && echo "WAVE3_BADGES_OK"`

If ANY of these checks fail, stop and report: "BLOCKED: Prior wave artifacts missing. Run Waves 1-3 first."

If no prior work exists, start from Phase 1. Read `/workspace/Segmentation_RBC_People.md` section 7 (Engagement & Retention Loops) for the spec. Then read `/workspace/app/src/stores/notificationStore.ts` to see the current notification state and preferences (including hiddenCostAlerts from Wave 3). Read `/workspace/app/app/(tabs)/insights.tsx` to see the metric sections added in Wave 2. Read `/workspace/app/src/services/gamificationService.ts` to see the badge/challenge system (including Wave 3 badges). Verify the app compiles with `cd /workspace/app && npx tsc --noEmit` before making any changes. If the app does NOT compile before your changes, stop and report: "BLOCKED: Pre-existing compilation failure. Cannot proceed."

## Requirements

1. **Scheduled morning brief** — schedule a local notification at 8 AM daily using expo-notifications
2. **Advanced metric visualizations** — polish the Insights screen metric cards with trend arrows, progress rings, and traffic lights
3. **Challenge templates** — 5 new challenge templates for hidden cost awareness

## Phases

### Phase 1: Add scheduled morning brief notification
1. Run `cd /workspace/app && npx expo install expo-notifications` to add the dependency
2. Add `"expo-notifications"` to the plugins array in `/workspace/app/app.json`
3. In `/workspace/app/src/stores/notificationStore.ts`:
   - Import `* as Notifications` from `expo-notifications` and `import { SchedulableTriggerInputTypes } from 'expo-notifications'`
   - Add action `scheduleMorningBrief(): Promise<void>`:
     - Request notification permissions via `Notifications.requestPermissionsAsync()`
     - Cancel any existing scheduled notification with identifier `'morning-brief'`
     - Schedule a daily repeating notification at 8:00 AM:
       ```
       Notifications.scheduleNotificationAsync({
         content: { title: "Today's Spending Forecast", body: "Check your daily brief for today's events and hidden costs.", data: { screen: 'dashboard' } },
         trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 8, minute: 0 },
         identifier: 'morning-brief',
       })
       ```
     - Only schedule if `preferences.hiddenCostAlerts` is true
   - Add action `cancelMorningBrief(): Promise<void>`:
     - Cancel the scheduled notification with identifier `'morning-brief'`
   - Update `togglePreference` to call `scheduleMorningBrief()` or `cancelMorningBrief()` when `hiddenCostAlerts` is toggled. Since these are async and `togglePreference` may be sync, call them fire-and-forget: `scheduleMorningBrief().catch(console.warn)` / `cancelMorningBrief().catch(console.warn)`

Verify: `cd /workspace/app && npx tsc --noEmit` compiles.
Git: Commit with message "feat(notifications): add scheduled morning brief at 8 AM"

### Phase 2: Polish advanced metric visualizations in Insights
1. In `/workspace/app/app/(tabs)/insights.tsx`:
   - **Spending Velocity card**: Add a trend arrow (Ionicons `arrow-up` / `arrow-down`) next to the daily rate. Green arrow-down if ratio < 1 (spending slower than budget pace), red arrow-up if ratio > 1. Show the ratio as "1.2x budget pace" text.
   - **Surprise Spend Ratio card**: Add a simple progress ring visualization. Use a `View` with `borderRadius: 50%` and a colored border segment to represent the percentage. Or use two overlapping semicircles for a basic ring effect. The ratio (0-1) maps to ring fill. Color: green (<20%), yellow (20-50%), red (>50%).
   - **Event Cost Variance card**: For each category, show the traffic light as a small colored circle (green/yellow/red) next to the category name and CV value. Add a label: "Very predictable" / "Variable" / "Unpredictable".
   - **CCI card**: If the CCI score is available, show it as a large number with a colored ring background. Add per-category bars below showing individual category CCI scores as horizontal bars.
   - Ensure all visualizations use `Colors` constants and are consistent with existing chart styling

Verify: `cd /workspace/app && npx tsc --noEmit` compiles. Test in Expo Go: Insights tab shows polished metric cards with visual indicators.
Git: Commit with message "feat(insights): polish advanced metric visualizations"

### Phase 3: Add hidden cost challenge templates
1. In `/workspace/app/src/services/gamificationService.ts`:
   - Add 5 new challenge templates to `buildDemoChallenges()`:
     | ID | Title | Description | Duration | XP | Goal Type |
     |---|---|---|---|---|---|
     | challenge-11 | No-Spend Weekend | $0 discretionary spending Sat-Sun | 2 days | 100 | { goal_type: 'zero_spend', days: 2 } |
     | challenge-12 | Coffee Cutback | Reduce coffee spending by 30% this week | 7 days | 75 | { goal_type: 'reduce_category', category: 'dining', reduction: 0.3 } |
     | challenge-13 | Lunch Prep Week | Pack lunch every workday (skip all lunch predictions) | 5 days | 80 | { goal_type: 'skip_category', category: 'dining', days: 5 } |
     | challenge-14 | Hidden Cost Master | Acknowledge all hidden costs before events for 7 days | 7 days | 120 | { goal_type: 'hidden_cost_acknowledged', days: 7 } |
     | challenge-15 | Savings Sprint | Save $100 more than usual this month | 30 days | 200 | { goal_type: 'savings_target', amount: 100 } |
   - Each template should have `is_template: true`, appropriate dates, and `reward_xp` matching the table above

Verify: `cd /workspace/app && npx tsc --noEmit` compiles. Navigate to Arena tab — verify new challenge templates appear in the challenges list.
Git: Commit with message "feat(gamification): add 5 hidden cost challenge templates"

## Scope Constraints

### Files you MUST modify:
- `/workspace/app/src/stores/notificationStore.ts`
- `/workspace/app/app/(tabs)/insights.tsx`
- `/workspace/app/src/services/gamificationService.ts`

### Files you MUST modify (config):
- `/workspace/app/package.json` (via npx expo install)
- `/workspace/app/app.json` (expo-notifications plugin)

### Files you MUST NOT modify:
- All files from Waves 1-2 scope (types, prediction service, mock, stores, components, calendar, plan, dashboard, budgetStore)
- `/workspace/app/src/stores/socialStore.ts` (Wave 3 scope)
- `/workspace/app/src/stores/predictionStore.ts` (Waves 1/3 scope)
- `/workspace/supabase/migrations/012_create_hidden_costs.sql` (Wave 3 scope)
- Any `.env` file or file containing API keys/secrets

Any file not listed in "MUST modify" or "MUST create" above should NOT be modified unless absolutely necessary for compilation. If you must modify an unlisted file, add a comment explaining why.

## Rules

1. Follow ALL existing codebase conventions.
2. The morning brief notification uses expo-notifications local scheduling — no server push needed.
3. Challenge templates must use `is_template: true` and follow the existing template pattern from `buildDemoChallenges()`.
4. Advanced metric visualizations should be implemented with basic React Native Views — no external charting libraries.
5. Git: Commit after each phase. Do NOT push to remote.
6. Verify TypeScript compilation after EVERY phase.
7. Do NOT rewrite entire files from scratch. Make targeted edits: insert new code at specific locations, modify specific functions. Preserve existing code structure and formatting.
8. Search for insertion points by content (function names, text strings, keywords) — NOT by line numbers. Line numbers may have shifted from prior waves/phases.
9. If you encounter a situation where you cannot proceed (missing dependency, incompatible API, unresolvable type error after 2 attempts), report it as "BLOCKED: [reason]" and stop.
10. If `npx tsc --noEmit` returns the same error after 2 consecutive fix attempts, try a different fix strategy or skip with a TODO comment.
11. Check existing challenge template structure in `buildDemoChallenges()` for the correct goal field name (it may be `goal_type` rather than `type`). Match the existing convention exactly.

## When Stuck

- If expo-notifications has type issues: Check that `@types/expo-notifications` or the built-in types are available. The trigger MUST use `SchedulableTriggerInputTypes.DAILY` (imported from expo-notifications), not a string literal. If `SchedulableTriggerInputTypes` is not available, check the expo-notifications API for the correct trigger type enum.
- If `togglePreference` is sync but `scheduleMorningBrief` is async: Use fire-and-forget pattern: `scheduleMorningBrief().catch(console.warn)`. Do NOT make togglePreference async.
- If the notification doesn't schedule: In Expo Go, local notifications require explicit permission. The `requestPermissionsAsync()` call must succeed first.
- If the progress ring is hard to implement: Use a simpler visualization — a horizontal progress bar with a colored fill is acceptable as a fallback.
- If you are stuck for more than 2 iterations: Skip, add TODO, move on.

<promise>
Wave 4 is complete when ALL of the following are true:
1. `cd /workspace/app && npx tsc --noEmit` compiles without errors
2. expo-notifications is installed and configured in app.json
3. notificationStore has scheduleMorningBrief() and cancelMorningBrief() actions
4. Morning brief is scheduled at 8 AM when hiddenCostAlerts preference is true
5. Insights screen metric cards have polished visualizations (trend arrows, progress indicators, traffic lights)
6. gamificationService has 5 new challenge templates (challenge-11 through challenge-15)
7. App runs in Expo Go without crashes across all tabs
</promise>
