import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { useAuthStore } from '../../src/stores/authStore';
import { useTransactionStore } from '../../src/stores/transactionStore';

import { InsightsOverview } from '../../src/components/insights/InsightsOverview';
import { InsightsThisMonth } from '../../src/components/insights/InsightsThisMonth';
import { InsightsTrends } from '../../src/components/insights/InsightsTrends';
import { InsightsSavings } from '../../src/components/insights/InsightsSavings';
import { InsightsInsights } from '../../src/components/insights/InsightsInsights';

const TABS = ['Overview', 'This Month', 'Trends', 'Savings', 'Insights'] as const;
type TabName = (typeof TABS)[number];

export default function InsightsScreen() {
  const user = useAuthStore((s) => s.user);
  const { transactions, loadDemoData: loadTxns } = useTransactionStore();
  const userId = user?.id ?? 'demo-user';

  const [activeTab, setActiveTab] = useState<TabName>('Overview');

  useEffect(() => {
    if (transactions.length === 0) {
      loadTxns(userId);
    }
  }, [userId]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <InsightsOverview />;
      case 'This Month':
        return <InsightsThisMonth />;
      case 'Trends':
        return <InsightsTrends />;
      case 'Savings':
        return <InsightsSavings />;
      case 'Insights':
        return <InsightsInsights />;
      default:
        return <InsightsOverview />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Insights" />

      {/* Scrollable horizontal tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBarScroll}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Tab content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {renderTabContent()}
        <View style={{ height: 40 }} />
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
  tabBarScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tabBarContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.accentDark,
  },
  tabText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
});
