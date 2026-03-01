import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { supabase, isDemoMode } from '../src/lib/supabase';
import { Colors, Typography, Spacing } from '../src/constants';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { useAuthStore } from '../src/stores/authStore';
import { useCalendarStore } from '../src/stores/calendarStore';
import { useTransactionStore } from '../src/stores/transactionStore';
import {
  useNotificationStore,
  type ProfileVisibility,
  type NotificationPreferences,
} from '../src/stores/notificationStore';

// ---------------------------------------------------------------------------
// Reusable row components
// ---------------------------------------------------------------------------

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  statusColor?: string;
}

function SettingsRow({ icon, label, value, onPress, statusColor }: SettingsRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={20} color={Colors.accent} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value && (
        <Text style={[styles.rowValue, statusColor ? { color: statusColor } : undefined]}>
          {value}
        </Text>
      )}
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

interface ToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onToggle: () => void;
}

function ToggleRow({ icon, label, value, onToggle }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={Colors.accent} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.divider, true: Colors.accent + '80' }}
        thumbColor={value ? Colors.accent : Colors.textMuted}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Visibility Selector
// ---------------------------------------------------------------------------

const VISIBILITY_OPTIONS: { key: ProfileVisibility; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'public', label: 'Public', icon: 'globe-outline' },
  { key: 'friends_only', label: 'Friends Only', icon: 'people-outline' },
  { key: 'private', label: 'Private', icon: 'lock-closed-outline' },
];

interface VisibilitySelectorProps {
  value: ProfileVisibility;
  onChange: (v: ProfileVisibility) => void;
}

