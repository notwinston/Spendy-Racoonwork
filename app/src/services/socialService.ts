/**
 * Social Service
 *
 * Handles friends, circles, nudges, and notifications.
 * Supports both live Supabase mode and offline demo mode.
 */
import { supabase, isDemoMode } from '../lib/supabase';
import { getDemoChallenges, getDemoParticipants } from './gamificationService';
import type {
  Friendship,
  FriendCircle,
  CircleMember,
  SocialNudge,
  Notification,
  Profile,
  NudgeType,
  NotificationPriority,
  FriendWithProfile,
  Challenge,
  ChallengeParticipant,
} from '../types';

// ============================================================
// Demo-mode in-memory stores
// ============================================================

const now = new Date().toISOString();

const demoProfiles: Record<string, Profile> = {
  'demo-user': {
    id: 'demo-user',
    display_name: 'You',
    avatar_url: null,
    friend_code: 'DEMO1234',
    monthly_income: null,
    xp: 160,
    level: 2,
    streak_count: 5,
    longest_streak: 5,
    financial_health_score: 72,
    privacy_level: 'friends_only',
    timezone: 'America/Vancouver',
    created_at: now,
    updated_at: now,
  },
  'demo-friend-1': {
    id: 'demo-friend-1',
    display_name: 'Alex',
    avatar_url: null,
    friend_code: 'ALEX5678',
    monthly_income: null,
    xp: 120,
    level: 2,
    streak_count: 3,
    longest_streak: 10,
    financial_health_score: 68,
    privacy_level: 'friends_only',
    timezone: 'America/Vancouver',
    created_at: now,
    updated_at: now,
  },
  'demo-friend-2': {
    id: 'demo-friend-2',
    display_name: 'Jordan',
    avatar_url: null,
    friend_code: 'JORD9012',
    monthly_income: null,
    xp: 80,
    level: 1,
    streak_count: 1,
    longest_streak: 7,
    financial_health_score: 55,
    privacy_level: 'friends_only',
    timezone: 'America/Vancouver',
    created_at: now,
    updated_at: now,
  },
  'demo-pending': {
    id: 'demo-pending',
    display_name: 'Sam',
    avatar_url: null,
    friend_code: 'SAM3456',
    monthly_income: null,
    xp: 40,
    level: 1,
    streak_count: 0,
    longest_streak: 0,
    financial_health_score: null,
    privacy_level: 'friends_only',
    timezone: 'America/Vancouver',
    created_at: now,
    updated_at: now,
  },
  'demo-friend-3': {
    id: 'demo-friend-3',
    display_name: 'Riley',
    avatar_url: null,
    friend_code: 'RILY7890',
    monthly_income: null,
    xp: 200,
    level: 3,
    streak_count: 8,
    longest_streak: 15,
    financial_health_score: 81,
    privacy_level: 'friends_only',
    timezone: 'America/Vancouver',
    created_at: now,
    updated_at: now,
  },
  'demo-friend-4': {
    id: 'demo-friend-4',
    display_name: 'Morgan',
    avatar_url: null,
    friend_code: 'MORG4567',
    monthly_income: null,
    xp: 50,
    level: 1,
    streak_count: 2,
    longest_streak: 4,
    financial_health_score: 60,
    privacy_level: 'friends_only',
    timezone: 'America/Vancouver',
    created_at: now,
    updated_at: now,
  },
};

let demoFriendships: Friendship[] = [
  {
    id: 'fs-1',
    user_id: 'demo-friend-1', // user_id < friend_id per CHECK
    friend_id: 'demo-user',
    status: 'accepted',
    created_at: now,
    accepted_at: now,
  },
  {
    id: 'fs-2',
    user_id: 'demo-friend-2',
    friend_id: 'demo-user',
    status: 'accepted',
    created_at: now,
    accepted_at: now,
  },
  {
    id: 'fs-3',
    user_id: 'demo-pending',
    friend_id: 'demo-user',
    status: 'pending',
    requested_by: 'demo-pending',
    created_at: now,
    accepted_at: null,
  },
];

let demoCircles: FriendCircle[] = [
  {
    id: 'circle-1',
    creator_id: 'demo-user',
    name: 'Savings Squad',
    description: 'Our group savings accountability circle',
    max_members: 20,
    invite_code: 'SAV123',
    created_at: now,
  },
];

