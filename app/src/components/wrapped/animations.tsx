import React from 'react';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface AnimationProps {
  isActive: boolean;
  delay?: number;
  children: React.ReactNode;
}

export function FadeUp({ isActive, delay = 0, children }: AnimationProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = isActive
      ? withDelay(delay, withTiming(1, { duration: 450, easing: Easing.bezier(0.16, 1, 0.3, 1) }))
      : 0;
    const translateY = isActive
      ? withDelay(delay, withTiming(0, { duration: 450, easing: Easing.bezier(0.16, 1, 0.3, 1) }))
      : 16;
    return { opacity, transform: [{ translateY }] };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export function RollIn({ isActive, delay = 0, children }: AnimationProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = isActive
      ? withDelay(delay, withTiming(1, { duration: 650, easing: Easing.bezier(0.34, 1.2, 0.64, 1) }))
      : 0;
    const translateY = isActive
      ? withDelay(delay, withTiming(0, { duration: 650, easing: Easing.bezier(0.34, 1.2, 0.64, 1) }))
      : 36;
    const scale = isActive
      ? withDelay(delay, withTiming(1, { duration: 650, easing: Easing.bezier(0.34, 1.2, 0.64, 1) }))
      : 0.8;
    return { opacity, transform: [{ translateY }, { scale }] };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export function ScaleIn({ isActive, delay = 0, children }: AnimationProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = isActive
      ? withDelay(delay, withTiming(1, { duration: 400 }))
      : 0;
    const scale = isActive
      ? withDelay(delay, withTiming(1, { duration: 400 }))
      : 0.85;
    return { opacity, transform: [{ scale }] };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
