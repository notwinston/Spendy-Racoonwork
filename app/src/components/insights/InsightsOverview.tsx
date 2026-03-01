import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants';
import { Card } from '../ui/Card';
import { HealthScoreRing } from '../charts';
import { useAuthStore } from '../../stores/authStore';
import { useTransactionStore } from '../../stores/transactionStore';
import {
  useBudgetStore,
  calculateBurnRate,
  calculateHealthScoreV2,
  calculateSpendingStability,
  calculateBudgetAdherenceMVP,
  getHealthGrade,
} from '../../stores/budgetStore';
import {
  calculateCCI,
  forecastMonthEnd,
} from '../../stores/predictionStore';
import { usePredictionStore } from '../../stores/predictionStore';
import { useGamificationStore } from '../../stores/gamificationStore';

export function InsightsOverview() {
  const user = useAuthStore((s) => s.user);
  const { transactions } = useTransactionStore();
  const { totalBudget, totalSpent } = useBudgetStore();
  const { predictions, hiddenCosts } = usePredictionStore();
  const gamification = useGamificationStore((s) => s.profile);

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const streakDays = gamification.streakCount || user?.streakCount || 0;

  // ---------- Health Score ----------
  const burnRate = useMemo(
    () => calculateBurnRate(totalSpent, totalBudget, dayOfMonth, daysInMonth),
    [totalSpent, totalBudget, dayOfMonth, daysInMonth],
  );

  const budgetAdherence = useMemo(
    () => calculateBudgetAdherenceMVP(totalSpent, totalBudget),
    [totalSpent, totalBudget],
  );

  const spendingStability = useMemo(
    () => calculateSpendingStability(transactions),
    [transactions],
  );

  const cciRaw = useMemo(
    () => calculateCCI(predictions),
    [predictions],
  );
  const cciPercent = Math.round(cciRaw * 100);

  const hiddenCostAwareness = useMemo(() => {
    if (hiddenCosts.length === 0) return 0;
    const dismissed = hiddenCosts.filter((c) => c.is_dismissed).length;
    return Math.min(100, ((hiddenCosts.length - dismissed) / hiddenCosts.length) * 100);
  }, [hiddenCosts]);

  const savingsRate = useMemo(() => {
    if (totalBudget <= 0) return 50;
    const saved = Math.max(0, totalBudget - totalSpent);
    return Math.min(100, (saved / totalBudget) * 100);
  }, [totalBudget, totalSpent]);

  const healthScore = useMemo(
    () =>
      calculateHealthScoreV2(
        budgetAdherence,
        savingsRate,
        spendingStability,
        cciPercent,
        streakDays,
      ),
    [budgetAdherence, savingsRate, spendingStability, cciPercent, streakDays],
  );

  const grade = useMemo(() => getHealthGrade(healthScore), [healthScore]);

  const streakBonus = Math.min(100, streakDays * 3.33);

  const breakdownBars = useMemo(
    () => [
      { label: 'Budget Adherence', score: budgetAdherence, weight: 0.25, maxPoints: 25 },
      { label: 'Savings Rate', score: savingsRate, weight: 0.20, maxPoints: 20 },
      { label: 'Spending Stability', score: spendingStability, weight: 0.20, maxPoints: 20 },
      { label: 'Calendar Correlation', score: cciPercent, weight: 0.15, maxPoints: 15 },
      { label: 'Streak Bonus', score: streakBonus, weight: 0.10, maxPoints: 10 },
      { label: 'Hidden Cost Awareness', score: hiddenCostAwareness, weight: 0.10, maxPoints: 10 },
    ],
    [budgetAdherence, savingsRate, spendingStability, cciPercent, streakBonus, hiddenCostAwareness],
  );

  const healthTrend = useMemo(() => {
    const trend = transactions.length > 10 ? Math.round((healthScore - 79) * 10) / 10 : 5;
    return trend;
  }, [healthScore, transactions.length]);

  // ---------- Month Summary KPIs ----------
  const userIncome = user?.monthlyIncome ?? null;
  const totalIncome = userIncome ?? totalBudget * 1.3;
  const totalExpenses = totalSpent > 0 ? totalSpent : 0;
  const net = totalIncome - totalExpenses;

  // ---------- Days Until Budget Runs Out (using predictive forecast) ----------
  const forecast = useMemo(
    () => forecastMonthEnd(totalSpent, dayOfMonth, daysInMonth, totalBudget),
    [totalSpent, dayOfMonth, daysInMonth, totalBudget],
  );
  const dailySpendingRate = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const daysUntilBudgetRunsOut = dailySpendingRate > 0
    ? Math.round(remainingBudget / dailySpendingRate)
    : daysInMonth - dayOfMonth;

  return (
    <View>
      {/* Financial Health Card - Two Column Layout */}
      <Card style={styles.healthCard}>
        <Text style={styles.healthLabel}>Financial Health</Text>
        <View style={styles.healthColumns}>
          {/* Left: Score + Grade */}
          <View style={styles.healthLeft}>
            <Text style={[styles.scoreNumeral, { color: grade.color }]}>
              {healthScore}
            </Text>
            <Text style={[styles.gradeLabel, { color: grade.color }]}>
              {grade.grade}
            </Text>
            <View style={styles.trendRow}>
              <Ionicons
                name={healthTrend >= 0 ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={healthTrend >= 0 ? Colors.positive : Colors.danger}
              />
              <Text
                style={[
                  styles.trendText,
                  { color: healthTrend >= 0 ? Colors.positive : Colors.danger },
                ]}
              >
                {healthTrend >= 0 ? '+' : ''}{healthTrend}
              </Text>
            </View>
          </View>

          {/* Right: Breakdown Bars */}
          <View style={styles.healthRight}>
            {breakdownBars.map((item) => {
              const contribution = Math.round(item.score * item.weight);
              const fillPct = item.maxPoints > 0 ? (contribution / item.maxPoints) * 100 : 0;
              const barColor =
                fillPct >= 70 ? Colors.positive : fillPct >= 40 ? Colors.warning : Colors.danger;
              return (
                <View key={item.label} style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelRow}>
                    <Text style={styles.breakdownLabel} numberOfLines={1}>{item.label}</Text>
                    <Text style={styles.breakdownScore}>
                      {contribution}/{item.maxPoints}
                    </Text>
                  </View>
                  <View style={styles.breakdownBarBg}>
                    <View
                      style={[
                        styles.breakdownBarFill,
                        { width: `${Math.min(100, fillPct)}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Card>

      {/* Month Summary KPIs */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiChip}>
          <Text style={styles.kpiLabel}>
            {userIncome ? 'Total Income' : 'Est. Income'}
          </Text>
          <Text style={[styles.kpiAmount, { color: Colors.positive }]}>
            ${totalIncome.toLocaleString()}
          </Text>
        </View>
        <View style={styles.kpiChip}>
          <Text style={styles.kpiLabel}>Total Expenses</Text>
          <Text style={[styles.kpiAmount, { color: Colors.negative }]}>
            ${totalExpenses > 0 ? totalExpenses.toLocaleString() : '0'}
          </Text>
        </View>
        <View style={styles.kpiChip}>
          <Text style={styles.kpiLabel}>Net</Text>
          <Text style={[styles.kpiAmount, { color: net >= 0 ? Colors.positive : Colors.negative }]}>
            {net >= 0 ? '+' : '-'}${Math.abs(net).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Days Until Budget Runs Out */}
      <View style={[styles.budgetChip, forecast.isOverBudget && styles.budgetChipDanger]}>
        <Ionicons
          name={forecast.isOverBudget ? 'warning' : 'alert-circle'}
          size={16}
          color={forecast.isOverBudget ? Colors.negative : Colors.warning}
        />
        <View style={styles.budgetChipContent}>
          <Text style={[styles.budgetChipText, forecast.isOverBudget && styles.budgetChipTextDanger]}>
            <Text style={[styles.budgetChipDays, forecast.isOverBudget && { color: Colors.negative }]}>
              {daysUntilBudgetRunsOut}
            </Text> days until budget runs out
          </Text>
          <Text style={styles.budgetChipForecast}>
            Projected month-end:{' '}
            <Text style={styles.budgetChipForecastValue}>
              ${forecast.projected.toLocaleString()}
            </Text>
            {' '}({forecast.isOverBudget ? 'over by ' : 'under by '}
            <Text style={{ color: forecast.isOverBudget ? Colors.negative : Colors.positive }}>
              ${Math.abs(forecast.surplus).toLocaleString()}
            </Text>)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  healthCard: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  healthLabel: {
    ...Typography.heading.h2,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  healthColumns: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  healthLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  scoreNumeral: {
    ...Typography.numeric.displayLarge,
    fontSize: 48,
  },
  gradeLabel: {
    ...Typography.heading.h2,
    marginTop: Spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: Spacing.sm,
  },
  trendText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  healthRight: {
    flex: 1,
  },
  breakdownRow: {
    marginBottom: Spacing.xs,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  breakdownLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    flex: 1,
  },
  breakdownScore: {
    ...Typography.numeric.chartAxis,
    color: Colors.textSecondary,
  },
  breakdownBarBg: {
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  kpiChip: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  kpiLabel: {
    ...Typography.caption.meta,
    marginBottom: Spacing.xs,
  },
  kpiAmount: {
    ...Typography.numeric.displayMedium,
  },
  budgetChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: Spacing.radiusMd,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  budgetChipDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  budgetChipContent: {
    flex: 1,
  },
  budgetChipText: {
    ...Typography.body.small,
    color: Colors.warning,
  },
  budgetChipTextDanger: {
    color: Colors.negative,
  },
  budgetChipDays: {
    ...Typography.numeric.inlineValue,
    color: Colors.warning,
  },
  budgetChipForecast: {
    ...Typography.caption.meta,
    color: Colors.textMuted,
    marginTop: 2,
  },
  budgetChipForecastValue: {
    ...Typography.numeric.chartAxis,
    color: Colors.textSecondary,
  },
});
