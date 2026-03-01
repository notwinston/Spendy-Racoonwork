/**
 * Gamification Service
 *
 * Handles XP, levels, streaks, badges, challenges, and leaderboards.
 * Supports both live Supabase mode and offline demo mode.
 */
import { supabase, isDemoMode } from '../lib/supabase';
import { usePredictionStore } from '../stores/predictionStore';
import { useBudgetStore } from '../stores/budgetStore';
import { useTransactionStore } from '../stores/transactionStore';
import { calculateCCI } from '../stores/predictionStore';
import type {
  Badge,
  UserBadge,
  Challenge,
  ChallengeParticipant,
  StreakHistory,
  XpTransaction,
  XpSource,
  CheckinResult,
  LeaderboardEntry,
  Profile,
} from '../types';

// ============================================================
// Level system
// ============================================================

/**
 * Calculate the total XP required to reach a given level.
 * Level 1 = 0 XP, Level 2 = 100, Level 3 = 283, Level 4 = 520, ...
 * Formula: cumulative sum of 100 * n^1.5 for n = 1..level-1
 */
export function xpThresholdForLevel(level: number): number {
  let total = 0;
  for (let n = 1; n < level; n++) {
    total += Math.round(100 * Math.pow(n, 1.5));
  }
  return total;
}

/**
 * Determine which level a user is at based on total XP.
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  while (xpThresholdForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
}

/**
 * XP needed to advance from currentLevel to currentLevel + 1.
 */
export function getXPForNextLevel(currentLevel: number): number {
  return xpThresholdForLevel(currentLevel + 1) - xpThresholdForLevel(currentLevel);
}

/**
 * XP the user still needs to reach the next level.
 */
export function xpRemainingForNextLevel(totalXP: number): number {
  const level = calculateLevel(totalXP);
  return xpThresholdForLevel(level + 1) - totalXP;
}

// ============================================================
// Demo-mode in-memory stores
// ============================================================

const now = new Date().toISOString();
const today = new Date().toISOString().slice(0, 10);

let demoBadges: Badge[] = buildDemoBadges();
let demoUserBadges: UserBadge[] = [
  {
    id: 'ub-1',
    user_id: 'demo-user',
    badge_id: 'badge-1',
    earned_at: now,
    is_notified: true,
  },
  {
    id: 'ub-2',
    user_id: 'demo-user',
    badge_id: 'badge-11',
    earned_at: now,
    is_notified: true,
  },
];

let demoChallenges: Challenge[] = buildDemoChallenges();
let demoParticipants: ChallengeParticipant[] = [
  {
    id: 'cp-1',
    challenge_id: 'challenge-inst-1',
    user_id: 'demo-user',
    progress: { days_completed: 2 },
    status: 'active',
    joined_at: now,
    completed_at: null,
  },
];

let demoStreaks: StreakHistory[] = [
  {
    id: 'streak-1',
    user_id: 'demo-user',
    streak_type: 'daily_checkin',
    start_date: shiftDate(today, -4),
    end_date: null,
    length: 5,
    is_active: true,
    created_at: now,
  },
];

let demoXpTransactions: XpTransaction[] = [
  {
    id: 'xp-1',
    user_id: 'demo-user',
    amount: 10,
    source: 'checkin',
    reference_id: null,
    description: 'Daily check-in',
    created_at: now,
  },
];

let demoProfile: Pick<Profile, 'xp' | 'level' | 'streak_count' | 'longest_streak' | 'financial_health_score'> = {
  xp: 160,
  level: 2,
  streak_count: 5,
  longest_streak: 5,
  financial_health_score: 72,
};

let demoCheckinToday = false;

// ============================================================
// XP Awards
// ============================================================

/**
 * Award XP to a user. Creates an xp_transaction, updates profile.xp, and
 * recalculates the user's level.
 */
export async function awardXP(
  userId: string,
  amount: number,
  source: XpSource,
  referenceId?: string,
  description?: string,
): Promise<{ newXP: number; newLevel: number }> {
  if (isDemoMode()) {
    demoProfile.xp += amount;
    demoProfile.level = calculateLevel(demoProfile.xp);
    demoXpTransactions.push({
      id: `xp-${Date.now()}`,
      user_id: userId,
      amount,
      source,
      reference_id: referenceId ?? null,
      description: description ?? null,
      created_at: new Date().toISOString(),
    });
    return { newXP: demoProfile.xp, newLevel: demoProfile.level };
  }

  // Insert XP transaction
  const { error: txErr } = await supabase.from('xp_transactions').insert({
    user_id: userId,
    amount,
    source,
    reference_id: referenceId ?? null,
    description: description ?? null,
  });
  if (txErr) throw new Error(`awardXP insert failed: ${txErr.message}`);

  // Fetch current XP
  const { data: profile, error: fetchErr } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single();
  if (fetchErr) throw new Error(`awardXP fetch failed: ${fetchErr.message}`);

  const newXP = (profile.xp ?? 0) + amount;
  const newLevel = calculateLevel(newXP);

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ xp: newXP, level: newLevel, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (updateErr) throw new Error(`awardXP update failed: ${updateErr.message}`);

  return { newXP, newLevel };
}

