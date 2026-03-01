import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../src/constants';
import { GlassCard } from '../src/components/ui/GlassCard';
import { AtmosphericBackground } from '../src/components/ui/AtmosphericBackground';
import { TrendLineChart } from '../src/components/charts';
import { AdjustBudgetFAB } from '../src/components/AdjustBudgetFAB';
import { useBudgetStore, getBurnRateColor } from '../src/stores/budgetStore';
import { useTransactionStore } from '../src/stores/transactionStore';
import type { EventCategory } from '../src/types';
import { ThemedAlert } from '../src/components/ui/ThemedAlert';
import { useThemedAlert } from '../src/hooks/useThemedAlert';

type SortOption = 'newest' | 'largest';

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
  const alert = useThemedAlert();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const budgets = useBudgetStore((s) => s.budgets);
  const transactions = useTransactionStore((s) => s.transactions);

  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const cat = (category || 'dining') as EventCategory;
  const budget = budgets.find((b) => b.category === cat);

  const categoryTxns = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const filtered = transactions
      .filter((t) => t.category === cat && new Date(t.date) >= monthStart);
    if (sortOption === 'largest') {
      return filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, cat, sortOption]);

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
    <AtmosphericBackground variant="default">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title} Budget</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Card */}
        <GlassCard style={styles.progressCard}>
          <View style={styles.iconRow}>
            <View style={styles.categoryIconHalo}>
              <View style={styles.categoryIcon}>
                <Ionicons name={iconName} size={28} color={Colors.accentBright} />
              </View>
            </View>
          </View>
          <Text style={styles.amountText}>
            ${spent.toFixed(0)} / ${limit.toFixed(0)}
          </Text>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={isOver ? ['#EF4444', '#DC2626'] : ['#00D09C', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${Math.min(100, pctUsed)}%` },
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
              <Text style={styles.statLabel}>Daily Average</Text>
              <Text style={styles.statValue}>
                ${dayOfMonth > 0 ? (spent / dayOfMonth).toFixed(0) : '0'}/day
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Projected EOM</Text>
              <Text style={[styles.statValue, {
                color: (dayOfMonth > 0 ? (spent / dayOfMonth) * daysInMonth : 0) > limit ? Colors.danger : Colors.positive,
              }]}>
                ${dayOfMonth > 0 ? ((spent / dayOfMonth) * daysInMonth).toFixed(0) : '0'}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Days Until Depleted</Text>
              <Text style={[styles.statValue, { color: burnColor }]}>
                {dayOfMonth > 0 && spent > 0
                  ? Math.max(0, Math.floor(remaining / (spent / dayOfMonth))).toString()
                  : '--'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* 6-Month Trend Line */}
        <Text style={styles.sectionTitle}>6-Month Trend</Text>
        <GlassCard style={styles.trendCard}>
          <TrendLineChart
            data={[
              { label: 'Oct', value: Math.round(limit * 0.65) },
              { label: 'Nov', value: Math.round(limit * 0.80) },
              { label: 'Dec', value: Math.round(limit * 0.72) },
              { label: 'Jan', value: Math.round(limit * 0.90) },
              { label: 'Feb', value: Math.round(limit * 0.55) },
              { label: 'Mar', value: spent },
            ]}
            budgetLine={limit}
            period="6month"
          />
        </GlassCard>

        {/* Transactions */}
        <View style={styles.txnHeaderRow}>
          <Text style={styles.sectionTitle}>
            Transactions ({categoryTxns.length})
          </Text>
          <View style={styles.sortToggle}>
            <TouchableOpacity
              style={[styles.sortButton, sortOption === 'newest' && styles.sortButtonActive]}
              onPress={() => setSortOption('newest')}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortButtonText, sortOption === 'newest' && styles.sortButtonTextActive]}>
                Newest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortOption === 'largest' && styles.sortButtonActive]}
              onPress={() => setSortOption('largest')}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortButtonText, sortOption === 'largest' && styles.sortButtonTextActive]}>
                Largest
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <GlassCard>
          {categoryTxns.slice(0, 10).map((t, i) => (
            <Animated.View
              key={t.id}
              entering={FadeIn.delay(i * 60)}
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
            </Animated.View>
          ))}
          {categoryTxns.length === 0 && (
            <Text style={styles.emptyText}>No transactions in this category</Text>
          )}
        </GlassCard>
      </ScrollView>
      <AdjustBudgetFAB onPress={() => alert.info('Adjust Budget', 'Budget adjustment coming soon!')} />
      <ThemedAlert {...alert.alertProps} />
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  categoryIconHalo: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: Colors.glassBg,
    borderWidth: 2,
    borderColor: Colors.accentBright,
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
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  txnHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 2,
  },
  sortButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  sortButtonActive: {
    backgroundColor: Colors.accent,
  },
  sortButtonText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  sortButtonTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
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
