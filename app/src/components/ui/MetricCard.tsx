import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { Colors, Typography, Spacing } from '../../constants';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  subtitle?: string;
  onPress?: () => void;
}

export function MetricCard({
  label,
  value,
  trend,
  trendValue,
  subtitle,
  onPress,
}: MetricCardProps) {
  const trendColor =
    trend === 'up'
      ? '#00D09C'
      : trend === 'down'
        ? '#EF4444'
        : Colors.textSecondary;

  const trendIcon =
    trend === 'up'
      ? 'arrow-up'
      : trend === 'down'
        ? 'arrow-down'
        : 'remove';

  const accentEdge = trend && trend !== 'flat' ? 'left' as const : 'none' as const;

  const content = (
    <GlassCard
      style={styles.card}
      accentEdge={accentEdge}
      accentColor={trendColor}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {trend && trendValue ? (
        <View style={styles.trendRow}>
          <Ionicons
            name={trendIcon as keyof typeof Ionicons.glyphMap}
            size={14}
            color={trendColor}
          />
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trendValue}
          </Text>
          <View style={[styles.trendBar, { backgroundColor: trendColor }]} />
        </View>
      ) : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </GlassCard>
  );

  return content;
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  value: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 28,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  trendText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  trendBar: {
    height: 3,
    flex: 1,
    borderRadius: 2,
    marginLeft: 8,
    opacity: 0.6,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
