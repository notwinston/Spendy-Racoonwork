import React from 'react';
import {
  TouchableOpacity,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gradient';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  // Gradient variant uses Pressable + Reanimated
  if (variant === 'gradient') {
    return (
      <GradientButton
        title={title}
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        style={style}
      />
    );
  }

  // Map 'outline' to 'secondary' for backwards compat
  const resolvedVariant = variant === 'outline' ? 'secondary' : variant;

  const buttonStyles = [
    styles.button,
    resolvedVariant === 'primary' && styles.primary,
    resolvedVariant === 'secondary' && styles.secondary,
    resolvedVariant === 'ghost' && styles.ghost,
    resolvedVariant === 'danger' && styles.danger,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    resolvedVariant === 'primary' && styles.primaryText,
    resolvedVariant === 'secondary' && styles.secondaryText,
    resolvedVariant === 'ghost' && styles.ghostText,
    resolvedVariant === 'danger' && styles.dangerText,
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

function GradientButton({
  title,
  onPress,
  loading,
  disabled,
  style,
}: Omit<ButtonProps, 'variant'>) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={['#00D09C', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, styles.gradientInner, style]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.textPrimary} />
        ) : (
          <Text style={[styles.text, styles.gradientText]}>{title}</Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: Colors.accentBright,
    shadowColor: Colors.glowTeal,
    shadowRadius: 12,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
  },
  secondary: {
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: Colors.accentGlow,
  },
  ghostText: {
    color: Colors.textSecondary,
  },
  dangerText: {
    color: Colors.negative,
  },
  disabledText: {
    color: Colors.textMuted,
  },
  gradientInner: {
    shadowColor: Colors.glowTeal,
    shadowRadius: 12,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
  },
  gradientText: {
    color: '#FFFFFF',
  },
});
