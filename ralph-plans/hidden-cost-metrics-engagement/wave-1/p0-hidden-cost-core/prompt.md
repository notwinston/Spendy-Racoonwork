You are iterating on the FutureSpend React Native (Expo) app to add a hidden cost prediction engine and core UI. This is Wave 1 (P0) of a 4-wave feature implementation. Your changes establish the foundation that all subsequent waves build upon.

Cold start: First, check if work has already begun by running `cd /workspace/app && git log --oneline -20`. If commits exist with messages matching this wave's phases, determine which phases are complete by running these checks:
- Phase 1 done: `grep -q 'HiddenCostTier' /workspace/app/src/types/index.ts && echo "PHASE1_DONE"`
- Phase 2 done: `grep -q 'HIDDEN_COST_PROMPT_MARKER' /workspace/app/src/services/llm/mock.ts && echo "PHASE2_DONE"`
- Phase 3 done: `grep -q 'predictHiddenCosts' /workspace/app/src/services/predictionService.ts && echo "PHASE3_DONE"`
- Phase 4 done: `grep -q 'analyzeHiddenCosts' /workspace/app/src/stores/predictionStore.ts && echo "PHASE4_DONE"`
- Phase 5 done: `test -f /workspace/app/src/components/HiddenCostBreakdown.tsx && echo "PHASE5_DONE"`
- Phase 6 done: `grep -q 'HiddenCostBreakdown' /workspace/app/app/(tabs)/calendar.tsx && echo "PHASE6_DONE"`

Skip any phase that prints DONE. Resume from the first incomplete phase.

If no prior work exists, start from Phase 1. Read `/workspace/Segmentation_RBC_People.md` sections 2-5 for the full spec. Then read `/workspace/app/src/services/predictionService.ts` to understand the existing prediction pipeline pattern, `/workspace/app/src/services/llm/mock.ts` for the mock adapter pattern, and `/workspace/app/src/types/index.ts` for existing type definitions. Verify the app compiles with `cd /workspace/app && npx tsc --noEmit` before making any changes. If the app does NOT compile before your changes, stop and report: "BLOCKED: Pre-existing compilation failure. Cannot proceed."

## Subagent Instructions

You MAY use subagents (via the Task tool) for specific phases where parallel work is beneficial. Subagent guardrails:
- Subagents MUST NOT modify the same file simultaneously
- Subagents MUST complete and their changes verified BEFORE the next phase begins
- If a subagent fails or produces incorrect output, complete the work yourself
- Subagent tasks must be specific and scoped — never delegate an entire phase

## Requirements

Implement the hidden cost prediction engine with:
1. New TypeScript types (HiddenCostTier, HiddenCost, EventCostBreakdown, DailyBrief, LLM response types)
2. Hidden cost LLM prompt builder and response parser in the prediction service
3. Mock hidden cost response builder with keyword-based rules for demo mode
4. PredictionStore extensions (hiddenCosts state, eventCostBreakdowns, isAnalyzingHiddenCosts, analyzeHiddenCosts action, dismissHiddenCost action, generateDailyBrief action)
5. HiddenCostBreakdown reusable component with expand/collapse animations, tier coloring, dismiss functionality
6. Integration into calendar day-detail modal (collapsed by default) and plan screen prediction cards (expanded by default)
7. Install react-native-reanimated for animations
8. Configure babel.config.js with the reanimated Babel plugin

Both demo mode (mock data, no API keys) and real API mode must work. Both personas (Sarah + Marcus) must show hidden costs via the mock adapter.

## Phases

### Phase 1: Install react-native-reanimated, configure babel, and add types
1. Run `cd /workspace/app && npx expo install react-native-reanimated`
2. Add `"react-native-reanimated/plugin"` as the LAST entry in the `plugins` array in `/workspace/app/app.json`
3. Read `/workspace/app/babel.config.js`. Add `'react-native-reanimated/plugin'` as the LAST plugin in the plugins array. If no plugins array exists, add one. If the file does not exist, create it with:
   ```js
   module.exports = function (api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: ['react-native-reanimated/plugin'],
     };
   };
   ```
