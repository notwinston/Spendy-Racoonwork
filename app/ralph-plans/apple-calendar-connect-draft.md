You are iterating on a React Native + Expo feature: "Apple Calendar Connect Card" for the FutureSpend budgeting app.

## Cold Start — State Detection

Before doing anything, check what already exists:
1. Run: git log --oneline -5
2. Run: test -f /workspace/app/src/components/CalendarConnectCard.tsx && echo "COMPONENT_EXISTS" || echo "COMPONENT_MISSING"
3. Run: grep -c "CalendarConnectCard" /workspace/app/app/\(tabs\)/calendar.tsx 2>/dev/null || echo "0"
4. Run: npx tsc --noEmit 2>&1 | tail -20; echo "TSC_EXIT_CODE:$?"

Use the results to determine which phase to resume from (first match wins):
1. If COMPONENT_MISSING → start at Phase 1
2. If COMPONENT_EXISTS but tsc output contains errors mentioning `CalendarConnectCard` → fix Phase 1 component errors, then re-verify Phase 1
3. If COMPONENT_EXISTS and CalendarConnectCard count in calendar.tsx is 0 → start at Phase 2 (ignore tsc errors in unrelated files)
4. If CalendarConnectCard count in calendar.tsx > 0 and tsc output contains errors mentioning `CalendarConnectCard` or `calendar.tsx` → fix the errors in YOUR files only
5. If CalendarConnectCard count in calendar.tsx > 0 and tsc either passes OR only fails in files outside your scope → run the Final Verification block and emit the promise phrase if all pass

## Requirements

Build a "Connect Apple Calendar" card that appears below the calendar grid on the main calendar screen. The card lets users import their real Apple Calendar events (in EAS builds) or simulates the import with mock data (in Expo Go / dev builds).

**Existing Infrastructure (DO NOT REBUILD — reuse these):**
- `calendarStore.connectAppleCalendar(userId: string)` — already handles: requesting calendar permission via expo-calendar, fetching 90 days of events, mapping to CalendarEvent type, merging with existing events, persisting to Supabase. Located in `src/stores/calendarStore.ts` lines 139-157. This action throws on permission denial.
- `calendarStore.loadDemoData(userId: string, persona?: 'sarah' | 'marcus')` — loads mock events from JSON files. Located in `src/stores/calendarStore.ts` lines 127-137. NOTE: This function catches its own errors internally with `console.warn` and does NOT re-throw. Your try/catch will NOT catch errors from this function. To detect failure, check if `events.length` is still 0 after the call returns.
- `calendarStore.events` — the CalendarEvent[] array. Use `events.length` to determine if events are already loaded.
- `calendarStore.isLoading` — boolean, true during async operations.
- `useAuthStore` — `user?.id` for the userId parameter. Already used in `calendar.tsx` as `const user = useAuthStore((s) => s.user)`.
- `expo-constants` v18.0.13 — already installed, use `Constants.appOwnership` for EAS detection.
- `Card` component from `src/components/ui/Card` — NAMED export. Import as `import { Card } from './ui/Card'`. Wraps content in bgCard + borderSubtle styling.
- `Button` component from `src/components/ui/Button` — NAMED export. Import as `import { Button } from './ui/Button'`. Has `title`, `onPress`, `variant` ('primary'|'secondary'|'ghost'|'danger'), `loading`, `disabled` props.
- `Colors`, `Typography`, `Spacing` from `src/constants` — design tokens.
- `Ionicons` from `@expo/vector-icons` — icon library.

**What to Build:**

### CalendarConnectCard Component (`src/components/CalendarConnectCard.tsx`)

A self-contained component with all logic and UI in one file. Use `export default function CalendarConnectCard`.

**Props:**
```typescript
interface CalendarConnectCardProps {
  userId: string;
}
```

The component accepts `userId` as a prop. Do NOT import `useAuthStore` inside this component — the parent (`calendar.tsx`) already has the user and will pass the userId prop.

**EAS Build Detection (private function in same file):**
```typescript
import Constants from 'expo-constants';

function isEASBuild(): boolean {
  return Constants.appOwnership !== 'expo';
}
```
In Expo Go, `Constants.appOwnership` is `'expo'`. In EAS standalone builds, it is `null` or `undefined`.

