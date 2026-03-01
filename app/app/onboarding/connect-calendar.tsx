import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { AtmosphericBackground } from '../../src/components/ui/AtmosphericBackground';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useCalendarStore } from '../../src/stores/calendarStore';
import { useAuthStore } from '../../src/stores/authStore';

export default function ConnectCalendarScreen() {
  const router = useRouter();
  const { loadDemoData, connectAppleCalendar, isLoading, events } =
    useCalendarStore();
  const user = useAuthStore((s) => s.user);
  const [isConnected, setIsConnected] = useState(false);

  const userId = user?.id ?? 'demo-user';

  const handleAppleCalendar = async () => {
    try {
      await connectAppleCalendar(userId);
      await loadDemoData(userId);
      setIsConnected(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('permission denied')) {
        Alert.alert(
          'Permission Required',
          'Please allow calendar access in Settings to connect your Apple Calendar.',
        );
      } else {
        Alert.alert('Error', `Failed to connect Apple Calendar: ${message}`);
      }
    }
  };

  const handleGoogleCalendar = async () => {
    Alert.alert(
      'Google Calendar',
      'Real Google OAuth requires an EAS build. Connecting with demo data for now.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await loadDemoData(userId);
              setIsConnected(true);
            } catch {
              Alert.alert('Error', 'Failed to load calendar data. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleICSUpload = () => {
    Alert.alert(
      'Upload .ics File',
      'File picker requires expo-document-picker to be configured. Connecting with demo data for now.',
      [
        {
          text: 'OK',
          onPress: async () => {
            try {
              await loadDemoData(userId);
              setIsConnected(true);
            } catch {
              Alert.alert('Error', 'Failed to load calendar data. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleContinue = async () => {
    try {
      await loadDemoData(userId);
    } catch {
      // Silently continue even if demo data fails
    }
    router.push('/onboarding/connect-bank');
  };

  if (isConnected) {
    return (
      <AtmosphericBackground variant="onboarding">
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

          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.accentBright} />
              <Text style={styles.summaryText}>
                {events.length} calendar events imported
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.accentBright} />
              <Text style={styles.summaryText}>
                Categories detected automatically
              </Text>
            </View>
          </GlassCard>

          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Button title="Continue" variant="gradient" onPress={handleContinue} />
        </View>
      </AtmosphericBackground>
    );
  }

  return (
    <AtmosphericBackground variant="onboarding">
      <View style={styles.content}>
        <Ionicons name="calendar" size={64} color={Colors.accentBright} style={styles.icon} />
        <Text style={styles.title}>Connect Your Calendar</Text>
        <Text style={styles.subtitle}>
          We'll analyze your schedule to predict upcoming expenses
        </Text>

        <View style={styles.options}>
          <GlassCard accentEdge="left" accentColor="#FF3B30" style={styles.optionCard}>
            <Button
              title="Connect Apple Calendar"
              variant="gradient"
              onPress={handleAppleCalendar}
              loading={isLoading}
            />
          </GlassCard>

          <GlassCard accentEdge="left" accentColor="#4285F4" style={styles.optionCard}>
            <Button
              title="Connect Google Calendar"
              variant="secondary"
              onPress={handleGoogleCalendar}
              loading={isLoading}
            />
          </GlassCard>

          <GlassCard accentEdge="left" accentColor="#8B5CF6" style={styles.optionCard}>
            <Button
              title="Upload .ics File"
              variant="secondary"
              onPress={handleICSUpload}
            />
          </GlassCard>

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
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: Colors.accentBright,
    width: 24,
    shadowColor: Colors.glowTeal,
    shadowRadius: 6,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickStartBadge: {
    backgroundColor: Colors.accent + '25',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  quickStartText: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
});
