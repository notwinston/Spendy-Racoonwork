You are iterating on the FutureSpend React Native (Expo) app to add hidden cost notifications, new engagement badges, prediction accuracy tracking, and a Supabase migration. This is Wave 3 (P2) of a 4-wave feature implementation. Waves 1-2 are complete — hidden cost types/predictions/UI and daily brief/metrics are in place.

Cold start: First, check if work has already begun by running `cd /workspace/app && git log --oneline -20`. If commits exist with messages matching this wave's phases, determine which phases are complete:
- Phase 1 done: `grep -q 'hiddenCostAlerts' /workspace/app/src/stores/notificationStore.ts && echo "PHASE1_DONE"`
- Phase 2 done: `grep -q 'badge-28' /workspace/app/src/services/gamificationService.ts && echo "PHASE2_DONE"`
- Phase 3 done: `grep -q 'trackAccuracy' /workspace/app/src/stores/predictionStore.ts && echo "PHASE3_DONE"`
- Phase 4 done: `test -f /workspace/supabase/migrations/012_create_hidden_costs.sql && echo "PHASE4_DONE"`

Skip any phase that prints DONE. Resume from the first incomplete phase.

Before starting any phase, verify Waves 1-2 artifacts exist:
- `grep -q 'HiddenCostTier' /workspace/app/src/types/index.ts && echo "WAVE1_TYPES_OK"`
- `grep -q 'analyzeHiddenCosts' /workspace/app/src/stores/predictionStore.ts && echo "WAVE1_STORE_OK"`
- `test -f /workspace/app/src/components/DailyBriefCard.tsx && echo "WAVE2_BRIEF_OK"`
- `grep -q 'calculateCCI' /workspace/app/src/stores/budgetStore.ts && echo "WAVE2_METRICS_OK"`

If ANY of these checks fail, stop and report: "BLOCKED: Prior wave artifacts missing. Run Waves 1-2 first."

If no prior work exists, start from Phase 1. Read `/workspace/Segmentation_RBC_People.md` sections 4.3 (Pre-Event Notification), 6.2 (Hidden Cost Accuracy), 7 (Engagement & Retention Loops) for the spec. Then read `/workspace/app/src/stores/notificationStore.ts` to understand notification preferences and demo data patterns. Read `/workspace/app/src/services/gamificationService.ts` focusing on `evaluateCondition()` (search for `evaluateCondition`) and `buildDemoBadges()` (search for `buildDemoBadges`) for badge patterns. Read `/workspace/app/src/stores/predictionStore.ts` to see the hidden cost state from Wave 1. Verify the app compiles with `cd /workspace/app && npx tsc --noEmit` before making any changes. If the app does NOT compile before your changes, stop and report: "BLOCKED: Pre-existing compilation failure. Cannot proceed."

## Subagent Instructions

You MAY use subagents (via the Task tool) for specific phases where parallel work is beneficial. Subagent guardrails:
- Subagents MUST NOT modify the same file simultaneously
- Subagents MUST complete and their changes verified BEFORE the next phase begins

[Subagent opportunity] In Phase 1 and Phase 2, the notification work (notificationStore.ts + socialStore.ts) and badge work (gamificationService.ts) touch completely independent files. You MAY spawn a general-purpose subagent to handle Phase 2 (badges) while you work on Phase 1 (notifications). Subagent scope: ONLY `/workspace/app/src/services/gamificationService.ts`. Subagent must NOT touch notification or social stores.

## Requirements

1. **Notification preferences** — add hiddenCostAlerts toggle and pre-event hidden cost demo notifications
2. **Pre-event notification dispatch** — function to create hidden cost alert notifications 3 hours before events
3. **Badge system** — 8 new badges for hidden cost engagement with evaluateCondition() handlers
4. **Accuracy tracking** — morning-after auto-match comparing hidden cost predictions to actual transactions
5. **Supabase migration** — hidden_costs table with proper schema, indexes, and RLS

