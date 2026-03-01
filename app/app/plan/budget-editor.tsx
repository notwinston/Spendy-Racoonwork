import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useBudgetStore } from '../../src/stores/budgetStore';

export default function BudgetEditorScreen() {
  const router = useRouter();
  const budgets = useBudgetStore((s) => s.budgets);
  const updateBudget = useBudgetStore((s) => s.updateBudget);
  const totalBudget = useBudgetStore((s) => s.totalBudget);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const formatCategory = (cat: string): string =>
    cat.charAt(0).toUpperCase() + cat.slice(1);

  const handleStartEdit = (id: string, currentLimit: number) => {
    setEditingId(id);
    setEditValue(String(currentLimit));
  };

  const handleSaveEdit = (id: string) => {
    const num = parseFloat(editValue);
    if (!isNaN(num) && num >= 0) {
      updateBudget(id, Math.round(num));
    }
    setEditingId(null);
    setEditValue('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Budget Editor</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Monthly Budget</Text>
        <Text style={styles.totalAmount}>
          ${totalBudget.toLocaleString()}
        </Text>
      </Card>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {budgets.map((b) => {
          const isEditing = editingId === b.id;
          const pct = totalBudget > 0 ? Math.round((b.monthly_limit / totalBudget) * 100) : 0;
          return (
            <Card key={b.id} style={styles.categoryCard}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>
                    {formatCategory(b.category)}
                  </Text>
                  <Text style={styles.categoryPct}>{pct}%</Text>
                </View>
                {isEditing ? (
                  <View style={styles.editRow}>
                    <Text style={styles.editCurrency}>$</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="numeric"
                      autoFocus
                      onSubmitEditing={() => handleSaveEdit(b.id)}
                    />
                    <TouchableOpacity
                      onPress={() => handleSaveEdit(b.id)}
                      style={styles.saveBtn}
                    >
                      <Ionicons name="checkmark" size={20} color={Colors.positive} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleStartEdit(b.id, b.monthly_limit)}
                    style={styles.amountTouchable}
                  >
                    <Text style={styles.categoryAmount}>
                      ${b.monthly_limit.toLocaleString()}
                    </Text>
                    <Ionicons name="pencil" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              {/* Usage bar */}
              <View style={styles.usageBar}>
                <View
                  style={[
                    styles.usageFill,
                    {
                      width: `${Math.min(b.percentUsed, 100)}%`,
                      backgroundColor:
                        b.percentUsed > 100
                          ? Colors.negative
                          : b.percentUsed > 80
                          ? Colors.warning
                          : Colors.accentBright,
                    },
                  ]}
                />
              </View>
              <Text style={styles.usageText}>
                ${Math.round(b.spent).toLocaleString()} spent of ${b.monthly_limit.toLocaleString()}
              </Text>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgApp,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.heading.h2,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  totalCard: {
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    ...Typography.label.card,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 32,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  categoryCard: {
    marginBottom: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...Typography.body.regular,
    color: Colors.textPrimary,
  },
  categoryPct: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 2,
  },
  amountTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryAmount: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  editCurrency: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  editInput: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
    backgroundColor: Colors.bgElevated,
    borderRadius: Spacing.radiusSm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.accentBright,
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: Spacing.radiusSm,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageBar: {
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  usageFill: {
    height: '100%',
    borderRadius: 3,
  },
  usageText: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
  },
});
