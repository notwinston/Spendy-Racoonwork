import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants';
import { Card } from '../ui/Card';
import { TrendLineChart } from '../charts';
import { MonthComparison } from '../MonthComparison';
import type { TrendDataPoint } from '../charts';
import { useTransactionStore, getMonthlyTotals, getCategoryMoM } from '../../stores/transactionStore';
import { useBudgetStore } from '../../stores/budgetStore';
import { useInsightsMonthStore, getDisplayLabel } from '../../stores/insightsMonthStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

type TimePeriod = 'weekly' | 'monthly' | 'yearly';
type BreakdownView = 'net' | 'breakdown';

export function InsightsTrends() {
  const { transactions } = useTransactionStore();
  const { totalBudget } = useBudgetStore();
  const selectedMonth = useInsightsMonthStore((s) => s.selectedMonth);

  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [breakdownView, setBreakdownView] = useState<BreakdownView>('net');

  // Reference date derived from the store — end of selected month
  const refDate = useMemo(
    () => new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59),
    [selectedMonth.year, selectedMonth.month],
  );

  // ---------- Widget 1: Income vs Spending Chart ----------
  const trendData: TrendDataPoint[] = useMemo(() => {
    if (timePeriod === 'monthly' || timePeriod === 'yearly') {
      const months = timePeriod === 'yearly' ? 12 : 6;
      return getMonthlyTotals(transactions, months, refDate);
    }
    // Weekly: last 6 weeks ending at refDate
    const weeks: TrendDataPoint[] = [];
    for (let w = 5; w >= 0; w--) {
      const weekEnd = new Date(refDate);
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
  }, [transactions, timePeriod, refDate]);

  const trendBudgetLine = useMemo(() => {
    if (timePeriod === 'weekly') return Math.round(totalBudget / 4);
    return totalBudget;
  }, [totalBudget, timePeriod]);

  const trendAvg = useMemo(() => {
    if (trendData.length === 0) return 0;
    return Math.round(trendData.reduce((s, d) => s + d.value, 0) / trendData.length);
  }, [trendData]);

  // MoM Change
  const momChange = useMemo(() => {
    if (trendData.length < 2) return 0;
    const current = trendData[trendData.length - 1].value;
    const previous = trendData[trendData.length - 2].value;
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }, [trendData]);

  // ---------- Widget 2: Net Income / Spending Breakdown Toggle ----------
  const mockIncome = 4200;

  const netIncomeData = useMemo(() => {
    const months = 6;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { label: string; value: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(selectedMonth.year, selectedMonth.month - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const spending = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= monthDate && d <= monthEnd;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      result.push({
        label: monthNames[monthDate.getMonth()],
        value: Math.round((mockIncome - spending) * 100) / 100,
      });
    }
    return result;
  }, [transactions, selectedMonth.year, selectedMonth.month]);

  // Spending breakdown by category per month
  const spendingBreakdown = useMemo(() => {
    const months = 6;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const categories = new Set<string>();
    const monthlyData: { label: string; categories: Record<string, number> }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(selectedMonth.year, selectedMonth.month - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const catMap: Record<string, number> = {};
      transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= monthDate && d <= monthEnd;
        })
        .forEach((t) => {
          catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount);
          categories.add(t.category);
        });

      monthlyData.push({
        label: monthNames[monthDate.getMonth()],
        categories: catMap,
      });
    }
    return { months: monthlyData, categories: Array.from(categories).slice(0, 6) };
  }, [transactions, selectedMonth.year, selectedMonth.month]);

  // Month-over-month data for MonthComparison
  const momData = useMemo(() => {
    const thisMonthStart = new Date(selectedMonth.year, selectedMonth.month, 1);
    const thisMonthEnd = refDate;
    const lastMonthStart = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
    const lastMonthEnd = new Date(selectedMonth.year, selectedMonth.month, 0, 23, 59, 59);

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    const thisCats: Record<string, number> = {};
    const lastCats: Record<string, number> = {};

    for (const t of transactions) {
      const d = new Date(t.date);
      const amount = Math.abs(t.amount);
      if (d >= thisMonthStart && d <= thisMonthEnd) {
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
  }, [transactions, selectedMonth.year, selectedMonth.month, refDate]);

  // Max bar value for normalization
  const maxBarValue = useMemo(() => {
    if (breakdownView === 'net') {
      return Math.max(...netIncomeData.map((d) => Math.abs(d.value)), 1);
    }
    return Math.max(
      ...spendingBreakdown.months.map((m) =>
        Object.values(m.categories).reduce((a, b) => a + b, 0)
      ),
      1,
    );
  }, [breakdownView, netIncomeData, spendingBreakdown]);

  return (
    <View>
      {/* Widget 1: Income vs Spending */}
      <Text style={styles.sectionTitle}>Income vs Spending</Text>
      <Card>
        {/* Time toggle */}
        <View style={styles.toggleRow}>
          {(['weekly', 'monthly', 'yearly'] as TimePeriod[]).map((period) => {
            const labels: Record<TimePeriod, string> = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
            const isActive = timePeriod === period;
            return (
              <Pressable
                key={period}
                style={[styles.togglePill, isActive && styles.togglePillActive]}
                onPress={() => setTimePeriod(period)}
              >
                <Text style={[styles.togglePillText, isActive && styles.togglePillTextActive]}>
                  {labels[period]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* MoM change metric */}
        <View style={styles.momChangeRow}>
          <Ionicons
            name={momChange <= 0 ? 'arrow-down' : 'arrow-up'}
            size={14}
            color={momChange <= 0 ? Colors.positive : Colors.negative}
          />
          <Text
            style={[
              styles.momChangeText,
              { color: momChange <= 0 ? Colors.positive : Colors.negative },
            ]}
          >
            {Math.abs(momChange)}% vs previous period
          </Text>
        </View>

        <TrendLineChart
          data={trendData}
          budgetLine={trendBudgetLine > 0 ? trendBudgetLine : undefined}
          period={timePeriod === 'yearly' ? 'monthly' : timePeriod}
        />

        <View style={styles.trendSummary}>
          <Text style={styles.trendSummaryText}>
            Avg: <Text style={styles.trendSummaryAmount}>${trendAvg.toLocaleString()}</Text>
            {timePeriod === 'weekly' ? '/wk' : '/mo'}
          </Text>
        </View>
      </Card>

      {/* Widget 2: Net Income / Spending Breakdown Toggle */}
      <View style={styles.widget2Header}>
        <Text style={styles.sectionTitle}>
          {breakdownView === 'net' ? 'Net Income' : 'Spending Breakdown'}
        </Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.miniToggle, breakdownView === 'net' && styles.miniToggleActive]}
            onPress={() => setBreakdownView('net')}
          >
            <Text style={[styles.miniToggleText, breakdownView === 'net' && styles.miniToggleTextActive]}>
              Net Income
            </Text>
          </Pressable>
          <Pressable
            style={[styles.miniToggle, breakdownView === 'breakdown' && styles.miniToggleActive]}
            onPress={() => setBreakdownView('breakdown')}
          >
            <Text style={[styles.miniToggleText, breakdownView === 'breakdown' && styles.miniToggleTextActive]}>
              Breakdown
            </Text>
          </Pressable>
        </View>
      </View>

      <Card>
        {breakdownView === 'net' ? (
          <View style={styles.barChart}>
            {netIncomeData.map((item, idx) => {
              const barHeight = Math.max(4, (Math.abs(item.value) / maxBarValue) * 120);
              const isPositive = item.value >= 0;
              return (
                <View key={idx} style={styles.barColumn}>
                  <Text style={[styles.barValue, { color: isPositive ? Colors.positive : Colors.negative }]}>
                    {isPositive ? '+' : '-'}${Math.abs(item.value).toFixed(0)}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: isPositive ? Colors.positive : Colors.negative,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View>
            <View style={styles.barChart}>
              {spendingBreakdown.months.map((month, idx) => {
                const totalForMonth = Object.values(month.categories).reduce((a, b) => a + b, 0);
                const barHeight = Math.max(4, (totalForMonth / maxBarValue) * 120);
                return (
                  <View key={idx} style={styles.barColumn}>
                    <Text style={styles.barValue}>
                      ${totalForMonth.toFixed(0)}
                    </Text>
                    <View style={[styles.stackedBar, { height: barHeight }]}>
                      {spendingBreakdown.categories.map((cat) => {
                        const catAmt = month.categories[cat] || 0;
                        const catPct = totalForMonth > 0 ? (catAmt / totalForMonth) * 100 : 0;
                        return (
                          <View
                            key={cat}
                            style={{
                              width: '100%',
                              height: `${catPct}%`,
                              backgroundColor: CATEGORY_COLORS[cat] || Colors.textMuted,
                            }}
                          />
                        );
                      })}
                    </View>
                    <Text style={styles.barLabel}>{month.label}</Text>
                  </View>
                );
              })}
            </View>
            {/* Legend */}
            <View style={styles.legend}>
              {spendingBreakdown.categories.slice(0, 6).map((cat) => (
                <View key={cat} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[cat] || Colors.textMuted }]} />
                  <Text style={styles.legendText}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>

      {/* Month Comparison */}
      <Text style={styles.sectionTitle}>Month-over-Month</Text>
      <Card>
        <MonthComparison thisMonth={momData.thisMonth} lastMonth={momData.lastMonth} />
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
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  togglePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    backgroundColor: Colors.border,
  },
  togglePillActive: {
    backgroundColor: Colors.accentDark,
  },
  togglePillText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  togglePillTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  momChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  momChangeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  trendSummary: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  trendSummaryText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  trendSummaryAmount: {
    ...Typography.numeric.inlineValue,
  },
  widget2Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniToggle: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  miniToggleActive: {
    backgroundColor: Colors.accentDark,
  },
  miniToggleText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  miniToggleTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: Spacing.xl,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    ...Typography.numeric.chartAxis,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  bar: {
    width: 24,
    borderRadius: 4,
  },
  stackedBar: {
    width: 24,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barLabel: {
    ...Typography.caption.meta,
    marginTop: Spacing.xs,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.lg,
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
});