4. In `/workspace/app/src/types/index.ts`, append after the existing `LLMPredictionResponse` interface (search for `LLMPredictionResponse` to find the insertion point — do NOT rely on line numbers):
   - `HiddenCostTier` type: `'likely' | 'possible' | 'unlikely_costly'`
   - `HiddenCost` interface with fields: id (string), prediction_id (string), calendar_event_id (string), label (string), description (string), predicted_amount (number), amount_low (number), amount_high (number), tier (HiddenCostTier), confidence_score (number), category (EventCategory), signal_source (`'historical' | 'metadata' | 'social' | 'seasonal'`), is_dismissed (boolean)
   - `EventCostBreakdown` interface with fields: calendar_event_id (string), base_prediction (SpendingPrediction), hidden_costs (HiddenCost[]), total_likely (number), total_possible (number), total_with_risk (number), historical_avg (number | null)
   - `DailyBrief` interface with fields: date (string), events (EventCostBreakdown[]), total_predicted_low (number), total_predicted_high (number), top_warning (string | null), savings_opportunity (string | null)
   - `LLMHiddenCostItem` interface with fields: label (string), description (string), predicted_amount (number), amount_low (number), amount_high (number), confidence (number), category (string), signal_source (string)
   - `LLMHiddenCostResponse` interface: `{ hidden_costs: LLMHiddenCostItem[] }`

Verify: `cd /workspace/app && npx tsc --noEmit` compiles without errors.
Git: Commit with message "feat(types): add hidden cost types and install reanimated"

### Phase 2: Extend mock adapter with hidden cost rules
1. In `/workspace/app/src/services/llm/mock.ts`:
   - Add a constant `HIDDEN_COST_PROMPT_MARKER = '### Hidden Cost Analysis'` near the top (after existing imports/constants)
   - Add a `HIDDEN_COST_RULES` constant mapping keywords to arrays of hidden cost templates. Each template has: label, tier (HiddenCostTier), category (EventCategory), min (number), max (number). Cover at minimum these keywords:
     - `dinner/restaurant/earls`: Drinks after ($15-40 likely), Uber home ($12-35 possible), Parking ($5-15 possible)
     - `lunch/team lunch/nuba`: Coffee after ($4-8 likely), Dessert ($5-12 possible)
     - `gym/workout/equinox`: Post-workout smoothie ($6-12 likely), Parking ($3-10 possible)
     - `trip/weekend/whistler`: Gas ($30-70 likely), Meals ($20-50 likely), Emergency supplies ($20-80 unlikely_costly)
     - `birthday/party`: Gift ($20-60 likely), Drinks ($15-45 possible)
     - `concert/show`: Drinks ($15-40 likely), Merch ($20-60 possible), Uber ($12-30 possible)
     - `coffee/cafe/starbucks`: Pastry/snack ($3-8 possible)
     - `date`: Activity after ($15-45 possible), Flowers/gift ($15-30 possible)
     - `conference/meeting`: Coffee ($4-7 likely), Lunch ($12-25 possible)
   - Add `buildMockHiddenCostResponse(prompt: string): string` function that:
     a. Extracts event title and category from the prompt using regex (Title: ... pattern)
     b. Matches keywords against `HIDDEN_COST_RULES` by checking if any keyword appears in the title (case-insensitive)
     c. For each matched rule, generates random amounts within min-max range using existing `randomBetween()`
     d. Assigns confidence_score based on tier: likely=0.75-0.95, possible=0.35-0.65, unlikely_costly=0.10-0.25
     e. Returns JSON string: `{ "hidden_costs": [...] }`
   - Modify `MockAdapter.predict()`: At the START of the predict method (before any existing logic), check if the prompt contains `HIDDEN_COST_PROMPT_MARKER`. If yes, call `buildMockHiddenCostResponse(prompt)` and return it. If no, fall through to existing `buildMockResponse(prompt)` logic.

