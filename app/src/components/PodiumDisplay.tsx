import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing } from '../constants/spacing';

export interface PodiumEntry {
  displayName: string;
  avatarUrl?: string;
  xp: number;
  rank: number;
}

interface PodiumDisplayProps {
  top3: PodiumEntry[];
}

const PODIUM_CONFIG: Record<number, { height: number; color: string; label: string }> = {
  1: { height: 120, color: Colors.badgeGold, label: '1st' },
  2: { height: 100, color: Colors.badgeSilver, label: '2nd' },
  3: { height: 80, color: Colors.badgeBronze, label: '3rd' },
};

export function PodiumDisplay({ top3 }: PodiumDisplayProps) {
  if (top3.length === 0) return null;

  // Order: 2nd (left), 1st (center), 3rd (right)
  const ordered = [
    top3.find((e) => e.rank === 2),
    top3.find((e) => e.rank === 1),
    top3.find((e) => e.rank === 3),
  ];

  return (
    <View style={styles.container}>
      {ordered.map((entry, index) => {
        if (!entry) return <View key={index} style={styles.podiumSlot} />;
        const config = PODIUM_CONFIG[entry.rank] || PODIUM_CONFIG[3];
        // 2nd enters first (delay 100), 3rd next (delay 200), 1st enters last for drama (delay 400)
        const delays = [100, 400, 200];
        const delay = delays[index] ?? 100;

        return (
          <Animated.View
            key={entry.rank}
            style={styles.podiumSlot}
            entering={FadeIn.delay(delay).duration(400)}
          >
            {/* Avatar */}
            <View style={[styles.avatarCircle, { borderColor: config.color }]}>
              <Ionicons name="person" size={24} color={config.color} />
            </View>

            {/* Name + XP */}
            <Text style={styles.name} numberOfLines={1}>
              {entry.displayName}
            </Text>
            <Text style={[styles.xp, { color: config.color }]}>
              {entry.xp.toLocaleString()} XP
            </Text>

            {/* Podium block */}
            <View
              style={[
                styles.podiumBlock,
                {
                  height: config.height,
                  backgroundColor: config.color + '30',
                  borderColor: config.color,
                },
              ]}
            >
              <Text style={[styles.rankText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as '500',
    color: Colors.textPrimary,
    textAlign: 'center',
    maxWidth: 90,
  },
  xp: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as '600',
    marginBottom: Spacing.xs,
  },
  podiumBlock: {
    width: '80%',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as '700',
  },
});
