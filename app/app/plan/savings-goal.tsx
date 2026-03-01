import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants';

export default function SavingsGoalScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Savings Goal</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  back: {
    fontSize: Typography.sizes.md,
    color: Colors.accent,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
  },
});
