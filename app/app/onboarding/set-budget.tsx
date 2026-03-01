import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { DonutChart, type DonutSegment } from '../../src/components/charts';
import { useAuthStore } from '../../src/stores/authStore';
import { useBudgetStore } from '../../src/stores/budgetStore';

const CATEGORY_ALLOCATIONS = [
  { category: 'Dining', percentage: 30, color: Colors.negative },
  { category: 'Transport', percentage: 20, color: '#4ECDC4' },
  { category: 'Shopping', percentage: 15, color: '#45B7D1' },
  { category: 'Entertainment', percentage: 10, color: '#96CEB4' },
  { category: 'Groceries', percentage: 15, color: '#FFEAA7' },
  { category: 'Other', percentage: 10, color: '#DDA0DD' },
];

const PRESETS = [500, 1000, 1500, 2000, 3000, 5000];

export default function SetBudgetScreen() {
  const router = useRouter();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const userId = useAuthStore((s) => s.user?.id) ?? 'demo-user';
  const fetchBudgets = useBudgetStore((s) => s.fetchBudgets);
  const [selectedAmount, setSelectedAmount] = useState(2000);

  const donutData: DonutSegment[] = useMemo(
    () =>
      CATEGORY_ALLOCATIONS.map((cat) => ({
        category: cat.category,
        amount: Math.round((selectedAmount * cat.percentage) / 100),
        color: cat.color,
        percentage: cat.percentage,
      })),
    [selectedAmount],
  );

  const handleComplete = async () => {
    await fetchBudgets(userId);
    setOnboarded(true);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="pie-chart" size={64} color={Colors.accent} style={styles.icon} />
        <Text style={styles.title}>Set Your Budget</Text>
        <Text style={styles.subtitle}>
          Set a monthly spending target. You can always adjust it later.
        </Text>

        <View style={styles.budgetDisplay}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.amount}>{selectedAmount.toLocaleString()}</Text>
          <Text style={styles.period}>/month</Text>
        </View>

        <View style={styles.presets}>
          {PRESETS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.presetChip,
                selectedAmount === amount && styles.presetChipActive,
              ]}
              onPress={() => setSelectedAmount(amount)}
            >
              <Text
                style={[
                  styles.presetText,
                  selectedAmount === amount && styles.presetTextActive,
                ]}
              >
                ${amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Suggested category allocation preview */}
        <View style={styles.donutContainer}>
          <Text style={styles.donutLabel}>Suggested Allocation</Text>
          <DonutChart data={donutData} size={140} strokeWidth={24} showTotal={false} />
          <View style={styles.legendContainer}>
            {CATEGORY_ALLOCATIONS.map((cat) => (
              <View key={cat.category} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendText}>
                  {cat.category} {cat.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Button title="Looks Good!" onPress={handleComplete} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  icon: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  budgetDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: Spacing.xl,
  },
  currency: {
    fontSize: Typography.sizes['3xl'],
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  amount: {
    fontSize: Typography.sizes['5xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  period: {
    fontSize: Typography.sizes.lg,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  presetChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  presetChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '20',
  },
  presetText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  presetTextActive: {
    color: Colors.accent,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  donutContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  donutLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.md,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
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
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
});
