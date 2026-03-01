/**
 * Notification Preferences & History Zustand Store
 *
 * Manages notification preferences (toggles) and notification history.
 * In demo mode, pre-populates with sample notifications.
 */
import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import type { Notification, NotificationPriority } from '../types';

export interface NotificationPreferences {
  spendingAlerts: boolean;
  budgetWarnings: boolean;
  socialNudges: boolean;
  challengeUpdates: boolean;
  streakReminders: boolean;
  hiddenCostAlerts: boolean;
}

export type ProfileVisibility = 'public' | 'friends_only' | 'private';

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  shareSpendingData: boolean;
  anonymousLeaderboard: boolean;
}

interface NotificationState {
  preferences: NotificationPreferences;
  privacy: PrivacySettings;
  notifications: Notification[];
  isLoading: boolean;

  // Preference actions
  togglePreference: (key: keyof NotificationPreferences) => void;

  // Privacy actions
  setProfileVisibility: (visibility: ProfileVisibility) => void;
  togglePrivacy: (key: 'shareSpendingData' | 'anonymousLeaderboard') => void;

  // Notification actions
  fetchNotifications: (userId: string) => Promise<void>;
  markRead: (notificationId: string) => void;
  markAllRead: () => void;
  clearAll: () => void;

  // Morning brief scheduling
  scheduleMorningBrief: () => Promise<void>;
  cancelMorningBrief: () => Promise<void>;
}

function generateDemoNotifications(userId: string): Notification[] {
  const now = new Date();
  return [
    {
      id: 'notif-1',
      user_id: userId,
      title: 'Weekend Spending Alert',
      body: 'You have 3 events this weekend. Predicted spending: $145. Your dining budget is at 72%.',
      category: 'spending_alert',
      priority: 'high' as NotificationPriority,
      data: null,
      is_read: false,
      sent_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      read_at: null,
    },
    {
      id: 'notif-2',
      user_id: userId,
      title: 'Budget Warning: Dining',
      body: 'You have used 85% of your dining budget with 10 days remaining this month.',
      category: 'budget_warning',
      priority: 'high' as NotificationPriority,
      data: null,
      is_read: false,
      sent_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      read_at: null,
    },
    {
      id: 'notif-3',
      user_id: userId,
      title: 'Nudge from Alex',
      body: '"Hey, want to join the No-Spend Weekend challenge?"',
      category: 'social_nudge',
      priority: 'medium' as NotificationPriority,
      data: null,
      is_read: false,
      sent_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      read_at: null,
    },
    {
      id: 'notif-4',
      user_id: userId,
      title: 'Challenge Complete!',
      body: 'You completed the "Coffee-Free Week" challenge and earned 100 XP!',
      category: 'challenge_update',
      priority: 'medium' as NotificationPriority,
      data: null,
      is_read: true,
      sent_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-5',
      user_id: userId,
      title: 'Keep Your Streak Alive!',
      body: 'You are on a 5-day check-in streak. Do not forget to check in today!',
      category: 'streak_reminder',
      priority: 'low' as NotificationPriority,
      data: null,
      is_read: true,
      sent_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-6',
      user_id: userId,
      title: 'New Prediction Ready',
      body: 'We predicted $32 for your upcoming "Team Lunch" event tomorrow.',
      category: 'spending_alert',
      priority: 'medium' as NotificationPriority,
      data: null,
      is_read: true,
      sent_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(now.getTime() - 2.8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-7',
      user_id: userId,
      title: 'Hidden Cost Alert: Dinner Tonight',
      body: 'Budget $113 for dinner at Earls, not just $45. Drinks & Uber likely.',
      category: 'hidden_cost_alert',
      priority: 'medium' as NotificationPriority,
      data: null,
      is_read: false,
      sent_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      read_at: null,
    },
    {
      id: 'notif-8',
      user_id: userId,
      title: 'Pre-Event Cost Reminder',
      body: 'Gym in 2 hours — expect $8-12 for a post-workout smoothie.',
      category: 'hidden_cost_alert',
      priority: 'low' as NotificationPriority,
      data: null,
      is_read: true,
      sent_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  preferences: {
    spendingAlerts: true,
    budgetWarnings: true,
    socialNudges: true,
    challengeUpdates: true,
    streakReminders: true,
    hiddenCostAlerts: true,
  },

  privacy: {
    profileVisibility: 'friends_only',
    shareSpendingData: false,
    anonymousLeaderboard: false,
  },

  notifications: [],
  isLoading: false,

  togglePreference: (key: keyof NotificationPreferences) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        [key]: !state.preferences[key],
      },
    })),

  setProfileVisibility: (visibility: ProfileVisibility) =>
    set((state) => ({
      privacy: {
        ...state.privacy,
        profileVisibility: visibility,
      },
    })),

  togglePrivacy: (key: 'shareSpendingData' | 'anonymousLeaderboard') =>
    set((state) => ({
      privacy: {
        ...state.privacy,
        [key]: !state.privacy[key],
      },
    })),

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });
    try {
      // In demo mode, use sample notifications
      const demoNotifications = generateDemoNotifications(userId);
      set({ notifications: demoNotifications, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: (notificationId: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n,
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at || new Date().toISOString(),
      })),
    })),

  clearAll: () => set({ notifications: [] }),
}));
