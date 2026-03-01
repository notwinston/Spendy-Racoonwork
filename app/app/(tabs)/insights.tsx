import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Insights" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Financial Health Score</Text>
          <Text style={styles.scoreGrade}>B</Text>
          <Text style={styles.scoreValue}>74 / 100</Text>
        </Card>

        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        <Card>
          <Text style={styles.placeholder}>5-component breakdown bars placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Spending Trends</Text>
        <Card>
          <Text style={styles.placeholder}>Trend chart with toggle placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <Card>
          <Text style={styles.placeholder}>Donut chart placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>AI Recommendations</Text>
        <Card>
          <Text style={styles.placeholder}>AI insight cards placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Savings Projection</Text>
        <Card>
          <Text style={styles.placeholder}>Compound growth curve placeholder</Text>
        </Card>
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
  scoreCard: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  scoreGrade: {
    fontSize: Typography.sizes['5xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.gradeB,
    marginTop: Spacing.sm,
  },
  scoreValue: {
    fontSize: Typography.sizes.lg,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  placeholder: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
