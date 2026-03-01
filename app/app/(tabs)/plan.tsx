import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { HiddenCostBreakdown } from '../../src/components/HiddenCostBreakdown';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { BudgetAdjustmentCard } from '../../src/components/BudgetAdjustmentCard';
import { GoalEditor } from '../../src/components/GoalEditor';
import { useCalendarStore } from '../../src/stores/calendarStore';
import { usePredictionStore } from '../../src/stores/predictionStore';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useBudgetStore } from '../../src/stores/budgetStore';
import {
  captureReceipt,
  pickReceiptFromGallery,
  parseReceiptWithGemini,
  parseReceiptMock,
} from '../../src/services/receiptService';
import type {
  CalendarEvent,
  SpendingPrediction,
  EventCategory,
  ParsedReceipt,
} from '../../src/types';

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

// FREQUENCY_LABELS removed - recurring expenses section moved to Insights

function getConfidenceColor(label: string): string {
  switch (label) {
    case 'high':
      return Colors.positive;
    case 'medium':
      return Colors.warning;
    case 'low':
      return Colors.danger;
    default:
      return Colors.textMuted;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default function PlanScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { events, loadDemoData: loadCalendarDemo } = useCalendarStore();
  const {
    predictions,
    generatePredictions,
    isPredicting,
    eventCostBreakdowns,
    dismissHiddenCost,
  } = usePredictionStore();
  const {
    transactions,
    loadDemoData: loadTransactionDemo,
  } = useTransactionStore();
  const { totalBudget, totalSpent } = useBudgetStore();

  // GoalEditor modal state
  const [goalEditorVisible, setGoalEditorVisible] = useState(false);

  // Savings rules local state
  const [roundUpEnabled, setRoundUpEnabled] = useState(false);
  const [saveDifferenceEnabled, setSaveDifferenceEnabled] = useState(false);
  const [monthlySavingsGoal] = useState(200);

  // Guard against re-fetching predictions on every tab switch
  const hasFetchedPredictions = useRef(false);

  // Receipt scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);

  const handleScanReceipt = useCallback(async (fromGallery: boolean) => {
    setIsScanning(true);
    setParsedReceipt(null);
    try {
      const base64 = fromGallery
        ? await pickReceiptFromGallery()
        : await captureReceipt();

      let receipt: ParsedReceipt;
      try {
        receipt = await parseReceiptWithGemini(base64);
      } catch (parseError) {
        console.warn('Gemini receipt parsing failed, falling back to mock:', parseError);
        receipt = parseReceiptMock();
      }
      setParsedReceipt(receipt);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message !== 'Cancelled') {
        Alert.alert('Scan Error', message);
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleSaveReceipt = useCallback(async () => {
    if (!parsedReceipt || !user?.id) return;
    setIsSavingReceipt(true);
    try {
      const accountId = useTransactionStore.getState().accounts[0]?.id ?? 'manual';
      await useTransactionStore.getState().createFromReceipt(
        user.id,
        accountId,
        parsedReceipt,
      );
      setParsedReceipt(null);
      Alert.alert('Saved', 'Transaction created from receipt.');
    } catch {
      Alert.alert('Error', 'Failed to save receipt transaction.');
    } finally {
      setIsSavingReceipt(false);
    }
  }, [parsedReceipt, user?.id]);

  // Load demo data if needed
  useEffect(() => {
    if (events.length === 0 && user?.id) {
      loadCalendarDemo(user.id);
    }
  }, [user?.id, events.length, loadCalendarDemo]);

  useEffect(() => {
    if (transactions.length === 0 && user?.id) {
      loadTransactionDemo(user.id);
    }
  }, [user?.id, transactions.length, loadTransactionDemo]);

  // Generate predictions for future events (once per app session)
  useEffect(() => {
    if (hasFetchedPredictions.current) return;
    if (events.length > 0 && predictions.length === 0 && !isPredicting) {
      const futureEvents = events.filter(
        (e) => new Date(e.start_time) >= new Date()
      );
      if (futureEvents.length > 0) {
        hasFetchedPredictions.current = true;
        generatePredictions(futureEvents, user?.id);
      }
    }
  }, [events.length, predictions.length, isPredicting, generatePredictions, user?.id]);

  // Create prediction map
  const predictionMap = useMemo(() => {
    const map = new Map<string, SpendingPrediction>();
    for (const p of predictions) {
      map.set(p.calendar_event_id, p);
    }
    return map;
  }, [predictions]);

  // Create events map
  const eventsMap = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    for (const e of events) {
      map.set(e.id, e);
    }
    return map;
  }, [events]);

  // Upcoming predictions (future events with predictions, sorted by date)
  const upcomingPredictions = useMemo(() => {
    const now = new Date();
    const futureEvents = events
      .filter((e) => new Date(e.start_time) >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return futureEvents
      .map((event) => ({
        event,
        prediction: predictionMap.get(event.id),
      }))
      .filter((item) => item.prediction !== undefined)
      .slice(0, 10);
  }, [events, predictionMap]);

  // Total predicted upcoming spending
  const totalPredictedSpending = useMemo(() => {
    return upcomingPredictions.reduce(
      (sum, item) => sum + (item.prediction?.predicted_amount ?? 0),
      0
    );
  }, [upcomingPredictions]);

  // Unreviewed transactions count
  const unreviewedCount = useMemo(() => {
    return transactions.filter((t) => !t.reviewed).length;
  }, [transactions]);


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Plan" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* --- Upcoming Predictions --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Predictions</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        {upcomingPredictions.length > 0 && (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Predicted Upcoming Spend</Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(totalPredictedSpending)}
              </Text>
            </View>
            <Text style={styles.summarySubtext}>
              Based on {upcomingPredictions.length} upcoming events
            </Text>
          </Card>
        )}

        {upcomingPredictions.length === 0 ? (
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>
                {isPredicting
                  ? 'Generating predictions...'
                  : 'No upcoming predictions available'}
              </Text>
            </View>
          </Card>
        ) : (
          upcomingPredictions.map(({ event, prediction }) => {
            if (!prediction) return null;
            const iconName = CATEGORY_ICONS[prediction.predicted_category] ?? 'ellipsis-horizontal';
            return (
              <Card key={event.id} style={styles.predictionCard}>
                <View style={styles.predictionRow}>
                  <View style={styles.predictionIconWrap}>
                    <Ionicons
                      name={iconName as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={Colors.accent}
                    />
                  </View>
                  <View style={styles.predictionInfo}>
                    <Text style={styles.predictionTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.predictionDate}>
                      {formatDate(event.start_time)}
                    </Text>
                  </View>
                  <View style={styles.predictionRight}>
                    <Text style={styles.predictionAmount}>
                      {formatCurrency(prediction.predicted_amount)}
                    </Text>
                    <View style={styles.confidenceBarContainer}>
                      <View
                        style={[
                          styles.confidenceBarFill,
                          {
                            width: `${Math.round(prediction.confidence_score * 100)}%`,
                            backgroundColor: getConfidenceColor(prediction.confidence_label),
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.confidenceLabel,
                        { color: getConfidenceColor(prediction.confidence_label) },
                      ]}
                    >
                      {prediction.confidence_label}
                    </Text>
                  </View>
                </View>

                {/* Hidden Cost Breakdown */}
                {eventCostBreakdowns[prediction.calendar_event_id] && (
                  <HiddenCostBreakdown
                    eventCostBreakdown={eventCostBreakdowns[prediction.calendar_event_id]}
                    defaultExpanded={true}
                    onDismissCost={dismissHiddenCost}
                  />
                )}
              </Card>
            );
          })
        )}

        {/* --- Budget Planner --- */}
        <Text style={styles.sectionTitle}>Budget Planner</Text>
        <BudgetAdjustmentCard
          budget={totalBudget > 0 ? totalBudget : 2000}
          spent={totalSpent}
          remaining={Math.max(0, (totalBudget > 0 ? totalBudget : 2000) - totalSpent)}
        />

        {/* --- Scan a Receipt --- */}
        <Text style={styles.sectionTitle}>Scan a Receipt</Text>
        <Card>
          {isScanning ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.emptyStateText}>Analyzing receipt...</Text>
            </View>
          ) : parsedReceipt ? (
            <View style={styles.receiptResult}>
              <View style={styles.receiptHeader}>
                <Ionicons name="receipt-outline" size={24} color={Colors.accent} />
                <Text style={styles.receiptMerchant}>
                  {parsedReceipt.merchant_name}
                </Text>
              </View>
              <View style={styles.receiptDetails}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date</Text>
                  <Text style={styles.receiptValue}>{parsedReceipt.date}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Total</Text>
                  <Text style={styles.receiptTotal}>
                    {formatCurrency(parsedReceipt.total)}
                  </Text>
                </View>
                {parsedReceipt.tax != null && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Tax</Text>
                    <Text style={styles.receiptValue}>
                      {formatCurrency(parsedReceipt.tax)}
                    </Text>
                  </View>
                )}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Category</Text>
                  <Text style={styles.receiptValue}>{parsedReceipt.category}</Text>
                </View>
                {parsedReceipt.items.length > 0 && (
                  <View style={styles.receiptItems}>
                    <Text style={styles.receiptLabel}>Items</Text>
                    {parsedReceipt.items.map((item, i) => (
                      <Text key={i} style={styles.receiptItemText}>
                        {item.quantity}x {item.name} — {formatCurrency(item.price)}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.saveReceiptButton}
                onPress={handleSaveReceipt}
                disabled={isSavingReceipt}
              >
                {isSavingReceipt ? (
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.textPrimary} />
                    <Text style={styles.saveReceiptText}>Save Transaction</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.receiptButtons}>
              <TouchableOpacity
                style={styles.receiptButton}
                onPress={() => handleScanReceipt(false)}
              >
                <Ionicons name="camera" size={28} color={Colors.accent} />
                <Text style={styles.receiptButtonText}>Camera</Text>
              </TouchableOpacity>
              <View style={styles.receiptButtonDivider} />
              <TouchableOpacity
                style={styles.receiptButton}
                onPress={() => handleScanReceipt(true)}
              >
                <Ionicons name="images" size={28} color={Colors.accent} />
                <Text style={styles.receiptButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* --- Savings Rules --- */}
        <Text style={styles.sectionTitle}>Savings Rules</Text>
        <Card>
          <View style={styles.savingsGoalRow}>
            <Ionicons name="wallet-outline" size={20} color={Colors.accent} />
            <Text style={styles.savingsGoalLabel}>Monthly Savings Goal</Text>
            <Text style={styles.savingsGoalAmount}>{formatCurrency(monthlySavingsGoal)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="arrow-up-circle-outline" size={20} color={Colors.textSecondary} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>Round up transactions</Text>
                <Text style={styles.toggleDescription}>
                  Round each transaction to the nearest dollar and save the difference
                </Text>
              </View>
            </View>
            <Switch
              value={roundUpEnabled}
              onValueChange={setRoundUpEnabled}
              trackColor={{ false: Colors.cardBorder, true: Colors.accent + '66' }}
              thumbColor={roundUpEnabled ? Colors.accent : Colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="trending-down-outline" size={20} color={Colors.textSecondary} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>Save the difference</Text>
                <Text style={styles.toggleDescription}>
                  When you spend less than predicted, save the difference automatically
                </Text>
              </View>
            </View>
            <Switch
              value={saveDifferenceEnabled}
              onValueChange={setSaveDifferenceEnabled}
              trackColor={{ false: Colors.cardBorder, true: Colors.accent + '66' }}
              thumbColor={saveDifferenceEnabled ? Colors.accent : Colors.textMuted}
            />
          </View>
        </Card>

        {/* --- New Goal Button --- */}
        <TouchableOpacity
          style={styles.newGoalButton}
          onPress={() => setGoalEditorVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={22} color={Colors.textPrimary} />
          <Text style={styles.newGoalButtonText}>New Goal</Text>
        </TouchableOpacity>

        {/* --- Transaction Review Queue --- */}
        <Text style={styles.sectionTitle}>Transaction Review</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/transaction-review')}
        >
          <Card style={styles.reviewCard}>
            <View style={styles.reviewRow}>
              <View style={styles.reviewLeft}>
                <View style={styles.reviewIconWrap}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={Colors.accent} />
                </View>
                <View>
                  <Text style={styles.reviewTitle}>Review Transactions</Text>
                  <Text style={styles.reviewSubtext}>
                    {unreviewedCount > 0
                      ? `${unreviewedCount} transaction${unreviewedCount === 1 ? '' : 's'} to review`
                      : 'All transactions reviewed'}
                  </Text>
                </View>
              </View>
              {unreviewedCount > 0 && (
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewBadgeText}>{unreviewedCount}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>
      <GoalEditor
        visible={goalEditorVisible}
        onClose={() => setGoalEditorVisible(false)}
      />
      <FloatingChatButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  seeAllLink: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  // Summary Card
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  summaryAmount: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  summarySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  emptyStateText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // Prediction Cards
  predictionCard: {
    marginBottom: Spacing.sm,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  predictionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionInfo: {
    flex: 1,
  },
  predictionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  predictionDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  predictionRight: {
    alignItems: 'flex-end',
  },
  predictionAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  confidenceBarContainer: {
    width: 60,
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  // Savings Rules
  savingsGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  savingsGoalLabel: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  savingsGoalAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  toggleDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  // New Goal Button
  newGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accentBright,
    borderRadius: Spacing.radiusMd,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  newGoalButtonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // Transaction Review
  reviewCard: {
    marginBottom: Spacing.sm,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  reviewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  reviewSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reviewBadge: {
    backgroundColor: Colors.danger,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  // Receipt Scanning
  receiptButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  receiptButtonDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.divider,
  },
  receiptButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  receiptResult: {
    gap: Spacing.md,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  receiptMerchant: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  receiptDetails: {
    gap: Spacing.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  receiptValue: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  receiptTotal: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  receiptItems: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  receiptItemText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    paddingLeft: Spacing.sm,
  },
  saveReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  saveReceiptText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
});
