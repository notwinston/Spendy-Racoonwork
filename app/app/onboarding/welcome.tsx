import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';

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

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnims = useRef(features.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = fadeAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 200,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(200, animations).start();
  }, [fadeAnims]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>FutureSpend</Text>
        <Text style={styles.tagline}>See Tomorrow, Save Today, Share Success</Text>

        <View style={styles.features}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.title}
              style={[
                styles.feature,
                {
                  opacity: fadeAnims[index],
                  transform: [
                    {
                      translateY: fadeAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={feature.icon} size={24} color={Colors.accent} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
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
          onPress={() => router.push('/onboarding/connect-calendar')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  logo: {
    fontSize: Typography.sizes['5xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
    textAlign: 'center',
  },
  tagline: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  features: {
    gap: Spacing.xl,
    marginBottom: Spacing['3xl'],
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
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accent,
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
    backgroundColor: Colors.accent,
    width: 24,
  },
});
