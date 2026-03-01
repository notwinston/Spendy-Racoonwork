import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants';
import { GlassCard } from './ui/GlassCard';
import { RANK_TIERS, calculateRankTier } from '../stores/gamificationStore';

interface RankCardProps {
  savingsRate: number; // 0-100
}

export function RankCard({ savingsRate }: RankCardProps) {
  const tier = calculateRankTier(savingsRate);

  // Find next tier
  const currentIndex = RANK_TIERS.findIndex((t) => t.name === tier.name);
  const nextTier = currentIndex < RANK_TIERS.length - 1 ? RANK_TIERS[currentIndex + 1] : null;

  // Progress within current tier
  const tierRange = tier.maxRate - tier.minRate;
  const progressInTier = tierRange > 0 ? ((savingsRate - tier.minRate) / tierRange) * 100 : 100;

  return (
    <GlassCard style={styles.card} accentEdge="left" accentColor={tier.color}>
      <View style={styles.tierRow}>
        <Text style={styles.tierBadge}>{tier.badge}</Text>
        <View style={styles.tierInfo}>
          <Text style={[styles.tierName, { color: tier.color }]}>
            {tier.name}
          </Text>
          <Text style={styles.tierLabel}>{tier.label}</Text>
        </View>
      </View>

      {/* Savings Rate Display */}
      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Your savings rate</Text>
        <Text style={styles.rateValue}>{savingsRate.toFixed(1)}%</Text>
      </View>

      {/* Progress Bar to Next Tier */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progressInTier, 100)}%`,
                backgroundColor: tier.color,
              },
            ]}
          />
        </View>
      </View>

      {/* Next Tier Info */}
      {nextTier ? (
        <Text style={styles.nextTierText}>
          Next tier: <Text style={[styles.nextTierName, { color: nextTier.color }]}>{nextTier.name}</Text> at{' '}
          <Text style={styles.nextTierRate}>{nextTier.minRate}%</Text> savings rate
        </Text>
      ) : (
        <Text style={styles.nextTierText}>
          You have reached the highest tier!
        </Text>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tierBadge: {
    fontSize: 36,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  tierLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rateLabel: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
  },
  rateValue: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextTierText: {
    ...Typography.body.small,
    color: Colors.textMuted,
  },
  nextTierName: {
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
  nextTierRate: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
