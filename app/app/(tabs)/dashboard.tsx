import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { DailyBriefCard } from '../../src/components/DailyBriefCard';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { useAuthStore } from '../../src/stores/authStore';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { usePredictionStore } from '../../src/stores/predictionStore';
import { useCalendarStore } from '../../src/stores/calendarStore';
import {
  useBudgetStore,
  calculateBurnRate,
  calculateHealthScore,
  getHealthGrade,
  getBurnRateColor,
} from '../../src/stores/budgetStore';

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

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { transactions, loadDemoData: loadTxns } = useTransactionStore();
  const { predictions, hiddenCosts, generateDailyBrief } = usePredictionStore();
  const { events } = useCalendarStore();
  const {
    budgets,
    totalBudget,
    totalSpent,
    totalPredicted,
    fetchBudgets,
    computeFromTransactions,
  } = useBudgetStore();

  const userId = user?.id ?? 'demo-user';

  useEffect(() => {
    fetchBudgets(userId);
  }, [userId]);

  useEffect(() => {
    if (transactions.length === 0) {
      loadTxns(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (budgets.length > 0 && transactions.length > 0) {
      computeFromTransactions(
        transactions,
        predictions.map((p) => ({
          category: p.predicted_category,
          predicted_amount: p.predicted_amount,
        })),
      );
    }
  }, [budgets.length, transactions.length, predictions.length]);

  // Generate daily brief when predictions and hidden costs are available
  useEffect(() => {
    if (predictions.length > 0 && events.length > 0) {
      generateDailyBrief({ events, budgets });
    }
  }, [predictions.length, hiddenCosts.length, events.length, budgets.length, generateDailyBrief]);

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const burnRate = useMemo(
    () => calculateBurnRate(totalSpent, totalBudget, dayOfMonth, daysInMonth),
    [totalSpent, totalBudget, dayOfMonth, daysInMonth],
  );

  const budgetAdherence = useMemo(() => {
    if (budgets.length === 0) return 100;
    const underBudget = budgets.filter((b) => b.percentUsed <= 100).length;
    return (underBudget / budgets.length) * 100;
  }, [budgets]);

  const healthScore = useMemo(
    () => calculateHealthScore(burnRate, budgetAdherence, user?.streakCount ?? 0, 0.1),
    [burnRate, budgetAdherence, user?.streakCount],
  );

  const grade = useMemo(() => getHealthGrade(healthScore), [healthScore]);
  const burnColor = useMemo(() => getBurnRateColor(burnRate), [burnRate]);
  const remaining = Math.max(0, totalBudget - totalSpent);

  const topBudgets = useMemo(
    () => [...budgets].sort((a, b) => b.spent - a.spent).slice(0, 6),
    [budgets],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Dashboard" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Daily Brief */}
        <DailyBriefCard />

        {/* Hero Budget Card */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>Monthly Budget</Text>
          <Text style={styles.heroAmount}>
            ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} left
          </Text>
          <Text style={styles.heroSub}>
            of ${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget
          </Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%`,
                  backgroundColor: burnColor,
                },
              ]}
            />
            {totalPredicted > 0 && (
              <View
                style={[
                  styles.progressPredicted,
                  {
                    width: `${Math.min(100 - (totalSpent / totalBudget) * 100, (totalPredicted / totalBudget) * 100)}%`,
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: burnColor }]} />
              <Text style={styles.legendText}>
                Spent ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            {totalPredicted > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.legendText}>
                  Predicted ${totalPredicted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.dayProgress}>
            Day {dayOfMonth} of {daysInMonth}
          </Text>
        </Card>

        {/* Category Budgets */}
        <Text style={styles.sectionTitle}>Category Budgets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {topBudgets.map((b) => {
            const pct = Math.min(100, b.percentUsed);
            const isOver = b.percentUsed > 100;
            const iconName = CATEGORY_ICONS[b.category] || 'ellipsis-horizontal';
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.categoryCircle}
                onPress={() => router.push(`/budget-detail?category=${b.category}`)}
              >
                <View style={styles.circleOuter}>
                  <View
                    style={[
                      styles.circleProgress,
                      {
                        borderColor: isOver ? Colors.danger : Colors.accent,
                        borderLeftColor: pct > 25 ? (isOver ? Colors.danger : Colors.accent) : Colors.cardBorder,
                        borderBottomColor: pct > 50 ? (isOver ? Colors.danger : Colors.accent) : Colors.cardBorder,
                        borderRightColor: pct > 75 ? (isOver ? Colors.danger : Colors.accent) : Colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons name={iconName} size={20} color={isOver ? Colors.danger : Colors.accent} />
                  </View>
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {b.category.charAt(0).toUpperCase() + b.category.slice(1)}
                </Text>
                <Text style={[styles.categoryPct, isOver && { color: Colors.danger }]}>
                  {Math.round(pct)}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Metrics */}
        <Text style={styles.sectionTitle}>Metrics</Text>
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Burn Rate</Text>
            <Text style={[styles.metricValue, { color: burnColor }]}>
              {burnRate.toFixed(2)}x
            </Text>
            <Text style={styles.metricSub}>
              {burnRate <= 1 ? 'On track' : 'Over pace'}
            </Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Health Score</Text>
            <Text style={[styles.metricValue, { color: grade.color }]}>
              {grade.grade} — {healthScore}
            </Text>
            <Text style={styles.metricSub}>
              {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs work'}
            </Text>
          </Card>
        </View>

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Card>
          {transactions.slice(0, 5).map((t, i) => (
            <View key={t.id} style={[styles.txnRow, i < 4 && styles.txnBorder]}>
              <Ionicons
                name={CATEGORY_ICONS[t.category] || 'ellipsis-horizontal'}
                size={18}
                color={Colors.accent}
              />
              <View style={styles.txnInfo}>
                <Text style={styles.txnMerchant} numberOfLines={1}>
                  {t.merchant_name || 'Unknown'}
                </Text>
                <Text style={styles.txnDate}>{new Date(t.date).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.txnAmount}>
                -${Math.abs(t.amount).toFixed(2)}
              </Text>
            </View>
          ))}
          {transactions.length === 0 && (
            <Text style={styles.emptyText}>No transactions yet</Text>
          )}
        </Card>
      </ScrollView>
      <FloatingChatButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  heroAmount: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  heroSub: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: Colors.cardBorder,
    borderRadius: 5,
    marginTop: Spacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPredicted: {
    height: '100%',
    backgroundColor: Colors.warning,
    opacity: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
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
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  dayProgress: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoriesScroll: {
    marginBottom: Spacing.sm,
  },
  categoryCircle: {
    alignItems: 'center',
    marginRight: Spacing.lg,
    width: 72,
  },
  circleOuter: {
    marginBottom: Spacing.xs,
  },
  circleProgress: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryPct: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.xs,
  },
  metricSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  txnBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  txnInfo: {
    flex: 1,
  },
  txnMerchant: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  txnDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txnAmount: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.danger,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