**Internal State:**
- `status`: `'idle' | 'loading' | 'connected' | 'error'` — tracks the card's visual state
- `errorMessage`: `string | null` — error text for the error state

**Derived State:**
- `eventCount` from `useCalendarStore().events.length`
- On mount (or when events change): if `events.length > 0` and status is still `'idle'`, set status to `'connected'`. This handles the case where the auto-load useEffect in calendar.tsx has already populated events before the user taps Connect. Use a `useEffect` watching `events.length`. If adding `status` to the dependency array causes an infinite loop, use a ref:
  ```typescript
  const hasAutoDetected = useRef(false);
  useEffect(() => {
    if (events.length > 0 && !hasAutoDetected.current && status === 'idle') {
      hasAutoDetected.current = true;
      setStatus('connected');
    }
  }, [events.length]);
  ```

**Connect Flow (`handleConnect`):**
- If `isEASBuild()` is true (real EAS build):
  1. Set status to `'loading'`
  2. Call `await connectAppleCalendar(userId)` from the calendar store
  3. On success: set status to `'connected'`
  4. On error: check if error message includes `'permission'` (case insensitive). If so, set errorMessage to `'Calendar permission is required. Please enable it in Settings.'`. Otherwise set errorMessage to the error message. Set status to `'error'`.

- If `isEASBuild()` is false (Expo Go / dev):
  1. Show `Alert.alert()` simulating an iOS permission prompt:
     - Title: `'"FutureSpend" Would Like to Access Your Calendar'`
     - Message: `'This will import your upcoming events to predict spending.'`
     - Buttons: `[{ text: "Don't Allow", style: 'cancel' }, { text: 'Allow', onPress: <mock import function> }]`
  2. The mock import function (on "Allow") — IMPORTANT: extract this as a separate named async function (e.g., `const handleMockImport = async () => { ... }`) and reference it in the Alert button as `onPress: () => { handleMockImport(); }`. The non-async wrapper avoids `Promise<void>` vs `() => void` type issues:
     a. Set status to `'loading'`
     b. Wait 1200ms (`await new Promise(r => setTimeout(r, 1200))`) to simulate loading
     c. Call `await loadDemoData(userId)` from the calendar store
     d. Check if `useCalendarStore.getState().events.length > 0` after the call (since loadDemoData swallows errors AND the destructured `events` variable holds stale pre-render state — you MUST read the store directly via `getState()`). If yes: set status to `'connected'`. If no: set errorMessage to `'Failed to load sample calendar data.'`, set status to `'error'`.

**Re-sync Flow (`handleResync`):**
- Same logic as `handleConnect` — re-runs the appropriate flow (real or mock).

**UI States (rendered inside a `<Card>` wrapper with `style={{ marginHorizontal: Spacing.lg, marginTop: Spacing.md }}`)**

Use the local `status` state to determine which state to render. Do NOT use `calendarStore.isLoading` for the spinner — use `status === 'loading'` since it is already managed by `handleConnect`.

1. **Idle state** (status === 'idle'):
   - Row layout (`flexDirection: 'row', alignItems: 'center', gap: Spacing.md`):
     - Left: `Ionicons name="calendar-outline" size={24} color={Colors.accentBright}`
     - Center (flex: 1): "Apple Calendar" as title (`fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary`), "Import your events to predict spending" as subtitle (`fontSize: Typography.sizes.sm, color: Colors.textSecondary`)
     - Right: `<Button title="Connect" variant="primary" onPress={handleConnect} />`

2. **Loading state** (status === 'loading'):
   - Row layout: `ActivityIndicator size="small" color={Colors.accentBright}` + "Importing calendar events..." text (`color: Colors.textSecondary`)

3. **Connected state** (status === 'connected'):
   - Row layout:
     - `Ionicons name="checkmark-circle" size={20} color={Colors.positive}`
     - "Connected" text (`color: Colors.positive, fontWeight: Typography.weights.semibold`)
     - `"{eventCount} events imported"` text (`color: Colors.textSecondary`, flex: 1)
     - `<Button title="Sync" variant="ghost" onPress={handleResync} />`

4. **Error state** (status === 'error'):
   - `Ionicons name="alert-circle" size={20} color={Colors.danger}`
   - Error message text (`color: Colors.danger, fontSize: Typography.sizes.sm`)
   - `<Button title="Retry" variant="secondary" onPress={handleConnect} />`