Verify: `cd /workspace/app && npx tsc --noEmit` compiles.
Git: Commit with message "feat(mock): add hidden cost mock rules and response builder"

### Phase 3: Add hidden cost prediction to predictionService
1. In `/workspace/app/src/services/predictionService.ts`, add after the existing functions (search for the last `export` to find the insertion point):
   - `buildHiddenCostPrompt(event: CalendarEvent, historicalTransactions: Transaction[], similarEvents: { title: string; total_spent: number; breakdown: string[] }[]): string`
     - Must include the marker `### Hidden Cost Analysis` as the FIRST line of the prompt so mock adapter can detect it
     - Include event details: title, location, time, day of week, attendees, category, description
     - Include historical context: similar past events and what was actually spent
     - Include recent transaction patterns (last 20 transactions)
     - Request 2-5 hidden costs with: label, description, predicted_amount, amount_low, amount_high, confidence (0-1), category, signal_source
     - Request ONLY valid JSON response: `{ "hidden_costs": [...] }`
   - `parseHiddenCostResponse(raw: string, event: CalendarEvent, predictionId: string): HiddenCost[]`
     - Use existing `extractJSON()` helper to strip markdown fences
     - Parse as `LLMHiddenCostResponse`
     - Validate each item: clamp confidence to [0,1], validate category against known EventCategory values (check how existing code validates categories — if `isValidCategory()` exists use it, otherwise compare against the EventCategory union type values), assign tier based on confidence (>=0.70 = likely, 0.30-0.70 = possible, <0.30 && amount>=50 = unlikely_costly, else possible)
     - Generate unique IDs using `Date.now().toString(36) + Math.random().toString(36).substring(2)` pattern
     - Set prediction_id from the predictionId parameter
     - Set calendar_event_id from event.id
     - Set is_dismissed = false
   - `findSimilarTransactions(event: CalendarEvent, transactions: Transaction[]): Transaction[]`
     - Filter transactions where EITHER: the transaction category matches event category, OR the transaction merchant_name shares at least one word (3+ characters) with the event title
     - Return up to 10 most recent matches sorted by date descending
   - `predictHiddenCosts(events: CalendarEvent[], transactions: Transaction[], userId?: string): Promise<HiddenCost[]>`
     - For each event, build prompt using `buildHiddenCostPrompt()` and call adapter via `Promise.allSettled()`
     - Use existing `getAdapter()` (same cached singleton)
     - On error per-event: log the error with `console.warn()` and skip that event (do NOT retry — mock is already the adapter in demo mode)
     - Aggregate all successful results into a flat HiddenCost[]
   - `buildEventCostBreakdowns(predictions: SpendingPrediction[], hiddenCosts: HiddenCost[]): Record<string, EventCostBreakdown>`
     - Group hidden costs by calendar_event_id
     - Match with base predictions by calendar_event_id
     - Compute totals using only non-dismissed costs: total_likely (base + sum of likely hidden costs), total_possible (base + sum of likely + possible hidden costs), total_with_risk (base + sum of all non-dismissed hidden costs)
     - Set historical_avg to null (not yet implemented)
   - `generateDailyBrief(events: CalendarEvent[], predictions: SpendingPrediction[], hiddenCosts: HiddenCost[], budgets: Budget[]): DailyBrief`
     - Filter to today's events using `new Date().toISOString().split('T')[0]` for date comparison
     - Build EventCostBreakdowns for today's events
     - Compute aggregate totals (total_predicted_low = sum of base amounts, total_predicted_high = sum of total_with_risk)
     - Generate top_warning: label of the highest predicted_amount hidden cost across all today's events, or null if no hidden costs
     - Generate savings_opportunity: "Skip [label] to save ~$[amount]" for the lowest-confidence hidden cost, or null if no hidden costs

Verify: `cd /workspace/app && npx tsc --noEmit` compiles without errors.
Git: Commit with message "feat(prediction): add hidden cost prediction service functions"