## Phases

### Phase 1: Add hidden cost notification preferences and demo data
1. In `/workspace/app/src/stores/notificationStore.ts`:
   - Add `hiddenCostAlerts: boolean` (default true) to the `NotificationPreferences` interface and default state
   - Add 2 new demo notifications to `generateDemoNotifications()`:
     a. "Hidden Cost Alert: Dinner Tonight" — category: `'hidden_cost_alert'`, priority: `'medium'`, body: "Budget $113 for dinner at Earls, not just $45. Drinks & Uber likely.", unread
     b. "Pre-Event Cost Reminder" — category: `'hidden_cost_alert'`, priority: `'low'`, body: "Gym in 2 hours — expect $8-12 for a post-workout smoothie.", read
   - Update the `togglePreference` action to handle the new `hiddenCostAlerts` key

2. In `/workspace/app/src/stores/socialStore.ts`:
   - Add a new action `sendPreEventHiddenCostAlert(userId: string, event: CalendarEvent, breakdown: EventCostBreakdown): Promise<void>`:
     - Creates a notification with title: "[Event title] in [X] hours"
     - Body: "Budget $[total_likely] (not just $[base_amount]!) — [top hidden cost labels] likely."
     - Category: `'hidden_cost_alert'`
     - Priority: `'medium'`
     - Data: `{ calendar_event_id: event.id, total_predicted: breakdown.total_likely }`
     - Uses existing `createNotification()` action from the same store

Verify: `cd /workspace/app && npx tsc --noEmit` compiles. Check notification preferences screen shows the new toggle. Demo notifications include hidden cost alerts.
Git: Commit with message "feat(notifications): add hidden cost alert preferences and pre-event dispatch"

### Phase 2: Add new badges for hidden cost engagement
1. In `/workspace/app/src/services/gamificationService.ts`:
   - Add 8 new badge definitions to `buildDemoBadges()` (append after existing badges):
     | ID | Name | Condition Type | Condition | Tier | XP |
     |---|---|---|---|---|---|
     | badge-21 | First Forecast | hidden_cost_views | { type: 'hidden_cost_views', count: 1 } | bronze | 25 |
     | badge-22 | Crystal Ball | hidden_cost_accuracy | { type: 'hidden_cost_accuracy', count: 10, threshold: 0.7 } | silver | 100 |
     | badge-23 | Budget Guardian | budget_under_month | { type: 'budget_under_month', months: 1 } | silver | 150 |
     | badge-24 | Hidden Cost Hunter | hidden_cost_acknowledged | { type: 'hidden_cost_acknowledged', days: 7 } | gold | 200 |
     | badge-25 | Prediction Master | cci_achievement | { type: 'cci_achievement', score: 80, months: 1 } | gold | 250 |
     | badge-26 | Financial Sage | health_score_streak | { type: 'health_score_streak', grade: 'A+', weeks: 2 } | diamond | 500 |
     | badge-27 | Social Saver | challenges_completed | { type: 'challenges_completed', count: 3 } | silver | 150 |
     | badge-28 | Streak Legend | streak | { type: 'streak', streak_type: 'daily_checkin', length: 30 } | diamond | 300 |

   - Add new cases to `evaluateCondition()` switch statement. Note: the `stats` parameter (UserStats type) may not have fields like `hidden_cost_views`, `hidden_cost_accurate`, or `cci_score`. Access these fields with optional chaining (`stats.hidden_cost_views ?? 0`) and add a TODO comment noting they need to be added to the UserStats interface when stat tracking is implemented:
     - `'hidden_cost_views'`: Check `(stats as any).hidden_cost_views >= condition.count` (return false with TODO — stat field not yet on UserStats)
     - `'hidden_cost_accuracy'`: Check `(stats as any).hidden_cost_accurate >= condition.count` (return false with TODO)
     - `'budget_under_month'`: Return false (placeholder — needs transaction history)
     - `'hidden_cost_acknowledged'`: Return false (placeholder)
     - `'cci_achievement'`: Check `(stats as any).cci_score >= condition.score` (return false with TODO)
     - `'health_score_streak'`: Return false (placeholder)

