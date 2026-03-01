import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';

export interface AnomalyBannerProps {
  anomalies: Array<{
    category: string;
    amount: number;
    average: number;
    multiplier: number;
  }>;
}

export function AnomalyBanner({ anomalies }: AnomalyBannerProps) {
  if (anomalies.length === 0) return null;

  return (
    <View style={styles.container}>
      {anomalies.map((anomaly) => (
        <View key={anomaly.category} style={styles.banner}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Unusual Spending Detected</Text>
            <Text style={styles.body}>
              Your{' '}
              <Text style={styles.category}>
                {anomaly.category.charAt(0).toUpperCase() + anomaly.category.slice(1)}
              </Text>{' '}
              spending this month is{' '}
              <Text style={styles.multiplier}>{anomaly.multiplier.toFixed(1)}x</Text> your average.
              Current: <Text style={styles.amount}>${anomaly.amount.toFixed(0)}</Text> vs avg{' '}
              <Text style={styles.amount}>${anomaly.average.toFixed(0)}</Text>.
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: Spacing.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.warning,
    marginBottom: Spacing.xs,
  },
  body: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  category: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  multiplier: {
    ...Typography.numeric.inlineValue,
    color: Colors.warning,
  },
  amount: {
    ...Typography.numeric.inlineValue,
  },
});
