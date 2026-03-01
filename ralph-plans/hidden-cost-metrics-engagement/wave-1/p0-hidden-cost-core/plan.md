# Wave 1: P0 Hidden Cost Core — Plan Metadata

## Task Type
Feature implementation (P0 priority — core hidden cost prediction engine and UI)

## Summary
Implement the hidden cost prediction engine: new TypeScript types, LLM prompt builder/parser, mock adapter extension, predictionStore state management, HiddenCostBreakdown reusable component with react-native-reanimated animations, and integration into calendar day-detail modal and plan screen prediction cards.

## Codebase Context
- React Native 0.81 + Expo SDK 54 + TypeScript + Zustand v5
- LLM Adapter pattern (Claude/Gemini/Mock) with factory + lazy imports
- Prediction pipeline: buildPrompt → adapter.predict → extractJSON → parse → validate → store
- Mock adapter uses KEYWORD_RULES for realistic amounts
- Demo mode gated by `isDemoMode()` — no Supabase calls when true
- Dark theme UI with Colors/Typography/Spacing constants
- No animation libraries installed — react-native-reanimated will be added

## Chosen Approach
**Pragmatic Balance (Approach A)**: Per-event hidden cost prompts via Promise.allSettled(), pre-computed store breakdowns, react-native-reanimated for expand/collapse + stagger + tier dot pulse animations, mock adapter keyword-based rules for both personas.

### Rationale
- Per-event prompting gives higher quality predictions than batch
- Promise.allSettled() handles partial failures gracefully
- Pre-computed breakdowns in store prevent UI recomputation
- react-native-reanimated is the standard for Expo animations (better than LayoutAnimation)
- Mock keyword rules follow existing KEYWORD_RULES pattern in mock.ts

## Recommended --max-iterations
**8 iterations** — 6 phases with moderate complexity each. Phase 5 (component) and Phase 6 (integration into 2 screens) are the most complex. Extra iterations for compilation fixes.

## Context Budget Estimate
- **Pressure rating**: Moderate (34.6%)
- **Peak iteration tokens**: ~69,200 / 200,000
- **File breakdown**: 10 files (9 small, 1 medium — calendar.tsx at 1123 lines)
- **Estimated cost range**: $2.50 - $6.00
- **Disclaimer**: Estimates are approximate. Actual costs depend on model, iteration count, and complexity of compilation fixes.

## Unresolved Warnings
None — all validator issues from initial round have been addressed in the revised prompt.
