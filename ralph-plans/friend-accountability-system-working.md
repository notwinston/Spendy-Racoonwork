---
task_type: feature
workflow: feature-development
current_phase: F3
completed_phases: [F1, F2]
uat_fast_forward: false
session_name: friend-accountability-system
decomposed: false
context_pressure: null
context_budget: null
---

## F1: Discovery Decisions

- **Shared data**: Score + summary stats (health score, savings rate %, burn rate, streak, adherence %) — NO dollar amounts
- **UI location**: Arena tab (existing) — build on what's there
- **Accountability features**: ALL 3 — score comparison, challenges, AND nudges
- **Approach**: Fix and extend — debug existing code, then add features

## F2: Codebase Exploration Findings

### Critical Bugs Found

1. **getPendingRequests returns both sent/received** (socialService.ts ~line 345-362)
   - Filters on `user_id === userId || friend_id === userId` — should only return where userId is `friend_id` (received requests)

2. **Friend code not persisted in demo mode** (authStore.ts ~line 136)
   - `generateFriendCode()` called on EVERY sign-in — should be deterministic for demo users
   - Persona logins (sarah/marcus) have hardcoded codes but regular demo login doesn't

3. **Pending requests show "Friend Request"** instead of sender name (arena.tsx ~line 442)
   - `getPendingRequests()` returns bare `Friendship[]` — no profile data attached
   - UI can't display who sent the request

4. **Friends-scoped leaderboard doesn't filter** (arena.tsx, gamificationService.ts)
   - `leaderboardScope` state exists but `fetchLeaderboard()` ignores scope entirely
   - All 3 scopes (global/friends/circle) show identical data

5. **Demo friendship data violates sortIds constraint** (socialService.ts ~line 93)
   - `user_id: 'demo-friend-1'` > `friend_id: 'demo-user'` alphabetically — violates own CHECK

### What Exists & Works

- Friend code generation (8-char, no ambiguous chars)
- sendFriendRequest via code lookup (service + store + UI)
- acceptFriendRequest (basic flow works)
- getFriends returns FriendWithProfile with profile data
- Arena Friends tab: code display, TextInput, friend list, circles, privacy toggles
- Nudge system infrastructure (sendNudge, rate-limited 3/day per recipient)
- Rank tier system (Bronze→Diamond based on savings rate)
- RankCard, RankWidget components exist
- Privacy controls (socialOptIn, anonymousMode, profileVisibility)

### What's Missing

- **No copy button** for friend code
- **No friend comparison UI** — no accountability buddy features at all
- **No friend-filtered leaderboard** — service has no scope parameter
- **No reject friend request** — only accept exists
- **No remove friend button** in UI (service function exists)
- **No referral XP** — type defined but no logic awards it
- **No nudge UI** — sendNudge exists but no button to trigger it
- **No challenge system** between friends
- **No friend detail/profile view**

### Key Files

| File | Lines | Role |
|------|-------|------|
| src/services/socialService.ts | ~660 | Service layer: friend requests, nudges, circles |
| src/stores/socialStore.ts | ~230 | Zustand store for social state |
| src/stores/authStore.ts | ~200 | Auth + friend code generation |
| app/(tabs)/arena.tsx | ~650 | Arena tab with Friends section |
| src/stores/gamificationStore.ts | ~450 | XP, levels, rank tiers, leaderboard |
| src/services/gamificationService.ts | ~935 | Gamification service (leaderboard, XP) |
| src/components/RankCard.tsx | ~150 | Rank tier display component |
| src/types/index.ts | ~400+ | All type definitions |

### Shareable Data for Buddies (per user decision)

- Health score (0-100) + grade (A+/A/B/C/D/F)
- Savings rate %
- Burn rate status (on track / over / under)
- Streak count (days)
- Budget adherence %
- Rank tier (Bronze→Diamond) with progress
- Level and XP

## F3: Scope Analysis

### Decomposition Recommendation: DECOMPOSE into 2 sequential waves

**Wave 1: `friend-system-bugfixes`** (5-7 iterations)
- Fix demo friend code persistence (authStore.ts)
- Fix getPendingRequests to only return received requests (socialService.ts)
- Fix demo friendship data direction (socialService.ts)
- Add sender profile data to pending requests (socialService.ts → getPendingRequests returns FriendWithProfile[])
- Fix Arena pending request UI to show sender name (arena.tsx)
- Add friend-scoped leaderboard filtering (gamificationService.ts + arena.tsx)
- Add copy-to-clipboard for friend code (arena.tsx)
- Files: authStore.ts, socialService.ts, gamificationService.ts, arena.tsx

**Wave 2: `accountability-buddy-features`** (8-12 iterations)
- Depends on Wave 1 (working friend list required)
- Create FriendComparisonCard component (score/stats side-by-side)
- Add nudge quick-action buttons to friend rows in Arena
- Create ChallengeCard for mutual challenges
- Extend socialStore with comparison data actions
- Add getFriendComparison helper to socialService
- Integrate all into Arena Friends tab
- Files: FriendComparisonCard.tsx (new), ChallengeCard.tsx (new), socialStore.ts, socialService.ts, arena.tsx
