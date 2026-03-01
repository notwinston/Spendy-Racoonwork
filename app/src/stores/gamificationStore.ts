/**
 * Gamification Zustand Store
 *
 * Manages XP, levels, streaks, badges, and challenges state.
 */
import { create } from 'zustand';
import type {
  Badge,
  UserBadge,
  Challenge,
  ChallengeParticipant,
  LeaderboardEntry,
  XpTransaction,
} from '../types';
import {
  performCheckin as svcPerformCheckin,
  evaluateBadges as svcEvaluateBadges,
  fetchAllBadges,
  fetchUserBadges,
  getChallengeTemplates,
  getActiveChallenges,
  joinChallenge as svcJoinChallenge,
  completeChallenge as svcCompleteChallenge,
  updateChallengeProgress as svcUpdateChallengeProgress,
  createChallengeFromTemplate as svcCreateChallengeFromTemplate,
  getLeaderboard as svcGetLeaderboard,
  fetchGamificationProfile,
  fetchXpHistory,
  calculateLevel,
  getXPForNextLevel,
  xpThresholdForLevel,
  xpRemainingForNextLevel,
} from '../services/gamificationService';

interface GamificationProfile {
  xp: number;
  level: number;
  streakCount: number;
  longestStreak: number;
  healthScore: number | null;
}

interface GamificationState {
  // Profile / XP
  profile: GamificationProfile;
  xpHistory: XpTransaction[];

  // Badges
  badges: Badge[];
  earnedBadges: UserBadge[];

  // Challenges
  challengeTemplates: Challenge[];
  activeChallenges: (ChallengeParticipant & { challenge?: Challenge })[];

  // Leaderboard
  leaderboard: LeaderboardEntry[];

  // Check-in
  dailyCheckinDone: boolean;

  // Social/Privacy
  socialOptIn: boolean;
  anonymousMode: boolean;
  setSocialOptIn: (v: boolean) => void;
  setAnonymousMode: (v: boolean) => void;

  // Loading
  isLoading: boolean;
  error: string | null;

  // Computed helpers (not derived getters in zustand, but functions)
  xpForNextLevel: () => number;
  xpProgress: () => number;
  xpRemaining: () => number;

  // Actions
  loadProfile: (userId: string) => Promise<void>;
  performCheckin: (userId: string) => Promise<{
    xp_earned: number;
    streak_count: number;
    badges_earned: Badge[];
  }>;
  fetchBadges: (userId: string) => Promise<void>;
  evaluateBadges: (userId: string) => Promise<Badge[]>;
  fetchChallenges: (userId: string) => Promise<void>;
  joinChallenge: (userId: string, challengeId: string) => Promise<void>;
  completeChallenge: (userId: string, challengeId: string) => Promise<void>;
  updateChallengeProgress: (
    userId: string,
    challengeId: string,
    progress: Record<string, unknown>,
  ) => Promise<void>;
  createFromTemplate: (
    templateId: string,
    userId: string,
    startsAt?: string,
  ) => Promise<Challenge>;
  fetchLeaderboard: (options?: { challengeId?: string; scope?: 'global' | 'friends'; friendIds?: string[] }) => Promise<void>;
  fetchXpHistory: (userId: string) => Promise<void>;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: {
    xp: 0,
    level: 1,
    streakCount: 0,
    longestStreak: 0,
    healthScore: null,
  },
  xpHistory: [],
  badges: [],
  earnedBadges: [],
  challengeTemplates: [],
  activeChallenges: [],
  leaderboard: [],
  dailyCheckinDone: false,
  socialOptIn: true,
  anonymousMode: false,
  setSocialOptIn: (v: boolean) => set({ socialOptIn: v }),
  setAnonymousMode: (v: boolean) => set({ anonymousMode: v }),
  isLoading: false,
  error: null,

  // Computed helpers
  xpForNextLevel: () => getXPForNextLevel(get().profile.level),
  xpProgress: () => {
    const { xp, level } = get().profile;
    const currentThreshold = xpThresholdForLevel(level);
    const nextThreshold = xpThresholdForLevel(level + 1);
    const range = nextThreshold - currentThreshold;
    if (range <= 0) return 1;
    return (xp - currentThreshold) / range;
  },
  xpRemaining: () => xpRemainingForNextLevel(get().profile.xp),

  // Actions

