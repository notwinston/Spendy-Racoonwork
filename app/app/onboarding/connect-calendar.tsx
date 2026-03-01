import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useCalendarStore } from '../../src/stores/calendarStore';
import { useAuthStore } from '../../src/stores/authStore';

export default function ConnectCalendarScreen() {
  const router = useRouter();
  const { loadDemoData, isLoading, events } = useCalendarStore();
  const user = useAuthStore((s) => s.user);
  const [isConnected, setIsConnected] = useState(false);

  const userId = user?.id ?? 'demo-user';

  const handleGoogleCalendar = () => {
    Alert.alert(
      'Google Calendar',
      'Real Google OAuth requires an EAS build. Would you like to load demo calendar data instead?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Demo Data',
          onPress: handleDemoData,
        },
      ],
    );
  };

  const handleICSUpload = () => {
    Alert.alert(
      'Upload .ics File',
      'File picker requires expo-document-picker to be configured. For now, you can use demo data to explore the app.',
      [
        { text: 'OK', style: 'default' },
      ],
    );
  };

  const handleDemoData = async () => {
    try {
      await loadDemoData(userId);
      setIsConnected(true);
    } catch {
      Alert.alert('Error', 'Failed to load demo data. Please try again.');
    }
  };

  const handleContinue = () => {
    router.push('/onboarding/connect-bank');
  };

  if (isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Ionicons
            name="checkmark-circle"
            size={64}
            color={Colors.positive}
            style={styles.icon}
          />
          <Text style={styles.title}>Calendar Connected!</Text>
          <Text style={styles.subtitle}>
            {events.length} events loaded. We'll use these to predict your spending.
          </Text>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.accent} />
              <Text style={styles.summaryText}>
                {events.length} calendar events imported
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.accent} />
              <Text style={styles.summaryText}>
                Categories detected automatically
              </Text>
            </View>
          </Card>

          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Button title="Continue" onPress={handleContinue} />
        </View>
      </SafeAreaView>
    );
  }

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
              onPress={handleGoogleCalendar}
              loading={isLoading}
            />
          </Card>

          <Card style={styles.optionCard}>
            <Button
              title="Upload .ics File"
              variant="secondary"
              onPress={handleICSUpload}
            />
          </Card>

          <Card style={styles.optionCard}>
            <Button
              title="Use Demo Data"
              variant="outline"
              onPress={handleDemoData}
              loading={isLoading}
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
          onPress={handleContinue}
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
  summaryCard: {
    marginBottom: Spacing['2xl'],
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
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
