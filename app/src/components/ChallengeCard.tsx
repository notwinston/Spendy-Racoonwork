import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { Card } from './ui/Card';
import type { Challenge } from '../types';

interface ChallengeCardProps {
  challenge: Challenge;
  participants: { user: string; friend: string };
  onJoin?: () => void;
}

export function ChallengeCard({ challenge, participants, onJoin }: ChallengeCardProps) {
  const isActive = challenge.starts_at != null && challenge.ends_at != null;
  const daysRemaining = isActive && challenge.ends_at
    ? Math.max(0, Math.ceil((new Date(challenge.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : challenge.duration_days;
  const progress = isActive
    ? Math.max(0, Math.min(1, 1 - daysRemaining / challenge.duration_days))
    : 0;

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flash" size={20} color={Colors.accent} />
        <Text style={styles.title}>{challenge.title}</Text>
      </View>

      {challenge.description && (
        <Text style={styles.description}>{challenge.description}</Text>
      )}

      {/* Participants */}
      <View style={styles.participantsRow}>
        <View style={styles.participant}>
          <Ionicons name="person" size={14} color={Colors.textSecondary} />
          <Text style={styles.participantName}>{participants.user}</Text>
        </View>
        <Text style={styles.vs}>vs</Text>
        <View style={styles.participant}>
          <Ionicons name="person" size={14} color={Colors.textSecondary} />
          <Text style={styles.participantName}>{participants.friend}</Text>
        </View>
      </View>

      {/* Progress */}
      {isActive && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.duration}>{challenge.duration_days} days</Text>
        <Text style={styles.reward}>{challenge.reward_xp} XP</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  description: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  participantName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  vs: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  progressSection: {
    marginVertical: Spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  duration: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  reward: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
  },
});
