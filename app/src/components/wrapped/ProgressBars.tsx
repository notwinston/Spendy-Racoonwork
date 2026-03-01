import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface ProgressBarsProps {
  currentIndex: number;
  totalSlides: number;
}

export default function ProgressBars({ currentIndex, totalSlides }: ProgressBarsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSlides }).map((_, i) => (
        <View key={i} style={styles.barTrack}>
          <BarFill index={i} currentIndex={currentIndex} />
        </View>
      ))}
    </View>
  );
}

function BarFill({ index, currentIndex }: { index: number; currentIndex: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    let widthPct: number;
    if (index < currentIndex) {
      widthPct = 100;
    } else if (index === currentIndex) {
      widthPct = 100;
    } else {
      widthPct = 0;
    }
    return {
      width: withTiming(`${widthPct}%` as unknown as number, { duration: 300 }),
    };
  });

  return <Animated.View style={[styles.barFill, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  barTrack: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
});
