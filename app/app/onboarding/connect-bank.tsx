import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { AtmosphericBackground } from '../../src/components/ui/AtmosphericBackground';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { ThemedAlert } from '../../src/components/ui/ThemedAlert';
import { useThemedAlert } from '../../src/hooks/useThemedAlert';

export default function ConnectBankScreen() {
  const alert = useThemedAlert();
  const router = useRouter();
  const {
    loadDemoData,
    connectBank,
    isLoading,
    transactions,
    recurringTransactions,
    plaidConnections,
  } = useTransactionStore();
  const user = useAuthStore((s) => s.user);
  const [isConnected, setIsConnected] = useState(false);

  const userId = user?.id ?? 'demo-user';

  const handleConnectBank = async () => {
    try {
      await connectBank(userId);
      alert.custom(
        'Bank Connected (Simulated)',
        'In production, this would open Plaid Link. Loading demo transactions to showcase the app.',
        [
          {
            text: 'Load Demo Transactions',
            onPress: handleDemoData,
          },
        ],
        'success',
      );
    } catch {
      alert.error('Error', 'Failed to connect bank. Please try again.');
    }
  };

  const handleDemoData = async () => {
    try {
      await loadDemoData(userId);
      setIsConnected(true);
    } catch {
      alert.error('Error', 'Failed to load demo data. Please try again.');
    }
  };

  const handleContinue = () => {
    router.push('/onboarding/set-budget');
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
          <Text style={styles.title}>Bank Connected!</Text>
          <Text style={styles.subtitle}>
            {transactions.length} transactions loaded and analyzed.
          </Text>

          <View style={styles.statsContainer}>
            <GlassCard style={styles.statCard}>
              <Text style={styles.statNumber}>{transactions.length}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Text style={styles.statNumber}>{recurringTransactions.length}</Text>
              <Text style={styles.statLabel}>Recurring</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Text style={styles.statNumber}>{plaidConnections.length}</Text>
              <Text style={styles.statLabel}>Accounts</Text>
            </GlassCard>
          </View>

          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>

          <Button title="Continue" variant="gradient" onPress={handleContinue} />
        </View>
        <ThemedAlert {...alert.alertProps} />
      </AtmosphericBackground>
    );
  }

  return (
    <AtmosphericBackground variant="onboarding">
      <View style={styles.content}>
        <Ionicons name="wallet" size={64} color={Colors.accentBright} style={styles.icon} />
        <Text style={styles.title}>Connect Your Bank</Text>
        <Text style={styles.subtitle}>
          Securely link your accounts to track real spending
        </Text>

        <View style={styles.shieldContainer}>
          <Ionicons name="shield-checkmark" size={48} color={Colors.accentBright} />
        </View>

        <View style={styles.badges}>
          <GlassCard intensity="subtle" style={styles.badge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.accentBright} />
            <Text style={styles.badgeText}>Bank-level encryption</Text>
          </GlassCard>
          <GlassCard intensity="subtle" style={styles.badge}>
            <Ionicons name="eye-off" size={16} color={Colors.accentBright} />
            <Text style={styles.badgeText}>Never stores credentials</Text>
          </GlassCard>
          <GlassCard intensity="subtle" style={styles.badge}>
            <Ionicons name="eye-outline" size={16} color={Colors.accentBright} />
            <Text style={styles.badgeText}>Read-Only Access</Text>
          </GlassCard>
        </View>

        <Button
          title="Connect Your Bank"
          variant="gradient"
          onPress={handleConnectBank}
          loading={isLoading}
          style={styles.button}
        />

        <View style={styles.demoRow}>
          <View style={{ flex: 1 }}>
            <Button
              title="Use Demo Data"
              variant="secondary"
              onPress={handleDemoData}
              loading={isLoading}
              style={styles.button}
            />
          </View>
          <View style={styles.sandboxLabel}>
            <Text style={styles.sandboxText}>Sandbox Data</Text>
          </View>
        </View>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Button
          title="Skip for now"
          variant="outline"
          onPress={handleContinue}
        />
      </View>
      <ThemedAlert {...alert.alertProps} />
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
  badges: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: 0,
  },
  badgeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  button: {
    marginBottom: Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing['2xl'],
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  statNumber: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
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
  shieldContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sandboxLabel: {
    backgroundColor: Colors.warning + '25',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  sandboxText: {
    fontSize: Typography.sizes.xs,
    color: Colors.warning,
    fontWeight: Typography.weights.semibold,
  },
});
