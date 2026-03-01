---
task_type: feature
workflow: feature-development
current_phase: F3
completed_phases: [F1, F2]
uat_fast_forward: false
session_name: hidden-cost-metrics-engagement
decomposed: true
sub_workflows:
  - name: p0-hidden-cost-core
    type: feature
    wave: 1
    current_phase: F3
    completed_phases: []
  - name: p1-daily-brief-metrics
    type: feature
    wave: 2
    current_phase: F3
    completed_phases: []
  - name: p2-notifications-badges-migration
    type: feature
    wave: 3
    current_phase: F3
    completed_phases: []
  - name: p3-scheduled-briefs-advanced
    type: feature
    wave: 4
    current_phase: F3
    completed_phases: []
---

## Task Description
Implement the full FutureSpend Segmentation spec (P0-P3): hidden cost predictions, new metrics (CCI, Spending Velocity, Surprise Spend Ratio, Event Cost Variance), engagement loops, DailyBriefCard, HiddenCostBreakdown component, notifications, badges, and Supabase migration. Both demo mode + real API. Both personas (Sarah + Marcus). Test via Expo Go on device.

## F1 Discovery Decisions
- **Scope**: Full P0-P3 (all priorities)
- **Demo mode**: Both (mock fallback + real API when keys present)
- **Testing**: Expo Go on device
- **Personas**: Both equally (Sarah + Marcus)

## F2 Codebase Exploration Findings

### Architecture Overview
- React Native 0.81 + Expo SDK 54 + TypeScript
- Zustand v5 for state management (9 stores)
- LLM Adapter pattern: Claude/Gemini/Mock with factory + lazy imports
- Demo mode: `isDemoMode()` in lib/supabase.ts gates all data access
- File-based routing via Expo Router
- Dark theme UI with constants (Colors, Typography, Spacing)
- No animation libraries installed — only built-in LayoutAnimation available

### Critical Files & Line Counts

| File | Lines | Role |
|------|-------|------|
| `src/types/index.ts` | 432 | All TypeScript types — HiddenCost types go after line 229 |
| `src/services/predictionService.ts` | 313 | Prediction pipeline — add `buildHiddenCostPrompt()` after line 96, `predictHiddenCosts()` after line 289 |
| `src/services/llm/mock.ts` | 213 | Mock adapter — add `buildMockHiddenCostResponse()` for demo mode |
| `src/services/llm/adapter.ts` | 73 | Adapter interface — NO changes needed (prompt-agnostic) |
| `src/stores/predictionStore.ts` | 161 | Prediction state — add `hiddenCosts[]`, `dailyBrief`, `analyzeHiddenCosts()` |
| `app/(tabs)/calendar.tsx` | 1123 | Day detail modal lines 379-527 — insert HiddenCostBreakdown after line 516 |
| `app/(tabs)/plan.tsx` | 885 | Prediction cards lines 286-334 — insert hidden cost summary after line 330 |
| `app/(tabs)/dashboard.tsx` | 431 | Insert DailyBriefCard between line 114 (ScrollView) and line 115 (Hero Card) |
| `app/(tabs)/insights.tsx` | 354 | New metric sections after line 214 (Score Breakdown) |
| `src/stores/budgetStore.ts` | 258 | `calculateHealthScore()` at lines 229-247 — extend to v2 formula |
| `src/services/gamificationService.ts` | 1024 | Badge definitions at line 972, `evaluateCondition()` at line 477 — add hidden cost badges |
| `src/stores/gamificationStore.ts` | 345 | Store facade for gamification — delegates to service |
| `src/stores/notificationStore.ts` | 197 | Notification preferences + demo data — add hidden cost alert category |
| `src/stores/socialStore.ts` | 395 | Nudge system — for pre-event hidden cost notifications |
| `src/stores/transactionStore.ts` | 178 | Transaction loading — for matching predictions to actuals |
| `src/stores/calendarStore.ts` | 179 | Calendar events — demo data flow via calendarService |
| `src/services/calendarService.ts` | 391 | Demo data loading + category detection |
| `src/constants/colors.ts` | 56 | Colors.positive=#22C55E, Colors.warning=#FFB020, Colors.danger=#FF4757 |
| `src/components/ui/Card.tsx` | 23 | Card pattern: View + Colors.card bg + borderRadius 16 + padding Spacing.lg |
| `src/components/ui/Button.tsx` | 96 | Button: 3 variants (primary/secondary/outline), loading state |
| `src/lib/supabase.ts` | 36 | isDemoMode(), isSupabaseConfigured |
| `supabase/migrations/011_*` | latest | SQL pattern: UUID PKs, gen_random_uuid(), RLS, indexes |

### Existing Prediction Pipeline
1. Calendar loads events → `calendarStore.loadDemoData(userId, 'sarah'|'marcus')`
2. Screen triggers `predictionStore.generatePredictions(events, userId)`
3. Service calls `buildSpendingPrompt(events)` → `adapter.predict(prompt)`
4. Mock adapter uses keyword rules to generate realistic amounts
5. Response parsed via `extractJSON()` → validated → stored in predictionStore
6. Screens render via `predictionMap.get(event.id)`

### Existing Health Score v1 Formula
```
HealthScore = 0.35 × BurnRate + 0.30 × Adherence + 0.15 × Streak + 0.20 × Savings
```
Pure function exported from budgetStore.ts — called by dashboard + insights screens.

### Demo Data
- Sarah: ~200 events (education, dining, fitness, social) — SFU campus setting
- Marcus: ~180 events (professional, fitness, social) — Gastown/Vancouver

### Key Conventions
- Named function exports for components
- StyleSheet.create() at bottom of files
- Colors/Typography/Spacing constants exclusively (no inline hex)
- SafeAreaView wrapper for screens
- Supabase migrations: `CREATE TABLE IF NOT EXISTS`, UUID PKs, RLS policies, indexes
- Error pattern: try/catch, set error state, Alert.alert() for user-facing

### Existing Badge Condition Types (evaluateCondition in gamificationService.ts:477)
- `'streak'` — FUNCTIONAL
- `'challenges_completed'` — FUNCTIONAL
- `'any_streak'` — FUNCTIONAL
- All others (budget_streak, savings_total, accurate_predictions, cci_streak, etc.) — return false (NOT IMPLEMENTED)

### Animation Constraints
- No react-native-reanimated or moti installed
- Only LayoutAnimation (built-in) available
- Android needs `UIManager.setLayoutAnimationEnabledExperimental(true)`
