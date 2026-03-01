import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { useCalendarStore } from '../../src/stores/calendarStore';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useBudgetStore } from '../../src/stores/budgetStore';
import { useGamificationStore } from '../../src/stores/gamificationStore';
import { useSocialStore } from '../../src/stores/socialStore';
import { usePredictionStore } from '../../src/stores/predictionStore';
import { ThemedAlert } from '../../src/components/ui/ThemedAlert';
import { useThemedAlert } from '../../src/hooks/useThemedAlert';

interface Persona {
  name: string;
  email: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  persona: 'sarah' | 'marcus';
  xp: number;
  level: number;
  streak: number;
}

const PERSONAS: Persona[] = [
  {
    name: 'Sarah Chen',
    email: 'sarah@futurespend.app',
    description: 'UX Designer, 28 | Balanced spender with fitness & dining habits',
    icon: 'woman',
    persona: 'sarah',
    xp: 450,
    level: 5,
    streak: 7,
  },
  {
    name: 'Marcus Thompson',
    email: 'marcus@futurespend.app',
    description: 'Software Engineer, 32 | Tech-savvy with travel & entertainment spending',
    icon: 'man',
    persona: 'marcus',
    xp: 280,
    level: 3,
    streak: 3,
  },
];

export default function LoginScreen() {
  const alert = useThemedAlert();
  const router = useRouter();
  const { signIn, setUser, setOnboarded, isLoading, error, setError, setLoading } = useAuthStore();
  const { loadDemoData: loadCalendar } = useCalendarStore();
  const { loadDemoData: loadTransactions } = useTransactionStore();
  const { fetchBudgets, computeFromTransactions } = useBudgetStore();
  const { loadProfile } = useGamificationStore();
  const { fetchFriends, fetchCircles, fetchNotifications } = useSocialStore();
  const { generatePredictions } = usePredictionStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      alert.error('Missing Fields', 'Please enter both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert.error('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      alert.error('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    const success = await signIn(email.trim(), password.trim());
    if (success) {
      router.replace('/(tabs)/dashboard');
    }
  };

  const personaLoginInProgress = useRef(false);

  const handlePersonaLogin = async (persona: Persona) => {
    if (personaLoginInProgress.current) return;
    personaLoginInProgress.current = true;
    setLoading(true);
    try {
      const userId = `demo-${persona.persona}`;

      // Set user profile
      setUser({
        id: userId,
        email: persona.email,
        displayName: persona.name,
        friendCode: persona.persona === 'sarah' ? 'SARAH2026' : 'MARC2026',
        monthlyIncome: 4200,
        xp: persona.xp,
        level: persona.level,
        streakCount: persona.streak,
      });

      // Load all demo data for this persona
      await loadCalendar(userId, persona.persona);
      await loadTransactions(userId, persona.persona);
      await fetchBudgets(userId);
      await loadProfile(userId);
      await fetchFriends(userId);
      await fetchCircles(userId);
      await fetchNotifications(userId);

      // Generate predictions from loaded calendar events
      const events = useCalendarStore.getState().events;
      await generatePredictions(events, userId);

      // Compute budget metrics from loaded transactions + predictions
      const txns = useTransactionStore.getState().transactions;
      const preds = usePredictionStore.getState().predictions;
      computeFromTransactions(
        txns,
        preds.map((p) => ({
          category: p.predicted_category,
          predicted_amount: p.predicted_amount,
        })),
      );

      setOnboarded(true);
      setLoading(false);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      alert.error('Error', 'Failed to load demo data. Please try again.');
    } finally {
      setLoading(false);
      personaLoginInProgress.current = false;
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
            <Text style={styles.tagline}>See Tomorrow, Save Today</Text>
          </View>

          {/* Demo Persona Switcher */}
          <Text style={styles.demoTitle}>Try a Demo Persona</Text>
          <View style={styles.personaRow}>
            {PERSONAS.map((persona) => (
              <TouchableOpacity
                key={persona.persona}
                style={styles.personaCard}
                onPress={() => handlePersonaLogin(persona)}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.personaAvatar}>
                  <Ionicons name={persona.icon} size={28} color={Colors.accent} />
                </View>
                <Text style={styles.personaName}>{persona.name}</Text>
                <Text style={styles.personaDesc} numberOfLines={2}>
                  {persona.description}
                </Text>
                <View style={styles.personaStats}>
                  <Text style={styles.personaStat}>Lv.{persona.level}</Text>
                  <Text style={styles.personaStat}>{persona.xp} XP</Text>
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={10} color={Colors.warning} />
                    <Text style={styles.personaStat}>{persona.streak}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in</Text>
            <View style={styles.dividerLine} />
          </View>

          <Card style={styles.card}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

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
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                placeholder="Enter password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </View>

            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            />

            <Button
              title="Create Account"
              variant="outline"
              onPress={() => router.push('/(auth)/signup')}
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
    marginBottom: Spacing['2xl'],
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
  demoTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  personaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  personaCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  personaAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  personaName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  personaDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: Typography.sizes.xs * Typography.lineHeights.relaxed,
  },
  personaStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  personaStat: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
  },
  card: {
    gap: Spacing.lg,
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
