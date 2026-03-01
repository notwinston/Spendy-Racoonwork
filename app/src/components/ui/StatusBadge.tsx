import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: 'rgba(34,197,94,0.15)', text: Colors.positive },
  warning: { bg: 'rgba(255,217,61,0.15)', text: Colors.warningYellow },
  danger: { bg: 'rgba(255,107,107,0.15)', text: Colors.destructiveRed },
  info: { bg: 'rgba(59,130,246,0.15)', text: Colors.info },
  neutral: { bg: 'rgba(136,153,170,0.15)', text: Colors.textSecondary },
};

export function StatusBadge({
  label,
  variant = 'neutral',
  size = 'md',
}: StatusBadgeProps) {
  const colors = VARIANT_COLORS[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingVertical: isSmall ? 2 : Spacing.xs,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: isSmall ? Typography.sizes.xs : Typography.sizes.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: Typography.weights.semibold,
  },
});