// ============================================================
// Daily Check-in
// ============================================================

/**
 * Perform a daily check-in for the user.
 * Awards 10 XP, increments streak, evaluates badges.
 */
export async function performCheckin(userId: string): Promise<CheckinResult> {
  const XP_CHECKIN = 10;

  if (isDemoMode()) {
    if (demoCheckinToday) {
      return {
        xp_earned: 0,
        streak_count: demoProfile.streak_count,
        badges_earned: [],
      };
    }

    demoCheckinToday = true;
    demoProfile.streak_count += 1;
    if (demoProfile.streak_count > demoProfile.longest_streak) {
      demoProfile.longest_streak = demoProfile.streak_count;
    }

    // Update active streak
    const activeStreak = demoStreaks.find(
      (s) => s.user_id === userId && s.streak_type === 'daily_checkin' && s.is_active,
    );
    if (activeStreak) {
      activeStreak.length += 1;
      activeStreak.end_date = today;
    } else {
      demoStreaks.push({
        id: `streak-${Date.now()}`,
        user_id: userId,
        streak_type: 'daily_checkin',
        start_date: today,
        end_date: today,
        length: 1,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }

    await awardXP(userId, XP_CHECKIN, 'checkin', undefined, 'Daily check-in');
    const badgesEarned = await evaluateBadges(userId);

    return {
      xp_earned: XP_CHECKIN,
      streak_count: demoProfile.streak_count,
      badges_earned: badgesEarned,
    };
  }

  // --- Live Supabase mode ---
  const todayStr = new Date().toISOString().slice(0, 10);

  // Check if already checked in today
  const { data: existingXp } = await supabase
    .from('xp_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'checkin')
    .gte('created_at', `${todayStr}T00:00:00Z`)
    .lte('created_at', `${todayStr}T23:59:59Z`)
    .limit(1);

  if (existingXp && existingXp.length > 0) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('streak_count')
      .eq('id', userId)
      .single();
    return {
      xp_earned: 0,
      streak_count: prof?.streak_count ?? 0,
      badges_earned: [],
    };
  }

  // Update streak
  const { data: activeStreak } = await supabase
    .from('streak_history')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', 'daily_checkin')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (activeStreak) {
    // Extend if the last recorded date was yesterday or today
    const lastDate = activeStreak.end_date ?? activeStreak.start_date;
    const yesterday = shiftDate(todayStr, -1);
    if (lastDate === todayStr || lastDate === yesterday) {
      const newLength = activeStreak.length + 1;
      await supabase
        .from('streak_history')
        .update({ length: newLength, end_date: todayStr })
        .eq('id', activeStreak.id);
    } else {
      // Streak broken - deactivate old, start new
      await supabase
        .from('streak_history')
        .update({ is_active: false, end_date: lastDate })
        .eq('id', activeStreak.id);
      await supabase.from('streak_history').insert({
        user_id: userId,
        streak_type: 'daily_checkin',
        start_date: todayStr,
        end_date: todayStr,
        length: 1,
        is_active: true,
      });
    }
  } else {
    await supabase.from('streak_history').insert({
      user_id: userId,
      streak_type: 'daily_checkin',
      start_date: todayStr,
      end_date: todayStr,
      length: 1,
      is_active: true,
    });
  }

  // Increment streak_count on profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('streak_count, longest_streak')
    .eq('id', userId)
    .single();

  const newStreakCount = (currentProfile?.streak_count ?? 0) + 1;
  const newLongest = Math.max(newStreakCount, currentProfile?.longest_streak ?? 0);

  await supabase
    .from('profiles')
    .update({
      streak_count: newStreakCount,
      longest_streak: newLongest,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Award XP
  await awardXP(userId, XP_CHECKIN, 'checkin', undefined, 'Daily check-in');

  // Evaluate badges
  const badgesEarned = await evaluateBadges(userId);

  return {
    xp_earned: XP_CHECKIN,
    streak_count: newStreakCount,
    badges_earned: badgesEarned,
  };
}

// ============================================================
// Badge Evaluation
// ============================================================

/**
 * Evaluate all badge conditions for a user and award any newly earned badges.
 * Returns the list of newly earned badges.
 */
export async function evaluateBadges(userId: string): Promise<Badge[]> {
  if (isDemoMode()) {
    const earnedIds = new Set(
      demoUserBadges.filter((ub) => ub.user_id === userId).map((ub) => ub.badge_id),
    );

    const newlyEarned: Badge[] = [];

    for (const badge of demoBadges) {
      if (earnedIds.has(badge.id)) continue;
      if (evaluateCondition(badge.unlock_condition, getDemoStats(userId))) {
        demoUserBadges.push({
          id: `ub-${Date.now()}-${badge.id}`,
          user_id: userId,
          badge_id: badge.id,
          earned_at: new Date().toISOString(),
          is_notified: false,
        });
        await awardXP(userId, badge.xp_reward, 'challenge', badge.id, `Badge earned: ${badge.name}`);
        newlyEarned.push(badge);
      }
    }

    return newlyEarned;
  }

  // --- Live mode ---
  const { data: allBadges } = await supabase.from('badges').select('*');
  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  if (!allBadges) return [];

  const earnedIds = new Set((earnedBadges ?? []).map((ub) => ub.badge_id));
  const stats = await fetchUserStats(userId);
  const newlyEarned: Badge[] = [];

  for (const badge of allBadges as Badge[]) {
    if (earnedIds.has(badge.id)) continue;
    if (evaluateCondition(badge.unlock_condition, stats)) {
      const { error } = await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id,
      });
      if (!error) {
        await awardXP(userId, badge.xp_reward, 'challenge', badge.id, `Badge earned: ${badge.name}`);
        newlyEarned.push(badge);
      }
    }
  }

  return newlyEarned;
}

interface UserStats {
  streak_count: number;
  longest_streak: number;
  level: number;
  challenges_completed: number;
  friends_count: number;
  xp: number;
  hidden_cost_views: number;
  hidden_cost_accurate: number;
  cci_score: number;
  hidden_cost_acknowledged_days: number;
  health_score_weekly: number[];
  budget_under_months: number;
  zero_spend_days: number;
  savings_total: number;
}

function getDemoStats(_userId: string): UserStats {
  const completed = demoParticipants.filter(
    (p) => p.user_id === 'demo-user' && p.status === 'completed',
  ).length;
  return {
    streak_count: demoProfile.streak_count,
    longest_streak: demoProfile.longest_streak,
    level: demoProfile.level,
    challenges_completed: completed,
    friends_count: 2,
    xp: demoProfile.xp,
    hidden_cost_views: 0,
    hidden_cost_accurate: 0,
    cci_score: 0,
    hidden_cost_acknowledged_days: 0,
    health_score_weekly: [],
    budget_under_months: 0,
    zero_spend_days: 0,
    savings_total: 0,
  };
}

async function fetchUserStats(userId: string): Promise<UserStats> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_count, longest_streak, level, xp')
    .eq('id', userId)
    .single();

  const { count: challengesCompleted } = await supabase
    .from('challenge_participants')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  const { count: friendsCount } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  // Compute live stats from store state
  const predictionState = usePredictionStore.getState();
  const budgetState = useBudgetStore.getState();
  const transactionState = useTransactionStore.getState();

  const predictions = predictionState.predictions;
  const hiddenCosts = predictionState.hiddenCosts;
  const transactions = transactionState.transactions;

  // Hidden cost views: count of non-dismissed hidden costs
  const hiddenCostViews = hiddenCosts.filter((c) => !c.is_dismissed).length;

  // Hidden cost accuracy: hidden costs with was_accurate === true
  const hiddenCostAccurate = (hiddenCosts as Array<{ was_accurate?: boolean }>).filter(
    (c) => c.was_accurate === true,
  ).length;

  // CCI score (0-100 scale)
  const cciScore = Math.round(calculateCCI(predictions) * 100);

  // Hidden cost acknowledged days: count unique days with dismissed costs
  const acknowledgedDays = new Set(
    hiddenCosts
      .filter((c) => c.is_dismissed)
      .map((c) => {
        const pred = predictions.find((p) => p.id === c.prediction_id);
        return pred ? pred.created_at.slice(0, 10) : null;
      })
      .filter(Boolean),
  ).size;

  // Zero spend days: days with no transactions in current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const transactionDays = new Set(
    transactions
      .filter((t) => new Date(t.date) >= monthStart)
      .map((t) => t.date.slice(0, 10)),
  );
  const dayOfMonth = now.getDate();
  const zeroSpendDays = Math.max(0, dayOfMonth - transactionDays.size);

  // Savings total: budget - spent (if positive)
  const savingsTotal = Math.max(0, budgetState.totalBudget - budgetState.totalSpent);

  // Budget under months: count months in transaction history where spending < budget
  // Simplified: check if current month is under budget
  const budgetUnderMonths = budgetState.totalSpent <= budgetState.totalBudget ? 1 : 0;

  return {
    streak_count: profile?.streak_count ?? 0,
    longest_streak: profile?.longest_streak ?? 0,
    level: profile?.level ?? 1,
    challenges_completed: challengesCompleted ?? 0,
    friends_count: friendsCount ?? 0,
    xp: profile?.xp ?? 0,
    hidden_cost_views: hiddenCostViews,
    hidden_cost_accurate: hiddenCostAccurate,
    cci_score: cciScore,
    hidden_cost_acknowledged_days: acknowledgedDays,
    health_score_weekly: [],
    budget_under_months: budgetUnderMonths,
    zero_spend_days: zeroSpendDays,
    savings_total: savingsTotal,
  };
}

