import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants';
import { Header } from '../../src/components/ui/Header';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { useAuthStore } from '../../src/stores/authStore';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useInsightsMonthStore, isCurrentMonth } from '../../src/stores/insightsMonthStore';
import { MonthSelector } from '../../src/components/insights/MonthSelector';

import { InsightsOverview } from '../../src/components/insights/InsightsOverview';
import { InsightsThisMonth } from '../../src/components/insights/InsightsThisMonth';
import { InsightsTrends } from '../../src/components/insights/InsightsTrends';
import { InsightsSavings } from '../../src/components/insights/InsightsSavings';
import { InsightsInsights } from '../../src/components/insights/InsightsInsights';

const TAB_KEYS = ['overview', 'thisMonth', 'trends', 'savings', 'insights'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const MONTH_SHORT = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function InsightsScreen() {
  const user = useAuthStore((s) => s.user);
  const { transactions, loadDemoData: loadTxns } = useTransactionStore();
  const userId = user?.id ?? 'demo-user';
  const selectedMonth = useInsightsMonthStore((s) => s.selectedMonth);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    if (transactions.length === 0) {
      loadTxns(userId);
    }
  }, [userId]);

  const tabLabels: Record<TabKey, string> = useMemo(() => {
    const isCurrent = isCurrentMonth(selectedMonth);
    return {
      overview: 'Overview',
      thisMonth: isCurrent ? 'This Month' : MONTH_SHORT[selectedMonth.month],
      trends: 'Trends',
      savings: 'Savings',
      insights: 'Insights',
    };
  }, [selectedMonth.year, selectedMonth.month]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <InsightsOverview />;
      case 'thisMonth':
        return <InsightsThisMonth />;
      case 'trends':
        return <InsightsTrends />;
      case 'savings':
        return <InsightsSavings />;
      case 'insights':
        return <InsightsInsights />;
      default:
        return <InsightsOverview />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Insights" />

      {/* Month Selector */}
      <MonthSelector />

      {/* Scrollable horizontal tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBarScroll}
        contentContainerStyle={styles.tabBarContent}
      >
        {TAB_KEYS.map((key) => {
          const isActive = activeTab === key;
          return (
            <Pressable
              key={key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tabLabels[key]}
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
