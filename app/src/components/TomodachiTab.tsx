import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { GlassCard } from './ui/GlassCard';
import {
  STAGES,
  EMOTION_CONFIG,
  getRaccoonStage,
  getNextStage,
  getRaccoonEmotion,
  getRaccoonImage,
  getStreakConsistency,
  getQuestsCompleted,
  getTip,
} from '../utils/raccoonUtils';
import { ThemedAlert } from './ui/ThemedAlert';
import { useThemedAlert } from '../hooks/useThemedAlert';

interface TomodachiTabProps {
  profile: {
    xp: number;
    level: number;
    streakCount: number;
    longestStreak: number;
    healthScore: number | null;
  };
  savingsRate: number;
  earnedBadges: { badge_id: string; earned_at?: string }[];
  activeChallenges: { id: string; status: string }[];
  rankName: string;
}

export function TomodachiTab({
  profile,
  savingsRate,
  earnedBadges,
  activeChallenges,
  rankName,
}: TomodachiTabProps) {
  const alert = useThemedAlert();
  // Derive raccoon metrics
  const streakConsistency = getStreakConsistency(profile.streakCount, profile.longestStreak);
  const completedChallenges = activeChallenges.filter((c) => c.status === 'completed').length;
  const questsCompleted = getQuestsCompleted(earnedBadges.length, completedChallenges);

  const currentStage = getRaccoonStage(profile.xp, streakConsistency, questsCompleted);
  const nextStage = getNextStage(currentStage.stage);

  // Check if user earned a badge recently (within last 24h)
  const recentMilestone = useMemo(() => {
    const oneDayAgo = Date.now() - 86400000;
    return earnedBadges.some((b) => b.earned_at && new Date(b.earned_at).getTime() > oneDayAgo);
  }, [earnedBadges]);

  const emotion = getRaccoonEmotion(profile.healthScore, savingsRate, recentMilestone);
  const emotionConfig = EMOTION_CONFIG[emotion];
  const raccoonImage = getRaccoonImage(currentStage.stage, emotion);

  // Idle bobbing animation
  const bobY = useSharedValue(0);
  useEffect(() => {
    bobY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);
  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  // Tap handler
  const handleTap = () => {
    const tip = getTip(savingsRate);
    alert.info(`${currentStage.emoji} Raccoon says...`, tip);
  };

  // Evolution progress criteria
  const criteria = nextStage
    ? [
        { label: 'XP', current: profile.xp, target: nextStage.xpRequired, met: profile.xp >= nextStage.xpRequired },
        { label: 'Streak', current: streakConsistency, target: nextStage.streakConsistency, met: streakConsistency >= nextStage.streakConsistency, suffix: '%' },
        { label: 'Quests', current: questsCompleted, target: nextStage.questsRequired, met: questsCompleted >= nextStage.questsRequired },
      ]
    : [];

  // Overall evolution progress (average of 3 criteria percentages, capped at 100)
  const evolutionProgress = nextStage
    ? Math.min(
        100,
        Math.round(
          ((Math.min(profile.xp / nextStage.xpRequired, 1) +
            Math.min(streakConsistency / nextStage.streakConsistency, 1) +
            Math.min(questsCompleted / nextStage.questsRequired, 1)) /
            3) *
            100,
        ),
      )
    : 100;

  // Quest summary from activeChallenges
  const completedCount = completedChallenges;
  const totalCount = activeChallenges.length;

  return (
    <>
      {/* Raccoon Display */}
      <GlassCard style={styles.raccoonCard} onPress={handleTap}>
        <Text style={styles.tapHint}>Tap for a tip!</Text>
        <Animated.View style={[styles.raccoonContainer, bobStyle]}>
          {raccoonImage ? (
            <Image source={raccoonImage} style={styles.raccoonImage} resizeMode="contain" />
          ) : (
            <View style={styles.raccoonPlaceholder}>
              <Text style={styles.raccoonEmoji}>{currentStage.emoji}</Text>
            </View>
          )}
        </Animated.View>
        <View style={styles.emotionBadge}>
          <Text style={styles.emotionEmoji}>{emotionConfig.icon}</Text>
          <Text style={[styles.emotionLabel, { color: emotionConfig.color }]}>
            {emotionConfig.label}
          </Text>
        </View>
      </GlassCard>

      {/* Evolution Stage Card */}
      <GlassCard style={styles.evolutionCard} accentEdge="left" accentColor={Colors.glowGold}>
        <Text style={styles.stageLabel}>{currentStage.label}</Text>
        <Text style={styles.stageDescription}>{currentStage.description}</Text>

        {nextStage ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.nextLabel}>
              Next: {nextStage.label}
            </Text>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${evolutionProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{evolutionProgress}% to next evolution</Text>

            {/* Criteria checklist */}
            <View style={styles.criteriaList}>
              {criteria.map((c) => (
                <View key={c.label} style={styles.criteriaRow}>
                  <Ionicons
                    name={c.met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={c.met ? Colors.positive : Colors.textMuted}
                  />
                  <Text style={[styles.criteriaText, c.met && styles.criteriaMet]}>
                    {c.label}: {c.current.toLocaleString()}{c.suffix ?? ''} / {c.target.toLocaleString()}{c.suffix ?? ''}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.divider} />
            <View style={styles.maxEvolution}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.maxEvolutionText}>Max Evolution Reached!</Text>
            </View>
          </>
        )}
      </GlassCard>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Ionicons name="trending-up" size={18} color={Colors.accentBright} />
          <Text style={styles.statValue}>Lv. {profile.level}</Text>
          <Text style={styles.statLabel}>{profile.xp.toLocaleString()} XP</Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <Ionicons name="flame" size={18} color={Colors.warning} />
          <Text style={styles.statValue}>{profile.streakCount}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <Ionicons name="shield" size={18} color={Colors.badgeGold} />
          <Text style={styles.statValue}>{rankName}</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <Ionicons name="wallet" size={18} color={Colors.positive} />
          <Text style={styles.statValue}>{savingsRate}%</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </GlassCard>
      </View>

      {/* Quest Summary */}
      <GlassCard style={styles.questCard} accentEdge="left" accentColor={Colors.accentGlow}>
        <Text style={styles.questTitle}>Quest Summary</Text>
        <View style={styles.questRow}>
          <View style={styles.questItem}>
            <Ionicons name="sunny" size={16} color={Colors.warning} />
            <Text style={styles.questLabel}>Active Challenges</Text>
            <Text style={styles.questCount}>
              {completedCount}/{totalCount}
              <Text style={styles.questCountSuffix}> completed</Text>
            </Text>
          </View>
        </View>
        {totalCount > 0 && (
          <View style={styles.questProgress}>
            <View
              style={[
                styles.questProgressFill,
                { width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` },
              ]}
            />
          </View>
        )}
        {totalCount === 0 && (
          <Text style={styles.questEmpty}>Join a challenge in the Challenges tab!</Text>
        )}
      </GlassCard>

      {/* Evolution Stages Overview */}
      <GlassCard style={styles.stagesOverview}>
        <Text style={styles.questTitle}>Evolution Path</Text>
        <View style={styles.stagesTimeline}>
          {STAGES.map((s, i) => {
            const isActive = s.stage === currentStage.stage;
            const isPast = STAGES.indexOf(currentStage) > i;
            return (
              <View key={s.stage} style={styles.stageStep}>
                <View
                  style={[
                    styles.stageCircle,
                    isActive && styles.stageCircleActive,
                    isPast && styles.stageCirclePast,
                  ]}
                >
                  <Text style={styles.stageStepEmoji}>{s.emoji}</Text>
                </View>
                <Text
                  style={[
                    styles.stageStepLabel,
                    isActive && styles.stageStepLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {s.stage.charAt(0).toUpperCase() + s.stage.slice(1)}
                </Text>
                {i < STAGES.length - 1 && (
                  <View style={[styles.stageLine, isPast && styles.stageLinePast]} />
                )}
              </View>
            );
          })}
        </View>
      </GlassCard>
      <ThemedAlert {...alert.alertProps} />
    </>
  );
}

const styles = StyleSheet.create({
  // Raccoon display
  raccoonCard: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  tapHint: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  raccoonContainer: { width: 260, height: 260, justifyContent: 'center', alignItems: 'center' },
  raccoonImage: { width: 260, height: 260 },
  raccoonPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.bgElevated,
    borderWidth: 2,
    borderColor: Colors.glassBorderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  raccoonEmoji: { fontSize: 80 },
  emotionBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.md },
  emotionEmoji: { fontSize: 18 },
  emotionLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  // Evolution card
  evolutionCard: {},
  stageLabel: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  stageDescription: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  divider: { height: 1, backgroundColor: Colors.borderSubtle, marginVertical: Spacing.md },
  nextLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  progressBarBg: { height: 8, backgroundColor: Colors.cardBorder, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 4 },
  progressText: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  criteriaList: { marginTop: Spacing.md, gap: Spacing.sm },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  criteriaText: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  criteriaMet: { color: Colors.positive },
  maxEvolution: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center' },
  maxEvolutionText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: '#F59E0B' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs },
  statValue: { fontSize: Typography.sizes.sm, fontFamily: 'DMMono_500Medium', fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginTop: Spacing.xs },
  statLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },

  // Quest summary
  questCard: {},
  questTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  questRow: { gap: Spacing.sm },
  questItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  questLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, flex: 1 },
  questCount: { fontSize: Typography.sizes.sm, fontFamily: 'DMMono_500Medium', color: Colors.textPrimary },
  questCountSuffix: { color: Colors.textMuted },
  questProgress: { height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, marginTop: Spacing.md, overflow: 'hidden' },
  questProgressFill: { height: '100%', backgroundColor: Colors.accentBright, borderRadius: 3 },
  questEmpty: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontStyle: 'italic', marginTop: Spacing.xs },

  // Evolution stages overview
  stagesOverview: {},
  stagesTimeline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: Spacing.sm },
  stageStep: { alignItems: 'center', flex: 1, position: 'relative' },
  stageCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgElevated,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageCircleActive: { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  stageCirclePast: { borderColor: Colors.positive, backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  stageStepEmoji: { fontSize: 18 },
  stageStepLabel: { fontSize: 9, color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' },
  stageStepLabelActive: { color: '#F59E0B', fontWeight: Typography.weights.bold },
  stageLine: {
    position: 'absolute',
    top: 20,
    left: '70%',
    right: '-30%',
    height: 2,
    backgroundColor: Colors.textMuted,
    zIndex: -1,
  },
  stageLinePast: { backgroundColor: Colors.positive },
});