/**
 * Evaluate a single badge unlock_condition JSONB against user stats.
 */
function evaluateCondition(
  condition: Record<string, unknown>,
  stats: UserStats,
): boolean {
  const type = condition.type as string | undefined;
  if (!type) return false;

  switch (type) {
    case 'streak': {
      const length = (condition.length as number) ?? 0;
      return stats.longest_streak >= length;
    }
    case 'budget_streak': {
      // Not enough real-time data to evaluate in MVP; skip for now
      return false;
    }
    case 'savings_total': {
      const amount = (condition.amount as number) ?? 0;
      return stats.savings_total >= amount;
    }
    case 'challenges_completed': {
      const count = (condition.count as number) ?? 0;
      return stats.challenges_completed >= count;
    }
    case 'accurate_predictions':
    case 'cci_streak':
    case 'early_checkin':
    case 'late_checkin':
    case 'challenge_categories':
    case 'challenge_wins':
    case 'connections': {
      // These require deeper data; skip for MVP
      return false;
    }
    case 'zero_spend_day': {
      const count = (condition.count as number) ?? 0;
      return stats.zero_spend_days >= count;
    }
    case 'any_streak': {
      const length = (condition.length as number) ?? 0;
      return stats.longest_streak >= length;
    }
    case 'hidden_cost_views': {
      const count = (condition.count as number) ?? 0;
      return stats.hidden_cost_views >= count;
    }
    case 'hidden_cost_accuracy': {
      const count = (condition.count as number) ?? 0;
      return stats.hidden_cost_accurate >= count;
    }
    case 'budget_under_month': {
      const months = (condition.months as number) ?? 0;
      return stats.budget_under_months >= months;
    }
    case 'hidden_cost_acknowledged': {
      const days = (condition.days as number) ?? 0;
      return stats.hidden_cost_acknowledged_days >= days;
    }
    case 'cci_achievement': {
      const score = (condition.score as number) ?? 0;
      return stats.cci_score >= score;
    }
    case 'health_score_streak': {
      // Requires weekly health score history tracking (not yet accumulated)
      return false;
    }
    default:
      return false;
  }
}

