import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../src/constants';
import { Card } from '../src/components/ui/Card';
import { useBudgetStore, getBurnRateColor } from '../src/stores/budgetStore';
import { useTransactionStore } from '../src/stores/transactionStore';
import type { EventCategory } from '../src/types';

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

export default function BudgetDetailScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const budgets = useBudgetStore((s) => s.budgets);
  const transactions = useTransactionStore((s) => s.transactions);

  const cat = (category || 'dining') as EventCategory;
  const budget = budgets.find((b) => b.category === cat);

  const categoryTxns = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter((t) => t.category === cat && new Date(t.date) >= monthStart)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, cat]);

  const spent = budget?.spent ?? 0;
  const limit = budget?.monthly_limit ?? 300;
  const remaining = Math.max(0, limit - spent);
  const pctUsed = limit > 0 ? (spent / limit) * 100 : 0;
  const isOver = pctUsed > 100;

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = limit / daysInMonth;
  const expectedSpent = dailyBudget * dayOfMonth;
  const localBurnRate = expectedSpent > 0 ? spent / expectedSpent : 0;
  const burnColor = getBurnRateColor(localBurnRate);

  const title = cat.charAt(0).toUpperCase() + cat.slice(1);
  const iconName = CATEGORY_ICONS[cat] || 'ellipsis-horizontal';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title} Budget</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Card */}
        <Card style={styles.progressCard}>
          <View style={styles.iconRow}>
            <View style={styles.categoryIcon}>
              <Ionicons name={iconName} size={28} color={Colors.accent} />
            </View>
          </View>
          <Text style={styles.amountText}>
            ${spent.toFixed(0)} / ${limit.toFixed(0)}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, pctUsed)}%`,
                  backgroundColor: isOver ? Colors.danger : Colors.accent,
                },
              ]}
            />
          </View>
          <Text style={[styles.remainingText, isOver && { color: Colors.danger }]}>
            {isOver
              ? `$${(spent - limit).toFixed(0)} over budget`
              : `$${remaining.toFixed(0)} remaining`}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Burn Rate</Text>
              <Text style={[styles.statValue, { color: burnColor }]}>
                {localBurnRate.toFixed(2)}x
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Daily Avg</Text>
              <Text style={styles.statValue}>
                ${dayOfMonth > 0 ? (spent / dayOfMonth).toFixed(0) : '0'}/day
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Projected</Text>
              <Text style={[styles.statValue, {
                color: (spent / dayOfMonth) * daysInMonth > limit ? Colors.danger : Colors.positive,
              }]}>
                ${dayOfMonth > 0 ? ((spent / dayOfMonth) * daysInMonth).toFixed(0) : '0'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Trend placeholder */}
        <Text style={styles.sectionTitle}>Monthly Trend</Text>
        <Card style={styles.trendCard}>
          <View style={styles.trendBars}>
            {[65, 80, 72, 90, 55, Math.round(pctUsed)].map((val, i) => (
              <View key={i} style={styles.trendBarCol}>
                <View style={styles.trendBarBg}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        height: `${Math.min(100, val)}%`,
                        backgroundColor: i === 5 ? Colors.accent : Colors.cardBorder,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendLabel}>
                  {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>
          Transactions ({categoryTxns.length})
        </Text>
        <Card>
          {categoryTxns.slice(0, 10).map((t, i) => (
            <View
              key={t.id}
              style={[styles.txnRow, i < Math.min(9, categoryTxns.length - 1) && styles.txnBorder]}
            >
              <View style={styles.txnInfo}>
                <Text style={styles.txnMerchant} numberOfLines={1}>
                  {t.merchant_name || 'Unknown'}
                </Text>
                <Text style={styles.txnDate}>
                  {new Date(t.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.txnAmount}>-${Math.abs(t.amount).toFixed(2)}</Text>
            </View>
          ))}
          {categoryTxns.length === 0 && (
            <Text style={styles.emptyText}>No transactions in this category</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  progressCard: {
    alignItems: 'center',
  },
  iconRow: {
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountText: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
    marginTop: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: Typography.sizes.md,
    color: Colors.accent,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  stat: {
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  trendCard: {
    paddingVertical: Spacing.xl,
  },
  trendBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  trendBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarBg: {
    width: 24,
    height: 100,
    backgroundColor: Colors.background,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  trendLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
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