let demoCircleMembers: CircleMember[] = [
  { id: 'cm-1', circle_id: 'circle-1', user_id: 'demo-user', role: 'admin', joined_at: now },
  { id: 'cm-2', circle_id: 'circle-1', user_id: 'demo-friend-1', role: 'member', joined_at: now },
];

let demoNudges: SocialNudge[] = [
  {
    id: 'nudge-1',
    sender_id: 'demo-friend-1',
    recipient_id: 'demo-user',
    nudge_type: 'encouragement',
    content: 'Keep up the great streak! 🔥',
    reference_id: null,
    is_read: false,
    created_at: now,
  },
];

let demoNotifications: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'demo-user',
    title: 'Badge Earned!',
    body: 'You earned the "Invested" badge for your 7-day streak!',
    category: 'badge',
    priority: 'high',
    data: { badge_id: 'badge-1' },
    is_read: false,
    sent_at: now,
    read_at: null,
  },
  {
    id: 'notif-2',
    user_id: 'demo-user',
    title: 'Challenge Started',
    body: 'No Eating Out Week has begun. Good luck!',
    category: 'challenge',
    priority: 'medium',
    data: { challenge_id: 'challenge-inst-1' },
    is_read: true,
    sent_at: now,
    read_at: now,
  },
];

// ============================================================
// Friends
// ============================================================

/**
 * Sort two UUIDs to satisfy the CHECK (user_id < friend_id) constraint.
 */
function sortIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Send a friend request by looking up the target user's friend_code.
 */
