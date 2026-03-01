import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../src/constants';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';

export default function TransactionReviewScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Transaction</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.txnCard}>
          <Text style={styles.merchant}>Earls Kitchen + Bar</Text>
          <Text style={styles.amount}>$42.50</Text>
          <Text style={styles.date}>March 1, 2026</Text>
          <Text style={styles.account}>Checking ****1234</Text>
        </Card>

        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actions}>
          <Button title="Exclude" variant="secondary" onPress={() => {}} />
          <Button title="Split" variant="secondary" onPress={() => {}} />
          <Button title="Mark Recurring" variant="secondary" onPress={() => {}} />
          <Button title="Review Complete" onPress={() => router.back()} />
        </View>

        <Text style={styles.sectionTitle}>Category</Text>
        <Card>
          <Text style={styles.placeholder}>Category override picker placeholder</Text>
        </Card>

        <Text style={styles.sectionTitle}>Linked Event</Text>
        <Card>
          <Text style={styles.placeholder}>Linked calendar event placeholder</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  txnCard: {
    alignItems: 'center',
  },
  merchant: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  amount: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.danger,
    marginTop: Spacing.sm,
  },
  date: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  account: {
    fontSize: Typography.sizes.sm,
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
  actions: {
    gap: Spacing.md,
  },
  placeholder: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