// ============================================================
// Challenge System
// ============================================================

/**
 * Fetch all available challenges (templates).
 */
export async function getChallengeTemplates(): Promise<Challenge[]> {
  if (isDemoMode()) {
    return demoChallenges.filter((c) => c.is_template);
  }

  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_template', true)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`getChallengeTemplates failed: ${error.message}`);
  return (data ?? []) as Challenge[];
}

/**
 * Create a new challenge instance from a template.
 */
export async function createChallengeFromTemplate(
  templateId: string,
  userId: string,
  startsAt?: string,
): Promise<Challenge> {
  const startDate = startsAt ?? new Date().toISOString();

  if (isDemoMode()) {
    const template = demoChallenges.find((c) => c.id === templateId);
    if (!template) throw new Error('Template not found');

    const endDate = new Date(
      new Date(startDate).getTime() + template.duration_days * 86400000,
    ).toISOString();

    const instance: Challenge = {
      ...template,
      id: `challenge-inst-${Date.now()}`,
      creator_id: userId,
      is_template: false,
      starts_at: startDate,
      ends_at: endDate,
      created_at: new Date().toISOString(),
    };
    demoChallenges.push(instance);
    return instance;
  }

  // Fetch template
  const { data: template, error: tErr } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', templateId)
    .single();
  if (tErr || !template) throw new Error('Template not found');

  const endDate = new Date(
    new Date(startDate).getTime() + template.duration_days * 86400000,
  ).toISOString();

  const { data: instance, error: iErr } = await supabase
    .from('challenges')
    .insert({
      creator_id: userId,
      title: template.title,
      description: template.description,
      challenge_type: template.challenge_type,
      duration_days: template.duration_days,
      goal: template.goal,
      reward_xp: template.reward_xp,
      is_template: false,
      starts_at: startDate,
      ends_at: endDate,
    })
    .select()
    .single();

  if (iErr) throw new Error(`createChallengeFromTemplate failed: ${iErr.message}`);
  return instance as Challenge;
}

/**
 * Join a challenge as a participant.
 */
export async function joinChallenge(
  userId: string,
  challengeId: string,
): Promise<ChallengeParticipant> {
  if (isDemoMode()) {
    const existing = demoParticipants.find(
      (p) => p.challenge_id === challengeId && p.user_id === userId,
    );
    if (existing) return existing;

    const participant: ChallengeParticipant = {
      id: `cp-${Date.now()}`,
      challenge_id: challengeId,
      user_id: userId,
      progress: {},
      status: 'active',
      joined_at: new Date().toISOString(),
      completed_at: null,
    };
    demoParticipants.push(participant);
    return participant;
  }

  const { data, error } = await supabase
    .from('challenge_participants')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      progress: {},
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(`joinChallenge failed: ${error.message}`);
  return data as ChallengeParticipant;
}

/**
 * Update progress on a challenge.
 */
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  progress: Record<string, unknown>,
): Promise<ChallengeParticipant> {
  if (isDemoMode()) {
    const participant = demoParticipants.find(
      (p) => p.challenge_id === challengeId && p.user_id === userId,
    );
    if (!participant) throw new Error('Participant not found');
    participant.progress = { ...participant.progress, ...progress };
    return participant;
  }

  const { data, error } = await supabase
    .from('challenge_participants')
    .update({ progress })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`updateChallengeProgress failed: ${error.message}`);
  return data as ChallengeParticipant;
}

/**
 * Complete a challenge: marks completed, awards reward_xp.
 */
