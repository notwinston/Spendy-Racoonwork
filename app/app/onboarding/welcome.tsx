import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { AtmosphericBackground } from '../../src/components/ui/AtmosphericBackground';
import { GlassCard } from '../../src/components/ui/GlassCard';

const features = [
  {
    icon: 'calendar' as const,
    title: 'Calendar Intelligence',
    description: 'Predict spending from your schedule',
  },
  {
    icon: 'trending-up' as const,
    title: 'Smart Predictions',
    description: 'AI-powered spending forecasts',
  },
  {
    icon: 'trophy' as const,
    title: 'Social Savings',
    description: 'Gamify saving with friends',
  },
];

function GlowingLogo() {
  const glowOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1.0, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glowOpacity]);

  const animatedGlow = useAnimatedStyle(() => ({
    textShadowColor: Colors.glowTeal,
    textShadowRadius: 25,
    textShadowOffset: { width: 0, height: 0 },
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.logoContainer}>
      {/* Shadow layer for glow effect */}
      <Animated.Text style={[styles.logo, styles.logoGlow, animatedGlow]}>
        FutureSpend
      </Animated.Text>
      {/* Foreground text */}
      <Text style={styles.logo}>FutureSpend</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <AtmosphericBackground variant="onboarding">
      <View style={styles.content}>
        <GlowingLogo />

        <Animated.Text entering={FadeIn.delay(500)} style={styles.tagline}>
          See Tomorrow, Save Today, Share Success
        </Animated.Text>

        <View style={styles.features}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeIn.delay(700 + index * 100)}
            >
              <GlassCard style={styles.featureCard}>
                <View style={styles.feature}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={feature.icon} size={24} color={Colors.accentBright} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          ))}
        </View>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Button
          title="Get Started"
          variant="gradient"
          onPress={() => router.push('/onboarding/connect-calendar')}
        />
      </View>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: '40%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 48,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  logoGlow: {
    position: 'absolute',
  },
  tagline: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  features: {
    gap: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  featureCard: {
    padding: 0,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 208, 156, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  featureDescription: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  dotActive: {
    backgroundColor: Colors.accentBright,
    width: 24,
    shadowColor: Colors.glowTeal,
    shadowRadius: 6,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  },
});