**Styling:**
- Use `StyleSheet.create({...})` with design tokens throughout
- Row layouts use `flexDirection: 'row'`, `alignItems: 'center'`, `gap: Spacing.md`

### Calendar Screen Integration (`app/(tabs)/calendar.tsx`)

Minimal changes — just import and render:

1. Add import: `import CalendarConnectCard from '../../src/components/CalendarConnectCard';`
2. Find the line containing `viewMode === 'month' ? renderMonthView() : renderWeekView()` (search by pattern, NOT line number — line numbers may have shifted). Immediately AFTER that line, before the Quick Day Summary section, add:
   ```tsx
   {/* Calendar Connect */}
   <CalendarConnectCard userId={user?.id ?? 'demo-user'} />
   ```
3. That's it. No other changes to calendar.tsx.

## File Structure

**Files to CREATE (1):**
1. `src/components/CalendarConnectCard.tsx` — the calendar connect card component (~150-180 lines)

**Files to EDIT (1):**
2. `app/(tabs)/calendar.tsx` — import CalendarConnectCard + render after calendar view (~3 lines added)

## Phases

Execute phases in strict order. Do NOT skip ahead. After completing each phase, verify it passes before moving to the next.

### Phase 1: Create CalendarConnectCard Component

**Do:**
Create `/workspace/app/src/components/CalendarConnectCard.tsx`:

1. Imports:
   - `React, { useState, useEffect, useRef }` from 'react'
   - `{ View, Text, Alert, ActivityIndicator, StyleSheet }` from 'react-native'
   - `Constants` from 'expo-constants'
   - `{ Ionicons }` from '@expo/vector-icons'
   - `{ Colors, Typography, Spacing }` from '../constants'
   - `{ Card }` from './ui/Card' (NAMED import — not default)
   - `{ Button }` from './ui/Button' (NAMED import — not default)
   - `{ useCalendarStore }` from '../stores/calendarStore'

2. Define `isEASBuild()` function (see Requirements).

3. Use `export default function CalendarConnectCard({ userId }: CalendarConnectCardProps)`.

4. Implement the component with all 4 states (see Requirements for full UI specification).

5. Add `useEffect` to detect if events are already loaded on mount (see Requirements for pattern with ref to avoid infinite loops).

6. Implement `handleConnect` and `handleResync` functions (see Requirements for full logic).

7. Style with `StyleSheet.create({...})` using design tokens.

**Verify:**
```bash
test -f /workspace/app/src/components/CalendarConnectCard.tsx && echo "COMPONENT_OK"
grep "export default" /workspace/app/src/components/CalendarConnectCard.tsx && echo "DEFAULT_EXPORT_OK"
grep "isEASBuild\|appOwnership" /workspace/app/src/components/CalendarConnectCard.tsx && echo "EAS_DETECT_OK"
grep "connectAppleCalendar" /workspace/app/src/components/CalendarConnectCard.tsx && echo "REAL_CONNECT_OK"
grep "loadDemoData" /workspace/app/src/components/CalendarConnectCard.tsx && echo "MOCK_CONNECT_OK"
grep "Alert.alert" /workspace/app/src/components/CalendarConnectCard.tsx && echo "MOCK_PERMISSION_OK"
grep "'idle'" /workspace/app/src/components/CalendarConnectCard.tsx && grep "'loading'" /workspace/app/src/components/CalendarConnectCard.tsx && grep "'connected'" /workspace/app/src/components/CalendarConnectCard.tsx && grep "'error'" /workspace/app/src/components/CalendarConnectCard.tsx && echo "STATES_OK"
grep -i "events imported\|eventCount\|events.length" /workspace/app/src/components/CalendarConnectCard.tsx && echo "EVENT_COUNT_OK"
grep -i "resync\|re-sync\|handleResync\|title=\"Sync\"" /workspace/app/src/components/CalendarConnectCard.tsx && echo "RESYNC_OK"
grep "from.*Card\|{ Card }" /workspace/app/src/components/CalendarConnectCard.tsx && echo "CARD_IMPORT_OK"
grep "Button" /workspace/app/src/components/CalendarConnectCard.tsx && echo "BUTTON_USAGE_OK"
grep "useEffect" /workspace/app/src/components/CalendarConnectCard.tsx && echo "EFFECT_OK"
grep "1200" /workspace/app/src/components/CalendarConnectCard.tsx && echo "MOCK_DELAY_OK"
grep "ActivityIndicator" /workspace/app/src/components/CalendarConnectCard.tsx && echo "ACTIVITY_INDICATOR_OK"
grep -i "permission" /workspace/app/src/components/CalendarConnectCard.tsx && echo "PERMISSION_HANDLING_OK"
npx tsc --noEmit 2>&1 | tail -20; echo "TSC_EXIT_CODE:$?"
```

