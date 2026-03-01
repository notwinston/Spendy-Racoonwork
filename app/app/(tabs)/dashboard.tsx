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
import { SpendingTrajectoryChart } from '../../src/components/SpendingTrajectoryChart';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { MetricCard } from '@/components/ui/MetricCard';
import { HealthScoreRing } from '@/components/charts';
import { useAuthStore } from '../../src/stores/authStore';
import {
  useTransactionStore,
  calculateSpendingVelocity,
  calculateVelocityTrend,
} from '../../src/stores/transactionStore';
import {
  usePredictionStore,
  calculateCCI,
} from '../../src/stores/predictionStore';
import { useCalendarStore } from '../../src/stores/calendarStore';
import {
  useBudgetStore,
  calculateHealthScoreV2,
  calculateBudgetAdherenceMVP,
  calculateSpendingStability,
} from '../../src/stores/budgetStore';
import { calculateSavingsRate } from '../../src/utils/financialCalcs';

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

  const remaining = Math.max(0, totalBudget - totalSpent);

  const topBudgets = useMemo(
    () => [...budgets].sort((a, b) => b.spent - a.spent).slice(0, 6),
    [budgets],
  );

  // New metric computations
  const spendingVelocity = useMemo(
    () => calculateSpendingVelocity(transactions),
    [transactions],
  );

  const velocityTrend = useMemo(
    () => calculateVelocityTrend(transactions),
    [transactions],
  );

  const savingsRate = useMemo(() => {
    // TODO: use real income from user profile when available
    const estimatedMonthlyIncome = totalBudget * 1.3;
    return calculateSavingsRate(estimatedMonthlyIncome, totalSpent);
  }, [totalBudget, totalSpent]);

  const cciScore = useMemo(
    () => calculateCCI(predictions),
    [predictions],
  );

  const budgetAdherenceMVP = useMemo(
    () => calculateBudgetAdherenceMVP(totalSpent, totalBudget),
    [totalSpent, totalBudget],
  );

  const spendingStability = useMemo(
    () => calculateSpendingStability(transactions),
    [transactions],
  );

  const healthScoreV2 = useMemo(
    () => calculateHealthScoreV2(
      budgetAdherenceMVP,
      Math.max(0, savingsRate * 100),
      spendingStability,
      cciScore * 100,
      user?.streakCount ?? 0,
    ),
    [budgetAdherenceMVP, savingsRate, spendingStability, cciScore, user?.streakCount],
  );

  const daysRemaining = daysInMonth - dayOfMonth;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Dashboard" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Daily Brief */}
        <DailyBriefCard />

        {/* Hero Budget Card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroBudgetHeader}>
            <View>
              <Text style={styles.heroLabel}>Monthly Budget</Text>
              <Text style={styles.heroAmount}>
                ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} left
              </Text>
              <Text style={styles.heroSub}>
                of ${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget
              </Text>
            </View>
            <View style={styles.daysRemainingBadge}>
              <Text style={styles.daysRemainingNumber}>{daysRemaining}</Text>
              <Text style={styles.daysRemainingLabel}>days left</Text>
            </View>
          </View>

          {/* Spending Trajectory Chart */}
          <SpendingTrajectoryChart
            spent={totalSpent}
            predicted={totalPredicted > 0 ? totalSpent + totalPredicted : totalSpent * (daysInMonth / Math.max(1, dayOfMonth))}
            budget={totalBudget}
            daysElapsed={dayOfMonth}
            totalDays={daysInMonth}
          />
        </Card>

        {/* Category Budgets */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {topBudgets.map((b) => {
            const pct = Math.min(100, b.percentUsed);
            const isOver = b.percentUsed > 100;
            const iconName = CATEGORY_ICONS[b.category] || 'ellipsis-horizontal';
            const ringColor = isOver ? Colors.danger : Colors.accent;
            const catRemaining = b.remaining;
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.categoryCircle}
                onPress={() => router.push(`/budget-detail?category=${b.category}`)}
              >
                <ProgressRing
                  progress={Math.min(1, pct / 100)}
                  size={56}
                  strokeWidth={4}
                  color={ringColor}
                >
                  <Ionicons name={iconName} size={20} color={ringColor} />
                </ProgressRing>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {b.category.charAt(0).toUpperCase() + b.category.slice(1)}
                </Text>
                <Text style={[styles.categoryAmount, isOver && { color: Colors.danger }]}>
                  {isOver
                    ? `$${Math.abs(Math.round(catRemaining))} over`
                    : `$${Math.round(catRemaining)} left`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Health Score Ring */}
        <View style={styles.healthRingContainer}>
          <TouchableOpacity onPress={() => router.push('/insights' as any)}>
            <HealthScoreRing score={healthScoreV2} size={80} strokeWidth={8} />
          </TouchableOpacity>
        </View>

        {/* Key Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCardWrapper}>
            <MetricCard
              label="Spending Velocity"
              value={`$${spendingVelocity.toFixed(0)}/day`}
              trend={velocityTrend < 0 ? 'down' : velocityTrend > 0 ? 'up' : 'flat'}
              trendValue={`${Math.abs(velocityTrend).toFixed(0)}%`}
            />
          </View>
          <View style={styles.metricCardWrapper}>
            <MetricCard
              label="Savings Rate"
              value={`${(savingsRate * 100).toFixed(0)}%`}
              trend={savingsRate >= 0.2 ? 'up' : savingsRate >= 0.1 ? 'flat' : 'down'}
              trendValue={savingsRate >= 0.2 ? 'Good' : savingsRate >= 0.1 ? 'Fair' : 'Low'}
            />
          </View>
          <View style={styles.metricCardWrapper}>
            <MetricCard
              label="CCI Score"
              value={`${(cciScore * 100).toFixed(0)}%`}
              trend={cciScore >= 0.7 ? 'up' : cciScore >= 0.4 ? 'flat' : 'down'}
              trendValue={cciScore >= 0.7 ? 'Strong' : cciScore >= 0.4 ? 'Fair' : 'Weak'}
            />
          </View>
        </View>
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
    marginBottom: Spacing.lg,
  },
  heroBudgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
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
  daysRemainingBadge: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  daysRemainingNumber: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  daysRemainingLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  categoriesScroll: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  categoryCircle: {
    alignItems: 'center',
    marginRight: Spacing.lg,
    width: 72,
  },
  categoryName: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  categoryAmount: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
    marginTop: 2,
  },
  healthRingContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  metricCardWrapper: {
    flex: 1,
  },
});
