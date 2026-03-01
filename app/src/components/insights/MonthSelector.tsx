import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants';
import {
  useInsightsMonthStore,
  isCurrentMonth,
  getDisplayLabel,
} from '../../stores/insightsMonthStore';

export function MonthSelector() {
  const { selectedMonth, goBack, goForward, resetToCurrent } =
    useInsightsMonthStore();

  const isCurrent = isCurrentMonth(selectedMonth);
  const label = getDisplayLabel(selectedMonth);

  // Determine if forward is at limit (current + 3 months)
  const now = new Date();
  const maxAbsolute = now.getFullYear() * 12 + now.getMonth() + 3;
  const currentAbsolute = selectedMonth.year * 12 + selectedMonth.month;
  const canGoForward = currentAbsolute < maxAbsolute;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={goBack}
        style={styles.chevron}
        hitSlop={12}
        accessibilityLabel="Previous month"
      >
        <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
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