Verify: `cd /workspace/app && npx tsc --noEmit` compiles. Navigate to Arena tab — verify new badges appear in the badge grid.
Git: Commit with message "feat(gamification): add 8 hidden cost engagement badges"

### Phase 3: Add prediction accuracy tracking
1. In `/workspace/app/src/services/predictionService.ts`:
   - Add `matchPredictionsToActuals(predictions: SpendingPrediction[], hiddenCosts: HiddenCost[], transactions: Transaction[]): { predictionId: string; actual_amount: number; was_accurate: boolean; hiddenCostMatches: { costId: string; actual_amount: number; was_accurate: boolean }[] }[]`
     - For each prediction, find transactions on the same date with matching category
     - Sum transaction amounts as actual_amount for the base prediction
     - Compare |predicted - actual| / max(predicted, actual) — accurate if < 0.30
     - For hidden costs: match by category + date, compare individual amounts
     - Return structured match results

2. In `/workspace/app/src/stores/predictionStore.ts`:
   - Add action `trackAccuracy(transactions: Transaction[]): void`:
     - Calls `matchPredictionsToActuals()` with current predictions, hiddenCosts, and provided transactions
     - Updates `was_accurate` and `actual_amount` on matched predictions
     - Updates hidden cost items with actual amounts where matched
   - Add state field `lastAccuracyCheck: string | null` (ISO date string) to prevent re-running
   - The action should only process events from yesterday (morning-after pattern)

Verify: `cd /workspace/app && npx tsc --noEmit` compiles.
Git: Commit with message "feat(accuracy): add morning-after prediction accuracy tracking"

### Phase 4: Create Supabase migration
1. Create `/workspace/supabase/migrations/012_create_hidden_costs.sql`:
   - Follow the convention from existing migrations (header comment, IF NOT EXISTS)
   - Create the `hidden_cost_tier` enum: `CREATE TYPE hidden_cost_tier AS ENUM ('likely', 'possible', 'unlikely_costly');`
   - Create the `hidden_costs` table:
     ```sql
     CREATE TABLE IF NOT EXISTS hidden_costs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       prediction_id UUID NOT NULL REFERENCES spending_predictions(id) ON DELETE CASCADE,
       calendar_event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
       user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
       label TEXT NOT NULL,
       description TEXT,
       predicted_amount DECIMAL(10,2) NOT NULL,
       amount_low DECIMAL(10,2) NOT NULL,
       amount_high DECIMAL(10,2) NOT NULL,
       tier hidden_cost_tier NOT NULL DEFAULT 'possible',
       confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
       category event_category NOT NULL,
       signal_source TEXT NOT NULL CHECK (signal_source IN ('historical','metadata','social','seasonal')),
       is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
       actual_amount DECIMAL(10,2),
       was_accurate BOOLEAN,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     ```
   - Add indexes: `idx_hidden_costs_event` on calendar_event_id, `idx_hidden_costs_user` on user_id, `idx_hidden_costs_prediction` on prediction_id
   - Enable RLS: `ALTER TABLE hidden_costs ENABLE ROW LEVEL SECURITY;`
   - Add policy: `CREATE POLICY "Users see own hidden costs" ON hidden_costs FOR ALL USING (auth.uid() = user_id);`

Verify: The SQL file exists and follows migration conventions. `cd /workspace/app && npx tsc --noEmit` still compiles (migration is SQL only).
Git: Commit with message "feat(db): add hidden_costs table migration"

## Scope Constraints

### Files you MUST modify:
- `/workspace/app/src/stores/notificationStore.ts`
- `/workspace/app/src/stores/socialStore.ts`
- `/workspace/app/src/services/gamificationService.ts`
- `/workspace/app/src/stores/predictionStore.ts`
- `/workspace/app/src/services/predictionService.ts`

