import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../src/constants';
import { AtmosphericBackground } from '../src/components/ui/AtmosphericBackground';
import { GlassCard } from '../src/components/ui/GlassCard';
import { useNotificationStore } from '../src/stores/notificationStore';
import { useAuthStore } from '../src/stores/authStore';
import type { Notification } from '../src/types';

function getCategoryIcon(category: string | null): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'spending_alert':
      return 'cash-outline';
    case 'budget_warning':
      return 'warning-outline';
    case 'social_nudge':
      return 'people-outline';
    case 'challenge_update':
      return 'trophy-outline';
    case 'streak_reminder':
      return 'flame-outline';
    default:
      return 'notifications-outline';
  }
}

function getCategoryColor(category: string | null): string {
  switch (category) {
    case 'spending_alert':
      return Colors.accent;
    case 'budget_warning':
      return Colors.warning;
    case 'social_nudge':
      return Colors.info;
    case 'challenge_update':
      return Colors.badgeGold;
    case 'streak_reminder':
      return '#FF6B35';
    default:
      return Colors.textSecondary;
  }
}

function getNotificationAccentColor(category: string | null): string {
  switch (category) {
    case 'spending_alert':
    case 'budget_warning':
      return '#F59E0B'; // amber/warning
    case 'social_nudge':
      return '#2563EB'; // blue/info
    case 'challenge_update':
    case 'streak_reminder':
      return '#00D09C'; // green/success
    default:
      return '#2563EB'; // blue default
  }
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

function NotificationItem({ notification, onPress, index }: NotificationItemProps & { index: number }) {
  const icon = getCategoryIcon(notification.category);
  const iconColor = getCategoryColor(notification.category);
  const accentColor = getNotificationAccentColor(notification.category);

  return (
    <Animated.View entering={FadeIn.delay(index * 60)} style={!notification.is_read ? styles.unreadItem : undefined}>
      <GlassCard
        accentEdge="left"
        accentColor={accentColor}
        onPress={onPress}
        style={styles.notificationItem}
      >
        <View style={styles.notificationRow}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationTitle,
                  !notification.is_read && styles.unreadTitle,
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {!notification.is_read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {notification.body}
            </Text>
            <Text style={styles.notificationTimestamp}>
              {formatTimestamp(notification.sent_at)}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotificationStore();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
    }
  }, [user?.id]);

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime(),
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AtmosphericBackground variant="default">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllRead}>Read All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : sortedNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={48}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            You will see spending alerts, budget warnings, and more here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {unreadCount > 0 && (
            <Text style={styles.sectionLabel}>
              {unreadCount} unread
            </Text>
          )}
          {sortedNotifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              index={index}
              onPress={() => {
                if (!notification.is_read) {
                  markRead(notification.id);
                }
              }}
            />
          ))}
        </ScrollView>
      )}
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  notificationRow: {
    flexDirection: 'row',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  markAllRead: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.accent,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  notificationItem: {
    marginBottom: Spacing.sm,
    padding: 0,
  },
  unreadItem: {
    backgroundColor: 'rgba(0, 208, 156, 0.05)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  unreadTitle: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginLeft: Spacing.sm,
  },
  notificationBody: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  notificationTimestamp: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
