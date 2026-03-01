import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
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
      ? Colors.positive
      : trend === 'down'
        ? Colors.danger
        : Colors.textSecondary;

  const trendIcon =
    trend === 'up'
      ? 'arrow-up'
      : trend === 'down'
        ? 'arrow-down'
        : 'remove';

  const content = (
    <Card style={styles.card}>
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
        </View>
      ) : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

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
    fontSize: Typography.sizes['2xl'],
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
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