All lines must show their "_OK" suffix. TSC_EXIT_CODE must be 0. If tsc errors appear ONLY in files you did NOT touch, those are pre-existing — note them but focus on fixing errors in YOUR files.

**Git:** `git add src/components/CalendarConnectCard.tsx && git commit -m "feat(calendar-connect): create CalendarConnectCard component"`

### Phase 2: Integrate into Calendar Screen

**Do:**
Edit `/workspace/app/app/(tabs)/calendar.tsx`:

1. Add import at the top with the other component imports:
   ```typescript
   import CalendarConnectCard from '../../src/components/CalendarConnectCard';
   ```

2. Find the line containing `viewMode === 'month' ? renderMonthView() : renderWeekView()` by searching the file. Do NOT rely on line numbers.
3. Immediately AFTER that line (before the Quick Day Summary section), add:
   ```tsx
   {/* Calendar Connect */}
   <CalendarConnectCard userId={user?.id ?? 'demo-user'} />
   ```

4. Do NOT change anything else in calendar.tsx. No state additions, no store changes, no restructuring.

**Verify:**
```bash
grep "import CalendarConnectCard" /workspace/app/app/\(tabs\)/calendar.tsx && echo "IMPORT_LINE_OK"
grep "CalendarConnectCard" /workspace/app/app/\(tabs\)/calendar.tsx | grep -v "import" && echo "RENDER_OK"
grep "userId" /workspace/app/app/\(tabs\)/calendar.tsx | grep -i "calendarconnect\|demo-user" && echo "USERID_PROP_OK"
npx tsc --noEmit 2>&1 | tail -20; echo "TSC_EXIT_CODE:$?"
```

**Git:** `git add app/\(tabs\)/calendar.tsx && git commit -m "feat(calendar-connect): integrate CalendarConnectCard into calendar screen"`

## Final Verification (run ALL before emitting promise)

Run every command below. ALL must produce their expected "_OK" output, and TSC_EXIT_CODE must be 0. If ANY fails, fix the issue and re-verify. Do NOT emit the completion promise until every single check passes.

```bash
# Phase 1 checks
test -f /workspace/app/src/components/CalendarConnectCard.tsx && echo "COMPONENT_OK"
grep "export default" /workspace/app/src/components/CalendarConnectCard.tsx && echo "DEFAULT_EXPORT_OK"
grep "isEASBuild\|appOwnership" /workspace/app/src/components/CalendarConnectCard.tsx && echo "EAS_DETECT_OK"
grep "connectAppleCalendar" /workspace/app/src/components/CalendarConnectCard.tsx && echo "REAL_CONNECT_OK"
grep "loadDemoData" /workspace/app/src/components/CalendarConnectCard.tsx && echo "MOCK_CONNECT_OK"
grep "Alert.alert" /workspace/app/src/components/CalendarConnectCard.tsx && echo "MOCK_PERMISSION_OK"
grep "'idle'" /workspace/app/src/components/CalendarConnectCard.tsx && grep "'loading'" /workspace/app/src/components/CalendarConnectCard.tsx && grep "'connected'" /workspace/app/src/components/CalendarConnectCard.tsx && grep "'error'" /workspace/app/src/components/CalendarConnectCard.tsx && echo "STATES_OK"
grep -i "events imported\|eventCount\|events.length" /workspace/app/src/components/CalendarConnectCard.tsx && echo "EVENT_COUNT_OK"
grep -i "resync\|re-sync\|handleResync\|title=\"Sync\"" /workspace/app/src/components/CalendarConnectCard.tsx && echo "RESYNC_OK"
grep "from.*Card\|{ Card }" /workspace/app/src/components/CalendarConnectCard.tsx && echo "CARD_IMPORT_OK"
grep "Button" /workspace/app/src/components/CalendarConnectCard.tsx && echo "BUTTON_USAGE_OK"
grep "useEffect" /workspace/app/src/components/CalendarConnectCard.tsx && echo "EFFECT_OK"
grep "1200" /workspace/app/src/components/CalendarConnectCard.tsx && echo "MOCK_DELAY_OK"
grep "ActivityIndicator" /workspace/app/src/components/CalendarConnectCard.tsx && echo "ACTIVITY_INDICATOR_OK"
grep -i "permission" /workspace/app/src/components/CalendarConnectCard.tsx && echo "PERMISSION_HANDLING_OK"

# Phase 2 checks
grep "import CalendarConnectCard" /workspace/app/app/\(tabs\)/calendar.tsx && echo "IMPORT_LINE_OK"
grep "CalendarConnectCard" /workspace/app/app/\(tabs\)/calendar.tsx | grep -v "import" && echo "RENDER_OK"
grep "userId" /workspace/app/app/\(tabs\)/calendar.tsx | grep -i "calendarconnect\|demo-user" && echo "USERID_PROP_OK"

# TypeScript compilation
npx tsc --noEmit 2>&1 | tail -20; echo "TSC_EXIT_CODE:$?"

# Git commits
git log --oneline | grep "feat(calendar-connect):" | wc -l
```