### Phase 4: Extend predictionStore with hidden cost state
1. In `/workspace/app/src/stores/predictionStore.ts`:
   - Add to the state interface (search for `interface` or the existing state type definition):
     - `hiddenCosts: HiddenCost[]`
     - `eventCostBreakdowns: Record<string, EventCostBreakdown>`
     - `dailyBrief: DailyBrief | null`
     - `isAnalyzingHiddenCosts: boolean`
   - Add default values in the store creation: `hiddenCosts: [], eventCostBreakdowns: {}, dailyBrief: null, isAnalyzingHiddenCosts: false`
   - Add actions:
     - `analyzeHiddenCosts(events: CalendarEvent[], transactions: Transaction[], userId?: string)`:
       Sets isAnalyzingHiddenCosts=true, calls `predictHiddenCosts()`, then calls `buildEventCostBreakdowns()` with the existing predictions + new hidden costs, stores results. Sets isAnalyzingHiddenCosts=false. On error: sets error, isAnalyzingHiddenCosts=false.
     - `dismissHiddenCost(costId: string)`:
       Finds the cost by id in hiddenCosts array, sets its is_dismissed=true. Then recalculates the affected EventCostBreakdown by calling `buildEventCostBreakdowns()` with current predictions and updated hiddenCosts. Updates both hiddenCosts and eventCostBreakdowns in store.
     - `generateDailyBrief(context: { events: CalendarEvent[]; budgets: Budget[] })`:
       Calls `generateDailyBrief()` from predictionService using store's current predictions and hiddenCosts plus context.events and context.budgets. Stores result in dailyBrief state.
   - Update the existing `clear()` action (search for `clear` in the store actions) to also reset: `hiddenCosts: [], eventCostBreakdowns: {}, dailyBrief: null, isAnalyzingHiddenCosts: false`

Verify: `cd /workspace/app && npx tsc --noEmit` compiles.
Git: Commit with message "feat(store): add hidden cost state and actions to predictionStore"

### Phase 5: Build HiddenCostBreakdown component
1. Create `/workspace/app/src/components/HiddenCostBreakdown.tsx`:
   - Import `Animated as ReAnimated, FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming, withSequence` from `react-native-reanimated`. IMPORTANT: Alias as `ReAnimated` to avoid conflicts with React Native's built-in `Animated`. Never import `Animated` from both `react-native` and `react-native-reanimated` in the same file.
   - Import `Colors, Typography, Spacing` from constants, `Ionicons` from `@expo/vector-icons`
   - Props interface: `{ eventCostBreakdown: EventCostBreakdown; defaultExpanded?: boolean; onDismissCost?: (costId: string) => void; onAdjustBudget?: (category: EventCategory, amount: number) => void; compact?: boolean }`
   - Named export: `export function HiddenCostBreakdown(props)`
   - Tier color mapping: `likely` = `Colors.positive`, `possible` = `Colors.warning`, `unlikely_costly` = `Colors.danger`
   - Tier label mapping: `likely` = 'Likely', `possible` = 'Possible', `unlikely_costly` = 'Risk'
   - Filter out dismissed costs from display
   - Three visual states:
     a. **Compact** (when `compact={true}`): Single row — "+N hidden costs (~$XX)" with tier dots inline and a "Details" arrow. No expand/collapse.
     b. **Collapsed** (default): Row showing "Hidden Costs (N)" with tier dot indicators (filled circles), total amount "+$XX", and chevron-right icon. Tapping expands.
     c. **Expanded**: Full list of hidden costs. Each item shows: colored tier dot, label, amount, description text, and a dismiss button (X icon). Total at bottom with range. "Adjust Budget" and historical average comparison if available.
   - Animations:
     - Expand/collapse: Use a boolean state (`isExpanded`) and conditionally render the expanded content. Use `FadeIn.duration(200)` as the `entering` animation on the expanded container wrapped in `ReAnimated.View`, and `FadeOut.duration(150)` as the `exiting` animation. Do NOT attempt height animation with useSharedValue — use conditional rendering with entering/exiting animations instead.
     - Stagger: Each hidden cost item uses `FadeIn.delay(index * 50)` entering animation from reanimated
     - Tier dot pulse: On first render, each tier dot scales from 1 -> 1.3 -> 1 using `withSequence(withTiming(1.3, {duration: 200}), withTiming(1, {duration: 200}))`
   - Dismiss handler: When X is tapped, call `onDismissCost(costId)`. The item will be removed on next render since dismissed costs are filtered out.
   - Style: Dark theme using Colors.card background, Colors.cardBorder for separators, Colors.textPrimary/Secondary for text. Use `StyleSheet.create()` at bottom.

