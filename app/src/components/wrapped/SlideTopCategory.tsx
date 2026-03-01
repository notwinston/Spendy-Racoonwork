import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TopCategorySlide } from '../../hooks/useWrappedData';

interface Props {
  data: TopCategorySlide;
  isActive: boolean;
  accent: string;
}

export default function SlideTopCategory({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.headline, { color: accent }]}>You lived{'\n'}for{'\n'}{data.categoryLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headline: { fontSize: 36, fontFamily: 'Syne_800ExtraBold', textAlign: 'center' },
});
