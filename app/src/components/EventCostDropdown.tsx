import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import type { EventCostBreakdown, HiddenCostTier } from '../types';

const TIER_COLORS: Record<HiddenCostTier, string> = {
  likely: Colors.positive,
  possible: Colors.warning,
  unlikely_costly: Colors.danger,
};

function getConfidenceLabel(score: number): string {
  if (score >= 0.7) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}

function getConfidenceColor(score: number): string {
  if (score >= 0.7) return Colors.positive;
  if (score >= 0.4) return Colors.warning;
  return Colors.danger;
}

const SIGNAL_SOURCE_LABELS: Record<string, string> = {
  historical: 'your spending history',
  metadata: 'event details',
  social: 'social patterns',
  seasonal: 'seasonal trends',
};

interface EventCostDropdownProps {
  breakdown: EventCostBreakdown;
  isExpanded: boolean;
  onToggle: () => void;
  onConfirm: () => void;
  onDismissCost: (costId: string) => void;
  isConfirmed: boolean;
}

export default function EventCostDropdown({
  breakdown,
  isExpanded,
  onToggle,
  onConfirm,
  onDismissCost,
  isConfirmed,
}: EventCostDropdownProps) {
  if (!isExpanded) return null;

  const activeCosts = breakdown.hidden_costs.filter((c) => !c.is_dismissed);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.container}
    >
      {/* Base prediction row */}
      <View style={styles.row}>
        <Ionicons name="wallet-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.rowLabel}>Expected cost</Text>
        <Text style={styles.rowAmount}>
          ${breakdown.base_prediction.predicted_amount.toFixed(0)}
        </Text>
      </View>

      {/* Hidden costs section */}
      {activeCosts.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.warning} />
            <Text style={styles.sectionHeaderText}>Potential unexpected costs</Text>
          </View>

          {activeCosts.map((cost) => {
            const confidenceLabel = getConfidenceLabel(cost.confidence_score);
            const confidenceColor = getConfidenceColor(cost.confidence_score);
            const signalLabel =
              SIGNAL_SOURCE_LABELS[cost.signal_source] ?? cost.signal_source;

            return (
              <View key={cost.id} style={styles.costItem}>
                <View style={styles.costItemHeader}>
                  <View
                    style={[
                      styles.tierDot,
                      { backgroundColor: TIER_COLORS[cost.tier] },
                    ]}
                  />
                  <Text style={styles.costLabel}>{cost.label}</Text>
                  <Text style={styles.costAmount}>
                    ${cost.predicted_amount.toFixed(0)}
                  </Text>
                </View>

                <View style={styles.costMeta}>
                  <Text style={[styles.confidenceBadge, { color: confidenceColor }]}>
                    {confidenceLabel}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onDismissCost(cost.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {cost.description ? (
                  <Text style={styles.costDescription}>{cost.description}</Text>
                ) : null}

                <Text style={styles.signalSource}>
                  Based on {signalLabel} data
                </Text>
              </View>
            );
          })}
        </>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Total row */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Estimated total</Text>
        <Text style={styles.totalAmount}>
          ${breakdown.total_with_risk.toFixed(0)}
        </Text>
      </View>

      {/* Confirm button */}
      <TouchableOpacity
        style={[styles.confirmButton, isConfirmed && styles.confirmButtonDone]}
        onPress={onConfirm}
        disabled={isConfirmed}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.confirmButtonText,
            isConfirmed && styles.confirmButtonTextDone,
          ]}
        >
          {isConfirmed ? 'Confirmed \u2713' : 'Acknowledge Estimate'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glassBg,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  rowLabel: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  rowAmount: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionHeaderText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  costItem: {
    marginBottom: Spacing.md,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.divider,
  },
  costItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  costLabel: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  costAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  costMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingLeft: Spacing.lg,
  },
  confidenceBadge: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  costDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    paddingLeft: Spacing.lg,
  },
  signalSource: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    paddingLeft: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  confirmButton: {
    backgroundColor: Colors.accent,
    borderRadius: Spacing.radiusSm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  confirmButtonDone: {
    backgroundColor: Colors.bgElevated,
  },
  confirmButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  confirmButtonTextDone: {
    color: Colors.textMuted,
  },
});
