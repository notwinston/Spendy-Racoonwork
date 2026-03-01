import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import type { EventCategory } from '../types';

const CATEGORIES: { key: EventCategory; label: string; icon: string }[] = [
  { key: 'dining', label: 'Dining', icon: 'restaurant' },
  { key: 'groceries', label: 'Groceries', icon: 'cart' },
  { key: 'transport', label: 'Transport', icon: 'car' },
  { key: 'entertainment', label: 'Entertainment', icon: 'film' },
  { key: 'shopping', label: 'Shopping', icon: 'bag' },
  { key: 'travel', label: 'Travel', icon: 'airplane' },
  { key: 'health', label: 'Health', icon: 'medkit' },
  { key: 'education', label: 'Education', icon: 'school' },
  { key: 'fitness', label: 'Fitness', icon: 'barbell' },
  { key: 'social', label: 'Social', icon: 'people' },
  { key: 'professional', label: 'Professional', icon: 'briefcase' },
  { key: 'bills', label: 'Bills', icon: 'receipt' },
  { key: 'personal', label: 'Personal', icon: 'person' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

interface SplitTransactionModalProps {
  transaction: { amount: number; merchant: string };
  visible: boolean;
  onSplit: (splits: { category: EventCategory; amount: number }[]) => void;
  onClose: () => void;
}

export function SplitTransactionModal({
  transaction,
  visible,
  onSplit,
  onClose,
}: SplitTransactionModalProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const totalAllocated = useMemo(() => {
    return Object.values(amounts).reduce((sum, val) => {
      const num = parseFloat(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [amounts]);

  const remaining = transaction.amount - totalAllocated;
  const isValid = Math.abs(remaining) < 0.01 && totalAllocated > 0;

  const handleSplit = () => {
    const splits = Object.entries(amounts)
      .filter(([_, val]) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      })
      .map(([category, val]) => ({
        category: category as EventCategory,
        amount: parseFloat(val),
      }));
    onSplit(splits);
  };

  const updateAmount = (category: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [category]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Split Transaction</Text>
              <Text style={styles.subtitle}>
                {transaction.merchant} - ${transaction.amount.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Remaining Indicator */}
          <View style={styles.remainingRow}>
            <Text style={styles.remainingLabel}>Remaining to allocate:</Text>
            <Text
              style={[
                styles.remainingAmount,
                { color: Math.abs(remaining) < 0.01 ? Colors.positive : Colors.warning },
              ]}
            >
              ${remaining.toFixed(2)}
            </Text>
          </View>

          {/* Category Rows */}
          <ScrollView style={styles.categoryList}>
            {CATEGORIES.map((cat) => (
              <View key={cat.key} style={styles.categoryRow}>
                <Ionicons
                  name={cat.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={Colors.textSecondary}
                />
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <View style={styles.amountInputWrap}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    value={amounts[cat.key] ?? ''}
                    onChangeText={(val) => updateAmount(cat.key, val)}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Split Button */}
          <TouchableOpacity
            style={[styles.splitButton, !isValid && styles.splitButtonDisabled]}
            onPress={handleSplit}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Text style={styles.splitButtonText}>
              {isValid ? 'Split Transaction' : `$${remaining.toFixed(2)} remaining`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Spacing['3xl'],
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: 12,
  },
  remainingLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  remainingAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  categoryList: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  categoryLabel: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    width: 100,
  },
  dollarSign: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  amountInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  splitButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  splitButtonDisabled: {
    backgroundColor: Colors.cardBorder,
  },
  splitButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
});
