import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { useAuthStore } from '../../src/stores/authStore';
import { useTransactionStore } from '../../src/stores/transactionStore';
import {
  useBudgetStore,
  calculateBurnRate,
  calculateHealthScore,
  getHealthGrade,
} from '../../src/stores/budgetStore';
import { usePredictionStore } from '../../src/stores/predictionStore';
import type { EventCategory } from '../../src/types';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  dining: 'restaurant',
  groceries: 'cart',
  transport: 'car',
  entertainment: 'film',
  shopping: 'bag-handle',
  travel: 'airplane',
  health: 'medical',
  education: 'school',
  fitness: 'barbell',
  social: 'people',
  professional: 'briefcase',
  bills: 'receipt',
  personal: 'person',
  other: 'ellipsis-horizontal',
};

const CATEGORY_COLORS: Record<string, string> = {
  dining: '#FF6B6B',
  groceries: '#4ECDC4',
  transport: '#45B7D1',
  entertainment: '#96CEB4',
  shopping: '#DDA0DD',
  travel: '#FF8C00',
  health: '#20B2AA',
  education: '#6495ED',
  fitness: '#FF69B4',
  social: '#FFD700',
  professional: '#708090',
  bills: '#CD853F',
  personal: '#9370DB',
  other: '#778899',
};

interface BreakdownItem {
  label: string;
  score: number;
  maxScore: number;
}

