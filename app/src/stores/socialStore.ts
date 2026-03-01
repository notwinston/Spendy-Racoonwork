/**
 * Social Zustand Store
 *
 * Manages friends, circles, nudges, and notifications state.
 */
import { create } from 'zustand';
import type {
  Friendship,
  FriendCircle,
  CircleMember,
  SocialNudge,
  Notification,
  NudgeType,
  NotificationPriority,
  Profile,
  LeaderboardEntry,
  FriendWithProfile,
  CalendarEvent,
  EventCostBreakdown,
} from '../types';
import {
  sendFriendRequest as svcSendFriendRequest,
  acceptFriendRequest as svcAcceptFriendRequest,
  getFriends as svcGetFriends,
  getPendingRequests as svcGetPendingRequests,
  removeFriend as svcRemoveFriend,
  createCircle as svcCreateCircle,
  joinCircle as svcJoinCircle,
  getCircleMembers as svcGetCircleMembers,
  getUserCircles as svcGetUserCircles,
  leaveCircle as svcLeaveCircle,
  sendNudge as svcSendNudge,
  getNudges as svcGetNudges,
  markNudgeRead as svcMarkNudgeRead,
  createNotification as svcCreateNotification,
  getNotifications as svcGetNotifications,
  markNotificationRead as svcMarkNotificationRead,
  getUnreadNotificationCount as svcGetUnreadNotificationCount,
} from '../services/socialService';
import { getLeaderboard as svcGetLeaderboard } from '../services/gamificationService';

interface SocialState {
  // Friends
  friends: FriendWithProfile[];
  pendingRequests: Friendship[];

  // Circles
  circles: FriendCircle[];
  circleMembersMap: Record<string, (CircleMember & { profile?: Profile })[]>;

  // Nudges & Notifications
  nudges: SocialNudge[];
  notifications: Notification[];
  unreadNotificationCount: number;

  // Leaderboard
  leaderboard: LeaderboardEntry[];

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions - Friends
  fetchFriends: (userId: string) => Promise<void>;
  fetchPendingRequests: (userId: string) => Promise<void>;
  sendFriendRequest: (userId: string, friendCode: string) => Promise<void>;
  acceptRequest: (userId: string, friendshipId: string) => Promise<void>;
  removeFriend: (userId: string, friendId: string) => Promise<void>;

  // Actions - Circles
  fetchCircles: (userId: string) => Promise<void>;
  createCircle: (userId: string, name: string, description?: string) => Promise<FriendCircle>;
  joinCircle: (userId: string, inviteCode: string) => Promise<void>;
  fetchCircleMembers: (circleId: string) => Promise<void>;
  leaveCircle: (userId: string, circleId: string) => Promise<void>;

  // Actions - Nudges
  sendNudge: (
    senderId: string,
    recipientId: string,
    nudgeType: NudgeType,
    content: string,
  ) => Promise<void>;
  fetchNudges: (userId: string) => Promise<void>;
  markNudgeRead: (nudgeId: string) => Promise<void>;

