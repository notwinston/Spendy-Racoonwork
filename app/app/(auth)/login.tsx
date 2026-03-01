import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>FutureSpend</Text>
          <Text style={styles.tagline}>See Tomorrow, Save Today</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.placeholder}>
            Email and password fields will be added in the auth loop
          </Text>

          <Button
            title="Sign In"
            onPress={() => router.replace('/(tabs)/dashboard')}
            style={styles.button}
          />

          <Button
            title="Create Account"
            variant="outline"
            onPress={() => router.push('/(auth)/signup')}
            style={styles.button}
          />
        </Card>
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  tagline: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  card: {
    gap: Spacing.lg,
  },
  cardTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  placeholder: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.sm,
  },
});
