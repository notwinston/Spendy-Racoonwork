import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TotalSpentSlide } from '../../hooks/useWrappedData';

interface Props {
  data: TotalSpentSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideTotalSpent({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.bignum, { color: accent }]}>${Math.round(data.totalSpent).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bignum: { fontSize: 42, fontFamily: 'Syne_800ExtraBold' },
});
