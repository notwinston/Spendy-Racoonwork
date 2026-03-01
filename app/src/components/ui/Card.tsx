import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants';
import { GlassCard } from './GlassCard';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'solid' | 'glass';
}

export function Card({ children, style, variant = 'solid' }: CardProps) {
  if (variant === 'glass') {
    return <GlassCard style={style}>{children}</GlassCard>;
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
});