export async function sendFriendRequest(
  userId: string,
  friendCode: string,
): Promise<Friendship> {
  if (isDemoMode()) {
    const targetProfile = Object.values(demoProfiles).find(
      (p) => p.friend_code === friendCode && p.id !== userId,
    );
    if (!targetProfile) throw new Error('Friend not found with that code');

    const [uid, fid] = sortIds(userId, targetProfile.id);

    // Check for existing friendship
    const existing = demoFriendships.find(
      (f) => f.user_id === uid && f.friend_id === fid,
    );
    if (existing) throw new Error('Friendship already exists');

    const friendship: Friendship = {
      id: `fs-${Date.now()}`,
      user_id: uid,
      friend_id: fid,
      status: 'pending',
      requested_by: userId,
      created_at: new Date().toISOString(),
      accepted_at: null,
    };
    demoFriendships.push(friendship);
    return friendship;
  }

  // Look up friend by code
  const { data: friendProfile, error: lookupErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('friend_code', friendCode)
    .neq('id', userId)
    .single();

  if (lookupErr || !friendProfile) throw new Error('Friend not found with that code');

  const [uid, fid] = sortIds(userId, friendProfile.id);

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: uid,
      friend_id: fid,
      status: 'pending',
      requested_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(`sendFriendRequest failed: ${error.message}`);
  return data as Friendship;
}

/**
 * Accept a pending friend request.
 */
export async function acceptFriendRequest(
  _userId: string,
  friendshipId: string,
): Promise<Friendship> {
  if (isDemoMode()) {
    const fs = demoFriendships.find((f) => f.id === friendshipId);
    if (!fs) throw new Error('Friendship not found');
    fs.status = 'accepted';
    fs.accepted_at = new Date().toISOString();
    return fs;
  }

  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .select()
    .single();

  if (error) throw new Error(`acceptFriendRequest failed: ${error.message}`);
  return data as Friendship;
}

/**
 * Get all accepted friends with their profile data.
 */
export async function getFriends(userId: string): Promise<FriendWithProfile[]> {
  if (isDemoMode()) {
    return demoFriendships
      .filter(
        (f) =>
          f.status === 'accepted' &&
          (f.user_id === userId || f.friend_id === userId),
      )
      .map((f) => {
        const friendId = f.user_id === userId ? f.friend_id : f.user_id;
        const profile = demoProfiles[friendId] ?? {
          id: friendId,
          display_name: 'Unknown',
          avatar_url: null,
          friend_code: '',
          xp: 0,
          level: 1,
          streak_count: 0,
          longest_streak: 0,
          financial_health_score: null,
          privacy_level: 'private' as const,
          timezone: 'UTC',
          created_at: now,
          updated_at: now,
        };
        return { ...f, profile };
      });
  }

  // Friendships where user is user_id
  const { data: asUser, error: e1 } = await supabase
    .from('friendships')
    .select('*, profiles!friendships_friend_id_fkey(id, display_name, avatar_url, friend_code, xp, level, streak_count, longest_streak, financial_health_score, privacy_level, timezone, created_at, updated_at)')
    .eq('user_id', userId)
    .eq('status', 'accepted');

  // Friendships where user is friend_id
  const { data: asFriend, error: e2 } = await supabase
    .from('friendships')
    .select('*, profiles!friendships_user_id_fkey(id, display_name, avatar_url, friend_code, xp, level, streak_count, longest_streak, financial_health_score, privacy_level, timezone, created_at, updated_at)')
    .eq('friend_id', userId)
    .eq('status', 'accepted');

  if (e1) throw new Error(`getFriends (asUser) failed: ${e1.message}`);
  if (e2) throw new Error(`getFriends (asFriend) failed: ${e2.message}`);

  const results: FriendWithProfile[] = [];

  for (const row of asUser ?? []) {
    const r = row as Record<string, unknown>;
    const profile = r.profiles as Profile | null;
    if (profile) {
      results.push({ ...(r as unknown as Friendship), profile });
    }
  }
  for (const row of asFriend ?? []) {
    const r = row as Record<string, unknown>;
    const profile = r.profiles as Profile | null;
    if (profile) {
      results.push({ ...(r as unknown as Friendship), profile });
    }
  }

  return results;
}

/**
 * Get pending friend requests (where the current user needs to accept).
 */
export async function getPendingRequests(userId: string): Promise<FriendWithProfile[]> {
  if (isDemoMode()) {
    return demoFriendships
      .filter(
        (f) =>
          f.status === 'pending' &&
          (f.user_id === userId || f.friend_id === userId) &&
          f.requested_by !== userId,
      )
      .map((f) => {
        const senderId = f.requested_by || (f.user_id === userId ? f.friend_id : f.user_id);
        const profile = demoProfiles[senderId] ?? {
          id: senderId,
          display_name: 'Unknown',
          avatar_url: null,
          friend_code: '',
          xp: 0,
          level: 1,
          streak_count: 0,
          longest_streak: 0,
          financial_health_score: null,
          privacy_level: 'private' as const,
          timezone: 'UTC',
          created_at: now,
          updated_at: now,
        };
        return { ...f, profile };
      });
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('*, profiles!friendships_requested_by_fkey(id, display_name, avatar_url, friend_code, xp, level, streak_count, longest_streak, financial_health_score, privacy_level, timezone, created_at, updated_at)')
    .eq('status', 'pending')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .neq('requested_by', userId);

  if (error) throw new Error(`getPendingRequests failed: ${error.message}`);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = (row.profiles as Profile) ?? {
      id: 'unknown',
      display_name: 'Unknown',
      avatar_url: null,
      friend_code: '',
      xp: 0,
      level: 1,
      streak_count: 0,
      longest_streak: 0,
      financial_health_score: null,
      privacy_level: 'private' as const,
      timezone: 'UTC',
      created_at: now,
      updated_at: now,
    };
    return { ...(row as unknown as Friendship), profile };
  });
}

/**
 * Remove a friendship.
 */
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  if (isDemoMode()) {
    const [uid, fid] = sortIds(userId, friendId);
    demoFriendships = demoFriendships.filter(
      (f) => !(f.user_id === uid && f.friend_id === fid),
    );
    return;
  }

  const [uid, fid] = sortIds(userId, friendId);
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', uid)
    .eq('friend_id', fid);

  if (error) throw new Error(`removeFriend failed: ${error.message}`);
}

// ============================================================
// Friend Challenges
// ============================================================

const FRIEND_CHALLENGE_TEMPLATES = [
  { id: 'fct-1', title: 'No Eating Out Week', description: 'Avoid restaurants and takeout for a full week', duration: 7, reward_xp: 100 },
  { id: 'fct-2', title: 'Save $50 This Week', description: 'Cut spending and save at least $50 this week', duration: 7, reward_xp: 150 },
  { id: 'fct-3', title: 'Budget Streak 7 Days', description: 'Stay under budget every day for a week', duration: 7, reward_xp: 200 },
];

