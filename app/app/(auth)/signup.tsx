import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

export default function SignupScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>FutureSpend</Text>
          <Text style={styles.tagline}>Join the future of finance</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.placeholder}>
            Name, email, and password fields will be added in the auth loop
          </Text>

          <Button
            title="Create Account"
            onPress={() => router.replace('/onboarding/welcome')}
            style={styles.button}
          />

          <Button
            title="Already have an account? Sign In"
            variant="outline"
            onPress={() => router.back()}
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