  loadProfile: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchGamificationProfile(userId);
      set({
        profile: {
          xp: data.xp,
          level: data.level,
          streakCount: data.streak_count,
          longestStreak: data.longest_streak,
          healthScore: data.financial_health_score,
        },
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  performCheckin: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await svcPerformCheckin(userId);
      // Refresh profile from latest data
      const data = await fetchGamificationProfile(userId);
      set({
        profile: {
          xp: data.xp,
          level: data.level,
          streakCount: data.streak_count,
          longestStreak: data.longest_streak,
          healthScore: data.financial_health_score,
        },
        dailyCheckinDone: true,
        isLoading: false,
      });

      // If any new badges, refresh them
      if (result.badges_earned.length > 0) {
        const allBadges = await fetchAllBadges();
        const userBadges = await fetchUserBadges(userId);
        set({ badges: allBadges, earnedBadges: userBadges });
      }

      return result;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Check-in failed',
        isLoading: false,
      });
      return { xp_earned: 0, streak_count: get().profile.streakCount, badges_earned: [] };
    }
  },

  fetchBadges: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const [allBadges, userBadges] = await Promise.all([
        fetchAllBadges(),
        fetchUserBadges(userId),
      ]);
      set({ badges: allBadges, earnedBadges: userBadges, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch badges',
        isLoading: false,
      });
    }
  },

  evaluateBadges: async (userId: string) => {
    try {
      const newBadges = await svcEvaluateBadges(userId);
      if (newBadges.length > 0) {
        const userBadges = await fetchUserBadges(userId);
        set({ earnedBadges: userBadges });
      }
      return newBadges;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Badge evaluation failed',
      });
      return [];
    }
  },

  fetchChallenges: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const [templates, active] = await Promise.all([
        getChallengeTemplates(),
        getActiveChallenges(userId),
      ]);
      set({
        challengeTemplates: templates,
        activeChallenges: active,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch challenges',
        isLoading: false,
      });
    }
  },

  joinChallenge: async (userId: string, challengeId: string) => {
    set({ error: null });
    try {
      const participant = await svcJoinChallenge(userId, challengeId);
      set((state) => ({
        activeChallenges: [...state.activeChallenges, participant],
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to join challenge',
      });
    }
  },

  completeChallenge: async (userId: string, challengeId: string) => {
    set({ error: null });
    try {
      await svcCompleteChallenge(userId, challengeId);
      // Refresh active challenges and profile
      const [active, profileData] = await Promise.all([
        getActiveChallenges(userId),
        fetchGamificationProfile(userId),
      ]);
      set({
        activeChallenges: active,
        profile: {
          xp: profileData.xp,
          level: profileData.level,
          streakCount: profileData.streak_count,
          longestStreak: profileData.longest_streak,
          healthScore: profileData.financial_health_score,
        },
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to complete challenge',
      });
    }
  },

  updateChallengeProgress: async (
    userId: string,
    challengeId: string,
    progress: Record<string, unknown>,
  ) => {
    set({ error: null });
    try {
      const updated = await svcUpdateChallengeProgress(userId, challengeId, progress);
      set((state) => ({
        activeChallenges: state.activeChallenges.map((p) =>
          p.challenge_id === challengeId && p.user_id === userId
            ? { ...p, progress: updated.progress }
            : p,
        ),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update progress',
      });
    }
  },

  createFromTemplate: async (
    templateId: string,
    userId: string,
    startsAt?: string,
  ) => {
    set({ error: null });
    try {
      const challenge = await svcCreateChallengeFromTemplate(templateId, userId, startsAt);
      return challenge;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create challenge',
      });
      throw err;
    }
  },

  fetchLeaderboard: async (options?: { challengeId?: string; scope?: 'global' | 'friends'; friendIds?: string[] }) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await svcGetLeaderboard(options);
      set({ leaderboard: entries, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch leaderboard',
        isLoading: false,
      });
    }
  },

  fetchXpHistory: async (userId: string) => {
    set({ error: null });
    try {
      const history = await fetchXpHistory(userId);
      set({ xpHistory: history });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch XP history',
      });
    }
  },
}));

// Re-export pure calculation helpers for convenience
export { calculateLevel, getXPForNextLevel, xpThresholdForLevel, xpRemainingForNextLevel };

// ---------- Rank Tier System ----------

export const RANK_TIERS = [
  { name: 'Bronze', minRate: 0, maxRate: 5, color: '#CD7F32', badge: '\u{1F949}', label: 'Getting Started' },
  { name: 'Silver', minRate: 5, maxRate: 15, color: '#94A3B8', badge: '\u{1F948}', label: 'On Track' },
  { name: 'Gold', minRate: 15, maxRate: 25, color: '#F59E0B', badge: '\u{1F947}', label: 'Saver' },
  { name: 'Platinum', minRate: 25, maxRate: 40, color: '#3B82F6', badge: '\u{1F48E}', label: 'Super Saver' },
  { name: 'Diamond', minRate: 40, maxRate: 100, color: '#8B5CF6', badge: '\u{1F537}', label: 'Financial Elite' },
] as const;

export function calculateRankTier(savingsRate: number): typeof RANK_TIERS[number] {
  return RANK_TIERS.find((t) => savingsRate >= t.minRate && savingsRate < t.maxRate) || RANK_TIERS[0];
}
