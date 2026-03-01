import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants';
import { Card } from '../ui/Card';
import { DonutChart } from '../charts';
import type { DonutSegment } from '../charts';
import { useTransactionStore, getCategoryMoM } from '../../stores/transactionStore';
import { useBudgetStore } from '../../stores/budgetStore';

const CATEGORY_COLORS: Record<string, string> = {
  dining: Colors.negative,
  groceries: Colors.chartColors[1],
  transport: Colors.chartColors[5],
  entertainment: Colors.positive,
  shopping: Colors.chartColors[2],
  travel: Colors.chartColors[3],
  health: Colors.chartColors[1],
  education: Colors.chartColors[0],
  fitness: Colors.chartColors[4],
  social: Colors.chartColors[3],
  professional: Colors.textSecondary,
  bills: Colors.chartColors[3],
  personal: Colors.chartColors[2],
  other: Colors.textMuted,
};

export function InsightsThisMonth() {
  const { transactions } = useTransactionStore();
  const { totalBudget, totalSpent, budgets } = useBudgetStore();

  const mockIncome = 4200;
  const totalIncome = mockIncome;
  const totalExpenses = totalSpent > 0 ? totalSpent : 0;
  const net = totalIncome - totalExpenses;

  // Category breakdown
  const categoryMoM = useMemo(() => getCategoryMoM(transactions), [transactions]);

  const donutData: DonutSegment[] = useMemo(() => {
    const totalCatSpend = categoryMoM.reduce((s, c) => s + c.thisMonth, 0);
    return categoryMoM
      .filter((c) => c.thisMonth > 0)
      .slice(0, 8)
      .map((c) => ({
        category: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        amount: c.thisMonth,
        color: CATEGORY_COLORS[c.category] || Colors.textMuted,
        percentage: totalCatSpend > 0 ? (c.thisMonth / totalCatSpend) * 100 : 0,
      }));
  }, [categoryMoM]);

  // Get budget for each category
  const budgetMap = useMemo(() => {
    const map: Record<string, number> = {};
    budgets.forEach((b) => {
      map[b.category] = b.monthly_limit;
    });
    return map;
  }, [budgets]);

  // Insight chips: find categories with big MoM changes
  const insightChips = useMemo(() => {
    const chips: { text: string; type: 'up' | 'down' }[] = [];
    categoryMoM.forEach((cat) => {
      if (cat.changePercent > 10 && cat.thisMonth > 20) {
        chips.push({
          text: `You spent ${Math.abs(cat.changePercent).toFixed(0)}% more on ${cat.category} than last month`,
          type: 'up',
        });
      } else if (cat.changePercent < -15 && cat.lastMonth > 20) {
        chips.push({
          text: `${cat.category} spending down ${Math.abs(cat.changePercent).toFixed(0)}% from last month`,
          type: 'down',
        });
      }
    });
    return chips.slice(0, 3);
  }, [categoryMoM]);

  // Savings goals (mock data since no dedicated savings goal store)
  const savingsGoals = useMemo(() => {
    const monthlySaved = Math.max(0, totalBudget - totalSpent);
    return [
      { name: 'Emergency Fund', target: 5000, saved: 2800, addedThisMonth: monthlySaved * 0.4 },
      { name: 'Vacation', target: 2000, saved: 1200, addedThisMonth: monthlySaved * 0.3 },
      { name: 'New Laptop', target: 1500, saved: 600, addedThisMonth: monthlySaved * 0.3 },
    ];
  }, [totalBudget, totalSpent]);

  return (
    <View>
      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Income</Text>
          <Text style={[styles.kpiAmount, { color: Colors.positive }]}>
            ${totalIncome.toLocaleString()}
          </Text>
        </Card>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Expenses</Text>
          <Text style={[styles.kpiAmount, { color: Colors.negative }]}>
            ${totalExpenses > 0 ? totalExpenses.toLocaleString() : '0'}
          </Text>
        </Card>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Net</Text>
          <Text style={[styles.kpiAmount, { color: net >= 0 ? Colors.positive : Colors.negative }]}>
            {net >= 0 ? '+' : '-'}${Math.abs(net).toLocaleString()}
          </Text>
        </Card>
      </View>

      {/* Insight Chips */}
      {insightChips.length > 0 && (
        <View style={styles.chipsContainer}>
          {insightChips.map((chip, idx) => (
            <View key={idx} style={styles.insightChip}>
              <Text style={styles.insightChipIcon}>{chip.type === 'up' ? '\u2191' : '\u2193'}</Text>
              <Text style={styles.insightChipText}>{chip.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Spending Breakdown */}
      <Text style={styles.sectionTitle}>Spending Breakdown</Text>
      <Card>
        <View style={styles.donutContainer}>
          <DonutChart data={donutData} size={160} />
        </View>

        {/* Category list with progress bars */}
        <View style={styles.catList}>
          {categoryMoM
            .filter((c) => c.thisMonth > 0)
            .slice(0, 8)
            .map((cat) => {
              const budget = budgetMap[cat.category] || 0;
              const spent = cat.thisMonth;
              const overspent = budget > 0 && spent > budget;
              const progressPct = budget > 0 ? Math.min(150, (spent / budget) * 100) : 100;

              return (
                <View key={cat.category} style={styles.catRow}>
                  <View style={styles.catRowHeader}>
                    <View
                      style={[
                        styles.catDot,
                        { backgroundColor: CATEGORY_COLORS[cat.category] || Colors.textMuted },
                      ]}
                    />
                    <Text style={styles.catName}>
                      {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                    </Text>
                    <Text style={styles.catAmountBudget}>
                      <Text style={styles.catAmountValue}>${spent.toFixed(0)}</Text>
                      {budget > 0 ? ` / $${budget.toLocaleString()}` : ''}
                    </Text>
                  </View>
                  {budget > 0 && (
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(100, progressPct)}%`,
                            backgroundColor: overspent ? Colors.negative : Colors.positive,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              );
            })}
        </View>

        {categoryMoM.length === 0 && (
          <Text style={styles.emptyText}>No spending data yet</Text>
        )}
      </Card>

      {/* Savings Goal Progress */}
      <Text style={styles.sectionTitle}>Savings Goals</Text>
      <Card>
        {savingsGoals.map((goal) => {
          const totalSaved = goal.saved + goal.addedThisMonth;
          const savedPct = (goal.saved / goal.target) * 100;
          const addedPct = (goal.addedThisMonth / goal.target) * 100;

          return (
            <View key={goal.name} style={styles.goalRow}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalAmount}>
                  <Text style={styles.goalAmountValue}>${totalSaved.toFixed(0)}</Text>
                  {' / $' + goal.target.toLocaleString()}
                </Text>
              </View>
              <View style={styles.goalProgressBg}>
                <View
                  style={[
                    styles.goalProgressSaved,
                    { width: `${Math.min(100, savedPct)}%` },
                  ]}
                />
                <View
                  style={[
                    styles.goalProgressAdded,
                    {
                      width: `${Math.min(100 - savedPct, addedPct)}%`,
                      left: `${Math.min(100, savedPct)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </Card>
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
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  kpiLabel: {
    ...Typography.caption.meta,
    marginBottom: Spacing.xs,
  },
  kpiAmount: {
    ...Typography.numeric.displayMedium,
  },
  chipsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  insightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgElevated,
    borderRadius: Spacing.radiusSm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  insightChipIcon: {
    fontSize: Typography.sizes.md,
    color: Colors.accentBright,
  },
  insightChipText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    flex: 1,
  },
  donutContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  catList: {
    marginTop: Spacing.sm,
  },
  catRow: {
    marginBottom: Spacing.md,
  },
  catRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  catName: {
    flex: 1,
    ...Typography.body.regular,
    color: Colors.textPrimary,
  },
  catAmountBudget: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  catAmountValue: {
    ...Typography.numeric.inlineValue,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 18,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyText: {
    ...Typography.body.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  goalRow: {
    marginBottom: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  goalName: {
    ...Typography.body.regular,
    color: Colors.textPrimary,
  },
  goalAmount: {
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
