import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 56,
  strokeWidth = 4,
  color = Colors.accent,
  backgroundColor = Colors.cardBorder,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const targetOffset = circumference * (1 - clampedProgress);

  const animatedOffset = useSharedValue(circumference);

  useEffect(() => {
    animatedOffset.value = withTiming(targetOffset, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetOffset, circumference]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  const gloomStrokeWidth = strokeWidth * 1.5;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Glow bloom layer */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={gloomStrokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
          opacity={0.2}
        />
        {/* Main ring */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children ? (
        <View style={[styles.childrenContainer, StyleSheet.absoluteFill]}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  childrenContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
