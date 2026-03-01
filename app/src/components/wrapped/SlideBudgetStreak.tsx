import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BudgetStreakSlide } from '../../hooks/useWrappedData';

interface Props {
  data: BudgetStreakSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideBudgetStreak({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.bignum, { color: accent }]}>{data.streakCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bignum: { fontSize: 42, fontFamily: 'Syne_800ExtraBold' },
});