Verify: `cd /workspace/app && npx tsc --noEmit` compiles.
Git: Commit with message "feat(ui): add HiddenCostBreakdown component with animations"

[Subagent opportunity] After verifying the HiddenCostBreakdown component compiles, you MAY spawn a general-purpose subagent to handle plan.tsx integration (Phase 6b below) while you work on calendar.tsx integration (Phase 6a). Subagent scope: ONLY `/workspace/app/app/(tabs)/plan.tsx`. Subagent must NOT touch calendar.tsx.

### Phase 6: Integrate into calendar and plan screens
**Phase 6a: Calendar screen** (`/workspace/app/app/(tabs)/calendar.tsx`):
1. Import `HiddenCostBreakdown` from `../../src/components/HiddenCostBreakdown`
2. Import `useTransactionStore` from `../../src/stores/transactionStore`
3. In the existing predictionStore destructuring (search for `usePredictionStore`), add: `hiddenCosts, eventCostBreakdowns, analyzeHiddenCosts, dismissHiddenCost, isAnalyzingHiddenCosts`
4. Get transactions: `const { transactions } = useTransactionStore();`
5. Add a `useEffect` that triggers `analyzeHiddenCosts(events, transactions)` when predictions are loaded and hiddenCosts is empty. Guard: `if (predictions.length > 0 && hiddenCosts.length === 0 && !isAnalyzingHiddenCosts)`. Dependencies: `[predictions.length, hiddenCosts.length, isAnalyzingHiddenCosts]`.
6. In the day detail modal rendering (search for the modal or `renderDayDetailModal` function), after the prediction explanation section (search for text like "Explanation" or "confidence" near the prediction display), add:
   ```
   {eventCostBreakdowns[selectedEvent.id] && (
     <HiddenCostBreakdown
       eventCostBreakdown={eventCostBreakdowns[selectedEvent.id]}
       defaultExpanded={false}
       onDismissCost={dismissHiddenCost}
     />
   )}
   ```
   Use the correct variable name for the selected event — search the function for `selectedEvent` or `event` to find the right identifier.
7. In the weekly view event rows (search for the event list rendering), add a small hidden cost indicator text after the event amount. Show "+$XX hidden" text in Colors.warning if `eventCostBreakdowns[event.id]` exists and has hidden costs with `hidden_costs.length > 0`. This provides a visual hint before tapping into the detail modal.

**Phase 6b: Plan screen** (`/workspace/app/app/(tabs)/plan.tsx`):
1. Import `HiddenCostBreakdown` from `../../src/components/HiddenCostBreakdown`
2. In the store destructuring (search for `usePredictionStore`), add `eventCostBreakdowns` and `dismissHiddenCost`
3. Inside each prediction card (search for the prediction card rendering — look for `prediction.predicted_amount` or confidence bar), after the confidence bar section, add:
   ```
   {eventCostBreakdowns[prediction.calendar_event_id] && (
     <HiddenCostBreakdown
       eventCostBreakdown={eventCostBreakdowns[prediction.calendar_event_id]}
       defaultExpanded={true}
       onDismissCost={dismissHiddenCost}
     />
   )}
   ```
4. Search for a prediction summary section at the top of the screen (look for total or aggregate prediction amount display). If such a section exists, add the total hidden costs to the displayed amount. If no summary section exists, skip this step.