### Files you MUST create:
- `/workspace/supabase/migrations/012_create_hidden_costs.sql`

### Files you MUST NOT modify:
- `/workspace/app/src/types/index.ts` (Wave 1 scope)
- `/workspace/app/src/services/llm/mock.ts` (Wave 1 scope)
- `/workspace/app/src/components/HiddenCostBreakdown.tsx` (Wave 1 scope)
- `/workspace/app/app/(tabs)/calendar.tsx` (Wave 1 scope)
- `/workspace/app/app/(tabs)/plan.tsx` (Wave 1 scope)
- `/workspace/app/src/components/DailyBriefCard.tsx` (Wave 2 scope)
- `/workspace/app/app/(tabs)/dashboard.tsx` (Wave 2 scope)
- `/workspace/app/src/stores/budgetStore.ts` (Wave 2 scope)
- `/workspace/app/app/(tabs)/insights.tsx` (Wave 2/4 scope)
- Any `.env` file or file containing API keys/secrets

Any file not listed in "MUST modify" or "MUST create" above should NOT be modified unless absolutely necessary for compilation. If you must modify an unlisted file, add a comment explaining why.

## Rules

1. Follow ALL existing codebase conventions.
2. New badge evaluateCondition() cases should return false with a TODO comment where the stat is not yet tracked. This keeps the structure ready for future stat tracking.
3. The accuracy tracking action must only process yesterday's events (morning-after pattern). Guard with `lastAccuracyCheck` date.
4. Notification categories must use string literals that match the existing category pattern in types/index.ts `NotificationCategory`.
5. The Supabase migration must follow the exact conventions from migration 011 (header comment, IF NOT EXISTS, standard indexes, RLS).
6. Git: Commit after each phase. Do NOT push to remote.
7. Verify TypeScript compilation after EVERY phase.
8. Do NOT rewrite entire files from scratch. Make targeted edits: insert new code at specific locations, modify specific functions. Preserve existing code structure and formatting.
9. Search for insertion points by content (function names, text strings, keywords) — NOT by line numbers. Line numbers may have shifted from prior waves/phases.
10. If you encounter a situation where you cannot proceed (missing dependency, incompatible API, unresolvable type error after 2 attempts), report it as "BLOCKED: [reason]" and stop.
11. If `npx tsc --noEmit` returns the same error after 2 consecutive fix attempts, try a different fix strategy or skip with a TODO comment.
12. For evaluateCondition() cases that reference stats fields not yet on UserStats, use `(stats as any).fieldName` with a TODO comment. Do NOT modify the UserStats interface in this wave.

## When Stuck

- If `NotificationCategory` type doesn't include 'hidden_cost_alert': Add it to the union type in types/index.ts. This is an exception to the "don't modify types/index.ts" rule — if a new notification category is needed, add ONLY the category to the union.
- If badge IDs conflict with existing ones: Use IDs badge-21 through badge-28 (existing go up to badge-20).
- If accuracy matching produces no results: Demo transaction dates may not align with prediction dates. Adjust the date matching window to +/- 1 day.
- If you are stuck for more than 2 iterations: Skip, add TODO, move on.

<promise>
Wave 3 is complete when ALL of the following are true:
1. `cd /workspace/app && npx tsc --noEmit` compiles without errors
2. notificationStore has hiddenCostAlerts preference toggle and 2 new demo notifications
3. socialStore has sendPreEventHiddenCostAlert() action
4. gamificationService has 8 new badge definitions (badge-21 through badge-28)
5. evaluateCondition() handles all new condition types (even if returning false for untracked stats)
6. predictionStore has trackAccuracy() action with morning-after date guard
7. predictionService has matchPredictionsToActuals() function
8. 012_create_hidden_costs.sql migration exists with table, enum, indexes, and RLS policy
9. App runs in Expo Go without crashes
</promise>
