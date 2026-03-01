import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants';
import { AtmosphericBackground } from '../../src/components/ui/AtmosphericBackground';
import { GlassCard } from '../../src/components/ui/GlassCard';

export default function CircleDetailScreen() {
  const router = useRouter();
  return (
    <AtmosphericBackground variant="arena">
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Circle Detail</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
      </GlassCard>
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: Spacing.lg,
  },
  card: {
    marginHorizontal: Spacing.lg,
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
