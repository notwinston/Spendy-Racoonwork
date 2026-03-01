import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { AIInsightCard } from '../../src/components/AIInsightCard';
import { MonthComparison } from '../../src/components/MonthComparison';
import {
  HealthScoreRing,
  BurnRateGauge,
  CCIBadge,
  DonutChart,
  TrendLineChart,
  GrowthCurveChart,
} from '../../src/components/charts';
import type { DonutSegment, TrendDataPoint } from '../../src/components/charts';
import { useAuthStore } from '../../src/stores/authStore';
import { useTransactionStore } from '../../src/stores/transactionStore';
import {
  useBudgetStore,
  calculateBurnRate,
  calculateHealthScoreV2,
  calculateSpendingStability,
  calculateBudgetAdherenceMVP,
  getHealthGrade,
} from '../../src/stores/budgetStore';
import {
  calculateSpendingVelocity,
  calculateVelocityTrend,
  getCategoryMoM,
  getMonthlyTotals,
} from '../../src/stores/transactionStore';
import { usePredictionStore } from '../../src/stores/predictionStore';
import {
  calculateCCI,
  getCCIByCategory,
  getRecentPredictionAccuracy,
} from '../../src/stores/predictionStore';
import { useGamificationStore } from '../../src/stores/gamificationStore';
import { getProjectionScenarios } from '../../src/utils/financialCalcs';

// ---------- Constants ----------

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

const ACCURACY_COLORS: Record<string, string> = {
  hit: Colors.positive,
  close: Colors.warning,
  miss: Colors.danger,
  pending: Colors.textMuted,
};

// ---------- Component ----------

