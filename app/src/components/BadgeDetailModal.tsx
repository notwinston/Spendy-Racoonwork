import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing } from '../constants/spacing';

export interface BadgeInfo {
  name: string;
  description: string;
  tier: string;
  icon?: string;
}

interface BadgeDetailModalProps {
  badge: BadgeInfo | null;
  earned: boolean;
  visible: boolean;
  onClose: () => void;
}

const TIER_COLORS: Record<string, string> = {
  bronze: Colors.badgeBronze,
  silver: Colors.badgeSilver,
  gold: Colors.badgeGold,
  diamond: Colors.badgeDiamond,
};

export function BadgeDetailModal({ badge, earned, visible, onClose }: BadgeDetailModalProps) {
  if (!badge) return null;

  const tierColor = TIER_COLORS[badge.tier] || Colors.textMuted;
  const iconName = (badge.icon as keyof typeof Ionicons.glyphMap) || (earned ? 'trophy' : 'medal');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={[styles.content, { borderColor: tierColor }]}>
          {/* Badge icon */}
          <View style={[styles.iconContainer, { borderColor: tierColor }]}>
            <Ionicons name={iconName} size={60} color={tierColor} />
          </View>

          {/* Badge name */}
          <Text style={styles.badgeName}>{badge.name}</Text>

          {/* Tier label */}
          <View style={[styles.tierPill, { backgroundColor: tierColor + '25' }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>
              {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{badge.description}</Text>

          {/* Earned status */}
          {earned ? (
            <View style={styles.earnedRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.positive} />
              <Text style={styles.earnedText}>Earned</Text>
            </View>
          ) : (
            <View style={styles.lockedRow}>
              <Ionicons name="lock-closed" size={20} color={Colors.textMuted} />
              <Text style={styles.lockedText}>Locked - Keep progressing to unlock!</Text>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  content: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 2,
    padding: Spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  badgeName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  tierPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  tierText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as '600',
  },
  description: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  earnedText: {
    fontSize: Typography.sizes.md,
    color: Colors.positive,
    fontWeight: Typography.weights.medium as '500',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  lockedText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium as '500',
    flex: 1,
  },
  closeButton: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium as '500',
  },
});
