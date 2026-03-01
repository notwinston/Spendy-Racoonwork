import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { Card } from './ui/Card';
import { useOptimizerStore, type SpendableResult } from '../stores/optimizerStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useBudgetStore } from '../stores/budgetStore';
import { usePredictionStore } from '../stores/predictionStore';

interface SpendableBudgetCardProps {
  onSetUp: () => void;
}

function HorizonPill({
  result,
  isSelected,
  onPress,
}: {
  result: SpendableResult;
  isSelected: boolean;
  onPress: () => void;
}) {
  const amountColor =
    result.amount < 20
      ? Colors.negative
      : result.amount < 80
        ? Colors.warning
        : Colors.positive;

  return (
    <TouchableOpacity
      style={[styles.horizonPill, isSelected && styles.horizonPillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.horizonLabel}>{result.label}</Text>
      <Text style={[styles.horizonAmount, { color: amountColor }]}>
        ${result.amount.toFixed(0)}
      </Text>
    </TouchableOpacity>
  );
}

function BreakdownRow({ label, amount }: { label: string; amount: number }) {
  if (amount === 0) return null;
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownAmount}>${amount.toFixed(0)}</Text>
    </View>
  );
}

export function SpendableBudgetCard({ onSetUp }: SpendableBudgetCardProps) {
  const { profile, spendables, isOnboarded, recompute, loadDemoData } = useOptimizerStore();
  const transactions = useTransactionStore((s) => s.transactions);
  const recurringTransactions = useTransactionStore((s) => s.recurringTransactions);
  const goals = useBudgetStore((s) => s.goals);
  const predictions = usePredictionStore((s) => s.predictions);
  const [selectedHorizon, setSelectedHorizon] = useState<number>(0);

  // Load demo data on first mount if not onboarded and transactions exist (demo mode)
  useEffect(() => {
    if (!isOnboarded && transactions.length > 0) {
      loadDemoData();
    }
  }, [isOnboarded, transactions.length, loadDemoData]);

  // Recompute whenever inputs change
  useEffect(() => {
    if (profile) {
      recompute(transactions, predictions, goals, recurringTransactions);
    }
  }, [profile, transactions, predictions, goals, recurringTransactions, recompute]);

  const selected = spendables[selectedHorizon] ?? null;

  // Empty state
  if (!isOnboarded) {
    return (
      <Card style={styles.card}>
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={36} color={Colors.accentBright} />
          <Text style={styles.emptyTitle}>Spendable Budget Advisor</Text>
          <Text style={styles.emptyBody}>
            Know exactly how much you can safely spend today, this week, and until your next paycheck.
          </Text>
          <TouchableOpacity style={styles.setupButton} onPress={onSetUp} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.setupButtonText}>Set Up Financial Profile</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="wallet" size={20} color={Colors.accentBright} />
          <Text style={styles.headerTitle}>Spendable Budget</Text>
        </View>
        <TouchableOpacity onPress={onSetUp} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="settings-outline" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Horizon pills */}
      <View style={styles.horizonRow}>
        {spendables.map((result, idx) => (
          <HorizonPill
            key={result.horizon}
            result={result}
            isSelected={idx === selectedHorizon}
            onPress={() => setSelectedHorizon(idx)}
          />
        ))}
      </View>

      {/* Breakdown for selected horizon */}
      {selected && (
        <View style={styles.breakdown}>
          <BreakdownRow label="Income in period" amount={selected.incomeInPeriod} />
          <BreakdownRow label="Already spent" amount={-selected.spentInPeriod} />
          <BreakdownRow label="Predicted expenses" amount={-selected.predictedInPeriod} />
          <BreakdownRow label="Bills due" amount={-selected.billsInPeriod} />
          <BreakdownRow label="Savings" amount={-selected.savingsInPeriod} />
          <BreakdownRow label="Safety buffer" amount={-selected.bufferAmount} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading.h2,
    color: Colors.textPrimary,
  },
  horizonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  horizonPill: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  horizonPillActive: {
    borderColor: Colors.accentBright,
    backgroundColor: Colors.bgHover,
  },
  horizonLabel: {
    ...Typography.caption.meta,
    marginBottom: Spacing.xs,
  },
  horizonAmount: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 20,
    fontWeight: '500',
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  breakdownLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  breakdownAmount: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyBody: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accentBright,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.radiusMd,
  },
  setupButtonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
