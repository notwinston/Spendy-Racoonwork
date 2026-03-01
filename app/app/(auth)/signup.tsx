import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { ThemedAlert } from '../../src/components/ui/ThemedAlert';
import { useThemedAlert } from '../../src/hooks/useThemedAlert';

export default function SignupScreen() {
  const alert = useThemedAlert();
  const router = useRouter();
  const { signUp, isLoading, error, setError } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      alert.error('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      alert.error('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      alert.error('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    const success = await signUp(email.trim(), password, displayName.trim());
    if (success) {
      router.replace('/onboarding/welcome');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>FutureSpend</Text>
            <Text style={styles.tagline}>Join the future of finance</Text>
          </View>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (error) setError(null);
                }}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(null);
                }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            />

            <Button
              title="Already have an account? Sign In"
              variant="outline"
              onPress={() => router.back()}
              style={styles.button}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
      <ThemedAlert {...alert.alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
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
  errorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.danger,
    textAlign: 'center',
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.lg,
    color: Colors.textPrimary,
  },
  button: {
    marginTop: Spacing.sm,
  },
});
