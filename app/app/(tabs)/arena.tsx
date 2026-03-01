import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';

const TABS = ['My Progress', 'Challenges', 'Leaderboard', 'Friends'];

export default function ArenaScreen() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Arena" />

      <View style={styles.tabBar}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}
          >
            <Text
              style={[styles.tabText, activeTab === index && styles.tabTextActive]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 0 && (
          <>
            <Card style={styles.progressCard}>
              <Text style={styles.level}>Level 5</Text>
              <Text style={styles.title}>Novice Saver</Text>
              <Text style={styles.xp}>450 / 1,118 XP</Text>
            </Card>
            <Card>
              <Text style={styles.placeholder}>Streak display placeholder</Text>
            </Card>
            <Card>
              <Text style={styles.placeholder}>Badge grid placeholder</Text>
            </Card>
          </>
        )}

        {activeTab === 1 && (
          <>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <Card>
              <Text style={styles.placeholder}>Active challenges placeholder</Text>
            </Card>
            <Text style={styles.sectionTitle}>Browse Challenges</Text>
            <Card>
              <Text style={styles.placeholder}>Challenge catalog placeholder</Text>
            </Card>
          </>
        )}

        {activeTab === 2 && (
          <Card>
            <Text style={styles.placeholder}>Leaderboard with podium placeholder</Text>
          </Card>
        )}

        {activeTab === 3 && (
          <>
            <Card>
              <Text style={styles.placeholder}>Friend code + QR placeholder</Text>
            </Card>
            <Card>
              <Text style={styles.placeholder}>Friends list placeholder</Text>
            </Card>
            <Card>
              <Text style={styles.placeholder}>Circles list placeholder</Text>
            </Card>
          </>
        )}
      </ScrollView>
      <FloatingChatButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.accent,
  },
  tabText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  tabTextActive: {
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  progressCard: {
    alignItems: 'center',
  },
  level: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  title: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  xp: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  placeholder: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
