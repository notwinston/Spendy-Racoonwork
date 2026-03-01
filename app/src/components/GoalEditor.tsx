import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useBudgetStore } from '../stores/budgetStore';
import { useTransactionStore, getMonthlyTotals } from '../stores/transactionStore';
import type { SavingsGoal } from '../types';

interface GoalEditorProps {
  visible: boolean;
  onClose: () => void;
  editingGoal?: SavingsGoal;
}

export function GoalEditor({ visible, onClose, editingGoal }: GoalEditorProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [budgetAmount, setBudgetAmount] = useState('');

  // Step 2 state - category allocations as percentages (0-100)
  const budgets = useBudgetStore((s) => s.budgets);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Step 3 state - savings goals
  const goals = useBudgetStore((s) => s.goals);
  const goalAdd = useBudgetStore((s) => s.goalAdd);
  const goalUpdate = useBudgetStore((s) => s.goalUpdate);
  const goalDelete = useBudgetStore((s) => s.goalDelete);
  const goalReorder = useBudgetStore((s) => s.goalReorder);

  // Local goal drafts for step 3
  const [localGoals, setLocalGoals] = useState<SavingsGoal[]>([]);

  // Read previous month spending from transactionStore
  const transactions = useTransactionStore((s) => s.transactions);
  const previousMonthTotal = useMemo(() => {
    const totals = getMonthlyTotals(transactions, 2);
    // totals[0] is the month before last, totals[1] is last month
    if (totals.length >= 2 && totals[totals.length - 2].value > 0) {
      return totals[totals.length - 2].value;
    }
    return 2340; // fallback
  }, [transactions]);

  // Initialize allocations from budgets when step 2 is reached
  const initializeAllocations = useCallback(() => {
    const totalBudget = parseFloat(budgetAmount) || 0;
    if (totalBudget <= 0 || budgets.length === 0) return;

    const totalLimit = budgets.reduce((s, b) => s + b.monthly_limit, 0);
    const allocs: Record<string, number> = {};
    for (const b of budgets) {
      allocs[b.category] = totalLimit > 0
        ? Math.round((b.monthly_limit / totalLimit) * 100)
        : Math.round(100 / budgets.length);
    }
    setAllocations(allocs);
  }, [budgetAmount, budgets]);

  // Initialize local goals from store when step 3 is reached
  const initializeGoals = useCallback(() => {
    if (editingGoal) {
      setLocalGoals([editingGoal]);
    } else {
      setLocalGoals(goals.length > 0 ? [...goals] : []);
    }
  }, [editingGoal, goals]);

  const parsedBudget = parseFloat(budgetAmount) || 0;

  // Step 2 computed values
  const totalAllocatedPercent = useMemo(() => {
    return Object.values(allocations).reduce((s, v) => s + v, 0);
  }, [allocations]);

  const allocationBarColor = useMemo(() => {
    if (totalAllocatedPercent > 100) return Colors.negative;
    if (totalAllocatedPercent >= 95) return Colors.warning;
    return Colors.accentBright;
  }, [totalAllocatedPercent]);

  const canProceedFromStep2 = totalAllocatedPercent <= 100;

  // Step navigation
  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      if (parsedBudget <= 0) {
        Alert.alert('Invalid Budget', 'Please enter a budget amount greater than $0.');
        return;
      }
      initializeAllocations();
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!canProceedFromStep2) {
        Alert.alert('Over Budget', 'Total allocation exceeds 100%. Please adjust your categories.');
        return;
      }
      initializeGoals();
      setCurrentStep(3);
    }
  }, [currentStep, parsedBudget, canProceedFromStep2, initializeAllocations, initializeGoals]);

  const handleBack = useCallback(() => {
    if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
  }, [currentStep]);

  const handleSave = useCallback(() => {
    // Update budget allocations in the store
    const totalBudget = parsedBudget;
    for (const b of budgets) {
      const pct = allocations[b.category] || 0;
      const newLimit = Math.round((pct / 100) * totalBudget);
      if (newLimit !== b.monthly_limit) {
        useBudgetStore.getState().updateBudget(b.id, newLimit);
      }
    }

    // Save goals - sync local goals to store
    const existingIds = new Set(goals.map((g) => g.id));
    for (const lg of localGoals) {
      if (existingIds.has(lg.id)) {
        goalUpdate(lg.id, lg);
      } else {
        const { id: _id, ...rest } = lg;
        goalAdd(rest);
      }
    }
    // Delete goals that were removed locally
    const localIds = new Set(localGoals.map((g) => g.id));
    for (const g of goals) {
      if (!localIds.has(g.id)) {
        goalDelete(g.id);
      }
    }

    // Reset and close
    setCurrentStep(1);
    setBudgetAmount('');
    setAllocations({});
    setLocalGoals([]);
    onClose();
  }, [parsedBudget, budgets, allocations, localGoals, goals, goalAdd, goalUpdate, goalDelete, onClose]);

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setBudgetAmount('');
    setAllocations({});
    setLocalGoals([]);
    onClose();
  }, [onClose]);

  // Step 3: Add a new goal
  const addLocalGoal = useCallback(() => {
    const newGoal: SavingsGoal = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: '',
      targetAmount: 0,
      currentSaved: 0,
      targetDate: '',
      monthlyContribution: 0,
      isPaused: false,
    };
    setLocalGoals((prev) => [...prev, newGoal]);
  }, []);

  const updateLocalGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setLocalGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    );
  }, []);

  const deleteLocalGoal = useCallback((id: string) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setLocalGoals((prev) => prev.filter((g) => g.id !== id)),
      },
    ]);
  }, []);

  const reorderLocalGoal = useCallback((id: string, direction: 'up' | 'down') => {
    setLocalGoals((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((g) => g.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= arr.length) return prev;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      return arr;
    });
  }, []);

  // Slider change handler for step 2
  const handleSliderChange = useCallback((category: string, value: number) => {
    setAllocations((prev) => ({ ...prev, [category]: Math.round(value) }));
  }, []);

  // ETA calculation for a goal
  const calculateETA = (goal: SavingsGoal): string => {
    if (goal.monthlyContribution <= 0) return 'Set a contribution amount';
    const remaining = goal.targetAmount - goal.currentSaved;
    if (remaining <= 0) return 'Goal reached!';
    const months = Math.ceil(remaining / goal.monthlyContribution);
    const now = new Date();
    const eta = new Date(now.getFullYear(), now.getMonth() + months, 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[eta.getMonth()]} ${eta.getFullYear()}`;
  };

  // Format category name
  const formatCategory = (cat: string): string => {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentStep === 1 ? 'Set Budget' : currentStep === 2 ? 'Allocate Budget' : 'Savings Goals'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.stepDot,
                currentStep === step && styles.stepDotActive,
                currentStep > step && styles.stepDotComplete,
              ]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ========== STEP 1: Budget Input ========== */}
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>MONTHLY BUDGET</Text>
              <View style={styles.budgetInputContainer}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={budgetAmount}
                  onChangeText={(text) => setBudgetAmount(text.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
              <Text style={styles.previousMonthRef}>
                Last month:{' '}
                <Text style={styles.previousMonthAmount}>
                  ${previousMonthTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </Text>

              <View style={styles.stepCta}>
                <Button
                  title="Set Budget"
                  onPress={handleNext}
                  variant="primary"
                  disabled={parsedBudget <= 0}
                />
              </View>
            </View>
          )}

          {/* ========== STEP 2: Category Allocation Sliders ========== */}
          {currentStep === 2 && (
            <View style={styles.stepContent}>
              {budgets.map((b) => {
                const pct = allocations[b.category] ?? 0;
                const dollarAmount = Math.round((pct / 100) * parsedBudget);
                return (
                  <View key={b.category} style={styles.sliderRow}>
                    <View style={styles.sliderHeader}>
                      <Text style={styles.sliderLabel}>
                        {formatCategory(b.category)}
                      </Text>
                      <Text style={styles.sliderValues}>
                        <Text style={styles.sliderPercent}>{pct}%</Text>
                        {'  '}
                        <Text style={styles.sliderDollar}>${dollarAmount.toLocaleString()}</Text>
                      </Text>
                    </View>
                    {/* Custom slider using TouchableOpacity range */}
                    <View style={styles.sliderTrackContainer}>
                      <View style={styles.sliderTrack}>
                        <View
                          style={[
                            styles.sliderFill,
                            {
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: Colors.accentBright,
                            },
                          ]}
                        />
                      </View>
                      {/* Slider buttons for increment/decrement */}
                      <View style={styles.sliderButtons}>
                        <TouchableOpacity
                          style={styles.sliderBtn}
                          onPress={() => handleSliderChange(b.category, Math.max(0, pct - 1))}
                        >
                          <Ionicons name="remove" size={16} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.sliderInput}
                          value={String(pct)}
                          onChangeText={(text) => {
                            const num = parseInt(text, 10);
                            if (!isNaN(num) && num >= 0 && num <= 100) {
                              handleSliderChange(b.category, num);
                            } else if (text === '') {
                              handleSliderChange(b.category, 0);
                            }
                          }}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                        <TouchableOpacity
                          style={styles.sliderBtn}
                          onPress={() => handleSliderChange(b.category, Math.min(100, pct + 1))}
                        >
                          <Ionicons name="add" size={16} color={Colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Running total bar */}
              <View style={styles.totalBar}>
                <View style={styles.totalBarHeader}>
                  <Text style={styles.totalBarLabel}>Total Allocated</Text>
                  <Text
                    style={[
                      styles.totalBarPercent,
                      { color: allocationBarColor },
                    ]}
                  >
                    {totalAllocatedPercent}%
                  </Text>
                </View>
                <View style={styles.totalBarTrack}>
                  <View
                    style={[
                      styles.totalBarFill,
                      {
                        width: `${Math.min(totalAllocatedPercent, 100)}%`,
                        backgroundColor: allocationBarColor,
                      },
                    ]}
                  />
                </View>
                {totalAllocatedPercent > 100 && (
                  <Text style={styles.totalBarWarning}>
                    Over budget by {totalAllocatedPercent - 100}%
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* ========== STEP 3: Savings Goals ========== */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              {localGoals.map((goal, index) => (
                <Card key={goal.id} style={styles.goalCard}>
                  {/* Goal header with controls */}
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalIndex}>Goal {index + 1}</Text>
                    <View style={styles.goalActions}>
                      <TouchableOpacity
                        onPress={() => reorderLocalGoal(goal.id, 'up')}
                        disabled={index === 0}
                        style={[styles.goalActionBtn, index === 0 && styles.goalActionDisabled]}
                      >
                        <Ionicons
                          name="arrow-up"
                          size={18}
                          color={index === 0 ? Colors.textMuted : Colors.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => reorderLocalGoal(goal.id, 'down')}
                        disabled={index === localGoals.length - 1}
                        style={[styles.goalActionBtn, index === localGoals.length - 1 && styles.goalActionDisabled]}
                      >
                        <Ionicons
                          name="arrow-down"
                          size={18}
                          color={index === localGoals.length - 1 ? Colors.textMuted : Colors.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          updateLocalGoal(goal.id, { isPaused: !goal.isPaused })
                        }
                        style={styles.goalActionBtn}
                      >
                        <Ionicons
                          name={goal.isPaused ? 'play' : 'pause'}
                          size={18}
                          color={goal.isPaused ? Colors.positive : Colors.warning}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteLocalGoal(goal.id)}
                        style={styles.goalActionBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.negative} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {goal.isPaused && (
                    <View style={styles.pausedBadge}>
                      <Text style={styles.pausedText}>PAUSED</Text>
                    </View>
                  )}

                  {/* Goal name */}
                  <Text style={styles.goalFieldLabel}>Goal Name</Text>
                  <TextInput
                    style={styles.goalTextInput}
                    value={goal.name}
                    onChangeText={(text) => updateLocalGoal(goal.id, { name: text })}
                    placeholder="e.g., Emergency Fund"
                    placeholderTextColor={Colors.textMuted}
                  />

                  {/* Target amount */}
                  <Text style={styles.goalFieldLabel}>Target Amount</Text>
                  <View style={styles.goalNumericRow}>
                    <Text style={styles.goalCurrency}>$</Text>
                    <TextInput
                      style={styles.goalNumericInput}
                      value={goal.targetAmount > 0 ? String(goal.targetAmount) : ''}
                      onChangeText={(text) => {
                        const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                        updateLocalGoal(goal.id, { targetAmount: isNaN(num) ? 0 : num });
                      }}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Target date */}
                  <Text style={styles.goalFieldLabel}>Target Date</Text>
                  <TextInput
                    style={styles.goalTextInput}
                    value={goal.targetDate}
                    onChangeText={(text) => updateLocalGoal(goal.id, { targetDate: text })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textMuted}
                  />

                  {/* Monthly contribution */}
                  <Text style={styles.goalFieldLabel}>Monthly Contribution</Text>
                  <View style={styles.goalNumericRow}>
                    <Text style={styles.goalCurrency}>$</Text>
                    <TextInput
                      style={styles.goalNumericInput}
                      value={goal.monthlyContribution > 0 ? String(goal.monthlyContribution) : ''}
                      onChangeText={(text) => {
                        const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                        updateLocalGoal(goal.id, { monthlyContribution: isNaN(num) ? 0 : num });
                      }}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* ETA */}
                  <View style={styles.etaContainer}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.etaText}>
                      Estimated completion:{' '}
                      <Text style={styles.etaValue}>{calculateETA(goal)}</Text>
                    </Text>
                  </View>
                </Card>
              ))}

              {/* Add another goal */}
              <TouchableOpacity style={styles.addGoalButton} onPress={addLocalGoal}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.accentBright} />
                <Text style={styles.addGoalText}>Add another goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom navigation */}
        <View style={styles.bottomNav}>
          {currentStep > 1 && (
            <Button title="Back" onPress={handleBack} variant="ghost" />
          )}
          <View style={styles.bottomNavSpacer} />
          {currentStep < 3 ? (
            <Button
              title="Next"
              onPress={handleNext}
              variant="primary"
              disabled={currentStep === 2 && !canProceedFromStep2}
            />
          ) : (
            <Button title="Save" onPress={handleSave} variant="primary" />
          )}
        </View>
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading.h2,
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.bgElevated,
  },
  stepDotActive: {
    backgroundColor: Colors.accentBright,
    width: 24,
  },
  stepDotComplete: {
    backgroundColor: Colors.positive,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  stepContent: {
    flex: 1,
  },

  // Step 1 styles
  stepLabel: {
    ...Typography.label.sectionDivider,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    marginTop: Spacing.xl,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  currencyPrefix: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 36,
    fontWeight: '500',
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
  budgetInput: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 36,
    fontWeight: '500',
    color: Colors.textPrimary,
    minWidth: 120,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentBright,
    paddingVertical: Spacing.sm,
  },
  previousMonthRef: {
    ...Typography.body.regular,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  previousMonthAmount: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.accentBright,
  },
  stepCta: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },

  // Step 2 styles
  sliderRow: {
    marginBottom: Spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sliderLabel: {
    ...Typography.body.regular,
    color: Colors.textPrimary,
  },
  sliderValues: {
    flexDirection: 'row',
  },
  sliderPercent: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.accentBright,
  },
  sliderDollar: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  sliderTrackContainer: {
    gap: Spacing.sm,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  sliderBtn: {
    width: 32,
    height: 32,
    borderRadius: Spacing.radiusSm,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderInput: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
    width: 48,
    height: 32,
    backgroundColor: Colors.bgCard,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  totalBar: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Spacing.radiusMd,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  totalBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  totalBarLabel: {
    ...Typography.heading.h3,
  },
  totalBarPercent: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 18,
    fontWeight: '500',
  },
  totalBarTrack: {
    height: 10,
    backgroundColor: Colors.bgElevated,
    borderRadius: 5,
    overflow: 'hidden',
  },
  totalBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  totalBarWarning: {
    ...Typography.body.small,
    color: Colors.negative,
    marginTop: Spacing.xs,
  },

  // Step 3 styles
  goalCard: {
    marginBottom: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalIndex: {
    ...Typography.heading.h3,
  },
  goalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  goalActionBtn: {
    width: 32,
    height: 32,
    borderRadius: Spacing.radiusSm,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalActionDisabled: {
    opacity: 0.4,
  },
  pausedBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.radiusSm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  pausedText: {
    ...Typography.label.card,
    color: Colors.warning,
  },
  goalFieldLabel: {
    ...Typography.caption.subLabel,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  goalTextInput: {
    ...Typography.body.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgElevated,
    borderRadius: Spacing.radiusSm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  goalNumericRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.md,
  },
  goalCurrency: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
  goalNumericInput: {
    flex: 1,
    fontFamily: 'DMMono_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  etaText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  etaValue: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 13,
    fontWeight: '500',
    color: Colors.accentBright,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  addGoalText: {
    ...Typography.body.regular,
    color: Colors.accentBright,
  },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
  },
  bottomNavSpacer: {
    flex: 1,
  },
});
