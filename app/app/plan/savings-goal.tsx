import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Card } from '../../src/components/ui/Card';
import { GoalEditor } from '../../src/components/GoalEditor';
import { useBudgetStore } from '../../src/stores/budgetStore';
import type { SavingsGoal } from '../../src/types';

export default function SavingsGoalScreen() {
  const router = useRouter();
  const goals = useBudgetStore((s) => s.goals);
  const [goalEditorVisible, setGoalEditorVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>(undefined);

  const calculateETA = (goal: SavingsGoal): string => {
    if (goal.monthlyContribution <= 0) return 'No contribution set';
    const remaining = goal.targetAmount - goal.currentSaved;
    if (remaining <= 0) return 'Goal reached!';
    const months = Math.ceil(remaining / goal.monthlyContribution);
    const now = new Date();
    const eta = new Date(now.getFullYear(), now.getMonth() + months, 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[eta.getMonth()]} ${eta.getFullYear()}`;
  };

  const calculateProgress = (goal: SavingsGoal): number => {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(100, (goal.currentSaved / goal.targetAmount) * 100);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalEditorVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Savings Goals</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingGoal(undefined);
            setGoalEditorVisible(true);
          }}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {goals.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="flag-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No savings goals yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first savings goal to start tracking your progress
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                setEditingGoal(undefined);
                setGoalEditorVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={20} color={Colors.textPrimary} />
              <Text style={styles.createButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal);
            return (
              <TouchableOpacity
                key={goal.id}
                onPress={() => handleEditGoal(goal)}
                activeOpacity={0.7}
              >
                <Card style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalNameRow}>
                      <Text style={styles.goalName}>{goal.name || 'Unnamed Goal'}</Text>
                      {goal.isPaused && (
                        <View style={styles.pausedBadge}>
                          <Text style={styles.pausedText}>PAUSED</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.goalDetails}>
                    <View style={styles.goalDetailColumn}>
                      <Text style={styles.goalDetailLabel}>Saved</Text>
                      <Text style={styles.goalDetailValue}>
                        ${goal.currentSaved.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.goalDetailColumn}>
                      <Text style={styles.goalDetailLabel}>Target</Text>
                      <Text style={styles.goalDetailValue}>
                        ${goal.targetAmount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.goalDetailColumn}>
                      <Text style={styles.goalDetailLabel}>Monthly</Text>
                      <Text style={styles.goalDetailValue}>
                        ${goal.monthlyContribution.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.etaRow}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.etaText}>
                      Est. completion: <Text style={styles.etaDate}>{calculateETA(goal)}</Text>
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <GoalEditor
        visible={goalEditorVisible}
        onClose={() => {
          setGoalEditorVisible(false);
          setEditingGoal(undefined);
        }}
        editingGoal={editingGoal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgApp,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.heading.h2,
    flex: 1,
    textAlign: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading.h2,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.body.regular,
    textAlign: 'center',
    maxWidth: 280,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accentBright,
    borderRadius: Spacing.radiusMd,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  createButtonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  goalCard: {
    marginBottom: 0,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  goalName: {
    ...Typography.heading.h3,
  },
  pausedBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Spacing.radiusSm,
  },
  pausedText: {
    ...Typography.label.card,
    color: Colors.warning,
    fontSize: 9,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accentBright,
    borderRadius: 4,
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  goalDetailColumn: {
    alignItems: 'center',
  },
  goalDetailLabel: {
    ...Typography.caption.meta,
    marginBottom: 2,
  },
  goalDetailValue: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  etaText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  etaDate: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 13,
    fontWeight: '500',
    color: Colors.accentBright,
  },
});