Verify: `cd /workspace/app && npx tsc --noEmit` compiles.
Git: Commit with message "feat(screens): integrate HiddenCostBreakdown into calendar and plan screens"

## Scope Constraints

### Files you MUST modify:
- `/workspace/app/src/types/index.ts`
- `/workspace/app/src/services/predictionService.ts`
- `/workspace/app/src/services/llm/mock.ts`
- `/workspace/app/src/stores/predictionStore.ts`
- `/workspace/app/app/(tabs)/calendar.tsx`
- `/workspace/app/app/(tabs)/plan.tsx`
- `/workspace/app/package.json` (via npx expo install)
- `/workspace/app/app.json` (reanimated plugin)
- `/workspace/app/babel.config.js` (reanimated Babel plugin — create if needed)

### Files you MUST create:
- `/workspace/app/src/components/HiddenCostBreakdown.tsx`

### Files you MUST NOT modify:
- `/workspace/app/src/services/llm/adapter.ts` (adapter interface is prompt-agnostic)
- `/workspace/app/src/services/llm/claude.ts` (no changes needed)
- `/workspace/app/src/services/llm/gemini.ts` (no changes needed)
- `/workspace/app/src/stores/calendarStore.ts` (hidden costs are parallel, not embedded)
- `/workspace/app/src/stores/budgetStore.ts` (Wave 2 scope)
- `/workspace/app/src/stores/transactionStore.ts` (read-only usage, do not modify)
- `/workspace/app/src/stores/authStore.ts` (no changes needed)
- `/workspace/app/app/(tabs)/dashboard.tsx` (Wave 2 scope)
- `/workspace/app/app/(tabs)/insights.tsx` (Wave 2 scope)
- `/workspace/app/src/stores/notificationStore.ts` (Wave 3 scope)
- `/workspace/app/src/services/gamificationService.ts` (Wave 3 scope)
- Any file under `/workspace/supabase/` (Wave 3 scope)
- Any `.env` file or file containing API keys/secrets

Any file not listed in "MUST modify" or "MUST create" above should NOT be modified unless absolutely necessary for compilation. If you must modify an unlisted file, add a comment explaining why.

## Rules

1. Follow ALL existing codebase conventions: named function exports for components, StyleSheet.create() at bottom, Colors/Typography/Spacing constants exclusively (no inline hex values), Ionicons for icons, Card component for content grouping.
2. Every new function must have a TypeScript signature. No `any` types.
3. The mock adapter MUST produce realistic hidden costs for both Sarah (student: dinner, coffee, study groups, birthday) and Marcus (professional: team lunch, gym, weekend trip, conference) personas.
4. `isDemoMode()` from `/workspace/app/src/lib/supabase.ts` must be respected — no Supabase calls in demo mode.
5. The HiddenCostBreakdown component must be purely presentational — all state management happens in the store, not the component.
6. Dismissed costs MUST be excluded from total estimates (not just visually hidden).
7. Git: Commit after each phase with a descriptive message. Do NOT push to remote.
8. Do NOT install any dependency other than react-native-reanimated.
9. Do NOT modify existing test files (there are none, but do not create test files either).
10. Verify TypeScript compilation (`npx tsc --noEmit`) after EVERY phase before committing.
11. Do NOT rewrite entire files from scratch. Make targeted edits: insert new code at specific locations, modify specific functions. Preserve existing code structure and formatting.
12. Search for insertion points by content (function names, text strings, keywords) — NOT by line numbers. Line numbers may have shifted from prior phases.
13. If you encounter a situation where you cannot proceed (missing dependency, incompatible API, unresolvable type error after 2 attempts), report it as "BLOCKED: [reason]" and stop.
14. When importing `generateDailyBrief` from predictionService into predictionStore, alias it to avoid name collision with the store action: `import { generateDailyBrief as buildDailyBrief } from '../services/predictionService'` and call `buildDailyBrief(...)` inside the store action.
15. After modifying the predictionStore state interface, immediately update the `create()` call's initial values. Every field in the interface MUST have a corresponding default value in the store creation.
16. If `npx tsc --noEmit` returns the same error after 2 consecutive fix attempts, do NOT keep trying the same approach. Try a different fix strategy or skip the sub-feature with a TODO comment and move to the next phase.
17. Read npm/tsc error output carefully — the first error is usually the root cause. Fix errors one at a time from the top.