export { FRIEND_CHALLENGE_TEMPLATES };

/**
 * Create a friend challenge from a template. Both users are participants.
 */
export async function createFriendChallenge(
  userId: string,
  friendId: string,
  templateId: string,
): Promise<Challenge> {
  const template = FRIEND_CHALLENGE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error('Challenge template not found');

  const startsAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000).toISOString();

  if (isDemoMode()) {
    const challenge: Challenge = {
      id: `fc-${Date.now()}`,
      creator_id: userId,
      title: template.title,
      description: template.description,
      challenge_type: 'friend',
      duration_days: template.duration,
      goal: {},
      reward_xp: template.reward_xp,
      is_template: false,
      starts_at: startsAt,
      ends_at: endsAt,
      created_at: startsAt,
    };

    // Persist to shared demo state so getActiveChallenges() finds it
    getDemoChallenges().push(challenge);

    const participantBase: Omit<ChallengeParticipant, 'id' | 'user_id'> = {
      challenge_id: challenge.id,
      progress: { days_completed: 0 },
      status: 'active',
      joined_at: startsAt,
      completed_at: null,
    };
    getDemoParticipants().push(
      { ...participantBase, id: `cp-fc-${Date.now()}-1`, user_id: userId },
      { ...participantBase, id: `cp-fc-${Date.now()}-2`, user_id: friendId },
    );

    return challenge;
  }

  // Try Supabase, fall back to demo-style local creation
  try {
    const { data: challenge, error: cErr } = await supabase
      .from('challenges')
      .insert({
        creator_id: userId,
        title: template.title,
        description: template.description,
        challenge_type: 'friend',
        duration_days: template.duration,
        goal: {},
        reward_xp: template.reward_xp,
        is_template: false,
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .select()
      .single();

    if (cErr || !challenge) throw cErr;

    const challengeData = challenge as Challenge;

    await supabase
      .from('challenge_participants')
      .insert([
        { challenge_id: challengeData.id, user_id: userId, status: 'active', progress: {} },
        { challenge_id: challengeData.id, user_id: friendId, status: 'active', progress: {} },
      ]);

    return challengeData;
  } catch {
    // Fallback: create locally like demo mode
    const challenge: Challenge = {
      id: `fc-${Date.now()}`,
      creator_id: userId,
      title: template.title,
      description: template.description,
      challenge_type: 'friend',
      duration_days: template.duration,
      goal: {},
      reward_xp: template.reward_xp,
      is_template: false,
      starts_at: startsAt,
      ends_at: endsAt,
      created_at: startsAt,
    };

    getDemoChallenges().push(challenge);

    const participantBase: Omit<ChallengeParticipant, 'id' | 'user_id'> = {
      challenge_id: challenge.id,
      progress: { days_completed: 0 },
      status: 'active',
      joined_at: startsAt,
      completed_at: null,
    };
    getDemoParticipants().push(
      { ...participantBase, id: `cp-fc-${Date.now()}-1`, user_id: userId },
      { ...participantBase, id: `cp-fc-${Date.now()}-2`, user_id: friendId },
    );

    return challenge;
  }
}

// ============================================================
// Circles
// ============================================================

/**
 * Create a friend circle.
 */
export async function createCircle(
  userId: string,
  name: string,
  description?: string,
): Promise<FriendCircle> {
  if (isDemoMode()) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const circle: FriendCircle = {
      id: `circle-${Date.now()}`,
      creator_id: userId,
      name,
      description: description ?? null,
      max_members: 20,
      invite_code: inviteCode,
      created_at: new Date().toISOString(),
    };
    demoCircles.push(circle);

    // Add creator as admin
    demoCircleMembers.push({
      id: `cm-${Date.now()}`,
      circle_id: circle.id,
      user_id: userId,
      role: 'admin',
      joined_at: new Date().toISOString(),
    });

    return circle;
  }

  const { data: circle, error: cErr } = await supabase
    .from('friend_circles')
    .insert({
      creator_id: userId,
      name,
      description: description ?? null,
    })
    .select()
    .single();

  if (cErr) throw new Error(`createCircle failed: ${cErr.message}`);

  // Add creator as admin member
  const { error: mErr } = await supabase.from('circle_members').insert({
    circle_id: (circle as FriendCircle).id,
    user_id: userId,
    role: 'admin',
  });

  if (mErr) throw new Error(`createCircle member insert failed: ${mErr.message}`);
  return circle as FriendCircle;
}

