import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { AtmosphericBackground } from '../../src/components/ui/AtmosphericBackground';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { AnimatedNumber } from '../../src/components/ui/AnimatedNumber';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { DailyBriefCard } from '../../src/components/DailyBriefCard';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { SpendingTrajectoryChart } from '../../src/components/SpendingTrajectoryChart';
import { RankWidget } from '../../src/components/RankWidget';
import WrappedWidget from '../../src/components/wrapped/WrappedWidget';
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
import { useSocialStore } from '../../src/stores/socialStore';

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
  const { predictions, hiddenCosts, generateDailyBrief, trackAccuracy, eventCostBreakdowns } = usePredictionStore();
  const { events } = useCalendarStore();
  const { sendPreEventHiddenCostAlert } = useSocialStore();
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

  // Track prediction accuracy against actual transactions (morning-after pattern)
  useEffect(() => {
    if (transactions.length > 0) {
      trackAccuracy(transactions);
    }
  }, [transactions.length]);

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

  // Schedule pre-event hidden cost alerts via expo-notifications
  useEffect(() => {
    let cancelled = false;

    async function schedulePreEventAlerts() {
      try {
        const Notifications = await import('expo-notifications');
        const now = new Date();
        const TWO_HOURS = 2 * 60 * 60 * 1000;

        // Cancel previous pre-event notifications
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
          if (notif.identifier.startsWith('pre-event-')) {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
          }
        }

        if (cancelled) return;

        for (const event of events) {
          const breakdown = eventCostBreakdowns[event.id];
          if (!breakdown) continue;

          // Only schedule for events with likely hidden costs
          const likelyCosts = breakdown.hidden_costs.filter(
            (c) => !c.is_dismissed && c.tier === 'likely',
          );
          if (likelyCosts.length === 0) continue;

          const eventStart = new Date(event.start_time);
          if (eventStart.getTime() <= now.getTime()) continue;

          const triggerTime = new Date(eventStart.getTime() - TWO_HOURS);
          if (triggerTime.getTime() <= now.getTime()) continue;

          const totalHidden = likelyCosts.reduce((s, c) => s + c.predicted_amount, 0);
          const topLabels = likelyCosts.slice(0, 2).map((c) => c.label).join(' & ');

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${event.title} — budget $${breakdown.total_likely.toFixed(0)}, not $${breakdown.base_prediction.predicted_amount.toFixed(0)}`,
              body: `Likely hidden costs: ${topLabels} (+$${totalHidden.toFixed(0)})`,
              data: { eventId: event.id, screen: 'dashboard' },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerTime },
            identifier: `pre-event-${event.id}`,
          });

          // Fire the social alert when the notification triggers
          sendPreEventHiddenCostAlert(userId, event, breakdown).catch(console.warn);
        }
      } catch {
        // expo-notifications not available (e.g. Expo Go)
      }
    }

    if (events.length > 0 && Object.keys(eventCostBreakdowns).length > 0) {
      schedulePreEventAlerts();
    }

    return () => {
      cancelled = true;
    };
  }, [events.length, Object.keys(eventCostBreakdowns).length]);

  // Category sort preference
  const [categorySortPref, setCategorySortPref] = useState<'amount' | 'az'>('amount');

  useEffect(() => {
    AsyncStorage.getItem('categorySortPref').then((val) => {
      if (val === 'amount' || val === 'az') setCategorySortPref(val);
    });
  }, []);

  const handleSortChange = (pref: 'amount' | 'az') => {
    setCategorySortPref(pref);
    AsyncStorage.setItem('categorySortPref', pref);
  };

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const remaining = totalBudget - totalSpent;
  const remainingDisplay = Math.max(0, remaining);

  const topBudgets = useMemo(() => {
    const sorted = categorySortPref === 'az'
      ? [...budgets].sort((a, b) => a.category.localeCompare(b.category))
      : [...budgets].sort((a, b) => b.spent - a.spent);
    return sorted.slice(0, 6);
  }, [budgets, categorySortPref]);

  // New metric computations
  const spendingVelocity = useMemo(
    () => calculateSpendingVelocity(transactions),
    [transactions],
  );

  const velocityTrend = useMemo(
    () => calculateVelocityTrend(transactions),
    [transactions],
  );

  const monthlyIncome = user?.monthlyIncome ?? null;
  const savingsRate = useMemo(() => {
    if (!monthlyIncome || monthlyIncome <= 0) return null;
    return calculateSavingsRate(monthlyIncome, totalSpent);
  }, [monthlyIncome, totalSpent]);

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
      Math.max(0, (savingsRate ?? 0) * 100),
      spendingStability,
      cciScore * 100,
      user?.streakCount ?? 0,
    ),
    [budgetAdherenceMVP, savingsRate, spendingStability, cciScore, user?.streakCount],
  );

  const daysRemaining = daysInMonth - dayOfMonth;

  return (
    <AtmosphericBackground variant="dashboard">
      <Header title="Dashboard" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Daily Brief */}
        <Animated.View entering={FadeIn.delay(0)}>
          <DailyBriefCard />
        </Animated.View>

        {/* Monthly Wrapped Flashback Widget */}
        <Animated.View entering={FadeIn.delay(80)}>
          <WrappedWidget />
        </Animated.View>

        {/* Hero Budget Card */}
        <Animated.View entering={FadeIn.delay(160)}>
          <GlassCard accentEdge="top" accentColor={Colors.accentBright} style={styles.heroCard}>
            <View style={styles.heroBudgetHeader}>
              <View>
                <Text style={styles.heroLabel}>Monthly Budget</Text>
                <View style={styles.heroAmountRow}>
                  <Text style={styles.heroDollarSign}>$</Text>
                  <AnimatedNumber
                    value={remainingDisplay}
                    prefix=""
                    suffix=""
                    style={styles.heroDisplayNumber}
                  />
                  <Text style={styles.heroLeftText}> left</Text>
                </View>
                <Text style={styles.heroSub}>
                  of <Text style={styles.monoInline}>${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text> budget
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
          </GlassCard>
        </Animated.View>

        {/* Section Divider: Stats */}
        <View style={styles.sectionDividerContainer}>
          <Text style={styles.sectionDividerText}>BUDGET STATS</Text>
          <LinearGradient
            colors={['transparent', Colors.glassBorderLight, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sectionDividerLine}
          />
        </View>

        {/* Budget Stats Row */}
        <View style={styles.statsRow}>
          <Animated.View style={styles.statCardWrapper} entering={FadeIn.delay(0)}>
            <GlassCard accentEdge="left" accentColor={Colors.positive} style={styles.statCard}>
              <Text style={styles.statLabel}>SPENT</Text>
              <Text style={styles.statValue}>
                ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </GlassCard>
          </Animated.View>
          <Animated.View style={styles.statCardWrapper} entering={FadeIn.delay(100)}>
            <GlassCard accentEdge="left" accentColor={Colors.accentBright} style={styles.statCard}>
              <Text style={styles.statLabel}>BUDGET</Text>
              <Text style={styles.statValue}>
                ${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </GlassCard>
          </Animated.View>
          <Animated.View style={styles.statCardWrapper} entering={FadeIn.delay(200)}>
            <GlassCard
              accentEdge="left"
              accentColor={remaining >= 0 ? '#00D09C' : '#EF4444'}
              style={styles.statCard}
            >
              <Text style={styles.statLabel}>REMAINING</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: remaining >= 0 ? Colors.positive : Colors.negative },
                ]}
              >
                {remaining < 0 ? '-' : ''}${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </GlassCard>
          </Animated.View>
        </View>

        {/* Category Sort Toggle */}
        <View style={styles.sortToggleContainer}>
          <TouchableOpacity
            style={[
              styles.sortTab,
              categorySortPref === 'amount' && styles.sortTabActive,
            ]}
            onPress={() => handleSortChange('amount')}
          >
            <Text
              style={[
                styles.sortTabText,
                categorySortPref === 'amount'
                  ? styles.sortTabTextActive
                  : styles.sortTabTextInactive,
              ]}
            >
              $ Amount
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortTab,
              categorySortPref === 'az' && styles.sortTabActive,
            ]}
            onPress={() => handleSortChange('az')}
          >
            <Text
              style={[
                styles.sortTabText,
                categorySortPref === 'az'
                  ? styles.sortTabTextActive
                  : styles.sortTabTextInactive,
              ]}
            >
              A-Z
            </Text>
          </TouchableOpacity>
        </View>

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
          <View style={styles.healthRingGlow} />
          <TouchableOpacity onPress={() => router.push('/insights' as any)}>
            <HealthScoreRing score={healthScoreV2} size={80} strokeWidth={8} />
          </TouchableOpacity>
        </View>

        {/* Section Divider: Metrics */}
        <View style={styles.sectionDividerContainer}>
          <Text style={styles.sectionDividerText}>KEY METRICS</Text>
          <LinearGradient
            colors={['transparent', Colors.glassBorderLight, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sectionDividerLine}
          />
        </View>

        {/* Key Metric Cards */}
        <View style={styles.metricsRow}>
          <Animated.View style={styles.metricCardWrapper} entering={FadeIn.delay(0)}>
            <MetricCard
              label="Spending Velocity"
              value={`$${spendingVelocity.toFixed(0)}/day`}
              trend={velocityTrend < 0 ? 'down' : velocityTrend > 0 ? 'up' : 'flat'}
              trendValue={`${Math.abs(velocityTrend).toFixed(0)}%`}
            />
          </Animated.View>
          <Animated.View style={styles.metricCardWrapper} entering={FadeIn.delay(100)}>
            <MetricCard
              label="Savings Rate"
              value={savingsRate != null ? `${(savingsRate * 100).toFixed(0)}%` : '\u2014'}
              trend={savingsRate != null ? (savingsRate >= 0.2 ? 'up' : savingsRate >= 0.1 ? 'flat' : 'down') : 'flat'}
              trendValue={savingsRate != null ? (savingsRate >= 0.2 ? 'Good' : savingsRate >= 0.1 ? 'Fair' : 'Low') : 'Set income'}
            />
          </Animated.View>
          <Animated.View style={styles.metricCardWrapper} entering={FadeIn.delay(200)}>
            <MetricCard
              label="CCI Score"
              value={`${(cciScore * 100).toFixed(0)}%`}
              trend={cciScore >= 0.7 ? 'up' : cciScore >= 0.4 ? 'flat' : 'down'}
              trendValue={cciScore >= 0.7 ? 'Strong' : cciScore >= 0.4 ? 'Fair' : 'Weak'}
            />
          </Animated.View>
        </View>

        {/* Rank Widget */}
        <Animated.View entering={FadeIn.delay(300)}>
          <RankWidget />
        </Animated.View>
      </ScrollView>
      <FloatingChatButton />
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: 'DMSans_500Medium',
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
  },
  heroDollarSign: {
    ...Typography.numeric.displayHero,
    color: Colors.accentBright,
    textShadowColor: Colors.glowTeal,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  heroDisplayNumber: {
    ...Typography.numeric.displayHero,
    color: Colors.accentBright,
    textShadowColor: Colors.glowTeal,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  heroLeftText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: Typography.sizes['4xl'],
    color: Colors.accentBright,
  },
  heroSub: {
    fontFamily: 'DMSans_500Medium',
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  daysRemainingBadge: {
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    marginTop: Spacing.cardOverlap,
  },
  daysRemainingNumber: {
    fontFamily: 'DMMono_500Medium',
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  daysRemainingLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  // Section Dividers
  sectionDividerContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionDividerText: {
    ...Typography.label.sectionDividerLarge,
    marginBottom: Spacing.xs,
  },
  sectionDividerLine: {
    height: 1,
    width: '100%',
  },
  categoriesScroll: {
    marginTop: Spacing.sm,
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
    fontFamily: 'DMMono_500Medium',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
    marginTop: 2,
  },
  healthRingContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  healthRingGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 9999,
    backgroundColor: Colors.glowTeal,
    opacity: 0.15,
    top: -10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  metricCardWrapper: {
    flex: 1,
  },
  monoInline: {
    fontFamily: 'DMMono_500Medium',
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  // Budget Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.label.card,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontFamily: 'DMMono_500Medium',
    fontSize: Typography.sizes.lg,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  // Category Sort Toggle
  sortToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.glassBg,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    padding: 2,
    alignSelf: 'flex-start',
  },
  sortTab: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusSm - 1,
  },
  sortTabActive: {
    backgroundColor: Colors.accentDark,
  },
  sortTabText: {
    ...Typography.label.sortTab,
  },
  sortTabTextActive: {
    color: '#FFFFFF',
  },
  sortTabTextInactive: {
    color: Colors.textSecondary,
  },
});