export default function InsightsScreen() {
  const user = useAuthStore((s) => s.user);
  const { transactions, loadDemoData: loadTxns } = useTransactionStore();
  const { totalBudget, totalSpent, budgets } = useBudgetStore();
  const { predictions, insight } = usePredictionStore();

  const userId = user?.id ?? 'demo-user';

  useEffect(() => {
    if (transactions.length === 0) {
      loadTxns(userId);
    }
  }, [userId]);

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const burnRate = useMemo(
    () => calculateBurnRate(totalSpent, totalBudget, dayOfMonth, daysInMonth),
    [totalSpent, totalBudget, dayOfMonth, daysInMonth],
  );

  const budgetAdherence = useMemo(() => {
    if (budgets.length === 0) return 80;
    const under = budgets.filter((b) => b.percentUsed <= 100).length;
    return (under / budgets.length) * 100;
  }, [budgets]);

  const healthScore = useMemo(
    () => calculateHealthScore(burnRate, budgetAdherence, user?.streakCount ?? 3, 0.1),
    [burnRate, budgetAdherence, user?.streakCount],
  );

  const grade = useMemo(() => getHealthGrade(healthScore), [healthScore]);

  // Score breakdown components
  const breakdown: BreakdownItem[] = useMemo(() => {
    const burnScore = Math.max(0, Math.min(100, (1 - Math.abs(1 - burnRate)) * 100));
    const streakScore = Math.min(100, (user?.streakCount ?? 3) * 5);
    const savingsScore = Math.min(100, 0.1 * 200);
    return [
      { label: 'Burn Rate', score: Math.round(burnScore * 0.35), maxScore: 35 },
      { label: 'Budget Adherence', score: Math.round(budgetAdherence * 0.30), maxScore: 30 },
      { label: 'Consistency', score: Math.round(streakScore * 0.15), maxScore: 15 },
      { label: 'Savings Rate', score: Math.round(savingsScore * 0.20), maxScore: 20 },
    ];
  }, [burnRate, budgetAdherence, user?.streakCount]);

  // Category spending breakdown
  const categorySpending = useMemo(() => {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTxns = transactions.filter((t) => new Date(t.date) >= monthStart);

    const byCat: Record<string, number> = {};
    let total = 0;
    for (const t of monthTxns) {
      byCat[t.category] = (byCat[t.category] || 0) + Math.abs(t.amount);
      total += Math.abs(t.amount);
    }

    return Object.entries(byCat)
      .map(([category, amount]) => ({
        category: category as EventCategory,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Weekly spending trend (last 6 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks: number[] = [];
    for (let w = 5; w >= 0; w--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      const weekTotal = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      weeks.push(weekTotal);
    }
    return weeks;
  }, [transactions]);

  const maxWeekly = Math.max(...weeklyTrend, 1);

  // Savings projection
  const monthlySavings = Math.max(0, totalBudget - totalSpent);
  const projections = [1, 3, 6, 12].map((months) => ({
    months,
    amount: monthlySavings * months,
  }));

  // AI recommendations
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    if (burnRate > 1.1) {
      recs.push('Your spending is ahead of pace. Consider reducing discretionary spending for the rest of the month.');
    }
    const topCategory = categorySpending[0];
    if (topCategory && topCategory.percentage > 30) {
      recs.push(`${topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1)} is ${topCategory.percentage.toFixed(0)}% of your spending. Look for ways to optimize.`);
    }
    if ((user?.streakCount ?? 0) > 0) {
      recs.push(`Great job keeping a ${user?.streakCount}-day streak! Consistency is key to financial health.`);
    }
    if (recs.length === 0) {
      recs.push('You\'re doing great! Keep maintaining your budget and check back for more insights.');
    }
    return recs;
  }, [burnRate, categorySpending, user?.streakCount]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Insights" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Health Score */}
        <Card style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Financial Health Score</Text>
          <View style={styles.scoreRing}>
            <Text style={[styles.scoreGrade, { color: grade.color }]}>{grade.grade}</Text>
          </View>
          <Text style={[styles.scoreValue, { color: grade.color }]}>{healthScore} / 100</Text>
        </Card>

        {/* Score Breakdown */}
        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        <Card>
          {breakdown.map((item) => (
            <View key={item.label} style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <Text style={styles.breakdownText}>{item.label}</Text>
                <Text style={styles.breakdownScore}>{item.score}/{item.maxScore}</Text>
              </View>
              <View style={styles.breakdownBar}>
                <View
                  style={[
                    styles.breakdownFill,
                    {
                      width: `${(item.score / item.maxScore) * 100}%`,
                      backgroundColor: (item.score / item.maxScore) >= 0.7 ? Colors.positive : (item.score / item.maxScore) >= 0.4 ? Colors.warning : Colors.danger,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>

        {/* Spending Trends */}
        <Text style={styles.sectionTitle}>Weekly Spending Trend</Text>
        <Card>
          <View style={styles.trendChart}>
            {weeklyTrend.map((val, i) => (
              <View key={i} style={styles.trendCol}>
                <View style={styles.trendBarBg}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        height: `${(val / maxWeekly) * 100}%`,
                        backgroundColor: i === weeklyTrend.length - 1 ? Colors.accent : Colors.cardBorder,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendAmount}>
                  ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                </Text>
                <Text style={styles.trendLabel}>W{i + 1}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Category Breakdown - Donut approximation */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <Card>
          {categorySpending.slice(0, 6).map((cat) => (
            <View key={cat.category} style={styles.catRow}>
              <Ionicons
                name={CATEGORY_ICONS[cat.category] || 'ellipsis-horizontal'}
                size={18}
                color={CATEGORY_COLORS[cat.category] || Colors.textMuted}
              />
              <Text style={styles.catName}>
                {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
              </Text>
              <View style={styles.catBarBg}>
                <View
                  style={[
                    styles.catBarFill,
                    {
                      width: `${cat.percentage}%`,
                      backgroundColor: CATEGORY_COLORS[cat.category] || Colors.accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.catAmount}>${cat.amount.toFixed(0)}</Text>
              <Text style={styles.catPct}>{cat.percentage.toFixed(0)}%</Text>
            </View>
          ))}
          {categorySpending.length === 0 && (
            <Text style={styles.emptyText}>No spending data yet</Text>
          )}
        </Card>

        {/* AI Recommendations */}
        <Text style={styles.sectionTitle}>AI Recommendations</Text>
        {recommendations.map((rec, i) => (
          <Card key={i} style={styles.recCard}>
            <Ionicons name="bulb" size={20} color={Colors.accent} />
            <Text style={styles.recText}>{rec}</Text>
          </Card>
        ))}

        {/* Savings Projection */}
        <Text style={styles.sectionTitle}>Savings Projection</Text>
        <Card>
          <Text style={styles.savingsLabel}>
            If you save ${monthlySavings.toFixed(0)}/month:
          </Text>
          <View style={styles.projectionRow}>
            {projections.map((p) => (
              <View key={p.months} style={styles.projectionItem}>
                <Text style={styles.projectionAmount}>
                  ${p.amount >= 1000 ? `${(p.amount / 1000).toFixed(1)}k` : p.amount.toFixed(0)}
                </Text>
                <Text style={styles.projectionLabel}>
                  {p.months === 1 ? '1 mo' : `${p.months} mo`}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
      <FloatingChatButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 120 },
  scoreCard: { alignItems: 'center', marginBottom: Spacing.md },
  scoreLabel: { fontSize: Typography.sizes.md, color: Colors.textSecondary },
  scoreRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 4, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  scoreGrade: { fontSize: Typography.sizes['4xl'], fontWeight: Typography.weights.bold },
  scoreValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.semibold },
  sectionTitle: {
    fontSize: Typography.sizes.xl, fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.md,
  },
  breakdownRow: { marginBottom: Spacing.md },
  breakdownLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  breakdownText: { fontSize: Typography.sizes.md, color: Colors.textPrimary },
  breakdownScore: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  breakdownBar: { height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 3 },
  trendChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 140 },
  trendCol: { alignItems: 'center', flex: 1 },
  trendBarBg: { width: 20, height: 100, backgroundColor: Colors.background, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  trendBarFill: { width: '100%', borderRadius: 4 },
  trendAmount: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: 4 },
  trendLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  catName: { fontSize: Typography.sizes.sm, color: Colors.textPrimary, width: 80 },
  catBarBg: { flex: 1, height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catAmount: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textPrimary, width: 50, textAlign: 'right' },
  catPct: { fontSize: Typography.sizes.xs, color: Colors.textMuted, width: 30, textAlign: 'right' },
  recCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', marginBottom: Spacing.sm },
  recText: { flex: 1, fontSize: Typography.sizes.md, color: Colors.textSecondary, lineHeight: Typography.sizes.md * Typography.lineHeights.relaxed },
  savingsLabel: { fontSize: Typography.sizes.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  projectionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  projectionItem: { alignItems: 'center' },
  projectionAmount: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.accent },
  projectionLabel: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  emptyText: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },
});