## When Stuck

- If `npx tsc --noEmit` fails: Read the error messages carefully. The most common issues will be import paths (use relative paths like `../../src/types`) and missing type exports.
- If `npx tsc --noEmit` fails BEFORE you make any changes: Stop immediately. Report "BLOCKED: Pre-existing compilation failure" with the error output.
- If react-native-reanimated fails to install: Try `cd /workspace/app && npm install react-native-reanimated` as fallback. If that also fails, use LayoutAnimation as a fallback for animations (built into React Native) and skip the babel.config.js plugin step.
- If the mock adapter doesn't return hidden costs: Check that `HIDDEN_COST_PROMPT_MARKER` appears in the prompt text AND that `MockAdapter.predict()` checks for it BEFORE calling `buildMockResponse()`.
- If hidden costs don't appear in the calendar modal: Verify that `analyzeHiddenCosts` is being called in the useEffect, that `eventCostBreakdowns` is populated, and that the event ID used as key matches between predictions and calendar events.
- If animations crash in Expo Go: Fall back to LayoutAnimation. Replace reanimated imports with `import { LayoutAnimation, UIManager, Platform } from 'react-native'` and add `if (Platform.OS === 'android') { UIManager.setLayoutAnimationEnabledExperimental?.(true); }` at the top of the component. Do NOT attempt to use both react-native Animated and react-native-reanimated Animated in the same file — pick one.
- If height animation with useSharedValue is difficult: Do NOT fight it. Use conditional rendering with `FadeIn`/`FadeOut` entering/exiting animations instead. This is simpler and more reliable.
- If babel.config.js does not exist: Create it with the standard Expo template shown in Phase 1 step 3. If it exists but has a different format, add `'react-native-reanimated/plugin'` to the existing plugins array (or create the array if missing).
- If the event ID format differs between calendar events and predictions: Check how `predictionStore.predictions` stores `calendar_event_id` — it should match `event.id` from `calendarStore`. If they use different formats, you must map between them.
- If you are stuck for more than 2 iterations on the same issue: Skip that sub-feature, add a TODO comment, and move to the next phase. Do not thrash.

<promise>
Wave 1 is complete when ALL of the following are true:
1. `cd /workspace/app && npx tsc --noEmit` compiles without errors
2. HiddenCostTier, HiddenCost, EventCostBreakdown, DailyBrief, LLMHiddenCostItem, LLMHiddenCostResponse types exist in types/index.ts
3. react-native-reanimated is installed and configured in both app.json and babel.config.js
4. MockAdapter.predict() returns hidden cost JSON when prompt contains HIDDEN_COST_PROMPT_MARKER
5. predictionService.ts exports predictHiddenCosts(), buildEventCostBreakdowns(), parseHiddenCostResponse(), findSimilarTransactions(), generateDailyBrief(), and buildHiddenCostPrompt()
6. predictionStore has hiddenCosts[], eventCostBreakdowns, dailyBrief, isAnalyzingHiddenCosts state fields
7. predictionStore has analyzeHiddenCosts(), dismissHiddenCost(), generateDailyBrief() actions and clear() resets all new fields
8. HiddenCostBreakdown.tsx component exists with collapsed, expanded, and compact visual states
9. Calendar day-detail modal renders HiddenCostBreakdown (collapsed by default) when eventCostBreakdowns has data for the event
10. Plan screen prediction cards render HiddenCostBreakdown (expanded by default) when eventCostBreakdowns has data
11. `grep -r 'HiddenCostBreakdown' /workspace/app/app/(tabs)/calendar.tsx /workspace/app/app/(tabs)/plan.tsx` shows imports in both files
</promise>