export async function completeChallenge(
  userId: string,
  challengeId: string,
): Promise<{ xp_earned: number }> {
  if (isDemoMode()) {
    const participant = demoParticipants.find(
      (p) => p.challenge_id === challengeId && p.user_id === userId,
    );
    if (!participant) throw new Error('Participant not found');
    participant.status = 'completed';
    participant.completed_at = new Date().toISOString();

    const challenge = demoChallenges.find((c) => c.id === challengeId);
    const rewardXp = challenge?.reward_xp ?? 100;
    await awardXP(userId, rewardXp, 'challenge', challengeId, `Completed challenge: ${challenge?.title}`);
    return { xp_earned: rewardXp };
  }

  // Mark participant as completed
  const { error: pErr } = await supabase
    .from('challenge_participants')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);
  if (pErr) throw new Error(`completeChallenge update failed: ${pErr.message}`);

  // Fetch challenge for reward
  const { data: challenge, error: cErr } = await supabase
    .from('challenges')
    .select('reward_xp, title')
    .eq('id', challengeId)
    .single();
  if (cErr) throw new Error(`completeChallenge fetch failed: ${cErr.message}`);

  const rewardXp = challenge?.reward_xp ?? 100;
  await awardXP(userId, rewardXp, 'challenge', challengeId, `Completed challenge: ${challenge?.title}`);

  return { xp_earned: rewardXp };
}

/**
 * Get the user's active challenge participations.
 */
export async function getActiveChallenges(
  userId: string,
): Promise<(ChallengeParticipant & { challenge?: Challenge })[]> {
  if (isDemoMode()) {
    return demoParticipants
      .filter((p) => p.user_id === userId && p.status === 'active')
      .map((p) => ({
        ...p,
        challenge: demoChallenges.find((c) => c.id === p.challenge_id),
      }));
  }

  const { data, error } = await supabase
    .from('challenge_participants')
    .select('*, challenges(*)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) throw new Error(`getActiveChallenges failed: ${error.message}`);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as ChallengeParticipant),
    challenge: row.challenges as unknown as Challenge | undefined,
  }));
}

/**
 * Global or challenge-specific leaderboard.
 */
export async function getLeaderboard(challengeId?: string): Promise<LeaderboardEntry[]> {
  if (isDemoMode()) {
    const entries: LeaderboardEntry[] = [
      {
        user_id: 'demo-user',
        display_name: 'You',
        avatar_url: null,
        xp: demoProfile.xp,
        level: demoProfile.level,
        rank: 1,
      },
      {
        user_id: 'demo-friend-1',
        display_name: 'Alex',
        avatar_url: null,
        xp: 120,
        level: 2,
        rank: 2,
      },
      {
        user_id: 'demo-friend-2',
        display_name: 'Jordan',
        avatar_url: null,
        xp: 80,
        level: 1,
        rank: 3,
      },
    ];
    // Sort by XP descending and reassign ranks
    entries.sort((a, b) => b.xp - a.xp);
    entries.forEach((e, i) => (e.rank = i + 1));
    return entries;
  }

  if (challengeId) {
    // Challenge-specific: ranked by XP among participants
    const { data, error } = await supabase
      .from('challenge_participants')
      .select('user_id, profiles(display_name, avatar_url, xp, level)')
      .eq('challenge_id', challengeId)
      .order('joined_at', { ascending: true });

    if (error) throw new Error(`getLeaderboard failed: ${error.message}`);

    const entries: LeaderboardEntry[] = (data ?? []).map(
      (row: Record<string, unknown>, index: number) => {
        const profile = row.profiles as Record<string, unknown> | null;
        return {
          user_id: row.user_id as string,
          display_name: (profile?.display_name as string) ?? 'Unknown',
          avatar_url: (profile?.avatar_url as string | null) ?? null,
          xp: (profile?.xp as number) ?? 0,
          level: (profile?.level as number) ?? 1,
          rank: index + 1,
        };
      },
    );

    entries.sort((a, b) => b.xp - a.xp);
    entries.forEach((e, i) => (e.rank = i + 1));
    return entries;
  }

  // Global leaderboard
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, xp, level')
    .order('xp', { ascending: false })
    .limit(50);

  if (error) throw new Error(`getLeaderboard failed: ${error.message}`);

  return (data ?? []).map((row: Record<string, unknown>, index: number) => ({
    user_id: row.id as string,
    display_name: (row.display_name as string) ?? 'Unknown',
    avatar_url: (row.avatar_url as string | null) ?? null,
    xp: (row.xp as number) ?? 0,
    level: (row.level as number) ?? 1,
    rank: index + 1,
  }));
}

// ============================================================
// Fetch helpers
// ============================================================

/**
 * Fetch all badge definitions.
 */
export async function fetchAllBadges(): Promise<Badge[]> {
  if (isDemoMode()) return demoBadges;

  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('tier', { ascending: true });

  if (error) throw new Error(`fetchAllBadges failed: ${error.message}`);
  return (data ?? []) as Badge[];
}

/**
 * Fetch badges earned by a user.
 */
