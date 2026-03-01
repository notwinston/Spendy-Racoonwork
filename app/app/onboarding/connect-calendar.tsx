import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

export default function ConnectCalendarScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="calendar" size={64} color={Colors.accent} style={styles.icon} />
        <Text style={styles.title}>Connect Your Calendar</Text>
        <Text style={styles.subtitle}>
          We'll analyze your schedule to predict upcoming expenses
        </Text>

        <View style={styles.options}>
          <Card style={styles.optionCard}>
            <Button
              title="Connect Google Calendar"
              onPress={() => router.push('/onboarding/connect-bank')}
            />
          </Card>

          <Card style={styles.optionCard}>
            <Button
              title="Upload .ics File"
              variant="secondary"
              onPress={() => router.push('/onboarding/connect-bank')}
            />
          </Card>

          <Card style={styles.optionCard}>
            <Button
              title="Use Demo Data"
              variant="outline"
              onPress={() => router.push('/onboarding/connect-bank')}
            />
          </Card>
        </View>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Button
          title="Skip for now"
          variant="outline"
          onPress={() => router.push('/onboarding/connect-bank')}
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
  options: {
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  optionCard: {
    padding: Spacing.md,
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
