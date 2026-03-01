import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';

interface CategoryData {
  name: string;
  amount: number;
}

interface MonthData {
  total: number;
  categories: CategoryData[];
}

export interface MonthComparisonProps {
  thisMonth: MonthData;
  lastMonth: MonthData;
}

export function MonthComparison({ thisMonth, lastMonth }: MonthComparisonProps) {
  const totalChange =
    lastMonth.total > 0
      ? ((thisMonth.total - lastMonth.total) / lastMonth.total) * 100
      : 0;

  // Build a merged category list with deltas
  const catMap = new Map<
    string,
    { thisMonth: number; lastMonth: number; changePct: number }
  >();

  for (const c of lastMonth.categories) {
    catMap.set(c.name, { thisMonth: 0, lastMonth: c.amount, changePct: 0 });
  }
  for (const c of thisMonth.categories) {
    const existing = catMap.get(c.name);
    if (existing) {
      existing.thisMonth = c.amount;
    } else {
      catMap.set(c.name, { thisMonth: c.amount, lastMonth: 0, changePct: 0 });
    }
  }

  // Calculate change percents
  for (const [, val] of catMap) {
    val.changePct =
      val.lastMonth > 0
        ? ((val.thisMonth - val.lastMonth) / val.lastMonth) * 100
        : val.thisMonth > 0
          ? 100
          : 0;
  }

  const categorySorted = [...catMap.entries()].sort(
    (a, b) => b[1].thisMonth - a[1].thisMonth,
  );

  // Best improvement: biggest % decrease
  const improvements = categorySorted.filter(
    ([, v]) => v.changePct < 0 && v.lastMonth > 0,
  );
  const bestImprovement =
    improvements.length > 0
      ? improvements.reduce((best, curr) =>
          curr[1].changePct < best[1].changePct ? curr : best,
        )
      : null;

  // Needs attention: biggest % increase
  const increases = categorySorted.filter(([, v]) => v.changePct > 0);
  const needsAttention =
    increases.length > 0
      ? increases.reduce((worst, curr) =>
          curr[1].changePct > worst[1].changePct ? curr : worst,
        )
      : null;

  return (
    <View style={styles.container}>
      {/* Side-by-side totals */}
      <View style={styles.totalsRow}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>This Month</Text>
          <Text style={styles.totalAmount}>
            ${thisMonth.total.toFixed(0)}
          </Text>
        </View>
        <View style={styles.changeContainer}>
          <Ionicons
            name={totalChange <= 0 ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={totalChange <= 0 ? Colors.positive : Colors.danger}
          />
          <Text
            style={[
              styles.changePct,
              { color: totalChange <= 0 ? Colors.positive : Colors.danger },
            ]}
          >
            {Math.abs(totalChange).toFixed(1)}%
          </Text>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Last Month</Text>
          <Text style={styles.totalAmount}>
            ${lastMonth.total.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Best Improvement */}
      {bestImprovement && (
        <View style={[styles.callout, { borderLeftColor: Colors.positive }]}>
          <Ionicons name="trending-down" size={16} color={Colors.positive} />
          <View style={styles.calloutText}>
            <Text style={styles.calloutTitle}>Best Improvement</Text>
            <Text style={styles.calloutBody}>
              {bestImprovement[0]}: {Math.abs(bestImprovement[1].changePct).toFixed(0)}% decrease
            </Text>
          </View>
        </View>
      )}

      {/* Needs Attention */}
      {needsAttention && (
        <View style={[styles.callout, { borderLeftColor: Colors.danger }]}>
          <Ionicons name="trending-up" size={16} color={Colors.danger} />
          <View style={styles.calloutText}>
            <Text style={styles.calloutTitle}>Needs Attention</Text>
            <Text style={styles.calloutBody}>
              {needsAttention[0]}: {Math.abs(needsAttention[1].changePct).toFixed(0)}% increase
            </Text>
          </View>
        </View>
      )}

      {/* Category breakdown */}
      <View style={styles.categoryList}>
        {categorySorted.map(([name, data]) => (
          <View key={name} style={styles.categoryRow}>
            <Text style={styles.catName}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </Text>
            <Text style={styles.catAmount}>
              ${data.thisMonth.toFixed(0)}
            </Text>
            <View style={styles.deltaContainer}>
              {data.changePct !== 0 && (
                <>
                  <Ionicons
                    name={data.changePct < 0 ? 'caret-down' : 'caret-up'}
                    size={12}
                    color={data.changePct < 0 ? Colors.positive : Colors.danger}
                  />
                  <Text
                    style={[
                      styles.deltaPct,
                      { color: data.changePct < 0 ? Colors.positive : Colors.danger },
                    ]}
                  >
                    {Math.abs(data.changePct).toFixed(0)}%
                  </Text>
                </>
              )}
              {data.changePct === 0 && (
                <Text style={styles.deltaPct}>--</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  totalCard: {
    flex: 1,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
  },
  changePct: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  calloutText: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  calloutBody: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  categoryList: {
    marginTop: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  catName: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
  },
  catAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
  },
  deltaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
    justifyContent: 'flex-end',
    gap: 2,
  },
  deltaPct: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
});
