import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { GlassCard } from './ui/GlassCard';

interface BudgetAdjustmentCardProps {
  budget: number;
  spent: number;
  remaining: number;
}

export function BudgetAdjustmentCard({
  budget,
  spent,
  remaining,
}: BudgetAdjustmentCardProps) {
  const [whatIfDailySpend, setWhatIfDailySpend] = useState('');

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  const currentDailyAvg = dayOfMonth > 0 ? spent / dayOfMonth : 0;
  const projectedEndOfMonth = spent + currentDailyAvg * daysRemaining;

  const whatIfValue = parseFloat(whatIfDailySpend);
  const whatIfProjection = useMemo(() => {
    if (isNaN(whatIfValue) || whatIfValue <= 0) return null;
    return spent + whatIfValue * daysRemaining;
  }, [whatIfValue, spent, daysRemaining]);

  const projectedColor =
    projectedEndOfMonth > budget ? Colors.danger : Colors.positive;
  const whatIfColor =
    whatIfProjection !== null
      ? whatIfProjection > budget
        ? Colors.danger
        : Colors.positive
      : Colors.textMuted;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="calculator-outline" size={20} color={Colors.accent} />
        <Text style={styles.headerTitle}>Budget Planner</Text>
      </View>

      {/* Current Pace */}
      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Current Daily Avg</Text>
          <Text style={styles.statValue}>${currentDailyAvg.toFixed(2)}/day</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Days Remaining</Text>
          <Text style={styles.statValue}>{daysRemaining}</Text>
        </View>
      </View>

      {/* Projected End of Month */}
      <View style={styles.projectedRow}>
        <Text style={styles.projectedLabel}>Projected End-of-Month</Text>
        <Text style={[styles.projectedValue, { color: projectedColor }]}>
          ${projectedEndOfMonth.toFixed(0)} / ${budget.toFixed(0)}
        </Text>
      </View>

      {/* What-If Section */}
      <View style={styles.divider} />
      <Text style={styles.whatIfTitle}>What-If Scenario</Text>
      <View style={styles.whatIfRow}>
        <Text style={styles.whatIfLabel}>If I spend</Text>
        <View style={styles.whatIfInputWrap}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.whatIfInput}
            placeholder={currentDailyAvg.toFixed(0)}
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={whatIfDailySpend}
            onChangeText={setWhatIfDailySpend}
          />
        </View>
        <Text style={styles.whatIfLabel}>/day</Text>
      </View>

      {whatIfProjection !== null && (
        <View style={styles.whatIfResult}>
          <Text style={styles.whatIfResultLabel}>Projected total:</Text>
          <Text style={[styles.whatIfResultValue, { color: whatIfColor }]}>
            ${whatIfProjection.toFixed(0)}
          </Text>
          <Text
            style={[
              styles.whatIfResultStatus,
              { color: whatIfColor },
            ]}
          >
            {whatIfProjection <= budget ? 'Under budget' : 'Over budget'}
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  statValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  projectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 10,
  },
  projectedLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  projectedValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  whatIfTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  whatIfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  whatIfLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  whatIfInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    width: 90,
  },
  dollarSign: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  whatIfInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  whatIfResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 10,
  },
  whatIfResultLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  whatIfResultValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  whatIfResultStatus: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
});
