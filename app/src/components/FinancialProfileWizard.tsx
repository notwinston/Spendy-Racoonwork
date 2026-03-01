import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useOptimizerStore } from '../stores/optimizerStore';
import type { FinancialProfile, IncomeFrequency, FixedBill, EventCategory } from '../types';
import { ThemedAlert } from './ui/ThemedAlert';
import { useThemedAlert } from '../hooks/useThemedAlert';

interface FinancialProfileWizardProps {
  visible: boolean;
  onClose: () => void;
}

const FREQUENCY_OPTIONS: { label: string; value: IncomeFrequency }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];

export function FinancialProfileWizard({ visible, onClose }: FinancialProfileWizardProps) {
  const alert = useThemedAlert();
  const { profile, setProfile } = useOptimizerStore();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Income
  const [incomeAmount, setIncomeAmount] = useState(profile?.incomeAmount?.toString() ?? '');
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>(
    profile?.incomeFrequency ?? 'biweekly',
  );
  const [nextPayDate, setNextPayDate] = useState(profile?.nextPayDate ?? '');

  // Step 2: Bills
  const [fixedBills, setFixedBills] = useState<FixedBill[]>(profile?.fixedBills ?? []);

  // Step 3: Savings & Buffer
  const [emergencyFundTarget, setEmergencyFundTarget] = useState(
    profile?.emergencyFundTarget?.toString() ?? '10000',
  );
  const [safetyBufferPercent, setSafetyBufferPercent] = useState(
    profile?.safetyBufferPercent?.toString() ?? '10',
  );

  const parsedIncome = parseFloat(incomeAmount) || 0;
  const parsedEmergency = parseFloat(emergencyFundTarget) || 0;
  const parsedBuffer = parseFloat(safetyBufferPercent) || 0;

  // Step navigation
  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      if (parsedIncome <= 0) {
        alert.error('Invalid Income', 'Please enter your income amount.');
        return;
      }
      if (!nextPayDate) {
        alert.error('Missing Pay Date', 'Please enter your next pay date (YYYY-MM-DD).');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  }, [currentStep, parsedIncome, nextPayDate]);

  const handleBack = useCallback(() => {
    if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
  }, [currentStep]);

  const handleSave = useCallback(() => {
    const newProfile: FinancialProfile = {
      incomeAmount: parsedIncome,
      incomeFrequency,
      nextPayDate,
      emergencyFundTarget: parsedEmergency,
      safetyBufferPercent: parsedBuffer,
      fixedBills,
    };
    setProfile(newProfile);
    handleClose();
  }, [parsedIncome, incomeFrequency, nextPayDate, parsedEmergency, parsedBuffer, fixedBills, setProfile]);

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    onClose();
  }, [onClose]);

  // Bill management
  const addBill = useCallback(() => {
    setFixedBills((prev) => [
      ...prev,
      { name: '', amount: 0, dayOfMonth: 1, category: 'bills' as EventCategory },
    ]);
  }, []);

  const updateBill = useCallback((index: number, updates: Partial<FixedBill>) => {
    setFixedBills((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...updates } : b)),
    );
  }, []);

  const removeBill = useCallback((index: number) => {
    setFixedBills((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const stepTitle =
    currentStep === 1 ? 'Income' : currentStep === 2 ? 'Fixed Bills' : 'Savings & Buffer';

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
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{stepTitle}</Text>
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
          {/* ========== STEP 1: Income ========== */}
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>INCOME PER PAYCHECK</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.largeInput}
                  value={incomeAmount}
                  onChangeText={(text) => setIncomeAmount(text.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>

              <Text style={styles.fieldLabel}>PAY FREQUENCY</Text>
              <View style={styles.frequencyRow}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.frequencyPill,
                      incomeFrequency === opt.value && styles.frequencyPillActive,
                    ]}
                    onPress={() => setIncomeFrequency(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        incomeFrequency === opt.value && styles.frequencyTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>NEXT PAY DATE</Text>
              <TextInput
                style={styles.textInput}
                value={nextPayDate}
                onChangeText={setNextPayDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          )}

          {/* ========== STEP 2: Fixed Bills ========== */}
          {currentStep === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepDescription}>
                Add your recurring fixed bills so we can account for them in your spendable budget.
              </Text>

              {fixedBills.map((bill, index) => (
                <Card key={index} style={styles.billCard}>
                  <View style={styles.billHeader}>
                    <Text style={styles.billIndex}>Bill {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeBill(index)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.negative} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.billFieldLabel}>Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bill.name}
                    onChangeText={(text) => updateBill(index, { name: text })}
                    placeholder="e.g., Rent"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <View style={styles.billRow}>
                    <View style={styles.billRowField}>
                      <Text style={styles.billFieldLabel}>Amount</Text>
                      <View style={styles.smallInputRow}>
                        <Text style={styles.smallCurrency}>$</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={bill.amount > 0 ? String(bill.amount) : ''}
                          onChangeText={(text) => {
                            const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                            updateBill(index, { amount: isNaN(num) ? 0 : num });
                          }}
                          placeholder="0"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <View style={styles.billRowField}>
                      <Text style={styles.billFieldLabel}>Day of Month</Text>
                      <TextInput
                        style={styles.textInput}
                        value={bill.dayOfMonth > 0 ? String(bill.dayOfMonth) : ''}
                        onChangeText={(text) => {
                          const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                          updateBill(index, {
                            dayOfMonth: isNaN(num) ? 1 : Math.min(31, Math.max(1, num)),
                          });
                        }}
                        placeholder="1"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>
                </Card>
              ))}

              <TouchableOpacity style={styles.addBillButton} onPress={addBill}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.accentBright} />
                <Text style={styles.addBillText}>Add a bill</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========== STEP 3: Savings & Buffer ========== */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepDescription}>
                Configure your emergency fund target and safety buffer to protect your finances.
              </Text>

              <Text style={styles.fieldLabel}>EMERGENCY FUND TARGET</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.largeInput}
                  value={emergencyFundTarget}
                  onChangeText={(text) =>
                    setEmergencyFundTarget(text.replace(/[^0-9.]/g, ''))
                  }
                  placeholder="10000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.fieldLabel}>SAFETY BUFFER</Text>
              <Text style={styles.fieldHint}>
                Percentage of income to reserve as a spending cushion
              </Text>
              <View style={styles.bufferRow}>
                <TextInput
                  style={styles.bufferInput}
                  value={safetyBufferPercent}
                  onChangeText={(text) =>
                    setSafetyBufferPercent(text.replace(/[^0-9.]/g, ''))
                  }
                  placeholder="10"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.bufferPercent}>%</Text>
              </View>

              {/* Summary */}
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Profile Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Income</Text>
                  <Text style={styles.summaryValue}>
                    ${parsedIncome.toLocaleString()} / {incomeFrequency}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fixed bills</Text>
                  <Text style={styles.summaryValue}>
                    {fixedBills.length} (${fixedBills.reduce((s, b) => s + b.amount, 0).toLocaleString()}/mo)
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Safety buffer</Text>
                  <Text style={styles.summaryValue}>{parsedBuffer}%</Text>
                </View>
              </Card>
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
              disabled={currentStep === 1 && (parsedIncome <= 0 || !nextPayDate)}
            />
          ) : (
            <Button title="Save Profile" onPress={handleSave} variant="primary" />
          )}
        </View>
        <ThemedAlert {...alert.alertProps} />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  stepLabel: {
    ...Typography.label.sectionDivider,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    marginTop: Spacing.xl,
  },
  stepDescription: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    ...Typography.label.sectionDivider,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  fieldHint: {
    ...Typography.body.small,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  inputRow: {
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
  largeInput: {
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
  textInput: {
    ...Typography.body.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgElevated,
    borderRadius: Spacing.radiusSm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  frequencyPill: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusMd,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  frequencyPillActive: {
    borderColor: Colors.accentBright,
    backgroundColor: Colors.bgHover,
  },
  frequencyText: {
    ...Typography.body.regular,
    color: Colors.textMuted,
  },
  frequencyTextActive: {
    color: Colors.accentBright,
    fontWeight: Typography.weights.semibold,
  },

  // Bill styles
  billCard: {
    marginBottom: Spacing.md,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  billIndex: {
    ...Typography.heading.h3,
  },
  billFieldLabel: {
    ...Typography.caption.subLabel,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  billRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  billRowField: {
    flex: 1,
  },
  smallInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.md,
  },
  smallCurrency: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
  smallInput: {
    flex: 1,
    fontFamily: 'DMMono_500Medium',
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  addBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  addBillText: {
    ...Typography.body.regular,
    color: Colors.accentBright,
  },

  // Buffer styles
  bufferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  bufferInput: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 28,
    fontWeight: '500',
    color: Colors.textPrimary,
    width: 80,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentBright,
    paddingVertical: Spacing.sm,
  },
  bufferPercent: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 28,
    fontWeight: '500',
    color: Colors.textMuted,
  },

  // Summary
  summaryCard: {
    marginTop: Spacing.xl,
  },
  summaryTitle: {
    ...Typography.heading.h3,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  summaryLabel: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
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