  // Actions - Notifications
  createNotification: (
    userId: string,
    title: string,
    body: string,
    category: string,
    priority: NotificationPriority,
    data?: Record<string, unknown>,
  ) => Promise<void>;
  fetchNotifications: (userId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  fetchUnreadCount: (userId: string) => Promise<void>;

  // Actions - Hidden Cost Alerts
  sendPreEventHiddenCostAlert: (
    userId: string,
    event: CalendarEvent,
    breakdown: EventCostBreakdown,
  ) => Promise<void>;

  // Actions - Leaderboard
  fetchLeaderboard: (challengeId?: string) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  circles: [],
  circleMembersMap: {},
  nudges: [],
  notifications: [],
  unreadNotificationCount: 0,
  leaderboard: [],
  isLoading: false,
  error: null,

  // ---- Friends ----

  fetchFriends: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const friends = await svcGetFriends(userId);
      set({ friends, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch friends',
        isLoading: false,
      });
    }
  },

  fetchPendingRequests: async (userId: string) => {
    set({ error: null });
    try {
      const pending = await svcGetPendingRequests(userId);
      set({ pendingRequests: pending });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch pending requests',
      });
    }
  },

  sendFriendRequest: async (userId: string, friendCode: string) => {
    set({ error: null });
    try {
      await svcSendFriendRequest(userId, friendCode);
      // Refresh pending requests
      const pending = await svcGetPendingRequests(userId);
      set({ pendingRequests: pending });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to send friend request',
      });
      throw err;
    }
  },

  acceptRequest: async (userId: string, friendshipId: string) => {
    set({ error: null });
    try {
      await svcAcceptFriendRequest(userId, friendshipId);
      // Refresh both lists
      const [friends, pending] = await Promise.all([
        svcGetFriends(userId),
        svcGetPendingRequests(userId),
      ]);
      set({ friends, pendingRequests: pending });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to accept request',
      });
    }
  },

  removeFriend: async (userId: string, friendId: string) => {
    set({ error: null });
    try {
      await svcRemoveFriend(userId, friendId);
      set((state) => ({
        friends: state.friends.filter(
          (f) => f.profile.id !== friendId,
        ),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to remove friend',
      });
    }
  },

  // ---- Circles ----

  fetchCircles: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const circles = await svcGetUserCircles(userId);
      set({ circles, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch circles',
        isLoading: false,
      });
    }
  },

  createCircle: async (userId: string, name: string, description?: string) => {
    set({ error: null });
    try {
      const circle = await svcCreateCircle(userId, name, description);
      set((state) => ({ circles: [...state.circles, circle] }));
      return circle;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create circle',
      });
      throw err;
    }
  },

  joinCircle: async (userId: string, inviteCode: string) => {
    set({ error: null });
    try {
      await svcJoinCircle(userId, inviteCode);
      // Refresh circles
      const circles = await svcGetUserCircles(userId);
      set({ circles });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to join circle',
      });
      throw err;
    }
  },

  fetchCircleMembers: async (circleId: string) => {
    set({ error: null });
    try {
      const members = await svcGetCircleMembers(circleId);
      set((state) => ({
        circleMembersMap: {
          ...state.circleMembersMap,
          [circleId]: members,
        },
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch circle members',
      });
    }
  },

  leaveCircle: async (userId: string, circleId: string) => {
    set({ error: null });
    try {
      await svcLeaveCircle(userId, circleId);
      set((state) => ({
        circles: state.circles.filter((c) => c.id !== circleId),
        circleMembersMap: Object.fromEntries(
          Object.entries(state.circleMembersMap).filter(([key]) => key !== circleId),
        ),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to leave circle',
      });
    }
  },

  // ---- Nudges ----

  sendNudge: async (
    senderId: string,
    recipientId: string,
    nudgeType: NudgeType,
    content: string,
  ) => {
    set({ error: null });
    try {
      await svcSendNudge(senderId, recipientId, nudgeType, content);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to send nudge',
      });
      throw err;
    }
  },

  fetchNudges: async (userId: string) => {
    set({ error: null });
    try {
      const nudges = await svcGetNudges(userId);
      set({ nudges });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch nudges',
      });
    }
  },

  markNudgeRead: async (nudgeId: string) => {
    set({ error: null });
    try {
      await svcMarkNudgeRead(nudgeId);
      set((state) => ({
        nudges: state.nudges.filter((n) => n.id !== nudgeId),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to mark nudge read',
      });
    }
  },

  // ---- Notifications ----

  createNotification: async (
    userId: string,
    title: string,
    body: string,
    category: string,
    priority: NotificationPriority,
    data?: Record<string, unknown>,
  ) => {
    set({ error: null });
    try {
      const notif = await svcCreateNotification(userId, title, body, category, priority, data);
      set((state) => ({
        notifications: [notif, ...state.notifications],
        unreadNotificationCount: state.unreadNotificationCount + 1,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create notification',
      });
    }
  },

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const notifications = await svcGetNotifications(userId);
      set({ notifications, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch notifications',
        isLoading: false,
      });
    }
  },

  markNotificationRead: async (notificationId: string) => {
    set({ error: null });
    try {
      await svcMarkNotificationRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n,
        ),
        unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to mark notification read',
      });
    }
  },

  fetchUnreadCount: async (userId: string) => {
    set({ error: null });
    try {
      const count = await svcGetUnreadNotificationCount(userId);
      set({ unreadNotificationCount: count });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch unread count',
      });
    }
  },

  // ---- Hidden Cost Alerts ----

  sendPreEventHiddenCostAlert: async (
    userId: string,
    event: CalendarEvent,
    breakdown: EventCostBreakdown,
  ) => {
    const now = new Date();
    const eventStart = new Date(event.start_time);
    const hoursUntil = Math.max(0, Math.round((eventStart.getTime() - now.getTime()) / (1000 * 60 * 60)));

    const topLabels = breakdown.hidden_costs
      .filter((c) => !c.is_dismissed && c.tier === 'likely')
      .slice(0, 2)
      .map((c) => c.label)
      .join(' & ');

    const title = `${event.title} in ${hoursUntil} hours`;
    const body = `Budget $${Math.round(breakdown.total_likely)} (not just $${Math.round(breakdown.base_prediction.predicted_amount)}!)${topLabels ? ` — ${topLabels} likely.` : ''}`;

    const store = get();
    await store.createNotification(
      userId,
      title,
      body,
      'hidden_cost_alert',
      'medium',
      {
        calendar_event_id: event.id,
        total_predicted: breakdown.total_likely,
      },
    );
  },

  // ---- Leaderboard ----

  fetchLeaderboard: async (challengeId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await svcGetLeaderboard(challengeId);
      set({ leaderboard: entries, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch leaderboard',
        isLoading: false,
      });
    }
  },
}));
