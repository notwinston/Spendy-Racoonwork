import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';

export interface SmartBudgetSuggestionProps {
  category: string;
  currentBudget: number;
  suggestedBudget: number;
  reason: string;
  onAccept?: (category: string, newBudget: number) => void;
}

export function SmartBudgetSuggestion({
  category,
  currentBudget,
  suggestedBudget,
  reason,
  onAccept,
}: SmartBudgetSuggestionProps) {
  const isIncrease = suggestedBudget > currentBudget;
  const diff = Math.abs(suggestedBudget - currentBudget);
  const catLabel = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons
          name="bulb"
          size={18}
          color={Colors.accentBright}
        />
        <Text style={styles.title}>Smart Budget Suggestion</Text>
      </View>

      <Text style={styles.categoryLabel}>{catLabel}</Text>

      <View style={styles.budgetRow}>
        <View style={styles.budgetColumn}>
          <Text style={styles.budgetLabel}>Current</Text>
          <Text style={styles.budgetAmount}>${currentBudget.toLocaleString()}</Text>
        </View>

        <Ionicons
          name={isIncrease ? 'arrow-forward' : 'arrow-forward'}
          size={16}
          color={Colors.textMuted}
        />

        <View style={styles.budgetColumn}>
          <Text style={styles.budgetLabel}>Suggested</Text>
          <Text style={[styles.budgetAmount, styles.suggestedAmount]}>
            ${suggestedBudget.toLocaleString()}
          </Text>
        </View>

        <View
          style={[
            styles.diffBadge,
            { backgroundColor: isIncrease ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' },
          ]}
        >
          <Text
            style={[
              styles.diffText,
              { color: isIncrease ? Colors.negative : Colors.positive },
            ]}
          >
            {isIncrease ? '+' : '-'}${diff}
          </Text>
        </View>
      </View>

      <Text style={styles.reason}>{reason}</Text>

      {onAccept && (
        <Pressable
          style={styles.acceptButton}
          onPress={() => onAccept(category, suggestedBudget)}
        >
          <Text style={styles.acceptText}>Accept Suggestion</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentBright,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.accentBright,
  },
  categoryLabel: {
    ...Typography.heading.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  budgetColumn: {
    alignItems: 'center',
  },
  budgetLabel: {
    ...Typography.caption.meta,
    marginBottom: Spacing.xs,
  },
  budgetAmount: {
    ...Typography.numeric.displayMedium,
  },
  suggestedAmount: {
    color: Colors.accentBright,
  },
  diffBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.radiusSm,
    marginLeft: 'auto',
  },
  diffText: {
    ...Typography.numeric.inlineValue,
    fontSize: Typography.sizes.sm,
  },
  reason: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  acceptButton: {
    backgroundColor: Colors.accentBright,
    borderRadius: Spacing.radiusMd,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
  },
  acceptText: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
  },
});
