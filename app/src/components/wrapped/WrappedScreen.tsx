import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWrappedData } from '../../hooks/useWrappedData';
import ProgressBars from './ProgressBars';
import SlideIntro from './SlideIntro';
import SlideTotalSpent from './SlideTotalSpent';
import SlideTopCategory from './SlideTopCategory';
import SlideSavings from './SlideSavings';
import SlideBudgetStreak from './SlideBudgetStreak';
import SlideBiggestPurchase from './SlideBiggestPurchase';
import SlideForecast from './SlideForecast';
import SlideSummary from './SlideSummary';
import type { SlideData } from '../../hooks/useWrappedData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TIMING_CONFIG = {
  duration: 720,
  easing: Easing.bezier(0.77, 0, 0.18, 1),
};

function renderSlide(slide: SlideData, isActive: boolean, accent: string) {
  switch (slide.type) {
    case 'intro':
      return <SlideIntro data={slide} isActive={isActive} accent={accent} />;
    case 'totalSpent':
      return <SlideTotalSpent data={slide} isActive={isActive} accent={accent} />;
    case 'topCategory':
      return <SlideTopCategory data={slide} isActive={isActive} accent={accent} />;
    case 'savings':
      return <SlideSavings data={slide} isActive={isActive} accent={accent} />;
    case 'budgetStreak':
      return <SlideBudgetStreak data={slide} isActive={isActive} accent={accent} />;
    case 'biggestPurchase':
      return <SlideBiggestPurchase data={slide} isActive={isActive} accent={accent} />;
    case 'forecast':
      return <SlideForecast data={slide} isActive={isActive} accent={accent} />;
    case 'summary':
      return <SlideSummary data={slide} isActive={isActive} accent={accent} />;
  }
}

export default function WrappedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slides, palettes, hasData } = useWrappedData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const totalSlides = slides.length;

  const goToSlide = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
  }, []);

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      if (isAnimating.value) return;

      if (event.translationY < -50 && currentIndex < totalSlides - 1) {
        isAnimating.value = true;
        const target = -(currentIndex + 1) * SCREEN_HEIGHT;
        translateY.value = withTiming(target, TIMING_CONFIG, () => {
          isAnimating.value = false;
          runOnJS(goToSlide)(currentIndex + 1);
        });
      } else if (event.translationY > 50 && currentIndex > 0) {
        isAnimating.value = true;
        const target = -(currentIndex - 1) * SCREEN_HEIGHT;
        translateY.value = withTiming(target, TIMING_CONFIG, () => {
          isAnimating.value = false;
          runOnJS(goToSlide)(currentIndex - 1);
        });
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const currentPalette = palettes[currentIndex] || palettes[0];

  const blob1Style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(currentPalette?.blob1 ?? '#1e4a08', { duration: 720 }),
  }));

  const blob2Style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(currentPalette?.blob2 ?? '#0b3020', { duration: 720 }),
  }));

  const blob3Style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(currentPalette?.blob3 ?? '#4a8020', { duration: 720 }),
  }));

  if (!hasData || slides.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>No data for last month</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Blob backgrounds */}
      <Animated.View style={[styles.blob, styles.blob1, blob1Style]} />
      <Animated.View style={[styles.blob, styles.blob2, blob2Style]} />
      <Animated.View style={[styles.blob, styles.blob3, blob3Style]} />

      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 12 }]}
        onPress={() => router.back()}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      {/* Progress bars */}
      <View style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, zIndex: 20 }}>
        <ProgressBars currentIndex={currentIndex} totalSlides={totalSlides} />
      </View>

      {/* Slides */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.slidesContainer, containerStyle]}>
          {slides.map((slide, i) => (
            <View key={i} style={styles.slideWrapper}>
              {renderSlide(slide, i === currentIndex, palettes[i]?.accent ?? '#C8F135')}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050D1A',
    overflow: 'hidden',
  },
  slidesContainer: {
    flex: 1,
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.5,
  },
  blob1: {
    top: -100,
    left: -80,
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_HEIGHT * 0.7,
  },
  blob2: {
    bottom: -60,
    right: -40,
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.6,
  },
  blob3: {
    top: SCREEN_HEIGHT * 0.25,
    left: SCREEN_WIDTH * 0.15,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.5,
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    zIndex: 30,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    fontFamily: 'DMSans_500Medium',
  },
});
