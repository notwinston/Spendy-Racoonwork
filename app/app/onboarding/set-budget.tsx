import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';

export default function SetBudgetScreen() {
  const router = useRouter();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const handleComplete = () => {
    setOnboarded(true);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="pie-chart" size={64} color={Colors.accent} style={styles.icon} />
        <Text style={styles.title}>Set Your Budget</Text>
        <Text style={styles.subtitle}>
          Set a monthly spending target. You can always adjust it later.
        </Text>

        <View style={styles.budgetDisplay}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.amount}>1,000</Text>
          <Text style={styles.period}>/month</Text>
        </View>

        <Text style={styles.placeholder}>
          Category sliders will be added in the budget loop
        </Text>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Button title="Looks Good!" onPress={handleComplete} />
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
  icon: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  budgetDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: Spacing.xl,
  },
  currency: {
    fontSize: Typography.sizes['3xl'],
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  amount: {
    fontSize: Typography.sizes['5xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  period: {
    fontSize: Typography.sizes.lg,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
  placeholder: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
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
