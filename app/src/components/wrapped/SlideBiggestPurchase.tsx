import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BiggestPurchaseSlide } from '../../hooks/useWrappedData';

interface Props {
  data: BiggestPurchaseSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideBiggestPurchase({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.headline, { color: accent }]}>Your boldest{'\n'}move.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headline: { fontSize: 36, fontFamily: 'Syne_800ExtraBold', textAlign: 'center' },
});
