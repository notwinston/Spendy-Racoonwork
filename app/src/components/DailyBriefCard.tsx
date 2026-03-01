import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { GlassCard } from './ui/GlassCard';
import { usePredictionStore } from '../stores/predictionStore';
import type { EventCategory } from '../types';

const CATEGORY_ICONS: Record<EventCategory, string> = {
  dining: 'restaurant',
  groceries: 'cart',
  transport: 'car',
  entertainment: 'film',
  shopping: 'bag',
  travel: 'airplane',
  health: 'medkit',
  education: 'school',
  fitness: 'barbell',
  social: 'people',
  professional: 'briefcase',
  bills: 'receipt',
  personal: 'person',
  other: 'ellipsis-horizontal',
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export function DailyBriefCard() {
  const router = useRouter();
  const { dailyBrief } = usePredictionStore();

  if (!dailyBrief || dailyBrief.events.length === 0) return null;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <GlassCard style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="sunny" size={20} color={Colors.warning} />
          <Text style={styles.headerTitle}>Today's Spending Forecast</Text>
        </View>
        <Text style={styles.headerDate}>{dateStr}</Text>
      </View>

      {/* Summary */}
      <Text style={styles.summary}>
        {dailyBrief.events.length} event{dailyBrief.events.length !== 1 ? 's' : ''} · Estimated $
        {dailyBrief.total_predicted_low.toFixed(0)} - ${dailyBrief.total_predicted_high.toFixed(0)}
      </Text>

      {/* Simplified Event List */}
      <View style={styles.divider} />
      {dailyBrief.events.map((breakdown) => {
        const event = breakdown.base_prediction;
        const iconName = CATEGORY_ICONS[event.predicted_category] ?? 'ellipsis-horizontal';

        return (
          <TouchableOpacity
            key={breakdown.calendar_event_id}
            style={styles.eventRow}
            onPress={() => router.push('/(tabs)/calendar')}
            activeOpacity={0.7}
          >
            <View style={styles.eventLeft}>
              <Ionicons
                name={iconName as keyof typeof Ionicons.glyphMap}
                size={16}
                color={Colors.accent}
              />
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.explanation ?? event.predicted_category}
              </Text>
            </View>
            <Text style={styles.eventBase}>
              ${event.predicted_amount.toFixed(0)}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* View Full Breakdown */}
      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => router.push('/(tabs)/calendar')}
        activeOpacity={0.7}
      >
        <Text style={styles.linkText}>View Full Breakdown</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  headerDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  summary: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  eventTitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  eventBase: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  linkText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
});
