import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants';

interface RecurringChipProps {
  merchant: string;
  amount: number;
  frequency: string;
  nextDate: string;
  onPress: () => void;
}

export function RecurringChip({
  merchant,
  amount,
  frequency,
  nextDate,
  onPress,
}: RecurringChipProps) {
  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.merchant} numberOfLines={1}>
        {merchant}
      </Text>
      <Text style={styles.amount}>${amount.toFixed(2)}</Text>
      <View style={styles.meta}>
        <Text style={styles.frequency}>{frequency}</Text>
        {nextDate ? (
          <Text style={styles.nextDate}>Next: {nextDate}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: 150,
    maxWidth: 200,
    marginRight: Spacing.md,
  },
  merchant: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  meta: {
    gap: 2,
  },
  frequency: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  nextDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
});
