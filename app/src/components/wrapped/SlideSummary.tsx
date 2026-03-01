import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SummarySlide } from '../../hooks/useWrappedData';

interface Props {
  data: SummarySlide;
  isActive: boolean;
  accent: string;
}

export default function SlideSummary({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.bignum, { color: accent }]}>{data.healthScore}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bignum: { fontSize: 42, fontFamily: 'Syne_800ExtraBold' },
});