Expected: all "_OK" checks pass, TSC_EXIT_CODE:0, and commit count is 2.

## Rules

1. **File scope — ONLY modify these files:**
   - CREATE: `src/components/CalendarConnectCard.tsx`
   - EDIT: `app/(tabs)/calendar.tsx` (add import + render only — ~3 lines)
   - Do NOT modify any other file. Do NOT modify calendarStore, calendarService, types, supabase, or any other store/service.

2. **Do NOT rewrite calendar.tsx.** Only add 1 import line and 2 render lines. Do not restructure, reformat, or refactor any existing code.

3. **Do NOT rewrite CalendarConnectCard.tsx from scratch on each iteration.** If Phase 1 verification fails, make targeted edits to the existing file. Deleting and recreating the file loses incremental progress and wastes iterations.

4. **TypeScript strict.** Every file must pass `npx tsc --noEmit`. Run this after every phase. If it fails, fix the errors before committing.

5. **Reuse existing code:**
   - Use `connectAppleCalendar(userId)` from calendarStore — do NOT re-implement permission requests or event fetching
   - Use `loadDemoData(userId)` from calendarStore — do NOT create new mock data
   - Use `{ Card }` and `{ Button }` from `src/components/ui/` — NAMED imports, NOT default imports
   - Use `Colors`, `Typography`, `Spacing` from `src/constants`
   - Use `Ionicons` from `@expo/vector-icons`

6. **Git — local only.** Commit after each phase with the message shown. Do NOT push to remote.

7. **Regression check.** Run `npx tsc --noEmit` after EVERY phase. If a phase introduces errors, fix them before committing.

8. **Do NOT modify verification commands.** The verification grep/tsc commands are the acceptance criteria. Never weaken, skip, or alter them to force a pass.

9. **Pre-existing TypeScript errors.** If `npx tsc --noEmit` reports errors ONLY in files you did not create or edit (i.e., not in `src/components/CalendarConnectCard.tsx` or `app/(tabs)/calendar.tsx`), those are pre-existing. Note them but do not attempt to fix them. Only fix errors in files within your scope.

10. **Search by pattern, not line number.** When editing `calendar.tsx`, find the insertion point by searching for the string `viewMode === 'month' ? renderMonthView() : renderWeekView()`, not by relying on specific line numbers. Line numbers may have shifted.

11. **Do NOT remove required functionality to fix errors.** If tsc fails on a block of code (e.g., handleConnect, useEffect, Alert.alert), fix the TYPE issue — do not delete the code block, replace it with a stub, or remove error handling. All 4 UI states (idle, loading, connected, error) and both code paths (EAS and Expo Go) must be present in the final component.

12. **Check store state directly after loadDemoData.** Because loadDemoData swallows errors, and the destructured `events` variable holds stale (pre-render) state, check the store directly after calling loadDemoData: `useCalendarStore.getState().events.length > 0`. Do NOT rely on the component-scoped `events` variable for this check.

