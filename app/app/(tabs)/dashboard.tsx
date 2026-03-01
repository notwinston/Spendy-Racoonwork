import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Dashboard" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>Monthly Budget</Text>
          <Text style={styles.heroAmount}>$340 left</Text>
          <Text style={styles.heroSub}>of $1,000 budget</Text>
          <Text style={styles.placeholder}>Trajectory chart placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Category Budgets</Text>
        <Card>
          <Text style={styles.placeholder}>Category circles placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Metrics</Text>
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Burn Rate</Text>
            <Text style={[styles.metricValue, { color: Colors.positive }]}>0.97x</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Health Score</Text>
            <Text style={[styles.metricValue, { color: Colors.info }]}>B — 74</Text>
          </Card>
        </View>
      </ScrollView>
      <FloatingChatButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  heroAmount: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  heroSub: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  placeholder: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.xs,
  },
});