/**
 * Join a circle via invite code.
 */
export async function joinCircle(
  userId: string,
  inviteCode: string,
): Promise<CircleMember> {
  if (isDemoMode()) {
    const circle = demoCircles.find((c) => c.invite_code === inviteCode);
    if (!circle) throw new Error('Circle not found with that invite code');

    const existing = demoCircleMembers.find(
      (m) => m.circle_id === circle.id && m.user_id === userId,
    );
    if (existing) throw new Error('Already a member of this circle');

    const memberCount = demoCircleMembers.filter(
      (m) => m.circle_id === circle.id,
    ).length;
    if (memberCount >= circle.max_members) throw new Error('Circle is full');

    const member: CircleMember = {
      id: `cm-${Date.now()}`,
      circle_id: circle.id,
      user_id: userId,
      role: 'member',
      joined_at: new Date().toISOString(),
    };
    demoCircleMembers.push(member);
    return member;
  }

  // Look up circle by invite code
  const { data: circle, error: cErr } = await supabase
    .from('friend_circles')
    .select('id, max_members')
    .eq('invite_code', inviteCode)
    .single();

  if (cErr || !circle) throw new Error('Circle not found with that invite code');

  // Check member count
  const { count } = await supabase
    .from('circle_members')
    .select('id', { count: 'exact', head: true })
    .eq('circle_id', (circle as Record<string, unknown>).id as string);

  if ((count ?? 0) >= ((circle as Record<string, unknown>).max_members as number)) {
    throw new Error('Circle is full');
  }

  const { data: member, error: mErr } = await supabase
    .from('circle_members')
    .insert({
      circle_id: (circle as Record<string, unknown>).id as string,
      user_id: userId,
      role: 'member',
    })
    .select()
    .single();

  if (mErr) throw new Error(`joinCircle failed: ${mErr.message}`);
  return member as CircleMember;
}

/**
 * Get members of a circle with their profile data.
 */
export async function getCircleMembers(
  circleId: string,
): Promise<(CircleMember & { profile?: Profile })[]> {
  if (isDemoMode()) {
    return demoCircleMembers
      .filter((m) => m.circle_id === circleId)
      .map((m) => ({
        ...m,
        profile: demoProfiles[m.user_id],
      }));
  }

  const { data, error } = await supabase
    .from('circle_members')
    .select('*, profiles(*)')
    .eq('circle_id', circleId);

  if (error) throw new Error(`getCircleMembers failed: ${error.message}`);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as CircleMember),
    profile: row.profiles as unknown as Profile | undefined,
  }));
}

/**
 * Get circles a user belongs to.
 */
export async function getUserCircles(userId: string): Promise<FriendCircle[]> {
  if (isDemoMode()) {
    const circleIds = demoCircleMembers
      .filter((m) => m.user_id === userId)
      .map((m) => m.circle_id);
    return demoCircles.filter((c) => circleIds.includes(c.id));
  }

  const { data: memberships, error: mErr } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId);

  if (mErr) throw new Error(`getUserCircles failed: ${mErr.message}`);

  const circleIds = (memberships ?? []).map(
    (m: Record<string, unknown>) => m.circle_id as string,
  );
  if (circleIds.length === 0) return [];

  const { data, error } = await supabase
    .from('friend_circles')
    .select('*')
    .in('id', circleIds);

  if (error) throw new Error(`getUserCircles fetch failed: ${error.message}`);
  return (data ?? []) as FriendCircle[];
}

/**
 * Leave a circle.
 */
export async function leaveCircle(userId: string, circleId: string): Promise<void> {
  if (isDemoMode()) {
    demoCircleMembers = demoCircleMembers.filter(
      (m) => !(m.circle_id === circleId && m.user_id === userId),
    );
    return;
  }

  const { error } = await supabase
    .from('circle_members')
    .delete()
    .eq('circle_id', circleId)
    .eq('user_id', userId);

  if (error) throw new Error(`leaveCircle failed: ${error.message}`);
}

