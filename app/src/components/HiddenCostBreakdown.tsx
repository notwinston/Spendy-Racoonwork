import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import type { EventCostBreakdown, EventCategory, HiddenCost, HiddenCostTier } from '../types';

// ---- Tier mappings ----

const TIER_COLORS: Record<HiddenCostTier, string> = {
  likely: Colors.positive,
  possible: Colors.warning,
  unlikely_costly: Colors.danger,
};

const TIER_LABELS: Record<HiddenCostTier, string> = {
  likely: 'Likely',
  possible: 'Possible',
  unlikely_costly: 'Risk',
};

// ---- Props ----

interface HiddenCostBreakdownProps {
  eventCostBreakdown: EventCostBreakdown;
  defaultExpanded?: boolean;
  onDismissCost?: (costId: string) => void;
  onAdjustBudget?: (category: EventCategory, amount: number) => void;
  compact?: boolean;
}

// ---- Tier Dot with pulse animation ----

function TierDot({ tier, index }: { tier: HiddenCostTier; index: number }) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withTiming(1, { duration: 200 }),
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.tierDot,
        { backgroundColor: TIER_COLORS[tier] },
        animatedStyle,
      ]}
    />
  );
}

// ---- Hidden Cost Item ----

function HiddenCostItem({
  cost,
  index,
  onDismiss,
}: {
  cost: HiddenCost;
  index: number;
  onDismiss?: (costId: string) => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(200)}
      style={styles.costItem}
    >
      <View style={styles.costItemHeader}>
        <View style={styles.costItemLeft}>
          <TierDot tier={cost.tier} index={index} />
          <View style={styles.costItemText}>
            <Text style={styles.costLabel}>{cost.label}</Text>
            <Text style={styles.costTierLabel}>
              {TIER_LABELS[cost.tier]}
            </Text>
          </View>
        </View>
        <View style={styles.costItemRight}>
          <Text style={[styles.costAmount, { color: TIER_COLORS[cost.tier] }]}>
            +${cost.predicted_amount.toFixed(0)}
          </Text>
          {onDismiss && (
            <TouchableOpacity
              onPress={() => onDismiss(cost.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.dismissButton}
            >
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.costDescription}>{cost.description}</Text>
    </Animated.View>
  );
}

// ---- Main component ----

export function HiddenCostBreakdown({
  eventCostBreakdown,
  defaultExpanded = false,
  onDismissCost,
  onAdjustBudget,
  compact = false,
}: HiddenCostBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const visibleCosts = eventCostBreakdown.hidden_costs.filter(
    (c) => !c.is_dismissed,
  );

  if (visibleCosts.length === 0) return null;

  const totalHiddenAmount = visibleCosts.reduce(
    (sum, c) => sum + c.predicted_amount,
    0,
  );

  // Unique tiers present
  const tiers = [...new Set(visibleCosts.map((c) => c.tier))];

  // ---- Compact mode ----
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRow}>
          <View style={styles.compactLeft}>
            {tiers.map((tier, i) => (
              <TierDot key={tier} tier={tier} index={i} />
            ))}
            <Text style={styles.compactText}>
              +{visibleCosts.length} hidden costs (~${totalHiddenAmount.toFixed(0)})
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={Colors.textMuted}
          />
        </View>
      </View>
    );
  }

  // ---- Collapsed mode ----
  if (!isExpanded) {
    return (
      <TouchableOpacity
        onPress={() => setIsExpanded(true)}
        style={styles.collapsedContainer}
        activeOpacity={0.7}
      >
        <View style={styles.collapsedRow}>
          <View style={styles.collapsedLeft}>
            {tiers.map((tier, i) => (
              <TierDot key={tier} tier={tier} index={i} />
            ))}
            <Text style={styles.collapsedLabel}>
              Hidden Costs ({visibleCosts.length})
            </Text>
          </View>
          <View style={styles.collapsedRight}>
            <Text style={styles.collapsedAmount}>
              +${totalHiddenAmount.toFixed(0)}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.textMuted}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ---- Expanded mode ----
  const totalLow = visibleCosts.reduce((s, c) => s + c.amount_low, 0);
  const totalHigh = visibleCosts.reduce((s, c) => s + c.amount_high, 0);

  return (
    <View style={styles.expandedContainer}>
      <TouchableOpacity
        onPress={() => setIsExpanded(false)}
        style={styles.expandedHeader}
        activeOpacity={0.7}
      >
        <View style={styles.collapsedLeft}>
          {tiers.map((tier, i) => (
            <TierDot key={tier} tier={tier} index={i} />
          ))}
          <Text style={styles.collapsedLabel}>
            Hidden Costs ({visibleCosts.length})
          </Text>
        </View>
        <View style={styles.collapsedRight}>
          <Text style={styles.collapsedAmount}>
            +${totalHiddenAmount.toFixed(0)}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={Colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
      >
        <View style={styles.divider} />

        {visibleCosts.map((cost, index) => (
          <HiddenCostItem
            key={cost.id}
            cost={cost}
            index={index}
            onDismiss={onDismissCost}
          />
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Estimated Range</Text>
          <Text style={styles.totalAmount}>
            ${totalLow.toFixed(0)} – ${totalHigh.toFixed(0)}
          </Text>
        </View>

        {eventCostBreakdown.historical_avg != null && (
          <View style={styles.historicalRow}>
            <Text style={styles.historicalLabel}>Historical Avg</Text>
            <Text style={styles.historicalAmount}>
              ${eventCostBreakdown.historical_avg.toFixed(0)}
            </Text>
          </View>
        )}

        {onAdjustBudget && (
          <TouchableOpacity
            onPress={() =>
              onAdjustBudget(
                eventCostBreakdown.base_prediction.predicted_category,
                eventCostBreakdown.total_with_risk,
              )
            }
            style={styles.adjustButton}
            activeOpacity={0.7}
          >
            <Ionicons name="wallet-outline" size={14} color={Colors.accent} />
            <Text style={styles.adjustButtonText}>Adjust Budget</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  // Compact
  compactContainer: {
    paddingVertical: Spacing.xs,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  compactText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },

  // Collapsed
  collapsedContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  collapsedLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },
  collapsedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  collapsedAmount: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.warning,
  },

  // Expanded
  expandedContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },

  // Cost item
  costItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  costItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  costItemText: {
    marginLeft: Spacing.sm,
  },
  costLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  costTierLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  costItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  costAmount: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  costDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.lg + Spacing.sm,
  },
  dismissButton: {
    padding: Spacing.xs,
  },

  // Tier dot
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Totals
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  historicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  historicalLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  historicalAmount: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },

  // Adjust budget button
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  adjustButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.accent,
  },
});