export default function InsightsScreen() {
  const user = useAuthStore((s) => s.user);
  const { transactions, loadDemoData: loadTxns } = useTransactionStore();
  const { totalBudget, totalSpent, budgets } = useBudgetStore();
  const { predictions } = usePredictionStore();
  const gamification = useGamificationStore((s) => s.profile);

  const userId = user?.id ?? 'demo-user';

  useEffect(() => {
    if (transactions.length === 0) {
      loadTxns(userId);
    }
  }, [userId]);

  // ---------- Shared date values ----------
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const streakDays = gamification.streakCount || user?.streakCount || 0;

  // ---------- Period state for Spending Trends ----------
  const [trendPeriod, setTrendPeriod] = useState<'weekly' | 'monthly' | '6month'>('weekly');

  // ---------- Time horizon state for Savings Projection ----------
  const [projectionMonths, setProjectionMonths] = useState<number>(12);

  // ================================================================
  // SECTION 1: Financial Health Score (Hero)
  // ================================================================
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

  const savingsRate = useMemo(() => {
    if (totalBudget <= 0) return 50;
    const saved = Math.max(0, totalBudget - totalSpent);
    return Math.min(100, (saved / totalBudget) * 500);
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
      { label: 'Budget Adherence', score: budgetAdherence, weight: 0.30, maxPoints: 30 },
      { label: 'Savings Rate', score: savingsRate, weight: 0.25, maxPoints: 25 },
      { label: 'Spending Stability', score: spendingStability, weight: 0.20, maxPoints: 20 },
      { label: 'Calendar Correlation', score: cciPercent, weight: 0.15, maxPoints: 15 },
      { label: 'Streak Bonus', score: streakBonus, weight: 0.10, maxPoints: 10 },
    ],
    [budgetAdherence, savingsRate, spendingStability, cciPercent, streakBonus],
  );

  // Week-over-week trend
  const healthTrend = useMemo(() => {
    // TODO: Replace with actual week-over-week health score tracking
    const trend = transactions.length > 10 ? Math.round((healthScore - 79) * 10) / 10 : 5;
    return trend;
  }, [healthScore, transactions.length]);

  // ================================================================
  // SECTION 2: Twin Gauges
  // ================================================================
  const velocity = useMemo(
    () => calculateSpendingVelocity(transactions),
    [transactions],
  );
  const velocityTrend = useMemo(
    () => calculateVelocityTrend(transactions),
    [transactions],
  );
  const budgetPace = totalBudget > 0 ? Math.round(totalBudget / daysInMonth) : 33;

  // ================================================================
  // SECTION 3: CCI
  // ================================================================
  const cciByCategory = useMemo(
    () => getCCIByCategory(predictions),
    [predictions],
  );
  const recentAccuracy = useMemo(
    () => getRecentPredictionAccuracy(predictions, 5),
    [predictions],
  );

  // ================================================================
  // SECTION 4: Spending Trends
  // ================================================================
  const trendData: TrendDataPoint[] = useMemo(() => {
    if (trendPeriod === 'monthly' || trendPeriod === '6month') {
      const months = 6;
      return getMonthlyTotals(transactions, months);
    }
    // Weekly: last 6 weeks
    const weeks: TrendDataPoint[] = [];
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
      weeks.push({ label: `W${6 - w}`, value: Math.round(weekTotal * 100) / 100 });
    }
    return weeks;
  }, [transactions, trendPeriod]);

  const trendBudgetLine = useMemo(() => {
    if (trendPeriod === 'weekly') return Math.round(totalBudget / 4);
    return totalBudget;
  }, [totalBudget, trendPeriod]);

  const trendAvg = useMemo(() => {
    if (trendData.length === 0) return 0;
    return Math.round(trendData.reduce((s, d) => s + d.value, 0) / trendData.length);
  }, [trendData]);

  const trendHigh = useMemo(() => {
    if (trendData.length === 0) return { value: 0, label: '' };
    return trendData.reduce((best, d) => (d.value > best.value ? d : best), trendData[0]);
  }, [trendData]);

  // ================================================================
  // SECTION 5: Category Breakdown
  // ================================================================
  const categoryMoM = useMemo(
    () => getCategoryMoM(transactions),
    [transactions],
  );

  const donutData: DonutSegment[] = useMemo(() => {
    const totalCatSpend = categoryMoM.reduce((s, c) => s + c.thisMonth, 0);
    return categoryMoM
      .filter((c) => c.thisMonth > 0)
      .slice(0, 8)
      .map((c) => ({
        category: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        amount: c.thisMonth,
        color: CATEGORY_COLORS[c.category] || '#778899',
        percentage: totalCatSpend > 0 ? (c.thisMonth / totalCatSpend) * 100 : 0,
      }));
  }, [categoryMoM]);

  // ================================================================
  // SECTION 7: Savings Projection
  // ================================================================
  const monthlySavings = Math.max(0, totalBudget - totalSpent);
  const currentSavings = monthlySavings;
  const projectionScenarios = useMemo(
    () => getProjectionScenarios(currentSavings, monthlySavings, projectionMonths),
    [currentSavings, monthlySavings, projectionMonths],
  );

  // ================================================================
  // SECTION 8: Month-over-Month
  // ================================================================
  const momData = useMemo(() => {
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    const thisCats: Record<string, number> = {};
    const lastCats: Record<string, number> = {};

    for (const t of transactions) {
      const d = new Date(t.date);
      const amount = Math.abs(t.amount);
      if (d >= thisMonthStart && d <= now) {
        thisMonthTotal += amount;
        thisCats[t.category] = (thisCats[t.category] || 0) + amount;
      } else if (d >= lastMonthStart && d <= lastMonthEnd) {
        lastMonthTotal += amount;
        lastCats[t.category] = (lastCats[t.category] || 0) + amount;
      }
    }

    return {
      thisMonth: {
        total: Math.round(thisMonthTotal),
        categories: Object.entries(thisCats)
          .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
          .sort((a, b) => b.amount - a.amount),
      },
      lastMonth: {
        total: Math.round(lastMonthTotal),
        categories: Object.entries(lastCats)
          .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
          .sort((a, b) => b.amount - a.amount),
      },
    };
  }, [transactions]);

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Insights" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* ======== SECTION 1: Financial Health Score (Hero) ======== */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>Financial Health Score</Text>
          <View style={styles.ringContainer}>
            <HealthScoreRing score={healthScore} size={140} />
          </View>

          {/* Week-over-week trend */}
          <View style={styles.trendRow}>
            <Ionicons
              name={healthTrend >= 0 ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={healthTrend >= 0 ? Colors.positive : Colors.danger}
            />
            <Text
              style={[
                styles.trendText,
                { color: healthTrend >= 0 ? Colors.positive : Colors.danger },
              ]}
            >
              {healthTrend >= 0 ? '+' : ''}{healthTrend} from last week
            </Text>
          </View>

          {/* 5-component breakdown bars */}
          <View style={styles.breakdownContainer}>
            {breakdownBars.map((item) => {
              const contribution = Math.round(item.score * item.weight);
              const fillPct = item.maxPoints > 0 ? (contribution / item.maxPoints) * 100 : 0;
              const barColor =
                fillPct >= 70 ? Colors.positive : fillPct >= 40 ? Colors.warning : Colors.danger;
              return (
                <View key={item.label} style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelRow}>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
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
        </Card>

        {/* ======== SECTION 2: Twin Gauges ======== */}
        <Text style={styles.sectionTitle}>Burn Rate & Velocity</Text>
        <View style={styles.twinRow}>
          {/* Left: Burn Rate Gauge */}
          <Card style={styles.twinCard}>
            <Text style={styles.twinLabel}>Burn Rate</Text>
            <View style={styles.gaugeWrap}>
              <BurnRateGauge rate={burnRate} size={110} />
            </View>
          </Card>

          {/* Right: Spending Velocity */}
          <Card style={styles.twinCard}>
            <Text style={styles.twinLabel}>Spending Velocity</Text>
            <Text style={styles.velocityBig}>
              ${velocity > 0 ? velocity.toFixed(0) : '42'}
            </Text>
            <Text style={styles.velocityUnit}>per day</Text>
            <Text style={styles.velocityPace}>
              budget pace: ${budgetPace}/day
            </Text>
            <View style={styles.velocityTrendRow}>
              <Ionicons
                name={velocityTrend <= 0 ? 'arrow-down' : 'arrow-up'}
                size={12}
                color={velocityTrend <= 0 ? Colors.positive : Colors.danger}
              />
              <Text
                style={[
                  styles.velocityTrendText,
                  { color: velocityTrend <= 0 ? Colors.positive : Colors.danger },
                ]}
              >
                {Math.abs(velocityTrend).toFixed(1)}% vs last wk
              </Text>
            </View>
          </Card>
        </View>

        {/* ======== SECTION 3: Calendar Correlation Index ======== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Calendar Correlation</Text>
          <View style={styles.novelBadge}>
            <Text style={styles.novelBadgeText}>Novel</Text>
          </View>
        </View>
        <Card>
          <View style={styles.cciRow}>
            <CCIBadge score={cciPercent > 0 ? cciPercent : 62} size={80} />
            <View style={styles.cciExplain}>
              <Text style={styles.cciExplainText}>
                Your calendar predicted {cciPercent > 0 ? cciPercent : 62}% of your spending
                accurately this month.
              </Text>
            </View>
          </View>

          {/* Recent prediction accuracy */}
          {recentAccuracy.length > 0 && (
            <View style={styles.accuracySection}>
              <Text style={styles.subSectionTitle}>Recent Predictions</Text>
              {recentAccuracy.map((pred) => (
                <View key={pred.id} style={styles.accuracyRow}>
                  <View
                    style={[
                      styles.accuracyDot,
                      { backgroundColor: ACCURACY_COLORS[pred.accuracy] },
                    ]}
                  />
                  <Text style={styles.accuracyCat}>
                    {pred.category.charAt(0).toUpperCase() + pred.category.slice(1)}
                  </Text>
                  <Text style={styles.accuracyAmounts}>
                    ${pred.predictedAmount.toFixed(0)} → $
                    {pred.actualAmount != null ? pred.actualAmount.toFixed(0) : '?'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Per-category CCI bars */}
          {cciByCategory.length > 0 && (
            <View style={styles.cciCatSection}>
              <Text style={styles.subSectionTitle}>By Category</Text>
              {cciByCategory.slice(0, 5).map((cat) => {
                const pct = Math.round(cat.cci * 100);
                const barColor =
                  pct >= 70 ? Colors.positive : pct >= 40 ? Colors.warning : Colors.danger;
                return (
                  <View key={cat.category} style={styles.cciCatRow}>
                    <Text style={styles.cciCatLabel}>
                      {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                    </Text>
                    <View style={styles.cciCatBarBg}>
                      <View
                        style={[
                          styles.cciCatBarFill,
                          { width: `${pct}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                    <Text style={styles.cciCatPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Fallback if no predictions */}
          {recentAccuracy.length === 0 && cciByCategory.length === 0 && (
            <Text style={styles.emptyText}>
              No prediction data yet. Calendar-linked spending will appear here.
            </Text>
          )}
        </Card>

        {/* ======== SECTION 4: Spending Trends ======== */}
        <Text style={styles.sectionTitle}>Spending Trends</Text>
        <Card>
          {/* Period toggle */}
          <View style={styles.periodToggle}>
            {(['weekly', 'monthly', '6month'] as const).map((period) => {
              const labels = { weekly: 'Weekly', monthly: 'Monthly', '6month': '6-Month' };
              const isActive = trendPeriod === period;
              return (
                <Pressable
                  key={period}
                  style={[styles.periodPill, isActive && styles.periodPillActive]}
                  onPress={() => setTrendPeriod(period)}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      isActive && styles.periodPillTextActive,
                    ]}
                  >
                    {labels[period]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TrendLineChart
            data={trendData}
            budgetLine={trendBudgetLine > 0 ? trendBudgetLine : undefined}
            period={trendPeriod}
          />

          {/* Summary stats */}
          <View style={styles.trendSummary}>
            <Text style={styles.trendSummaryText}>
              Avg: ${trendAvg.toLocaleString()}
              {trendPeriod === 'weekly' ? '/wk' : '/mo'}
            </Text>
            <Text style={styles.trendSummaryText}>
              High: ${trendHigh.value.toLocaleString()} ({trendHigh.label})
            </Text>
          </View>
        </Card>

        {/* ======== SECTION 5: Category Breakdown ======== */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <Card>
          <View style={styles.donutContainer}>
            <DonutChart data={donutData} size={160} />
          </View>

          {/* Legend with MoM delta */}
          <View style={styles.catLegend}>
            {categoryMoM
              .filter((c) => c.thisMonth > 0)
              .slice(0, 8)
              .map((cat) => {
                const totalCatSpend = categoryMoM.reduce((s, c) => s + c.thisMonth, 0);
                const pct =
                  totalCatSpend > 0
                    ? ((cat.thisMonth / totalCatSpend) * 100).toFixed(0)
                    : '0';
                return (
                  <View key={cat.category} style={styles.catLegendRow}>
                    <View
                      style={[
                        styles.catDot,
                        {
                          backgroundColor:
                            CATEGORY_COLORS[cat.category] || '#778899',
                        },
                      ]}
                    />
                    <Text style={styles.catLegendName}>
                      {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                    </Text>
                    <Text style={styles.catLegendAmount}>
                      ${cat.thisMonth.toFixed(0)}
                    </Text>
                    <Text style={styles.catLegendPct}>{pct}%</Text>
                    <View style={styles.catDeltaContainer}>
                      {cat.changePercent !== 0 ? (
                        <>
                          <Ionicons
                            name={cat.changePercent < 0 ? 'caret-down' : 'caret-up'}
                            size={10}
                            color={
                              cat.changePercent < 0 ? Colors.positive : Colors.danger
                            }
                          />
                          <Text
                            style={[
                              styles.catDeltaText,
                              {
                                color:
                                  cat.changePercent < 0
                                    ? Colors.positive
                                    : Colors.danger,
                              },
                            ]}
                          >
                            {Math.abs(cat.changePercent).toFixed(0)}%
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.catDeltaText}>--</Text>
                      )}
                    </View>
                  </View>
                );
              })}
          </View>

          {categoryMoM.length === 0 && (
            <Text style={styles.emptyText}>No spending data yet</Text>
          )}
        </Card>

        {/* ======== SECTION 6: AI Insights ======== */}
        <Text style={styles.sectionTitle}>AI Insights</Text>
        <AIInsightCard
          type="warning"
          title="Dining Acceleration"
          body="Your dining spend has increased 23% compared to last month. At this pace, you'll exceed your dining budget by day 25."
          actionLabel="View Dining Trends"
        />
        <AIInsightCard
          type="opportunity"
          title="Subscription Savings"
          body="You have 3 subscriptions totaling $47/month that you haven't used in the last 30 days. Canceling them could save $564/year."
          actionLabel="Review Subscriptions"
        />
        <AIInsightCard
          type="win"
          title="Coffee Savings Win"
          body="You've reduced coffee shop spending by 35% this month compared to your 3-month average. That's $28 saved so far!"
        />

        {/* ======== SECTION 7: Savings Projection ======== */}
        <Text style={styles.sectionTitle}>Savings Projection</Text>
        <Card>
          {/* Time horizon selector */}
          <View style={styles.periodToggle}>
            {[3, 6, 12, 24].map((mo) => {
              const isActive = projectionMonths === mo;
              return (
                <Pressable
                  key={mo}
                  style={[styles.periodPill, isActive && styles.periodPillActive]}
                  onPress={() => setProjectionMonths(mo)}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      isActive && styles.periodPillTextActive,
                    ]}
                  >
                    {mo}mo
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <GrowthCurveChart
            scenarios={projectionScenarios}
            currentSavings={currentSavings}
          />

          <Text style={styles.projectionNote}>
            Saving ${monthlySavings.toFixed(0)}/mo with compound growth
          </Text>
        </Card>

        {/* ======== SECTION 8: Month-over-Month ======== */}
        <Text style={styles.sectionTitle}>Month-over-Month</Text>
        <Card>
          <MonthComparison
            thisMonth={momData.thisMonth}
            lastMonth={momData.lastMonth}
          />
        </Card>

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
      <FloatingChatButton />
    </SafeAreaView>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 120 },

  // Section titles
  sectionTitle: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 32,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: Spacing.md,
  },

  // Hero section
  heroCard: { alignItems: 'center', paddingBottom: Spacing.xl },
  heroLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  ringContainer: { marginBottom: Spacing.md },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  trendText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },

  // Breakdown bars
  breakdownContainer: { width: '100%', paddingHorizontal: Spacing.sm },
  breakdownRow: { marginBottom: Spacing.sm },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  breakdownLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  breakdownScore: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  breakdownBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBarFill: { height: '100%', borderRadius: 3 },

  // Twin Gauges
  twinRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  twinCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  twinLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  gaugeWrap: { alignItems: 'center' },
  velocityBig: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  velocityUnit: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  velocityPace: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  velocityTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  velocityTrendText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },

  // Novel badge
  novelBadge: {
    backgroundColor: 'rgba(0,208,156,0.15)',
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  novelBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
  },

  // CCI section
  cciRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cciExplain: { flex: 1 },
  cciExplainText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
  accuracySection: { marginTop: Spacing.md },
  subSectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  accuracyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accuracyCat: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
  },
  accuracyAmounts: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  cciCatSection: { marginTop: Spacing.lg },
  cciCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cciCatLabel: {
    width: 80,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
  },
  cciCatBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  cciCatBarFill: { height: '100%', borderRadius: 3 },
  cciCatPct: {
    width: 36,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
  },

  // Period toggle
  periodToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  periodPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    backgroundColor: Colors.border,
  },
  periodPillActive: {
    backgroundColor: Colors.accent,
  },
  periodPillText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  periodPillTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },

  // Trend summary
  trendSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  trendSummaryText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },

  // Donut
  donutContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  // Category legend
  catLegend: { marginTop: Spacing.sm },
  catLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  catLegendName: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
  },
  catLegendAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  catLegendPct: {
    width: 30,
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginRight: Spacing.sm,
  },
  catDeltaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    justifyContent: 'flex-end',
    gap: 2,
  },
  catDeltaText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },

  // Projection
  projectionNote: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // Shared
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
