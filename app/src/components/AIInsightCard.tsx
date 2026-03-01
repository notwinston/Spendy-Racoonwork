import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { GlassCard } from './ui/GlassCard';

export interface AIInsightCardProps {
  type: 'warning' | 'opportunity' | 'win' | 'budget';
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

const TYPE_CONFIG: Record<
  AIInsightCardProps['type'],
  { color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  warning: { color: Colors.negative, icon: 'alert-circle' },
  opportunity: { color: Colors.accentGlow, icon: 'cash-outline' },
  win: { color: Colors.positive, icon: 'trending-up' },
  budget: { color: Colors.accentBright, icon: 'wallet-outline' },
};

export function AIInsightCard({
  type,
  title,
  body,
  actionLabel,
  onAction,
}: AIInsightCardProps) {
  const config = TYPE_CONFIG[type];

  return (
    <GlassCard accentEdge="left" accentColor={config.color} style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={config.icon} size={20} color={config.color} />
        <Text style={[styles.title, { color: config.color }]}>{title}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction && (
        <Pressable style={[styles.actionBtn, { backgroundColor: config.color }]} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  body: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
  actionBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
});
