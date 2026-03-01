import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedProps,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CCIBadgeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

function getCCIColor(score: number): string {
  if (score > 80) return Colors.positive;
  if (score > 60) return Colors.accent;
  if (score > 40) return Colors.warning;
  return Colors.danger;
}

function getCCILabel(score: number): string {
  if (score > 80) return 'Excellent';
  if (score > 60) return 'Good';
  if (score > 40) return 'Fair';
  return 'Poor';
}

export const CCIBadge: React.FC<CCIBadgeProps> = ({
  score: rawScore,
  size = 80,
  showLabel = true,
}) => {
  const score = Math.max(0, Math.min(100, rawScore || 0));
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const glowStrokeWidth = strokeWidth * 1.5;

  const targetOffset = circumference * (1 - score / 100);
  const animatedOffset = useSharedValue(circumference);
  const containerScale = useSharedValue(0.6);
  const [displayProgress, setDisplayProgress] = useState(0);

  const updateDisplay = useCallback((v: number) => {
    const progress = 1 - v / circumference;
    setDisplayProgress(Math.round(progress * 100));
  }, [circumference]);

  useEffect(() => {
    // Scale-in spring
    containerScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    // Draw-in arc
    animatedOffset.value = withTiming(targetOffset, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetOffset, circumference]);

  useAnimatedReaction(
    () => animatedOffset.value,
    (current) => {
      runOnJS(updateDisplay)(current);
    },
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const color = getCCIColor(score);
  const label = getCCILabel(score);

  const totalHeight = size + (showLabel ? 20 : 0);

  return (
    <Animated.View style={[styles.container, { width: size, height: totalHeight }, scaleStyle]}>
      <Svg width={size} height={totalHeight} viewBox={`0 0 ${size} ${totalHeight}`}>
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Glow bloom layer */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={glowStrokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
          opacity={0.2}
        />

        {/* Score arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />

        {/* Percentage text */}
        <SvgText
          x={center}
          y={center + 1}
          textAnchor="middle"
          alignmentBaseline="central"
          fill={Colors.textPrimary}
          fontSize={Typography.sizes.lg}
          fontWeight={Typography.weights.bold}
        >
          {`${displayProgress}%`}
        </SvgText>

        {/* Quality label */}
        {showLabel && (
          <SvgText
            x={center}
            y={size + 14}
            textAnchor="middle"
            fill={color}
            fontSize={Typography.sizes.xs}
            fontWeight={Typography.weights.medium}
          >
            {label}
          </SvgText>
        )}
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
