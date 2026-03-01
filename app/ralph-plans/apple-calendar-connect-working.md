---
task_type: feature
workflow: feature-development
current_phase: F8
completed_phases: [F1, F2, F3, F4, F5, F6, F7]
uat_fast_forward: false
session_name: apple-calendar-connect
decomposed: false
context_pressure: null
context_budget: null
---

## Discovery (F1) Summary

User wants a UI element in the calendar screen that:
- Uses `expo-calendar` (device native calendar via EventKit)
- Shows an "Import button + status" — a "Connect Calendar" button with sync state
- Merges imported events into existing CalendarEvent store
- Detects EAS build via `Constants.expoConfig`; falls back to mock in Expo Go
- Simulates full import flow in mock mode (fake permission prompt, loading, then mock events)
- Button placement: below the calendar grid

## Exploration (F2) Findings

### Existing Infrastructure (KEY — most plumbing already exists)
1. **`expo-calendar` v15.0.8** already installed, permissions configured in `app.json`
2. **`connectAppleCalendar(userId)`** in `src/services/calendarService.ts:79-150` — requests permission, fetches 90 days of events, maps to CalendarEvent, persists to Supabase
3. **`calendarStore.connectAppleCalendar(userId)`** in `src/stores/calendarStore.ts:139-157` — calls the service, merges events
4. **Onboarding flow** at `app/onboarding/connect-calendar.tsx` — full working implementation with permission handling, error alerts
5. **`isDemoMode()`** in `src/lib/supabase.ts:18-22` — checks env vars
6. **`expo-constants` v18.0.13** installed but NOT currently used for build detection

### Key Files
| File | Lines | Role |
|------|-------|------|
| `app/(tabs)/calendar.tsx` | 1080 | Main calendar screen — integration target |
| `src/stores/calendarStore.ts` | 180 | Calendar state management |
| `src/services/calendarService.ts` | 391 | Native calendar integration + demo data |
| `src/lib/supabase.ts` | ~30 | isDemoMode() utility |
| `app/onboarding/connect-calendar.tsx` | 269 | Existing calendar connect flow (reference) |
| `src/types/index.ts` | 480+ | CalendarEvent type definition |

### No EAS Detection Exists
The app currently hardcodes alerts about EAS requirements. No programmatic build-type detection.

### Demo Data Pattern
- `loadDemoData(userId, persona?)` loads from JSON files
- Two personas: sarah, marcus
- Events auto-categorized via keyword detection
