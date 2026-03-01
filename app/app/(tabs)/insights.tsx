import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../src/constants';
import { AtmosphericBackground } from '../../src/components/ui/AtmosphericBackground';
import { Header } from '../../src/components/ui/Header';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { useAuthStore } from '../../src/stores/authStore';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { MonthSelector } from '../../src/components/insights/MonthSelector';

import { InsightsOverview } from '../../src/components/insights/InsightsOverview';
import { InsightsThisMonth } from '../../src/components/insights/InsightsThisMonth';
import { InsightsTrends } from '../../src/components/insights/InsightsTrends';
import { InsightsSavings } from '../../src/components/insights/InsightsSavings';
import { InsightsInsights } from '../../src/components/insights/InsightsInsights';

const TAB_KEYS = ['overview', 'thisMonth', 'trends', 'savings', 'insights'] as const;
type TabKey = (typeof TAB_KEYS)[number];


export default function InsightsScreen() {
  const user = useAuthStore((s) => s.user);
  const { transactions, loadDemoData: loadTxns } = useTransactionStore();
  const userId = user?.id ?? 'demo-user';
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Reanimated sliding underline
  const underlineX = useSharedValue(0);
  const underlineWidth = useSharedValue(0);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  const handleTabLayout = useCallback((key: TabKey, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[key] = { x, width };
    if (key === activeTab) {
      underlineX.value = x;
      underlineWidth.value = width;
    }
  }, [activeTab]);

  const handleTabPress = useCallback((key: TabKey) => {
    setActiveTab(key);
    const layout = tabLayouts.current[key];
    if (layout) {
      underlineX.value = withSpring(layout.x, { damping: 18, stiffness: 120 });
      underlineWidth.value = withSpring(layout.width, { damping: 18, stiffness: 120 });
    }
  }, []);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: underlineX.value }],
    width: underlineWidth.value,
  }));

  useEffect(() => {
    if (transactions.length === 0) {
      loadTxns(userId);
    }
  }, [userId]);

  const tabLabels: Record<TabKey, string> = {
    overview: 'Overview',
    thisMonth: 'Month',
    trends: 'Trends',
    savings: 'Savings',
    insights: 'Insights',
  };

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
    <AtmosphericBackground variant="insights">
      <Header title="Insights" />

      {/* Month Selector */}
      <MonthSelector />

      {/* Scrollable horizontal tab bar with sliding underline */}
      <View style={styles.tabBarWrapper}>
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
                onPress={() => handleTabPress(key)}
                onLayout={(e) => handleTabLayout(key, e)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tabLabels[key]}
                </Text>
              </Pressable>
            );
          })}
          {/* Sliding underline indicator */}
          <Animated.View style={[styles.tabUnderline, underlineStyle]} />
        </ScrollView>
      </View>

      {/* Tab content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {renderTabContent()}
        <View style={{ height: 40 }} />
      </ScrollView>

      <FloatingChatButton />
    </AtmosphericBackground>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tabBarScroll: {
    flexGrow: 0,
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
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: Colors.accentBright,
    borderRadius: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
});
