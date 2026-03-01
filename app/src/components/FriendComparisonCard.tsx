import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants';
import { Card } from './ui/Card';
import type { Profile } from '../types';
import { calculateRankTier } from '../stores/gamificationStore';

interface MyStats {
  healthScore: number | null;
  savingsRate: number;
  streakCount: number;
  level: number;
  xp: number;
}

interface FriendComparisonCardProps {
  myStats: MyStats;
  friendProfile: Profile;
}

function deriveSavingsRate(healthScore: number | null): number {
  if (healthScore == null) return 0;
  return Math.min(50, Math.round((healthScore / 100) * 30 * 10) / 10);
}

function StatRow({
  label,
  myValue,
  friendValue,
}: {
  label: string;
  myValue: string;
  friendValue: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statValue}>{myValue}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{friendValue}</Text>
    </View>
  );
}

export function FriendComparisonCard({ myStats, friendProfile }: FriendComparisonCardProps) {
  const myTier = calculateRankTier(myStats.savingsRate);
  const friendSavingsRate = deriveSavingsRate(friendProfile.financial_health_score);
  const friendTier = calculateRankTier(friendSavingsRate);

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerName}>You</Text>
        <Text style={styles.headerTitle}>vs</Text>
        <Text style={styles.headerName}>{friendProfile.display_name}</Text>
      </View>

      {/* Rank Badges */}
      <View style={styles.rankRow}>
        <Text style={styles.rankBadge}>
          {myTier.badge} {myTier.name}
        </Text>
        <Text style={styles.rankLabel}>Rank</Text>
        <Text style={styles.rankBadge}>
          {friendTier.badge} {friendTier.name}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Stats */}
      <StatRow
        label="Health Score"
        myValue={myStats.healthScore != null ? `${myStats.healthScore}` : '\u2014'}
        friendValue={friendProfile.financial_health_score != null ? `${friendProfile.financial_health_score}` : '\u2014'}
      />
      <StatRow
        label="Savings Rate"
        myValue={`${myStats.savingsRate}%`}
        friendValue={`${friendSavingsRate}%`}
      />
      <StatRow
        label="Streak"
        myValue={`${myStats.streakCount}d`}
        friendValue={`${friendProfile.streak_count}d`}
      />
      <StatRow
        label="Level"
        myValue={`${myStats.level}`}
        friendValue={`${friendProfile.level}`}
      />
      <StatRow
        label="XP"
        myValue={myStats.xp.toLocaleString()}
        friendValue={friendProfile.xp.toLocaleString()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginHorizontal: Spacing.sm,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rankBadge: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
    flex: 1,
    textAlign: 'center',
  },
  rankLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginHorizontal: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
});