function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  return (
    <View style={styles.visibilityContainer}>
      <View style={styles.row}>
        <Ionicons name="eye-outline" size={20} color={Colors.accent} />
        <Text style={styles.rowLabel}>Profile Visibility</Text>
      </View>
      <View style={styles.visibilityOptions}>
        {VISIBILITY_OPTIONS.map((opt) => {
          const isSelected = value === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.visibilityOption,
                isSelected && styles.visibilityOptionSelected,
              ]}
              onPress={() => onChange(opt.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={isSelected ? Colors.accent : Colors.textMuted}
              />
              <Text
                style={[
                  styles.visibilityOptionText,
                  isSelected && styles.visibilityOptionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Settings Screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const router = useRouter();
  const { user, setUser, signOut } = useAuthStore();
  const { connections: calendarConnections } = useCalendarStore();
  const { plaidConnections } = useTransactionStore();
  const {
    preferences,
    privacy,
    togglePreference,
    setProfileVisibility,
    togglePrivacy,
  } = useNotificationStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [incomeInput, setIncomeInput] = useState(
    user?.monthlyIncome ? user.monthlyIncome.toString() : '',
  );
  const [isSavingIncome, setIsSavingIncome] = useState(false);

  const calendarConnected = calendarConnections.length > 0;
  const bankConnected = plaidConnections.length > 0;

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleSaveName = useCallback(() => {
    if (editName.trim() && user) {
      setUser({ ...user, displayName: editName.trim() });
    }
    setIsEditingName(false);
  }, [editName, user, setUser]);

  const handleCopyFriendCode = useCallback(async () => {
    if (user?.friendCode) {
      await Clipboard.setStringAsync(user.friendCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [user?.friendCode]);

  const handleSaveIncome = useCallback(async () => {
    const parsed = parseFloat(incomeInput.replace(/[^0-9.]/g, ''));
    if (isNaN(parsed) || parsed <= 0) return;

    setIsSavingIncome(true);
    try {
      if (user) {
        setUser({ ...user, monthlyIncome: parsed });
      }
      if (!isDemoMode() && user) {
        await supabase
          .from('profiles')
          .update({ monthly_income: parsed, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }
    } finally {
      setIsSavingIncome(false);
    }
  }, [incomeInput, user, setUser]);

  const handleCalendarPress = () => {
    if (calendarConnected) {
      Alert.alert(
        'Google Calendar',
        'Your Google Calendar is connected.',
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert(
        'Connect Google Calendar',
        'Calendar sync will be available when you connect your Google account.',
        [{ text: 'OK' }],
      );
    }
  };

  const handleBankPress = () => {
    if (bankConnected) {
      Alert.alert(
        'Bank Account',
        'Your bank account is connected.',
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert(
        'Connect Bank Account',
        'Bank account connection will be available through Plaid integration.',
        [{ text: 'OK' }],
      );
    }
  };

  // Notification preference labels
  const NOTIFICATION_PREFS: {
    key: keyof NotificationPreferences;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: 'spendingAlerts', label: 'Spending Alerts', icon: 'cash-outline' },
    { key: 'budgetWarnings', label: 'Budget Warnings', icon: 'warning-outline' },
    { key: 'socialNudges', label: 'Social Nudges', icon: 'people-outline' },
    { key: 'challengeUpdates', label: 'Challenge Updates', icon: 'trophy-outline' },
    { key: 'streakReminders', label: 'Streak Reminders', icon: 'flame-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile / Account Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color={Colors.textPrimary} />
            </View>
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={14} color={Colors.textPrimary} />
            </View>
          </View>

          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.editNameInput}
                value={editName}
                onChangeText={setEditName}
                autoFocus
                onBlur={handleSaveName}
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity onPress={handleSaveName}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.editNameTouchable}
              onPress={() => {
                setEditName(user?.displayName || '');
                setIsEditingName(true);
              }}
            >
              <Text style={styles.profileName}>
                {user?.displayName || 'User'}
              </Text>
              <Ionicons
                name="pencil-outline"
                size={14}
                color={Colors.textMuted}
                style={{ marginLeft: Spacing.xs }}
              />
            </TouchableOpacity>
          )}

          <Text style={styles.profileEmail}>{user?.email || ''}</Text>

          {user?.friendCode ? (
            <TouchableOpacity
              style={styles.friendCodeContainer}
              onPress={handleCopyFriendCode}
              activeOpacity={0.7}
            >
              <Text style={styles.friendCode}>
                {copiedCode ? 'Copied!' : `Friend Code: ${user.friendCode}`}
              </Text>
              <Ionicons
                name={copiedCode ? 'checkmark' : 'copy-outline'}
                size={14}
                color={Colors.accent}
                style={{ marginLeft: Spacing.xs }}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Financial Information */}
        <Text style={styles.sectionTitle}>Financial Information</Text>
        <Card>
          <View style={styles.row}>
            <Ionicons name="cash-outline" size={20} color={Colors.accent} />
            <Text style={styles.rowLabel}>Monthly Income</Text>
          </View>
          <View style={styles.incomeInputRow}>
            <Text style={styles.incomeDollarSign}>$</Text>
            <TextInput
              style={styles.incomeInput}
              value={incomeInput}
              onChangeText={setIncomeInput}
              placeholder="e.g. 5000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
              onBlur={handleSaveIncome}
              onSubmitEditing={handleSaveIncome}
            />
            {isSavingIncome && (
              <Text style={styles.incomeSaving}>Saving...</Text>
            )}
            {!isSavingIncome && user?.monthlyIncome && (
              <Ionicons name="checkmark-circle" size={18} color={Colors.positive} />
            )}
          </View>
          <Text style={styles.incomeHint}>
            Used to calculate your savings rate on the dashboard.
          </Text>
        </Card>

        {/* Connected Accounts */}
        <Text style={styles.sectionTitle}>Connected Accounts</Text>
        <Card>
          <SettingsRow
            icon="calendar"
            label="Google Calendar"
            value={calendarConnected ? 'Connected' : 'Not connected'}
            statusColor={calendarConnected ? Colors.positive : Colors.textMuted}
            onPress={handleCalendarPress}
          />
          <SettingsRow
            icon="wallet"
            label="Bank Account"
            value={bankConnected ? 'Connected' : 'Not connected'}
            statusColor={bankConnected ? Colors.positive : Colors.textMuted}
            onPress={handleBankPress}
          />
        </Card>

        {/* Notification Preferences */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
          </TouchableOpacity>
        </View>
        <Card>
          {NOTIFICATION_PREFS.map((pref) => (
            <ToggleRow
              key={pref.key}
              icon={pref.icon}
              label={pref.label}
              value={preferences[pref.key]}
              onToggle={() => togglePreference(pref.key)}
            />
          ))}
          <ToggleRow
            icon="calendar-outline"
            label="Weekly Summary"
            value={weeklySummary}
            onToggle={() => setWeeklySummary((prev) => !prev)}
          />
        </Card>

        {/* Privacy Controls */}
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Card>
          <VisibilitySelector
            value={privacy.profileVisibility}
            onChange={setProfileVisibility}
          />
          <ToggleRow
            icon="share-social-outline"
            label="Share Spending with Friends"
            value={privacy.shareSpendingData}
            onToggle={() => togglePrivacy('shareSpendingData')}
          />
          <ToggleRow
            icon="eye-off-outline"
            label="Anonymous in Leaderboards"
            value={privacy.anonymousLeaderboard}
            onToggle={() => togglePrivacy('anonymousLeaderboard')}
          />
        </Card>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

        {/* Delete Account Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.deleteOverlay}>
            <View style={styles.deleteContent}>
              <Ionicons name="warning" size={48} color={Colors.danger} />
              <Text style={styles.deleteTitle}>Delete Account</Text>
              <Text style={styles.deleteDescription}>
                This action cannot be undone. Type DELETE to confirm.
              </Text>
              <TextInput
                style={styles.deleteInput}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder='Type "DELETE"'
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />
              <View style={styles.deleteActions}>
                <TouchableOpacity
                  style={styles.deleteCancelButton}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                >
                  <Text style={styles.deleteCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deleteConfirmButton,
                    deleteConfirmText !== 'DELETE' && styles.deleteConfirmDisabled,
                  ]}
                  onPress={() => {
                    if (deleteConfirmText === 'DELETE') {
                      setShowDeleteModal(false);
                      setDeleteConfirmText('');
                      Alert.alert('Account Deleted', 'Your account has been scheduled for deletion.');
                      handleSignOut();
                    }
                  }}
                  disabled={deleteConfirmText !== 'DELETE'}
                >
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
  // Profile
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  editNameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editNameInput: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    paddingVertical: Spacing.xs,
    minWidth: 120,
    textAlign: 'center',
  },
  friendCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  friendCode: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  // Section
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  viewAllText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
    marginRight: Spacing.xs,
  },
  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  rowLabel: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
  },
  rowValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  // Visibility selector
  visibilityContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  visibilityOptionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  visibilityOptionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  visibilityOptionTextSelected: {
    color: Colors.accent,
  },
  // Income input
  incomeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  incomeDollarSign: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  incomeInput: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs,
    fontFamily: 'DMMono_500Medium',
  },
  incomeSaving: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  incomeHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    paddingBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  // Sign out
  signOutButton: {
    marginTop: Spacing['3xl'],
    borderColor: Colors.danger,
  },
  // Delete account
  deleteAccountButton: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  deleteAccountText: {
    fontSize: Typography.sizes.md,
    color: Colors.danger,
    fontWeight: Typography.weights.medium,
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  deleteContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  deleteTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.danger,
    marginTop: Spacing.md,
  },
  deleteDescription: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  deleteInput: {
    width: '100%',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  deleteCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    alignItems: 'center',
  },
  deleteConfirmDisabled: {
    opacity: 0.4,
  },
  deleteConfirmText: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
});
