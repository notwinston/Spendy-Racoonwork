import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import {
  useDashboardMonthStore,
  isDashboardCurrentMonth,
  getDashboardDisplayLabel,
} from '../stores/dashboardMonthStore';

export function DashboardMonthSelector() {
  const { selectedMonth, goBack, goForward, resetToCurrent } =
    useDashboardMonthStore();

  const isCurrent = isDashboardCurrentMonth(selectedMonth);
  const label = getDashboardDisplayLabel(selectedMonth);

  // Determine if back navigation is at limit (3 months back)
  const now = new Date();
  const currentAbsolute = now.getFullYear() * 12 + now.getMonth();
  const selectedAbsolute = selectedMonth.year * 12 + selectedMonth.month;
  const canGoBack = selectedAbsolute > currentAbsolute - 3;
  const canGoForward = !isCurrent;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={canGoBack ? goBack : undefined}
        style={[styles.chevron, !canGoBack && styles.chevronDisabled]}
        hitSlop={12}
        accessibilityLabel="Previous month"
      >
        <Ionicons
          name="chevron-back"
          size={22}
          color={canGoBack ? Colors.textSecondary : Colors.textMuted}
        />
      </Pressable>

      <Pressable onPress={isCurrent ? undefined : resetToCurrent} style={styles.labelContainer}>
        <Animated.Text
          key={label}
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          style={styles.label}
        >
          {label}
        </Animated.Text>
        {!isCurrent && (
          <Text style={styles.resetHint}>Tap to reset</Text>
        )}
      </Pressable>

      <Pressable
        onPress={canGoForward ? goForward : undefined}
        style={[styles.chevron, !canGoForward && styles.chevronDisabled]}
        hitSlop={12}
        accessibilityLabel="Next month"
      >
        <Ionicons
          name="chevron-forward"
          size={22}
          color={canGoForward ? Colors.textSecondary : Colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  chevron: {
    padding: Spacing.xs,
  },
  chevronDisabled: {
    opacity: 0.4,
  },
  labelContainer: {
    alignItems: 'center',
    minWidth: 160,
  },
  label: {
    ...Typography.heading.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  resetHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.accentBright,
    marginTop: 2,
  },
});
