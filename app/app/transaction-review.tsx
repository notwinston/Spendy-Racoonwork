import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../src/constants';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { useTransactionStore } from '../src/stores/transactionStore';
import { useAuthStore } from '../src/stores/authStore';
import type { Transaction, EventCategory } from '../src/types';

const CATEGORIES: EventCategory[] = [
  'dining',
  'groceries',
  'transport',
  'entertainment',
  'shopping',
  'travel',
  'health',
  'education',
  'fitness',
  'social',
  'professional',
  'bills',
  'personal',
  'other',
];

const CATEGORY_ICONS: Record<EventCategory, string> = {
  dining: 'restaurant',
  groceries: 'cart',
  transport: 'car',
  entertainment: 'film',
  shopping: 'bag',
  travel: 'airplane',
  health: 'medkit',
  education: 'school',
  fitness: 'barbell',
  social: 'people',
  professional: 'briefcase',
  bills: 'receipt',
  personal: 'person',
  other: 'ellipsis-horizontal',
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  dining: 'Dining',
  groceries: 'Groceries',
  transport: 'Transport',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  travel: 'Travel',
  health: 'Health',
  education: 'Education',
  fitness: 'Fitness',
  social: 'Social',
  professional: 'Professional',
  bills: 'Bills',
  personal: 'Personal',
  other: 'Other',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default function TransactionReviewScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { transactions, loadDemoData, isLoading } = useTransactionStore();

  // Local state for category picker
  const [categoryPickerTxnId, setCategoryPickerTxnId] = useState<string | null>(null);

  // Local optimistic state for transactions being modified
  const [localUpdates, setLocalUpdates] = useState<
    Map<string, Partial<Transaction>>
  >(new Map());

  // Load demo data if needed
  useEffect(() => {
    if (transactions.length === 0 && user?.id) {
      loadDemoData(user.id);
    }
  }, [user?.id, transactions.length, loadDemoData]);

  // Unreviewed transactions
  const unreviewedTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const updates = localUpdates.get(t.id);
        const reviewed = updates?.reviewed ?? t.reviewed;
        return !reviewed;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, localUpdates]);

  const reviewedCount = useMemo(() => {
    return transactions.filter((t) => {
      const updates = localUpdates.get(t.id);
      return updates?.reviewed ?? t.reviewed;
    }).length;
  }, [transactions, localUpdates]);

  const getTransaction = useCallback(
    (txn: Transaction): Transaction => {
      const updates = localUpdates.get(txn.id);
      if (!updates) return txn;
      return { ...txn, ...updates };
    },
    [localUpdates]
  );

  const markReviewed = useCallback((txnId: string) => {
    setLocalUpdates((prev) => {
      const next = new Map(prev);
      const existing = next.get(txnId) ?? {};
      next.set(txnId, { ...existing, reviewed: true });
      return next;
    });
  }, []);

  const changeCategory = useCallback((txnId: string, category: EventCategory) => {
    setLocalUpdates((prev) => {
      const next = new Map(prev);
      const existing = next.get(txnId) ?? {};
      next.set(txnId, { ...existing, category });
      return next;
    });
    setCategoryPickerTxnId(null);
  }, []);

  const toggleRecurring = useCallback((txnId: string, currentRecurring: boolean) => {
    setLocalUpdates((prev) => {
      const next = new Map(prev);
      const existing = next.get(txnId) ?? {};
      next.set(txnId, { ...existing, is_recurring: !currentRecurring });
      return next;
    });
  }, []);

  const excludeTransaction = useCallback((txnId: string) => {
    setLocalUpdates((prev) => {
      const next = new Map(prev);
      const existing = next.get(txnId) ?? {};
      next.set(txnId, { ...existing, reviewed: true, notes: 'excluded' });
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Transactions</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {reviewedCount} of {transactions.length} reviewed
          </Text>
          <Text style={styles.progressCount}>
            {unreviewedTransactions.length} remaining
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  transactions.length > 0
                    ? `${(reviewedCount / transactions.length) * 100}%`
                    : '0%',
              },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {unreviewedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.accent} />
            <Text style={styles.emptyStateTitle}>All caught up!</Text>
            <Text style={styles.emptyStateSubtext}>
              All transactions have been reviewed.
            </Text>
            <Button
              title="Go Back"
              onPress={() => router.back()}
              style={styles.goBackButton}
            />
          </View>
        ) : (
          unreviewedTransactions.map((rawTxn) => {
            const txn = getTransaction(rawTxn);
            const iconName = CATEGORY_ICONS[txn.category] ?? 'ellipsis-horizontal';
            return (
              <Card key={txn.id} style={styles.txnCard}>
                {/* Transaction Header */}
                <View style={styles.txnHeader}>
                  <View style={styles.txnIconWrap}>
                    <Ionicons
                      name={iconName as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={Colors.accent}
                    />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnMerchant} numberOfLines={1}>
                      {txn.merchant_name ?? 'Unknown Merchant'}
                    </Text>
                    <Text style={styles.txnDate}>{formatDate(txn.date)}</Text>
                  </View>
                  <Text style={styles.txnAmount}>
                    {formatCurrency(txn.amount)}
                  </Text>
                </View>

                {/* Category Badge */}
                <View style={styles.categoryRow}>
                  <TouchableOpacity
                    style={styles.categoryBadge}
                    onPress={() => setCategoryPickerTxnId(txn.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={iconName as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={Colors.accent}
                    />
                    <Text style={styles.categoryBadgeText}>
                      {CATEGORY_LABELS[txn.category]}
                    </Text>
                    <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
                  </TouchableOpacity>

                  {txn.is_recurring && (
                    <View style={styles.recurringBadge}>
                      <Ionicons name="repeat" size={12} color={Colors.info} />
                      <Text style={styles.recurringBadgeText}>Recurring</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionPrimary]}
                    onPress={() => markReviewed(txn.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark" size={16} color={Colors.textPrimary} />
                    <Text style={styles.actionPrimaryText}>Looks Good</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setCategoryPickerTxnId(txn.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pricetag-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.actionText}>Category</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => toggleRecurring(txn.id, txn.is_recurring)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={txn.is_recurring ? 'repeat' : 'repeat-outline'}
                      size={14}
                      color={txn.is_recurring ? Colors.info : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        txn.is_recurring && { color: Colors.info },
                      ]}
                    >
                      Recurring
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => excludeTransaction(txn.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-outline" size={16} color={Colors.danger} />
                    <Text style={[styles.actionText, { color: Colors.danger }]}>
                      Exclude
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={categoryPickerTxnId !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryPickerTxnId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Change Category</Text>
                <TouchableOpacity onPress={() => setCategoryPickerTxnId(null)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.categoryList}>
              {CATEGORIES.map((category) => {
                const catIcon = CATEGORY_ICONS[category] ?? 'ellipsis-horizontal';
                const txn = categoryPickerTxnId
                  ? transactions.find((t) => t.id === categoryPickerTxnId)
                  : null;
                const currentCategory = txn
                  ? (localUpdates.get(txn.id)?.category ?? txn.category)
                  : null;
                const isSelected = category === currentCategory;

                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      isSelected && styles.categoryOptionSelected,
                    ]}
                    onPress={() => {
                      if (categoryPickerTxnId) {
                        changeCategory(categoryPickerTxnId, category);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryOptionIcon}>
                      <Ionicons
                        name={catIcon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={isSelected ? Colors.accent : Colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryOptionText,
                        isSelected && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {CATEGORY_LABELS[category]}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={Colors.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  // Progress
  progressSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  progressCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  emptyStateSubtext: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  goBackButton: {
    marginTop: Spacing.lg,
    minWidth: 160,
  },
  // Transaction Card
  txnCard: {
    marginBottom: Spacing.md,
  },
  txnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  txnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: {
    flex: 1,
  },
  txnMerchant: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  txnDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txnAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.danger,
  },
  // Category Row
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.info + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recurringBadgeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.info,
    fontWeight: Typography.weights.medium,
  },
  // Action Row
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.cardBorder,
  },
  actionPrimary: {
    backgroundColor: Colors.accent,
  },
  actionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  actionPrimaryText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  // Category Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Spacing['3xl'],
  },
  modalHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  categoryList: {
    padding: Spacing.lg,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.xs,
  },
  categoryOptionSelected: {
    backgroundColor: Colors.accent + '15',
  },
  categoryOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryOptionText: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    color: Colors.textPrimary,
  },
  categoryOptionTextSelected: {
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
});