export async function fetchUserBadges(userId: string): Promise<UserBadge[]> {
  if (isDemoMode()) {
    return demoUserBadges.filter((ub) => ub.user_id === userId);
  }

  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw new Error(`fetchUserBadges failed: ${error.message}`);
  return (data ?? []) as UserBadge[];
}

/**
 * Fetch the gamification-related profile fields.
 */
export async function fetchGamificationProfile(
  userId: string,
): Promise<Pick<Profile, 'xp' | 'level' | 'streak_count' | 'longest_streak' | 'financial_health_score'>> {
  if (isDemoMode()) return { ...demoProfile };

  const { data, error } = await supabase
    .from('profiles')
    .select('xp, level, streak_count, longest_streak, financial_health_score')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`fetchGamificationProfile failed: ${error.message}`);
  return data as Pick<Profile, 'xp' | 'level' | 'streak_count' | 'longest_streak' | 'financial_health_score'>;
}

/**
 * Fetch XP transaction history.
 */
export async function fetchXpHistory(userId: string, limit = 50): Promise<XpTransaction[]> {
  if (isDemoMode()) {
    return demoXpTransactions
      .filter((t) => t.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  const { data, error } = await supabase
    .from('xp_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`fetchXpHistory failed: ${error.message}`);
  return (data ?? []) as XpTransaction[];
}

// ============================================================
// Demo data helpers (reset for testing)
// ============================================================

export function getDemoProfile() {
  return { ...demoProfile };
}

export function getDemoCheckinStatus() {
  return demoCheckinToday;
}

export function resetDemoState() {
  demoProfile = {
    xp: 160,
    level: 2,
    streak_count: 5,
    longest_streak: 5,
    financial_health_score: 72,
  };
  demoCheckinToday = false;
  demoUserBadges = [
    {
      id: 'ub-1',
      user_id: 'demo-user',
      badge_id: 'badge-1',
      earned_at: now,
      is_notified: true,
    },
    {
      id: 'ub-2',
      user_id: 'demo-user',
      badge_id: 'badge-11',
      earned_at: now,
      is_notified: true,
    },
  ];
  demoParticipants = [
    {
      id: 'cp-1',
      challenge_id: 'challenge-inst-1',
      user_id: 'demo-user',
      progress: { days_completed: 2 },
      status: 'active',
      joined_at: now,
      completed_at: null,
    },
  ];
}

// ============================================================
// Internal helpers
// ============================================================

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildDemoBadges(): Badge[] {
  const badges: Badge[] = [
    { id: 'badge-1', name: 'Invested', description: 'Complete your first 7-day check-in streak', icon_url: '/badges/invested.png', tier: 'bronze', unlock_condition: { type: 'streak', streak_type: 'daily_checkin', length: 7 }, xp_reward: 50, created_at: now },
    { id: 'badge-2', name: 'Steadfast', description: 'Maintain a 7-day budget streak', icon_url: '/badges/steadfast.png', tier: 'bronze', unlock_condition: { type: 'streak', streak_type: 'weekly_budget', length: 7 }, xp_reward: 50, created_at: now },
    { id: 'badge-3', name: 'Radiant', description: 'Maintain a 30-day check-in streak', icon_url: '/badges/radiant.png', tier: 'silver', unlock_condition: { type: 'streak', streak_type: 'daily_checkin', length: 30 }, xp_reward: 150, created_at: now },
    { id: 'badge-4', name: 'Legendary', description: 'Maintain a 90-day check-in streak', icon_url: '/badges/legendary.png', tier: 'gold', unlock_condition: { type: 'streak', streak_type: 'daily_checkin', length: 90 }, xp_reward: 500, created_at: now },
    { id: 'badge-5', name: 'Prismatic', description: 'Maintain a 365-day check-in streak', icon_url: '/badges/prismatic.png', tier: 'diamond', unlock_condition: { type: 'streak', streak_type: 'daily_checkin', length: 365 }, xp_reward: 2000, created_at: now },
    { id: 'badge-6', name: 'Budget Boss', description: 'Stay under budget for 3 consecutive months', icon_url: '/badges/budget-boss.png', tier: 'gold', unlock_condition: { type: 'budget_streak', months: 3 }, xp_reward: 500, created_at: now },
    { id: 'badge-7', name: 'Penny Pincher', description: 'Accumulate $100+ in total savings', icon_url: '/badges/penny-pincher.png', tier: 'silver', unlock_condition: { type: 'savings_total', amount: 100 }, xp_reward: 150, created_at: now },
    { id: 'badge-8', name: 'Social Butterfly', description: 'Complete 5 group/friend challenges', icon_url: '/badges/social-butterfly.png', tier: 'silver', unlock_condition: { type: 'challenges_completed', count: 5, group_only: true }, xp_reward: 150, created_at: now },
    { id: 'badge-9', name: 'Fortune Teller', description: 'Have 10 predictions confirmed within 20% accuracy', icon_url: '/badges/fortune-teller.png', tier: 'gold', unlock_condition: { type: 'accurate_predictions', count: 10, accuracy_threshold: 0.2 }, xp_reward: 500, created_at: now },
    { id: 'badge-10', name: 'Early Bird', description: 'Check finances before 8 AM for 7 days', icon_url: '/badges/early-bird.png', tier: 'bronze', unlock_condition: { type: 'early_checkin', days: 7, before_hour: 8 }, xp_reward: 50, created_at: now },
    { id: 'badge-11', name: 'Zero Hero', description: 'Have a complete no-spend day', icon_url: '/badges/zero-hero.png', tier: 'bronze', unlock_condition: { type: 'zero_spend_day', count: 1 }, xp_reward: 50, created_at: now },
    { id: 'badge-12', name: 'Challenge Champion', description: 'Win 3 challenges', icon_url: '/badges/challenge-champion.png', tier: 'gold', unlock_condition: { type: 'challenge_wins', count: 3 }, xp_reward: 500, created_at: now },
    { id: 'badge-13', name: 'Data Driven', description: 'Connect all data sources', icon_url: '/badges/data-driven.png', tier: 'silver', unlock_condition: { type: 'connections', required: ['plaid', 'calendar'] }, xp_reward: 150, created_at: now },
    { id: 'badge-14', name: 'Consistent', description: 'Log spending for 30 consecutive days', icon_url: '/badges/consistent.png', tier: 'silver', unlock_condition: { type: 'streak', streak_type: 'daily_checkin', length: 30 }, xp_reward: 150, created_at: now },
    { id: 'badge-15', name: 'Dedicated', description: 'Maintain a 180-day check-in streak', icon_url: '/badges/dedicated.png', tier: 'gold', unlock_condition: { type: 'streak', streak_type: 'daily_checkin', length: 180 }, xp_reward: 500, created_at: now },
    { id: 'badge-16', name: 'Thrift Lord', description: 'Save $1,000+ cumulative', icon_url: '/badges/thrift-lord.png', tier: 'gold', unlock_condition: { type: 'savings_total', amount: 1000 }, xp_reward: 500, created_at: now },
    { id: 'badge-17', name: 'Prediction Pro', description: 'Achieve CCI score 0.8+ for 4 weeks', icon_url: '/badges/prediction-pro.png', tier: 'gold', unlock_condition: { type: 'cci_streak', score: 0.8, weeks: 4 }, xp_reward: 500, created_at: now },
    { id: 'badge-18', name: 'Night Owl', description: 'Review finances after 10 PM for 7 days', icon_url: '/badges/night-owl.png', tier: 'bronze', unlock_condition: { type: 'late_checkin', days: 7, after_hour: 22 }, xp_reward: 50, created_at: now },
    { id: 'badge-19', name: 'Versatile', description: 'Complete challenges from 5 different categories', icon_url: '/badges/versatile.png', tier: 'silver', unlock_condition: { type: 'challenge_categories', count: 5 }, xp_reward: 150, created_at: now },
    { id: 'badge-20', name: 'Eternal', description: 'Maintain a 365-day streak of any type', icon_url: '/badges/eternal.png', tier: 'diamond', unlock_condition: { type: 'any_streak', length: 365 }, xp_reward: 2000, created_at: now },
    // Hidden cost engagement badges
    { id: 'badge-21', name: 'First Forecast', description: 'View your first hidden cost breakdown', icon_url: '/badges/first-forecast.png', tier: 'bronze', unlock_condition: { type: 'hidden_cost_views', count: 1 }, xp_reward: 25, created_at: now },
    { id: 'badge-22', name: 'Crystal Ball', description: 'Have 10 hidden cost predictions at 70%+ accuracy', icon_url: '/badges/crystal-ball.png', tier: 'silver', unlock_condition: { type: 'hidden_cost_accuracy', count: 10, threshold: 0.7 }, xp_reward: 100, created_at: now },
    { id: 'badge-23', name: 'Budget Guardian', description: 'Stay under budget for a full month', icon_url: '/badges/budget-guardian.png', tier: 'silver', unlock_condition: { type: 'budget_under_month', months: 1 }, xp_reward: 150, created_at: now },
    { id: 'badge-24', name: 'Hidden Cost Hunter', description: 'Acknowledge hidden costs for 7 consecutive days', icon_url: '/badges/hidden-cost-hunter.png', tier: 'gold', unlock_condition: { type: 'hidden_cost_acknowledged', days: 7 }, xp_reward: 200, created_at: now },
    { id: 'badge-25', name: 'Prediction Master', description: 'Achieve CCI score of 80+ for a month', icon_url: '/badges/prediction-master.png', tier: 'gold', unlock_condition: { type: 'cci_achievement', score: 80, months: 1 }, xp_reward: 250, created_at: now },
    { id: 'badge-26', name: 'Financial Sage', description: 'Maintain A+ health score for 2 weeks', icon_url: '/badges/financial-sage.png', tier: 'diamond', unlock_condition: { type: 'health_score_streak', grade: 'A+', weeks: 2 }, xp_reward: 500, created_at: now },
    { id: 'badge-27', name: 'Social Saver', description: 'Complete 3 challenges', icon_url: '/badges/social-saver.png', tier: 'silver', unlock_condition: { type: 'challenges_completed', count: 3 }, xp_reward: 150, created_at: now },
    { id: 'badge-28', name: 'Streak Legend', description: 'Maintain a 30-day daily check-in streak', icon_url: '/badges/streak-legend.png', tier: 'diamond', unlock_condition: { type: 'streak', streak_type: 'daily_checkin', length: 30 }, xp_reward: 300, created_at: now },
  ];
  return badges;
}

function buildDemoChallenges(): Challenge[] {
  const templates: Challenge[] = [
    { id: 'tpl-1', creator_id: null, title: 'No Eating Out Week', description: 'Cook every meal for a full week.', challenge_type: 'no_spend', duration_days: 7, goal: { target_amount: 0, category: 'dining', goal_type: 'spending_limit' }, reward_xp: 250, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'tpl-2', creator_id: null, title: 'Coffee Savings Challenge', description: 'Make coffee at home for 2 weeks.', challenge_type: 'savings_target', duration_days: 14, goal: { target_amount: 70, category: 'coffee_drinks', goal_type: 'savings_target', daily_estimate: 5 }, reward_xp: 150, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'tpl-3', creator_id: null, title: '$500 Monthly Savings Sprint', description: 'Aggressively save $500 in one month.', challenge_type: 'savings_goal', duration_days: 30, goal: { target_amount: 500, goal_type: 'savings_target' }, reward_xp: 500, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'tpl-4', creator_id: null, title: 'Transportation Thrift', description: 'No Uber/Lyft/taxis for a week.', challenge_type: 'no_spend', duration_days: 7, goal: { target_amount: 0, category: 'transport', goal_type: 'spending_limit' }, reward_xp: 200, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'tpl-5', creator_id: null, title: 'Subscription Audit', description: 'Cancel at least one unused subscription.', challenge_type: 'audit', duration_days: 3, goal: { cancellations_required: 1, goal_type: 'category_reduction' }, reward_xp: 100, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'tpl-6', creator_id: null, title: 'Zero Dollar Day Challenge', description: 'Three no-spend days this week.', challenge_type: 'no_spend', duration_days: 7, goal: { zero_spend_days: 3, goal_type: 'spending_limit' }, reward_xp: 200, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'tpl-7', creator_id: null, title: 'Pack Lunch Week', description: 'Bring lunch from home every workday.', challenge_type: 'no_spend', duration_days: 5, goal: { target_amount: 0, category: 'dining', goal_type: 'spending_limit', workdays_only: true }, reward_xp: 200, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'tpl-8', creator_id: null, title: 'Entertainment Budget Challenge', description: 'Keep entertainment under $50 for two weeks.', challenge_type: 'budget_streak', duration_days: 14, goal: { target_amount: 50, category: 'entertainment', goal_type: 'spending_limit' }, reward_xp: 250, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'tpl-9', creator_id: null, title: 'Savings Snowball', description: 'Save $1 day 1, $2 day 2, etc.', challenge_type: 'savings_target', duration_days: 7, goal: { target_amount: 28, goal_type: 'savings_target', incremental: true }, reward_xp: 150, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'tpl-10', creator_id: null, title: 'Cash Only Week', description: 'Use only cash for the week.', challenge_type: 'budget_streak', duration_days: 7, goal: { goal_type: 'spending_limit', cash_only: true }, reward_xp: 300, is_template: true, starts_at: null, ends_at: null, created_at: now },
    // Hidden cost awareness challenges
    { id: 'challenge-11', creator_id: null, title: 'No-Spend Weekend', description: '$0 discretionary spending Sat-Sun.', challenge_type: 'no_spend', duration_days: 2, goal: { goal_type: 'zero_spend', days: 2 }, reward_xp: 100, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'challenge-12', creator_id: null, title: 'Coffee Cutback', description: 'Reduce coffee spending by 30% this week.', challenge_type: 'savings_target', duration_days: 7, goal: { goal_type: 'reduce_category', category: 'dining', reduction: 0.3 }, reward_xp: 75, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'challenge-13', creator_id: null, title: 'Lunch Prep Week', description: 'Pack lunch every workday (skip all lunch predictions).', challenge_type: 'no_spend', duration_days: 5, goal: { goal_type: 'skip_category', category: 'dining', days: 5 }, reward_xp: 80, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'challenge-14', creator_id: null, title: 'Hidden Cost Master', description: 'Acknowledge all hidden costs before events for 7 days.', challenge_type: 'budget_streak', duration_days: 7, goal: { goal_type: 'hidden_cost_acknowledged', days: 7 }, reward_xp: 120, is_template: true, starts_at: null, ends_at: null, created_at: now },
    { id: 'challenge-15', creator_id: null, title: 'Savings Sprint', description: 'Save $100 more than usual this month.', challenge_type: 'savings_goal', duration_days: 30, goal: { goal_type: 'savings_target', amount: 100 }, reward_xp: 200, is_template: true, starts_at: null, ends_at: null, created_at: now },
  ];

  // Add one active instance for demo user
  const instance: Challenge = {
    ...templates[0],
    id: 'challenge-inst-1',
    creator_id: 'demo-user',
    is_template: false,
    starts_at: shiftDate(today, -2),
    ends_at: shiftDate(today, 5),
  };

  return [...templates, instance];
}
