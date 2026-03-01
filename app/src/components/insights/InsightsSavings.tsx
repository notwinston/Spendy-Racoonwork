import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/transactionStore';
import { useBudgetStore } from '../../stores/budgetStore';
import { getProjectionScenarios } from '../../utils/financialCalcs';

// Use a simple custom slider implementation for compatibility
function SimpleSlider({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
}: {
  value: number;
  onValueChange: (val: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
}) {
  const pct = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  return (
    <View
      style={sliderStyles.track}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        const { locationX } = e.nativeEvent;
        updateValue(locationX);
      }}
      onResponderMove={(e) => {
        const { locationX } = e.nativeEvent;
        updateValue(locationX);
      }}
    >
      <View style={[sliderStyles.fill, { width: `${pct}%` }]} />
      <View style={[sliderStyles.thumb, { left: `${pct}%` }]} />
    </View>
  );

  function updateValue(x: number) {
    // Estimate track width at ~300px (we use flex so approximate)
    const trackWidth = 300;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    const raw = minimumValue + ratio * (maximumValue - minimumValue);
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.max(minimumValue, Math.min(maximumValue, stepped));
    onValueChange(clamped);
  }
}

const sliderStyles = StyleSheet.create({
  track: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 12,
    height: 8,
    backgroundColor: Colors.accentBright,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: Colors.accentBright,
  },
});

