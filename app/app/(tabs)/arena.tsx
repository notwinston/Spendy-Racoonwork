import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { AtmosphericBackground } from '../../src/components/ui/AtmosphericBackground';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { PodiumDisplay } from '../../src/components/PodiumDisplay';
import { BadgeDetailModal, type BadgeInfo } from '../../src/components/BadgeDetailModal';
import { RankCard } from '../../src/components/RankCard';
import { useAuthStore } from '../../src/stores/authStore';
import {
  useGamificationStore,
  calculateRankTier,
} from '../../src/stores/gamificationStore';
import { useSocialStore } from '../../src/stores/socialStore';
import { useBudgetStore } from '../../src/stores/budgetStore';

const TABS = ['My Progress', 'Challenges', 'Leaderboard', 'Friends'];

const BADGE_TIER_COLORS: Record<string, string> = {
  bronze: Colors.badgeBronze,
  silver: Colors.badgeSilver,
  gold: Colors.badgeGold,
  diamond: Colors.badgeDiamond,
};

type LeaderboardScope = 'global' | 'friends' | 'circle';

export default function ArenaScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [leaderboardScope, setLeaderboardScope] = useState<LeaderboardScope>('global');
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);
  const [selectedBadgeEarned, setSelectedBadgeEarned] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [joinedTemplateIds, setJoinedTemplateIds] = useState<Set<string>>(new Set());
  const [joinedMessage, setJoinedMessage] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 'demo-user';

  const {
    profile,
    badges,
    earnedBadges,
    challengeTemplates,
    activeChallenges,
    leaderboard,
    dailyCheckinDone,
    socialOptIn,
    anonymousMode,
    setSocialOptIn,
    setAnonymousMode,
    xpForNextLevel,
    xpProgress,
    loadProfile,
    performCheckin,
    fetchBadges,
    fetchChallenges,
    fetchLeaderboard,
    createFromTemplate,
    joinChallenge,
  } = useGamificationStore();

  const { totalBudget, totalSpent } = useBudgetStore();

  // Compute a demo savings rate based on budget data
  const savingsRate = useMemo(() => {
    if (totalBudget <= 0) return 12; // demo fallback
    const saved = Math.max(0, totalBudget - totalSpent);
    return Math.round((saved / totalBudget) * 100 * 10) / 10;
  }, [totalBudget, totalSpent]);

  const {
    friends,
    pendingRequests,
    circles,
    sendFriendRequest,
    acceptRequest,
    fetchFriends,
    fetchPendingRequests,
    fetchCircles,
    fetchLeaderboard: fetchSocialLeaderboard,
  } = useSocialStore();

  useEffect(() => {
    loadProfile(userId);
    fetchBadges(userId);
    fetchChallenges(userId);
    fetchLeaderboard();
    fetchFriends(userId);
    fetchPendingRequests(userId);
    fetchCircles(userId);
  }, [userId]);

  const handleCheckin = useCallback(async () => {
    const result = await performCheckin(userId);
    if (result) {
      Alert.alert(
        'Daily Check-in!',
        `+${result.xp_earned} XP! Streak: ${result.streak_count} days${
          result.badges_earned.length > 0
            ? `\nNew badge: ${result.badges_earned[0].name}!`
            : ''
        }`,
      );
    }
  }, [userId]);

  const handleAddFriend = useCallback(async () => {
    if (!friendCodeInput.trim()) return;
    try {
      await sendFriendRequest(userId, friendCodeInput.trim());
      setFriendCodeInput('');
      Alert.alert('Success', 'Friend request sent!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send request');
    }
  }, [userId, friendCodeInput]);

  const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badge_id));

  // Flame icon pulse animation
  const flameScale = useSharedValue(1);
  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(1.0, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);
  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  return (
    <AtmosphericBackground variant="arena">
      <Header title="Arena" />

      <View style={styles.tabBar}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* My Progress Tab */}
        {activeTab === 0 && (
          <>
            {/* Rank Card */}
            <RankCard savingsRate={savingsRate} />

            <GlassCard style={styles.progressCard} accentEdge="left" accentColor={Colors.glowGold}>
              <Text style={styles.level}>Level {profile.level}</Text>
              <Text style={styles.xpText}>
                {profile.xp.toLocaleString()} XP
              </Text>

              {/* XP Progress Bar */}
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${xpProgress() * 100}%` }]} />
              </View>
              <Text style={styles.xpRemaining}>
                {xpForNextLevel() - (profile.xp - Math.round(xpForNextLevel() * (1 - (1 - xpProgress()))))} XP to next level
              </Text>
            </GlassCard>

            {/* Streak & Check-in */}
            <GlassCard style={styles.streakCard}>
              <View style={styles.streakRow}>
                <View style={styles.streakInfo}>
                  <Animated.View style={flameAnimatedStyle}>
                    <Ionicons name="flame" size={28} color={Colors.warning} />
                  </Animated.View>
                  <View>
                    <Text style={styles.streakCount}>{profile.streakCount} day streak</Text>
                    <Text style={styles.streakBest}>Best: {profile.longestStreak} days</Text>
                  </View>
                </View>
                <Button
                  title={dailyCheckinDone ? 'Done!' : 'Check In'}
                  onPress={handleCheckin}
                  disabled={dailyCheckinDone}
                  variant={dailyCheckinDone ? 'secondary' : 'primary'}
                />
              </View>
            </GlassCard>

            {/* Badges */}
            <Text style={styles.sectionTitle}>
              Badges ({earnedBadges.length}/{badges.length})
            </Text>
            <View style={styles.badgeGrid}>
              {badges.map((badge, index) => {
                const earned = earnedBadgeIds.has(badge.id);
                const shouldAnimate = index < 12;
                return (
                  <Animated.View
                    key={badge.id}
                    entering={shouldAnimate ? ZoomIn.delay(index * 50).springify().damping(12) : undefined}
                  >
                  <TouchableOpacity
                    style={[styles.badgeItem, !earned && styles.badgeLocked]}
                    onPress={() => {
                      setSelectedBadge({
                        name: badge.name,
                        description: badge.description,
                        tier: badge.tier,
                      });
                      setSelectedBadgeEarned(earned);
                      setShowBadgeModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.badgeCircle,
                        { borderColor: BADGE_TIER_COLORS[badge.tier] || Colors.textMuted },
                        !earned && styles.badgeCircleLocked,
                      ]}
                    >
                      <Ionicons
                        name={earned ? 'ribbon' : 'lock-closed'}
                        size={20}
                        color={earned ? BADGE_TIER_COLORS[badge.tier] : Colors.textMuted}
                      />
                    </View>
                    <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={1}>
                      {badge.name}
                    </Text>
                  </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            <BadgeDetailModal
              badge={selectedBadge}
              earned={selectedBadgeEarned}
              visible={showBadgeModal}
              onClose={() => setShowBadgeModal(false)}
            />
          </>
        )}

        {/* Challenges Tab */}
        {activeTab === 1 && (
          <>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            {activeChallenges.length === 0 && (
              <Card>
                <Text style={styles.emptyText}>No active challenges. Join one below!</Text>
              </Card>
            )}
            {activeChallenges.map((cp) => (
              <Card key={cp.id} style={styles.challengeCard}>
                <Text style={styles.challengeTitle}>{(cp as unknown as { challenge?: { title: string } }).challenge?.title || 'Challenge'}</Text>
                <Text style={styles.challengeSub}>Status: {cp.status}</Text>
                <View style={styles.challengeProgress}>
                  <View style={[styles.challengeBar, { width: '40%' }]} />
                </View>
                <Text style={styles.challengeXP}>Reward: {(cp as unknown as { challenge?: { reward_xp: number } }).challenge?.reward_xp || 100} XP</Text>
              </Card>
            ))}

            <Text style={styles.sectionTitle}>Browse Challenges</Text>
            {joinedMessage && (
              <View style={styles.joinedBanner}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.textPrimary} />
                <Text style={styles.joinedBannerText}>{joinedMessage}</Text>
              </View>
            )}
            {challengeTemplates.map((tmpl) => (
              <Card key={tmpl.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.challengeTitle}>{tmpl.title}</Text>
                    <Text style={styles.challengeSub}>{tmpl.description}</Text>
                    <Text style={styles.challengeXP}>
                      {tmpl.duration_days} days | {tmpl.reward_xp} XP reward
                    </Text>
                  </View>
                  <Button
                    title={joinedTemplateIds.has(tmpl.id) ? 'Joined' : 'Join'}
                    variant={joinedTemplateIds.has(tmpl.id) ? 'secondary' : 'outline'}
                    disabled={joinedTemplateIds.has(tmpl.id)}
                    onPress={async () => {
                      await createFromTemplate(tmpl.id, userId);
                      setJoinedTemplateIds((prev) => new Set([...prev, tmpl.id]));
                      setJoinedMessage(`Joined "${tmpl.title}"!`);
                      setTimeout(() => setJoinedMessage(null), 3000);
                    }}
                  />
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 2 && (
          <>
            {/* Scope selector */}
            <View style={styles.scopeSelector}>
              {(['global', 'friends', 'circle'] as LeaderboardScope[]).map((scope) => (
                <TouchableOpacity
                  key={scope}
                  style={[
                    styles.scopePill,
                    leaderboardScope === scope && styles.scopePillActive,
                  ]}
                  onPress={() => setLeaderboardScope(scope)}
                >
                  <Text
                    style={[
                      styles.scopePillText,
                      leaderboardScope === scope && styles.scopePillTextActive,
                    ]}
                  >
                    {scope === 'global' ? 'Global' : scope === 'friends' ? 'Friends' : 'Circle'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Podium for top 3 */}
            {leaderboard.length >= 3 && (
              <Card style={styles.podiumCard}>
                <PodiumDisplay
                  top3={leaderboard.slice(0, 3).map((entry) => ({
                    displayName: entry.display_name,
                    xp: entry.xp,
                    rank: entry.rank,
                  }))}
                />
              </Card>
            )}

            <Text style={styles.sectionTitle}>Top Players</Text>
            {leaderboard.slice(leaderboard.length >= 3 ? 3 : 0).map((entry) => {
              // Derive a demo savings rate from XP for display
              const entrySavingsRate = Math.min(50, Math.round((entry.xp / 100) * 10) / 10);
              const entryTier = calculateRankTier(entrySavingsRate);
              return (
                <Card key={entry.user_id} style={styles.leaderRow}>
                  <Text style={[styles.rank, entry.rank <= 3 && { color: Colors.accent }]}>
                    #{entry.rank}
                  </Text>
                  <View style={styles.leaderAvatar}>
                    <Ionicons name="person" size={18} color={Colors.textPrimary} />
                  </View>
                  <View style={styles.leaderInfo}>
                    <Text style={styles.leaderName}>{entry.display_name}</Text>
                    <View style={styles.leaderMeta}>
                      <Text style={styles.leaderLevel}>Level {entry.level}</Text>
                      <Text style={styles.leaderTierBadge}>
                        {entryTier.badge} {entrySavingsRate}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.leaderXP}>{entry.xp.toLocaleString()} XP</Text>
                </Card>
              );
            })}
            {leaderboard.length === 0 && (
              <Card>
                <Text style={styles.emptyText}>Add friends to see the leaderboard!</Text>
              </Card>
            )}
          </>
        )}

        {/* Friends Tab */}
        {activeTab === 3 && (
          <>
            {/* Social Privacy Toggles */}
            <Card style={styles.socialTogglesCard}>
              <View style={styles.socialToggleRow}>
                <View style={styles.socialToggleInfo}>
                  <Ionicons name="share-social-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.socialToggleTextWrap}>
                    <Text style={styles.socialToggleLabel}>Share my rank</Text>
                    <Text style={styles.socialToggleDesc}>Let friends see your tier and progress</Text>
                  </View>
                </View>
                <Switch
                  value={socialOptIn}
                  onValueChange={setSocialOptIn}
                  trackColor={{ false: Colors.borderSubtle, true: Colors.accentBright + '66' }}
                  thumbColor={socialOptIn ? Colors.accentBright : Colors.textMuted}
                />
              </View>
              <View style={styles.socialDivider} />
              <View style={styles.socialToggleRow}>
                <View style={styles.socialToggleInfo}>
                  <Ionicons name="eye-off-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.socialToggleTextWrap}>
                    <Text style={styles.socialToggleLabel}>Anonymous mode</Text>
                    <Text style={styles.socialToggleDesc}>Hide your name on leaderboards</Text>
                  </View>
                </View>
                <Switch
                  value={anonymousMode}
                  onValueChange={setAnonymousMode}
                  trackColor={{ false: Colors.borderSubtle, true: Colors.accentBright + '66' }}
                  thumbColor={anonymousMode ? Colors.accentBright : Colors.textMuted}
                />
              </View>
            </Card>

            {/* Friend Code */}
            <Card style={styles.friendCodeCard}>
              <Text style={styles.friendCodeLabel}>Your Friend Code</Text>
              <Text style={styles.friendCode}>{user?.friendCode || 'XXXXXXXX'}</Text>
              <Text style={styles.friendCodeHint}>Share this code with friends</Text>
            </Card>

            {/* Add Friend */}
            <Card>
              <Text style={styles.addFriendLabel}>Add a Friend</Text>
              <View style={styles.addFriendRow}>
                <TextInput
                  style={styles.friendInput}
                  value={friendCodeInput}
                  onChangeText={setFriendCodeInput}
                  placeholder="Enter friend code"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
                <Button title="Add" onPress={handleAddFriend} />
              </View>
            </Card>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pending Requests</Text>
                {pendingRequests.map((req) => (
                  <Card key={req.id} style={styles.friendRow}>
                    <View style={styles.friendAvatar}>
                      <Ionicons name="person-add" size={18} color={Colors.warning} />
                    </View>
                    <Text style={styles.friendName}>Friend Request</Text>
                    <Button
                      title="Accept"
                      variant="outline"
                      onPress={() => acceptRequest(userId, req.id)}
                    />
                  </Card>
                ))}
              </>
            )}

            {/* Friends List */}
            <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
            {friends.map((f) => (
              <Card key={f.id} style={styles.friendRow}>
                <View style={styles.friendAvatar}>
                  <Ionicons name="person" size={18} color={Colors.accent} />
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{f.profile?.display_name || 'Friend'}</Text>
                  <Text style={styles.friendLevel}>
                    Level {f.profile?.level || 1} | {f.profile?.xp || 0} XP
                  </Text>
                </View>
              </Card>
            ))}
            {friends.length === 0 && (
              <Card>
                <Text style={styles.emptyText}>No friends yet. Add some using friend codes!</Text>
              </Card>
            )}

            {/* Circles */}
            <Text style={styles.sectionTitle}>Circles ({circles.length})</Text>
            {circles.map((c) => (
              <Card key={c.id} style={styles.circleCard}>
                <Ionicons name="people-circle" size={24} color={Colors.accent} />
                <View style={styles.circleInfo}>
                  <Text style={styles.circleName}>{c.name}</Text>
                  <Text style={styles.circleCode}>Code: {c.invite_code}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
      <FloatingChatButton />
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  tabBar: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.glassBg, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.glowGold },
  tabText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontWeight: Typography.weights.medium },
  tabTextActive: { color: '#F59E0B', fontWeight: Typography.weights.semibold },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  progressCard: { alignItems: 'center' },
  level: { fontSize: Typography.sizes['3xl'], fontWeight: Typography.weights.bold, color: Colors.accent },
  xpText: { fontSize: Typography.sizes.lg, color: Colors.textSecondary, marginTop: Spacing.xs },
  xpBar: { width: '100%', height: 8, backgroundColor: Colors.cardBorder, borderRadius: 4, marginTop: Spacing.lg, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 4 },
  xpRemaining: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  streakCard: {},
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streakInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streakCount: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  streakBest: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  sectionTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginTop: Spacing.md },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  badgeItem: { alignItems: 'center', width: 72 },
  badgeLocked: { opacity: 0.4 },
  badgeCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' },
  badgeCircleLocked: { borderColor: Colors.textMuted },
  badgeName: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  badgeNameLocked: { color: Colors.textMuted },
  challengeCard: {},
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  challengeTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  challengeSub: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  challengeProgress: { height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, marginTop: Spacing.sm, overflow: 'hidden' },
  challengeBar: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  challengeXP: { fontSize: Typography.sizes.sm, color: Colors.accent, marginTop: Spacing.xs },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rank: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textSecondary, width: 32 },
  leaderAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cardBorder, justifyContent: 'center', alignItems: 'center' },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  leaderMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  leaderLevel: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  leaderTierBadge: { fontFamily: 'DMMono_500Medium', fontSize: 11, fontWeight: '500', color: Colors.textSecondary },
  leaderXP: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.accent },
  friendCodeCard: { alignItems: 'center' },
  friendCodeLabel: { fontSize: Typography.sizes.md, color: Colors.textSecondary },
  friendCode: { fontSize: Typography.sizes['3xl'], fontWeight: Typography.weights.bold, color: Colors.accent, marginTop: Spacing.sm, letterSpacing: 3 },
  friendCodeHint: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  addFriendLabel: { fontSize: Typography.sizes.md, color: Colors.textSecondary, marginBottom: Spacing.sm },
  addFriendRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  friendInput: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: Typography.sizes.md, color: Colors.textPrimary },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  friendAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cardBorder, justifyContent: 'center', alignItems: 'center' },
  friendInfo: { flex: 1 },
  friendName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium, color: Colors.textPrimary, flex: 1 },
  friendLevel: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  circleCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  circleInfo: { flex: 1 },
  circleName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  circleCode: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  emptyText: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },
  joinedBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.md },
  joinedBannerText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  scopeSelector: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  scopePill: { flex: 1, paddingVertical: Spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: Colors.glassBorder, backgroundColor: Colors.glassBg, alignItems: 'center' },
  scopePillActive: { borderColor: Colors.glowGold, backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  scopePillText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontWeight: Typography.weights.medium },
  scopePillTextActive: { color: '#F59E0B' },
  podiumCard: { paddingBottom: Spacing.lg },
  socialTogglesCard: { marginBottom: Spacing.md },
  socialToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  socialToggleInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, flex: 1, marginRight: Spacing.md },
  socialToggleTextWrap: { flex: 1 },
  socialToggleLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
  socialToggleDesc: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  socialDivider: { height: 1, backgroundColor: Colors.borderSubtle, marginVertical: Spacing.md },
});
