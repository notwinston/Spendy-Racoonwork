import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { IntroSlide } from '../../hooks/useWrappedData';

interface Props {
  data: IntroSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideIntro({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.headline, { color: accent }]}>{data.monthName}{'\n'}Flashback</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headline: { fontSize: 42, fontFamily: 'Syne_800ExtraBold', textAlign: 'center' },
});
