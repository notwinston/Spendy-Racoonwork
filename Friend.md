Friend Accountability System — Multi-Workflow Plan                                                                                                          │
│                                                                                                                                                             │
│ Task Type: Feature (decomposed into 2 sequential waves)                                                                                                     │
│                                                                                                                                                             │
│ Summary                                                                                                                                                     │
│                                                                                                                                                             │
│ Fix the broken friend code system end-to-end and add accountability buddy features: score comparison, challenges, and nudges. The friend system has         │
│ critical bugs preventing basic functionality (demo user ID changes every login, pending requests broken, leaderboard scope ignored). After fixing, add      │
│ FriendComparisonCard, nudge buttons, and ChallengeCard to the Arena Friends tab.                                                                            │
│                                                                                                                                                             │
│ Context                                                                                                                                                     │
│                                                                                                                                                             │
│ - App: React Native + Expo SDK 54 + TypeScript + Expo Router + Zustand                                                                                      │
│ - Root cause: src/stores/authStore.ts lines 64 AND 134 generate id: 'demo-' + Date.now() — all demo data in socialService.ts and gamificationService.ts     │
│ references 'demo-user' so nothing matches                                                                                                                   │
│ - Friend code: generateFriendCode() called fresh each login — code changes, breaking friend-by-code lookup                                                  │
│ - sortIds constraint: sortIds(a, b) orders IDs alphabetically for CHECK user_id < friend_id. Loses who initiated request — need requested_by field.         │
│ - Leaderboard: getLeaderboard(challengeId?) has no scope param — all 3 scope buttons show identical data                                                    │
│ - Existing infrastructure: sendNudge (rate-limited 3/day), Challenge type, NudgeType ('encouragement' | 'challenge_invite' | 'celebration' | 'reminder'),   │
│ FriendWithProfile, RANK_TIERS, calculateRankTier, expo-clipboard in package.json                                                                            │
│ - No tests in the project — TypeScript compilation (npx tsc --noEmit) is the primary verification                                                           │
│                                                                                                                                                             │
│ Wave Structure                                                                                                                                              │
│                                                                                                                                                             │
│ - Wave 1: friend-system-bugfixes — Fix bugs + copy button + scope filtering (8 iterations max)                                                              │
│ - Wave 2: accountability-buddy-features — FriendComparisonCard, nudge UI, ChallengeCard (10 iterations max)                                                 │
│ - Wave 2 depends on Wave 1 (needs working friend list)                                                                                                      │
│                                                                                                                                                             │
│ Git Configuration                                                                                                                                           │
│                                                                                                                                                             │
│ - Commit after each sub-phase                                                                                                                               │
│ - Do NOT push to remote                                                                                                                                     │
│                                                                                                                                                             │
│ Context Budget                                                                                                                                              │
│                                                                                                                                                             │
│ ┌───────────────────┬───────┬────────────────┬──────────┬────────────┬───────────┐                                                                          │
│ │       Wave        │ Files │  Peak Tokens   │ Pressure │ Iterations │ Est. Cost │                                                                          │
│ ├───────────────────┼───────┼────────────────┼──────────┼────────────┼───────────┤                                                                          │
│ │ Wave 1 (bugfixes) │ 7     │ 57,040 (28.5%) │ low      │ 8          │ $3-8      │                                                                          │
│ ├───────────────────┼───────┼────────────────┼──────────┼────────────┼───────────┤                                                                          │
│ │ Wave 2 (features) │ 5     │ 50,780 (25.4%) │ low      │ 10         │ $5-12     │                                                                          │
│ ├───────────────────┼───────┼────────────────┼──────────┼────────────┼───────────┤                                                                          │
│ │ Aggregate         │ 10    │ —              │ —        │ 18         │ $8-20     │                                                                          │
│ └───────────────────┴───────┴────────────────┴──────────┴────────────┴───────────┘                                                                          │
│                                                                                                                                                             │
│ Context budget estimates are approximate.                                                                                                                   │
│                                                                                                                                                             │
│ ---                                                                                                                                                         │
│ Wave 1: friend-system-bugfixes                                                                                                                              │
│                                                                                                                                                             │
│ Files (7)                                                                                                                                                   │
│                                                                                                                                                             │
│ ┌─────────────────────────────────────┬───────┬─────────────────────────────────────────────────────────────────────────────────────────────────────┐       │
│ │                File                 │ Lines │                                               Action                                                │       │
│ ├─────────────────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤       │
│ │ src/types/index.ts                  │ 539   │ Add requested_by?: string to Friendship (line 324-331)                                              │       │
│ ├─────────────────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤       │
│ │ src/stores/authStore.ts             │ 259   │ Fix demo user ID at BOTH line 64 (signUp) AND line 134 (signIn)                                     │       │
│ ├─────────────────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤       │
│ │ src/services/socialService.ts       │ 813   │ Fix getPendingRequests, sendFriendRequest, demo data                                                │       │
│ ├─────────────────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤       │
│ │ src/services/gamificationService.ts │ 1140  │ Add scope/friendIds params to getLeaderboard (line 855)                                             │       │
│ ├─────────────────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤       │
│ │ src/stores/socialStore.ts           │ 437   │ Change pendingRequests: Friendship[] → FriendWithProfile[] (line 45), leaderboard scope passthrough │       │
│ ├─────────────────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤       │
│ │ src/stores/gamificationStore.ts     │ 368   │ fetchLeaderboard scope param (line 327)                                                             │       │
│ ├─────────────────────────────────────┼───────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤       │
│ │ app/(tabs)/arena.tsx                │ 602   │ Pending UI fix, copy button, leaderboard scope wiring                                               │       │
│ └─────────────────────────────────────┴───────┴─────────────────────────────────────────────────────────────────────────────────────────────────────┘       │
│                                                                                                                                                             │
│ Sub-Phases                                                                                                                                                  │
│                                                                                                                                                             │
│ Phase 1A: Demo User Identity + Friendship Type (Items 1-3)                                                                                                  │
│ - src/stores/authStore.ts line 64 (signUp demo): change id: 'demo-' + Date.now() → id: 'demo-user', friendCode: generateFriendCode() → friendCode:          │
│ 'DEMO1234'                                                                                                                                                  │
│ - src/stores/authStore.ts line 134 (signIn demo): same changes                                                                                              │
│ - src/types/index.ts line 324-331: Add requested_by?: string to Friendship interface (optional field, backward-compatible)                                  │
│ - src/services/socialService.ts line 209-218 (demo sendFriendRequest): add requested_by: userId to friendship object                                        │
│ - src/services/socialService.ts line 233-241 (Supabase sendFriendRequest): add requested_by: userId to .insert()                                            │
│ - src/services/socialService.ts line 112-117 (demo pending data fs-3): add requested_by: 'demo-pending'                                                     │
│ - Verify: cd /workspace/app && npx tsc --noEmit 2>&1 | grep "error TS" | wc -l outputs 0                                                                    │
│ - Verify: grep "id: 'demo-user'" /workspace/app/src/stores/authStore.ts | wc -l outputs 2 (signUp + signIn)                                                 │
│ - Verify: grep "requested_by" /workspace/app/src/types/index.ts | wc -l outputs 1+                                                                          │
│                                                                                                                                                             │
│ Phase 1B: Pending Requests Pipeline (Items 4-5)                                                                                                             │
│ Update ALL 3 files in one pass before compiling to avoid type cascade thrashing:                                                                            │
│ - src/services/socialService.ts line 345: change return type from Promise<Friendship[]> to Promise<FriendWithProfile[]>                                     │
│ - Filter to incoming only: f.requested_by !== userId (requests where someone else initiated)                                                                │
│ - Attach sender profile from demoProfiles (demo path) or join profiles table (Supabase path)                                                                │
│ - src/stores/socialStore.ts line 45: change pendingRequests: Friendship[] to FriendWithProfile[]                                                            │
│ - src/stores/socialStore.ts line 108: update fetchPendingRequests type signature                                                                            │
│ - sortIds verification: 'demo-friend-1' < 'demo-user' is TRUE alphabetically, so current demo data ordering IS CORRECT. No change needed — just confirm.    │
│ - Verify: npx tsc --noEmit 2>&1 | grep "error TS" | wc -l outputs 0                                                                                         │
│ - Verify: grep "FriendWithProfile" /workspace/app/src/services/socialService.ts | grep -i "pending" | wc -l outputs 1+                                      │
│                                                                                                                                                             │
│ Phase 1C: Leaderboard Scope (Item 6)                                                                                                                        │
│ - src/services/gamificationService.ts line 855: change signature to getLeaderboard(options?: { challengeId?: string; scope?: 'global' | 'friends';          │
│ friendIds?: string[] })                                                                                                                                     │
│ - Demo path: when scope is 'friends' and friendIds provided, filter demo entries to only those in friendIds + current user                                  │
│ - Supabase global path: when scope is 'friends', use .in('id', friendIds) instead of querying all profiles                                                  │
│ - src/stores/socialStore.ts line 425 fetchLeaderboard: update to pass scope and friend IDs                                                                  │
│ - src/stores/gamificationStore.ts line 327 fetchLeaderboard: update to accept and pass scope options                                                        │
│ - Verify: npx tsc --noEmit 2>&1 | grep "error TS" | wc -l outputs 0                                                                                         │
│ - Verify: grep "friendIds" /workspace/app/src/services/gamificationService.ts | wc -l outputs 1+                                                            │
│                                                                                                                                                             │
│ Phase 1D: Arena UI Fixes (Items 7-8)                                                                                                                        │
│ - app/(tabs)/arena.tsx line 444-448: wrap friend code text in <Pressable onPress={() => { Clipboard.setStringAsync(user?.friendCode || '');                 │
│ Alert.alert('Copied!', 'Friend code copied to clipboard'); }}>. Import * as Clipboard from 'expo-clipboard'.                                                │
│ - app/(tabs)/arena.tsx line 470-482: replace hardcoded 'Friend Request' (line 475) with req.profile?.display_name || 'Someone'                              │
│ - Add reject button: <Button title="Decline" variant="outline" onPress={() => removeFriend(userId, req.user_id === userId ? req.friend_id : req.user_id)}   │
│ />                                                                                                                                                          │
│ - Wire leaderboard scope: when leaderboardScope state changes, call fetchLeaderboard({ scope: leaderboardScope, friendIds: friends.map(f => f.profile.id)   │
│ })                                                                                                                                                          │
│ - Verify: npx tsc --noEmit 2>&1 | grep "error TS" | wc -l outputs 0                                                                                         │
│ - Verify: grep "Clipboard" /workspace/app/app/\\(tabs\\)/arena.tsx | wc -l outputs 1+                                                                       │
│ - Verify: grep "Friend Request" /workspace/app/app/\\(tabs\\)/arena.tsx | wc -l outputs 0                                                                   │
│                                                                                                                                                             │
│ Recommended --max-iterations: 8                                                                                                                             │
│                                                                                                                                                             │
│ Wave 1 Completion Promise                                                                                                                                   │
│                                                                                                                                                             │
│ ALL of the following must be true:                                                                                                                          │
│ 1. cd /workspace/app && npx tsc --noEmit 2>&1 | grep -v "gamificationService" | grep "error TS" | wc -l outputs 0                                           │
│ 2. grep "id: 'demo-user'" src/stores/authStore.ts | wc -l outputs 2 (both signUp and signIn)                                                                │
│ 3. grep "requested_by" src/types/index.ts | wc -l outputs 1+                                                                                                │
│ 4. grep "requested_by" src/services/socialService.ts | wc -l outputs 3+ (sendFriendRequest demo, Supabase, demo data)                                       │
│ 5. grep "FriendWithProfile" src/services/socialService.ts | grep -i "pending" | wc -l outputs 1+                                                            │
│ 6. grep "FriendWithProfile" src/stores/socialStore.ts | grep -i "pending" | wc -l outputs 1+                                                                │
│ 7. grep "friendIds" src/services/gamificationService.ts | wc -l outputs 1+                                                                                  │
│ 8. grep "Clipboard" app/\\(tabs\\)/arena.tsx | wc -l outputs 1+                                                                                             │
│ 9. grep "Friend Request" app/\\(tabs\\)/arena.tsx | wc -l outputs 0                                                                                         │
│ 10. git log --oneline -8 | grep -c "fix:" outputs 3+                                                                                                        │
│                                                                                                                                                             │
│ ---                                                                                                                                                         │
│ Wave 2: accountability-buddy-features                                                                                                                       │
│                                                                                                                                                             │
│ Files (5)                                                                                                                                                   │
│                                                                                                                                                             │
│ ┌─────────────────────────────────────────┬───────┬────────────────────────────────────────────────────────┐                                                │
│ │                  File                   │ Lines │                         Action                         │                                                │
│ ├─────────────────────────────────────────┼───────┼────────────────────────────────────────────────────────┤                                                │
│ │ src/components/FriendComparisonCard.tsx │ ~200  │ NEW — Side-by-side stats comparison                    │                                                │
│ ├─────────────────────────────────────────┼───────┼────────────────────────────────────────────────────────┤                                                │
│ │ src/components/ChallengeCard.tsx        │ ~200  │ NEW — Friend challenge display + create                │                                                │
│ ├─────────────────────────────────────────┼───────┼────────────────────────────────────────────────────────┤                                                │
│ │ src/services/socialService.ts           │ 813+  │ Add createFriendChallenge helper                       │                                                │
│ ├─────────────────────────────────────────┼───────┼────────────────────────────────────────────────────────┤                                                │
│ │ src/stores/socialStore.ts               │ 437+  │ Challenge actions, nudge sent tracking                 │                                                │
│ ├─────────────────────────────────────────┼───────┼────────────────────────────────────────────────────────┤                                                │
│ │ app/(tabs)/arena.tsx                    │ 602+  │ Friend row expansion, nudge buttons, challenge section │                                                │
│ └─────────────────────────────────────────┴───────┴────────────────────────────────────────────────────────┘                                                │
│                                                                                                                                                             │
│ Sub-Phases                                                                                                                                                  │
│                                                                                                                                                             │
│ Phase 2A: FriendComparisonCard (new component)                                                                                                              │
│ - Create src/components/FriendComparisonCard.tsx — a PROPS-ONLY component (no direct store imports)                                                         │
│ - Props: { myStats: { healthScore: number | null; savingsRate: number; streakCount: number; level: number; xp: number }; friendProfile: Profile }           │
│ - Layout: two-column side-by-side comparison. Each row shows a stat label with YOUR value on left, FRIEND's value on right                                  │
│ - Stats to display: Health Score (financial_health_score, fallback '—'), Savings Rate (%), Streak (days), Level, XP                                         │
│ - For friend's savings rate: derive from financial_health_score as proxy (score/100 * 30, capped at 50%) since we can't access their budget data            │
│ - Use existing calculateRankTier() to show rank tier badge for both users                                                                                   │
│ - Style with existing Colors, Typography, Spacing, Card from the design system                                                                              │
│ - Verify: test -f /workspace/app/src/components/FriendComparisonCard.tsx && echo EXISTS                                                                     │
│ - Verify: npx tsc --noEmit 2>&1 | grep "error TS" | wc -l outputs 0                                                                                         │
│                                                                                                                                                             │
│ Phase 2B: ChallengeCard + Service (new component + service helper)                                                                                          │
│ - Create src/components/ChallengeCard.tsx — displays a friend challenge                                                                                     │
│ - Props: { challenge: Challenge; participants: { user: string; friend: string }; onJoin?: () => void }                                                      │
│ - Displays: title, description, duration_days, reward_xp, both participant names, progress bar (if active)                                                  │
│ - Add createFriendChallenge(userId: string, friendId: string, templateId: string) to src/services/socialService.ts                                          │
│   - Uses existing createChallengeFromTemplate + joinChallenge pattern from gamificationService.ts                                                           │
│   - Creates a challenge instance from template, adds both users as participants                                                                             │
│   - 3 hardcoded templates: { title: 'No Eating Out Week', duration: 7, reward_xp: 100 }, { title: 'Save $50 This Week', duration: 7, reward_xp: 150 }, {    │
│ title: 'Budget Streak 7 Days', duration: 7, reward_xp: 200 }                                                                                                │
│ - Verify: test -f /workspace/app/src/components/ChallengeCard.tsx && echo EXISTS                                                                            │
│ - Verify: grep "createFriendChallenge" /workspace/app/src/services/socialService.ts | wc -l outputs 1+                                                      │
│                                                                                                                                                             │
│ Phase 2C: Store Integration                                                                                                                                 │
│ - src/stores/socialStore.ts: add createFriendChallenge action wrapping the service function                                                                 │
│ - src/stores/socialStore.ts: add nudgeSentTimestamps: Record<string, number> for UI feedback (disable button briefly after sending)                         │
│ - Verify: npx tsc --noEmit 2>&1 | grep "error TS" | wc -l outputs 0                                                                                         │
│                                                                                                                                                             │
│ Phase 2D: Arena Integration                                                                                                                                 │
│ - app/(tabs)/arena.tsx: make friend rows expandable — wrap each friend <Card> in <TouchableOpacity> that toggles expandedFriendId state                     │
│ - Expanded view shows: FriendComparisonCard (pass data from stores as props) + 4 nudge icon buttons + active challenges with that friend                    │
│ - Nudge buttons: 4 <Pressable> icons for each NudgeType:                                                                                                    │
│   - 'encouragement' → heart-outline Ionicon                                                                                                                 │
│   - 'reminder' → alarm-outline Ionicon                                                                                                                      │
│   - 'celebration' → trophy-outline Ionicon                                                                                                                  │
│   - 'challenge_invite' → flash-outline Ionicon                                                                                                              │
│ - On nudge press: call sendNudge(userId, friendId, nudgeType, predefinedContent) with predefined strings:                                                   │
│   - encouragement: "Keep up the great work!"                                                                                                                │
│   - reminder: "Don't forget to check your budget today!"                                                                                                    │
│   - celebration: "Congrats on your progress!"                                                                                                               │
│   - challenge_invite: "I challenge you!"                                                                                                                    │
│ - Success feedback: Alert.alert('Sent!', 'Nudge sent to [friendName]') (already imported in arena.tsx)                                                      │
│ - Show incoming nudge count as a badge number on each friend row (from nudges in socialStore, filtered by sender)                                           │
│ - Challenge section: below nudge buttons, show active challenges with that friend. "Challenge" button to create new from template list.                     │
│ - Use react-native-reanimated (already imported in arena.tsx) for expand/collapse animation. Fallback:                                                      │
│ LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut) if Reanimated accordion is complex.                                                    │
│ - Verify: grep "FriendComparisonCard" /workspace/app/app/\\(tabs\\)/arena.tsx | wc -l outputs 1+                                                            │
│ - Verify: grep "ChallengeCard" /workspace/app/app/\\(tabs\\)/arena.tsx | wc -l outputs 1+                                                                   │
│ - Verify: grep "sendNudge" /workspace/app/app/\\(tabs\\)/arena.tsx | wc -l outputs 1+                                                                       │
│ - Verify: npx tsc --noEmit 2>&1 | grep "error TS" | wc -l outputs 0                                                                                         │
│                                                                                                                                                             │
│ Recommended --max-iterations: 10                                                                                                                            │
│                                                                                                                                                             │
│ Wave 2 Completion Promise                                                                                                                                   │
│                                                                                                                                                             │
│ ALL of the following must be true:                                                                                                                          │
│ 1. cd /workspace/app && npx tsc --noEmit 2>&1 | grep -v "gamificationService" | grep "error TS" | wc -l outputs 0                                           │
│ 2. test -f src/components/FriendComparisonCard.tsx && echo EXISTS outputs EXISTS                                                                            │
│ 3. test -f src/components/ChallengeCard.tsx && echo EXISTS outputs EXISTS                                                                                   │
│ 4. grep "FriendComparisonCard" app/\\(tabs\\)/arena.tsx | wc -l outputs 1+                                                                                  │
│ 5. grep "ChallengeCard" app/\\(tabs\\)/arena.tsx | wc -l outputs 1+                                                                                         │
│ 6. grep "sendNudge" app/\\(tabs\\)/arena.tsx | wc -l outputs 1+                                                                                             │
│ 7. grep "createFriendChallenge" src/services/socialService.ts | wc -l outputs 1+                                                                            │
│ 8. grep "expandedFriend\|isExpanded" app/\\(tabs\\)/arena.tsx | wc -l outputs 1+                                                                            │
│ 9. git log --oneline -10 | grep -c "feat:" outputs 3+                                                                                                       │
│                                                                                                                                                             │
│ ---                                                                                                                                                         │
│ Rules (both waves)                                                                                                                                          │
│                                                                                                                                                             │
│ Do NOT                                                                                                                                                      │
│                                                                                                                                                             │
│ - Do NOT rewrite any file from scratch — make targeted, surgical edits only                                                                                 │
│ - Do NOT delete existing functions, exports, or type definitions                                                                                            │
│ - Do NOT push to remote repositories                                                                                                                        │
│ - Do NOT modify any files outside the explicitly listed scope per wave                                                                                      │
│ - Do NOT modify Supabase live-mode code paths unless the bug specifically exists there                                                                      │
│ - Do NOT change package.json, app.json, tsconfig.json, or any config files                                                                                  │
│ - Do NOT modify _layout.tsx files, navigation, or routing                                                                                                   │
│ - Do NOT install or remove any dependencies                                                                                                                 │
│ - Do NOT modify node_modules/                                                                                                                               │
│                                                                                                                                                             │
│ Error Handling Protocol                                                                                                                                     │
│                                                                                                                                                             │
│ - After running npx tsc --noEmit, read the FULL error output before attempting fixes                                                                        │
│ - Fix errors in dependency order: types → services → stores → UI components                                                                                 │
│ - When changing a return type (e.g., Friendship[] → FriendWithProfile[]), update ALL callers in one pass before compiling                                   │
│                                                                                                                                                             │
│ Stuck-State Recovery                                                                                                                                        │
│                                                                                                                                                             │
│ - If the same TypeScript error persists after 2 fix attempts: try a fundamentally different approach (e.g., keep the old type and add an adapter)           │
│ - If 3 iterations pass on one sub-task: skip it, document what's blocking, move to the next sub-task                                                        │
│ - If npx tsc --noEmit has errors you can't resolve: commit what compiles, document blockers in a comment                                                    │
│                                                                                                                                                             │
│ Anti-Thrashing Rules                                                                                                                                        │
│                                                                                                                                                             │
│ - Never undo a previous iteration's change unless it was provably wrong                                                                                     │
│ - Never rewrite a file from scratch to "fix" a small issue                                                                                                  │
│ - Update all related files in one pass before running the compiler                                                                                          │
│                                                                                                                                                             │
│ ---                                                                                                                                                         │
│ Execution Commands                                                                                                                                          │
│                                                                                                                                                             │
│ Wave 1 (run first)                                                                                                                                          │
│                                                                                                                                                             │
│ /ralph-loop:ralph-loop $(cat ralph-plans/friend-accountability-system/wave-1/friend-system-bugfixes/prompt.md) --completion-promise "$(cat                  │
│ ralph-plans/friend-accountability-system/wave-1/friend-system-bugfixes/promise.txt)" --max-iterations=8                                                     │
│                                                                                                                                                             │
│ Wave 2 (run after Wave 1 completes)                                                                                                                         │
│                                                                                                                                                             │
│ /ralph-loop:ralph-loop $(cat ralph-plans/friend-accountability-system/wave-2/accountability-buddy-features/prompt.md) --completion-promise "$(cat           │
│ ralph-plans/friend-accountability-system/wave-2/accountability-buddy-features/promise.txt)" --max-iterations=10 