export function InsightsSavings() {
  const { transactions } = useTransactionStore();
  const { totalBudget, totalSpent } = useBudgetStore();

  const mockIncome = 4200;
  const monthlySavings = Math.max(0, totalBudget - totalSpent);
  const currentSavings = monthlySavings;

  // What-if slider state
  const [sliderContribution, setSliderContribution] = useState(
    monthlySavings > 0 ? monthlySavings : 200,
  );

  // ---------- Overall Progress Bar ----------
  const savingsGoalTotal = 10000;
  const alreadySaved = 3500;
  const projectedNextMonth = sliderContribution;
  const savedPct = (alreadySaved / savingsGoalTotal) * 100;
  const projectedPct = (projectedNextMonth / savingsGoalTotal) * 100;

  // ---------- Savings Rate ----------
  const savingsRate = useMemo(() => {
    if (mockIncome <= 0) return 0;
    return ((mockIncome - totalSpent) / mockIncome) * 100;
  }, [totalSpent]);

  // ---------- Projection Table ----------
  const projectionRows = useMemo(() => {
    const rows = [
      { label: '1 Month', months: 1 },
      { label: '3 Months', months: 3 },
      { label: '6 Months', months: 6 },
      { label: '1 Year', months: 12 },
    ];
    return rows.map((row) => ({
      ...row,
      projected: alreadySaved + sliderContribution * row.months,
    }));
  }, [sliderContribution]);

  // ---------- Per-Goal Cards ----------
  const goals = useMemo(() => [
    { name: 'Emergency Fund', target: 5000, saved: 2800, addedThisMonth: monthlySavings * 0.4 },
    { name: 'Vacation', target: 2000, saved: 1200, addedThisMonth: monthlySavings * 0.3 },
    { name: 'New Laptop', target: 1500, saved: 600, addedThisMonth: monthlySavings * 0.3 },
  ], [monthlySavings]);

  return (
    <View>
      {/* Overall Progress Bar */}
      <Card>
        <Text style={styles.cardLabel}>Overall Savings Progress</Text>
        <View style={styles.overallProgressBg}>
          <View style={[styles.overallProgressSaved, { width: `${Math.min(100, savedPct)}%` }]} />
          <View
            style={[
              styles.overallProgressProjected,
              {
                left: `${Math.min(100, savedPct)}%`,
                width: `${Math.min(100 - savedPct, projectedPct)}%`,
              },
            ]}
          />
        </View>
        <View style={styles.overallLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.textPrimary }]} />
            <Text style={styles.legendText}>Saved</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.textMuted }]} />
            <Text style={styles.legendText}>Projected</Text>
          </View>
          <Text style={styles.overallTarget}>
            Goal: <Text style={styles.overallTargetValue}>${savingsGoalTotal.toLocaleString()}</Text>
          </Text>
        </View>
      </Card>

      {/* Savings Rate */}
      <Card style={styles.rateCard}>
        <Text style={styles.cardLabel}>Savings Rate</Text>
        <Text style={[styles.rateNumeral, { color: savingsRate >= 0 ? Colors.positive : Colors.negative }]}>
          {savingsRate.toFixed(1)}
          <Text style={styles.ratePct}>%</Text>
        </Text>
        <Text style={styles.rateSubtext}>of income saved this month</Text>
      </Card>

      {/* What-If Slider */}
      <Text style={styles.sectionTitle}>What-If Projection</Text>
      <Card>
        <Text style={styles.sliderLabel}>Monthly Contribution</Text>
        <View style={styles.sliderValueRow}>
          <Text style={styles.sliderValue}>${sliderContribution.toFixed(0)}</Text>
          <Text style={styles.sliderUnit}>/month</Text>
        </View>

        <View style={styles.sliderContainer}>
          <SimpleSlider
            value={sliderContribution}
            onValueChange={setSliderContribution}
            minimumValue={0}
            maximumValue={2000}
            step={50}
          />
          <View style={styles.sliderRange}>
            <Text style={styles.sliderRangeText}>$0</Text>
            <Text style={styles.sliderRangeText}>$2,000</Text>
          </View>
        </View>

        {/* Projection Table */}
        <View style={styles.projectionTable}>
          <View style={styles.projectionHeader}>
            <Text style={styles.projectionHeaderText}>Period</Text>
            <Text style={styles.projectionHeaderText}>Projected Balance</Text>
          </View>
          {projectionRows.map((row) => (
            <View key={row.label} style={styles.projectionRow}>
              <Text style={styles.projectionPeriod}>{row.label}</Text>
              <Text style={styles.projectionAmount}>${row.projected.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Per-Goal Cards */}
      <Text style={styles.sectionTitle}>Savings Goals</Text>
      {goals.map((goal) => {
        const totalSaved = goal.saved + goal.addedThisMonth;
        const savedGoalPct = (goal.saved / goal.target) * 100;
        const addedGoalPct = (goal.addedThisMonth / goal.target) * 100;

        return (
          <Card key={goal.name} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalAmounts}>
                <Text style={styles.goalAmountValue}>${totalSaved.toFixed(0)}</Text>
                {' / $' + goal.target.toLocaleString()}
              </Text>
            </View>
            <View style={styles.goalProgressBg}>
              <View
                style={[styles.goalProgressSaved, { width: `${Math.min(100, savedGoalPct)}%` }]}
              />
              <View
                style={[
                  styles.goalProgressAdded,
                  {
                    left: `${Math.min(100, savedGoalPct)}%`,
                    width: `${Math.min(100 - savedGoalPct, addedGoalPct)}%`,
                  },
                ]}
              />
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...Typography.heading.h2,
    fontSize: Typography.sizes.xl,
    color: Colors.textPrimary,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  cardLabel: {
    ...Typography.label.card,
    marginBottom: Spacing.md,
  },
  overallProgressBg: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  overallProgressSaved: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: Colors.textPrimary,
    borderRadius: 6,
  },
  overallProgressProjected: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: Colors.textMuted,
  },
  overallLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption.meta,
    color: Colors.textSecondary,
  },
  overallTarget: {
    ...Typography.caption.meta,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  overallTargetValue: {
    ...Typography.numeric.inlineValue,
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  rateCard: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  rateNumeral: {
    ...Typography.numeric.displayLarge,
    fontSize: 48,
  },
  ratePct: {
    fontSize: Typography.sizes['2xl'],
  },
  rateSubtext: {
    ...Typography.body.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sliderLabel: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  sliderValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  sliderValue: {
    ...Typography.numeric.displayMedium,
    color: Colors.accentBright,
  },
  sliderUnit: {
    ...Typography.body.small,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
  sliderContainer: {
    marginBottom: Spacing.lg,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  sliderRangeText: {
    ...Typography.caption.meta,
    color: Colors.textMuted,
  },
  projectionTable: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.md,
  },
  projectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  projectionHeaderText: {
    ...Typography.label.card,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  projectionPeriod: {
    ...Typography.body.regular,
    color: Colors.textPrimary,
  },
  projectionAmount: {
    ...Typography.numeric.inlineValue,
    color: Colors.positive,
  },
  goalCard: {
    marginBottom: Spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  goalName: {
    ...Typography.body.regular,
    color: Colors.textPrimary,
  },
  goalAmounts: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  goalAmountValue: {
    ...Typography.numeric.inlineValue,
  },
  goalProgressBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  goalProgressSaved: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: Colors.textPrimary,
    borderRadius: 4,
  },
  goalProgressAdded: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: Colors.positive,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});