// ============================================================
// Nudges
// ============================================================

/**
 * Send a nudge to another user.
 * Rate limited: max 10 nudges per sender->recipient pair per day.
 */
export async function sendNudge(
  senderId: string,
  recipientId: string,
  nudgeType: NudgeType,
  content: string,
): Promise<SocialNudge> {
  if (isDemoMode()) {
    // Rate limit check
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentCount = demoNudges.filter(
      (n) =>
        n.sender_id === senderId &&
        n.recipient_id === recipientId &&
        n.created_at >= oneDayAgo,
    ).length;

    if (recentCount >= 10) {
      throw new Error('Rate limit: max 10 nudges per recipient per day');
    }

    const nudge: SocialNudge = {
      id: `nudge-${Date.now()}`,
      sender_id: senderId,
      recipient_id: recipientId,
      nudge_type: nudgeType,
      content,
      reference_id: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    demoNudges.push(nudge);
    return nudge;
  }

  // Rate limit check: count nudges from sender to recipient in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await supabase
    .from('social_nudges')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', senderId)
    .eq('recipient_id', recipientId)
    .gte('created_at', oneDayAgo);

  if (countErr) throw new Error(`sendNudge rate check failed: ${countErr.message}`);
  if ((count ?? 0) >= 10) {
    throw new Error('Rate limit: max 10 nudges per recipient per day');
  }

  const { data, error } = await supabase
    .from('social_nudges')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      nudge_type: nudgeType,
      content,
    })
    .select()
    .single();

  if (error) throw new Error(`sendNudge failed: ${error.message}`);
  return data as SocialNudge;
}

/**
 * Get unread nudges for a user.
 */
export async function getNudges(userId: string): Promise<SocialNudge[]> {
  if (isDemoMode()) {
    return demoNudges.filter(
      (n) => n.recipient_id === userId && !n.is_read,
    );
  }

  const { data, error } = await supabase
    .from('social_nudges')
    .select('*')
    .eq('recipient_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getNudges failed: ${error.message}`);
  return (data ?? []) as SocialNudge[];
}

/**
 * Mark a nudge as read.
 */
export async function markNudgeRead(nudgeId: string): Promise<void> {
  if (isDemoMode()) {
    const nudge = demoNudges.find((n) => n.id === nudgeId);
    if (nudge) nudge.is_read = true;
    return;
  }

  const { error } = await supabase
    .from('social_nudges')
    .update({ is_read: true })
    .eq('id', nudgeId);

  if (error) throw new Error(`markNudgeRead failed: ${error.message}`);
}

// ============================================================
// Notifications
// ============================================================

/**
 * Create a notification for a user.
 */
export async function createNotification(
  userId: string,
  title: string,
  body: string,
  category: string,
  priority: NotificationPriority,
  data?: Record<string, unknown>,
): Promise<Notification> {
  if (isDemoMode()) {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      user_id: userId,
      title,
      body,
      category,
      priority,
      data: data ?? null,
      is_read: false,
      sent_at: new Date().toISOString(),
      read_at: null,
    };
    demoNotifications.push(notification);
    return notification;
  }

  const { data: notif, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      body,
      category,
      priority,
      data: data ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`createNotification failed: ${error.message}`);
  return notif as Notification;
}

/**
 * Get notifications for a user, newest first.
 */
export async function getNotifications(
  userId: string,
  limit = 50,
): Promise<Notification[]> {
  if (isDemoMode()) {
    return demoNotifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => b.sent_at.localeCompare(a.sent_at))
      .slice(0, limit);
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getNotifications failed: ${error.message}`);
  return (data ?? []) as Notification[];
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  if (isDemoMode()) {
    const notif = demoNotifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.is_read = true;
      notif.read_at = new Date().toISOString();
    }
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw new Error(`markNotificationRead failed: ${error.message}`);
}

/**
 * Get count of unread notifications.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (isDemoMode()) {
    return demoNotifications.filter(
      (n) => n.user_id === userId && !n.is_read,
    ).length;
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw new Error(`getUnreadNotificationCount failed: ${error.message}`);
  return count ?? 0;
}
