import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; bgEnd: string; text: string }> = {
  success: { bg: 'rgba(34,197,94,0.15)', bgEnd: 'rgba(34,197,94,0.08)', text: Colors.positive },
  warning: { bg: 'rgba(255,217,61,0.15)', bgEnd: 'rgba(255,217,61,0.08)', text: Colors.warningYellow },
  danger: { bg: 'rgba(255,107,107,0.15)', bgEnd: 'rgba(255,107,107,0.08)', text: Colors.destructiveRed },
  info: { bg: 'rgba(59,130,246,0.15)', bgEnd: 'rgba(59,130,246,0.08)', text: Colors.info },
  neutral: { bg: 'rgba(136,153,170,0.15)', bgEnd: 'rgba(136,153,170,0.08)', text: Colors.textSecondary },
};

const PULSING_VARIANTS: BadgeVariant[] = ['danger', 'warning'];

export function StatusBadge({
  label,
  variant = 'neutral',
  size = 'md',
}: StatusBadgeProps) {
  const colors = VARIANT_COLORS[variant];
  const isSmall = size === 'sm';
  const shouldPulse = PULSING_VARIANTS.includes(variant);

  const glowOpacity = useSharedValue(1);

  useEffect(() => {
    if (shouldPulse) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(1, { duration: 1500 }),
        ),
        -1,
      );
    }
  }, [shouldPulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: shouldPulse ? glowOpacity.value * 0.5 : 0,
  }));

  return (
    <Animated.View
      style={[
        styles.badgeOuter,
        {
          shadowColor: colors.text,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[colors.bg, colors.bgEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
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
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badgeOuter: {
    alignSelf: 'flex-start',
    borderRadius: 100,
  },
  badge: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  label: {
    fontWeight: Typography.weights.semibold,
  },
});
