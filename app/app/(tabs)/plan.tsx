import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';

export default function PlanScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Plan" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Upcoming Predictions</Text>
        <Card>
          <Text style={styles.placeholder}>Predicted spending events placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Budget Tools</Text>
        <Card>
          <Text style={styles.placeholder}>Budget adjustment tools placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Save the Difference</Text>
        <Card>
          <Text style={styles.placeholder}>Savings rules config placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Recurring Expenses</Text>
        <Card>
          <Text style={styles.placeholder}>Recurring charges list placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Transaction Review</Text>
        <Card>
          <Text style={styles.placeholder}>Unreviewed transactions queue placeholder</Text>
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