## Stuck-State Handling

- **Error diagnosis rule (DO THIS FIRST)**: Before retrying any fix, read and understand the FULL error message. Determine if it's: (a) import/type resolution → check file path and export style, (b) missing module → check if package is installed, (c) type mismatch → check the actual function signature in the store file. Do NOT blindly retry the same fix.
- **expo-constants import fails**: Try `import * as Constants from 'expo-constants'` instead of default import. If that also fails, fall back to `const isEASBuild = () => false` (always mock mode) with a `// TODO: add proper EAS detection` comment.
- **"has no default export" error for Card or Button**: These are NAMED exports. Use `import { Card } from './ui/Card'` and `import { Button } from './ui/Button'`. Do NOT use `import Card from './ui/Card'`.
- **connectAppleCalendar or loadDemoData type mismatch**: Read the calendarStore file (`/workspace/app/src/stores/calendarStore.ts`) to check the exact function signatures. Adapt the call to match the actual signature.
- **Alert.alert not showing buttons correctly**: Ensure the buttons array uses the correct format: `[{ text: string, style?: 'cancel' | 'default' | 'destructive', onPress?: () => void }]`.
- **useEffect infinite loop**: If adding `status` to the useEffect dependency array causes an infinite loop, use the ref pattern described in the Requirements section (`hasAutoDetected` ref).
- **useCalendarStore destructuring**: Use the direct destructuring pattern: `const { events, connectAppleCalendar, loadDemoData, isLoading } = useCalendarStore()`. Do NOT use selector functions.
- **events.length is 0 after loadDemoData**: The destructured `events` from `useCalendarStore()` reflects the PREVIOUS render's state. To check if loadDemoData succeeded, read the store directly: `useCalendarStore.getState().events.length > 0`. Alternatively, call loadDemoData, then unconditionally set status to `'connected'`, and let the useEffect on `events.length` handle the UI update.
- **Alert.alert onPress async type error**: The `onPress` callback expects `() => void`. An async arrow returns `Promise<void>`. If tsc complains, extract the async logic into a named async function (`const handleMockImport = async () => { ... }`) and reference it as `onPress: () => { handleMockImport(); }`. The non-async wrapper discards the Promise.
- **CalendarConnectCard import path fails in calendar.tsx**: Check how other components are imported in calendar.tsx. Existing imports use `../../src/components/...` (e.g., `import { HiddenCostBreakdown } from '../../src/components/HiddenCostBreakdown'`). Use the same relative pattern.
- **TypeScript error after 2 attempts**: Simplify. Replace complex types with explicit inline types. If a store hook return type doesn't match, use type assertions. "2 attempts" means 2 DIFFERENT code variations targeting the diagnosed root cause, not 2 identical retries.
- **Generic stuck-state escalation**: If you have attempted 3 DIFFERENT code variations for the same error, try a fundamentally different approach. If after 2 fundamentally different approaches it still fails, skip with a `// TODO: [description]` comment and move on.
- **Phase 1 is critical** — it's the entire component. Exhaust all stuck-state escalation paths before considering it blocked. Phase 2 depends on Phase 1. If Phase 1 is blocked, do NOT attempt Phase 2.
- **Global iteration budget**: If you have spent more than 12 tool-call cycles on Phase 1 without passing ALL verification checks, stop. Re-read the FULL list of tsc errors. List every distinct error. Then fix them in order, one at a time, verifying after each fix.
- **BLOCKED escape hatch**: If after exhausting all escalation paths (3 variations per error, 2 fundamentally different approaches) you still cannot pass `npx tsc --noEmit` for your files, emit `// BLOCKED: [brief description]` as a comment in the file and stop. Do NOT emit the completion promise.

## Completion Signal

When ALL phases are complete and the Final Verification block passes with every "_OK" check and TSC_EXIT_CODE:0, emit this exact phrase on its own line:

<promise>apple-calendar-connect-complete</promise>

Do NOT emit this phrase until every phase is done and verified. Do NOT emit it if any `npx tsc --noEmit` check fails. Do NOT emit it if any file is missing. Do NOT emit it if any "_OK" check in the Final Verification block is missing. Verify ALL criteria before emitting.
