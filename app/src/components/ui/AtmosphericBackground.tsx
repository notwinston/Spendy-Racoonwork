import React, { ReactNode } from 'react';
import { View, StyleSheet, ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants';

type BackgroundVariant =
  | 'dashboard'
  | 'insights'
  | 'arena'
  | 'calendar'
  | 'plan'
  | 'onboarding'
  | 'default';

interface AtmosphericBackgroundProps {
  variant?: BackgroundVariant;
  children: ReactNode;
}

type GradientTuple = readonly [ColorValue, ColorValue, ...ColorValue[]];

const VARIANT_GRADIENTS: Record<BackgroundVariant, GradientTuple> = {
  dashboard: Colors.gradientDashboard as unknown as GradientTuple,
  insights: Colors.gradientInsights as unknown as GradientTuple,
  arena: Colors.gradientArena as unknown as GradientTuple,
  calendar: Colors.gradientCalendar as unknown as GradientTuple,
  plan: Colors.gradientPlan as unknown as GradientTuple,
  onboarding: Colors.gradientOnboarding as unknown as GradientTuple,
  default: Colors.gradientMeshPrimary as unknown as GradientTuple,
};

export function AtmosphericBackground({
  variant = 'default',
  children,
}: AtmosphericBackgroundProps) {
  const gradientColors = VARIANT_GRADIENTS[variant];

  return (
    <LinearGradient
      colors={gradientColors}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradient}
    >
      {/* Noise / grain overlay */}
      <View style={styles.noiseOverlay} pointerEvents="none" />
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.noiseOverlay,
  },
  safeArea: {
    flex: 1,
  },
});
