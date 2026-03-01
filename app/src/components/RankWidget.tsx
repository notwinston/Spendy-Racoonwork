import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '../constants';
import { GlassCard } from './ui/GlassCard';

interface RankWidgetProps {
  percentile?: number;
  streak?: number;
  comparisonCategory?: string;
  comparisonPercentage?: number;
  monthLabel?: string;
}

export function RankWidget({
  percentile = 23,
  streak = 14,
  comparisonCategory = 'dining',
  comparisonPercentage = 18,
  monthLabel,
}: RankWidgetProps) {
  return (
    <GlassCard style={styles.card}>
      {/* Percentile */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>YOUR RANKING</Text>
        <Text style={styles.percentileText}>
          You're in the top{' '}
          <Text style={styles.percentileValue}>{percentile}%</Text>
          {' '}of savers {monthLabel ? `in ${monthLabel}` : 'this month'}
        </Text>

        {/* Percentile bar */}
        <View style={styles.barContainer}>
          <View style={styles.barTrack}>
            <LinearGradient
              colors={['#00D09C', Colors.accentBright]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.barFill,
                { width: `${100 - percentile}%` },
              ]}
            />
            <View
              style={[
                styles.barMarker,
                { left: `${100 - percentile}%` },
              ]}
            />
          </View>
          <View style={styles.barLabels}>
            <Text style={styles.barLabel}>Top</Text>
            <Text style={styles.barLabel}>Bottom</Text>
          </View>
        </View>
      </View>

      {/* Streak */}
      <View style={styles.divider} />
      <View style={styles.streakRow}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakText}>
          <Text style={styles.streakValue}>{streak}</Text>
          -day streak under budget
        </Text>
      </View>

      {/* Comparison */}
      <View style={styles.divider} />
      <Text style={styles.comparisonText}>
        Your {comparisonCategory} spend is{' '}
        <Text style={styles.comparisonValue}>{comparisonPercentage}% lower</Text>
        {' '}than similar users
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.label.card,
    marginBottom: Spacing.sm,
  },
  percentileText: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
  },
  percentileValue: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accentBright,
  },
  barContainer: {
    marginTop: Spacing.md,
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  barMarker: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accentGlow,
    borderWidth: 2,
    borderColor: Colors.bgCard,
    marginLeft: -8,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  barLabel: {
    ...Typography.caption.meta,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.md,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakText: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
  },
  streakValue: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.positive,
  },
  comparisonText: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
  },
  comparisonValue: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.positive,
  },
});
