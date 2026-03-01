import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
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
});
