import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useCalendarStore } from '../stores/calendarStore';
import { ThemedAlert } from './ui/ThemedAlert';
import { useThemedAlert } from '../hooks/useThemedAlert';

interface CalendarConnectCardProps {
  userId: string;
}

function isEASBuild(): boolean {
  return Constants.appOwnership !== 'expo';
}

export default function CalendarConnectCard({ userId }: CalendarConnectCardProps) {
  const alert = useThemedAlert();
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasAutoDetected = useRef(false);

  const events = useCalendarStore((s) => s.events);
  const connectAppleCalendar = useCalendarStore((s) => s.connectAppleCalendar);
  const loadDemoData = useCalendarStore((s) => s.loadDemoData);

  const eventCount = events.length;

  // Auto-detect if events are already loaded
  useEffect(() => {
    if (eventCount > 0 && !hasAutoDetected.current && status === 'idle') {
      hasAutoDetected.current = true;
      setStatus('connected');
    }
  }, [eventCount]);

  const handleMockImport = async () => {
    setStatus('loading');
    await new Promise((r) => setTimeout(r, 1200));
    await loadDemoData(userId);
    if (useCalendarStore.getState().events.length > 0) {
      setStatus('connected');
    } else {
      setErrorMessage('Failed to load sample calendar data.');
      setStatus('error');
    }
  };

  const handleConnect = async () => {
    setStatus('loading');
    setErrorMessage(null);

    if (isEASBuild()) {
      try {
        await connectAppleCalendar(userId);
        if (useCalendarStore.getState().events.length > 0) {
          setStatus('connected');
        } else {
          setErrorMessage('No events found in your calendar.');
          setStatus('error');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to connect calendar.';
        if (msg.toLowerCase().includes('permission')) {
          setErrorMessage('Calendar permission is required. Please enable it in Settings.');
        } else {
          setErrorMessage(msg);
        }
        setStatus('error');
      }
    } else {
      alert.confirm(
        '"FutureSpend" Would Like to Access Your Calendar',
        'This will import your upcoming events to predict spending.',
        {
          cancelText: "Don't Allow",
          confirmText: 'Allow',
          onCancel: () => setStatus('idle'),
          onConfirm: () => {
            handleMockImport();
          },
        },
      );
    }
  };

  const handleResync = async () => {
    setStatus('loading');
    try {
      await loadDemoData(userId, 'marcus');
      setStatus('connected');
    } catch {
      setStatus('connected');
    }
  };

  // --- Connected state ---
  if (status === 'connected') {
    return (
      <>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.positive} />
            <Text style={styles.connectedLabel}>Connected</Text>
            <Text style={styles.eventCountText}>
              {eventCount} event{eventCount !== 1 ? 's' : ''} imported
            </Text>
            <Button title="Sync" variant="ghost" onPress={handleResync} />
          </View>
        </Card>
        <ThemedAlert {...alert.alertProps} />
      </>
    );
  }

  // --- Loading state ---
  if (status === 'loading') {
    return (
      <>
        <Card style={styles.card}>
          <View style={styles.row}>
            <ActivityIndicator size="small" color={Colors.accentBright} />
            <Text style={styles.loadingText}>Importing calendar events...</Text>
          </View>
        </Card>
        <ThemedAlert {...alert.alertProps} />
      </>
    );
  }

  // --- Error state ---
  if (status === 'error') {
    return (
      <>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="alert-circle" size={20} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
          <Button title="Retry" variant="secondary" onPress={handleConnect} />
        </Card>
        <ThemedAlert {...alert.alertProps} />
      </>
    );
  }

  // --- Idle state ---
  return (
    <>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={24} color={Colors.accentBright} />
          <View style={styles.textGroup}>
            <Text style={styles.title}>Apple Calendar</Text>
            <Text style={styles.subtitle}>Import your events to predict spending</Text>
          </View>
          <Button title="Connect" variant="primary" onPress={handleConnect} />
        </View>
      </Card>
      <ThemedAlert {...alert.alertProps} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  connectedLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.positive,
  },
  eventCountText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.danger,
  },
});
