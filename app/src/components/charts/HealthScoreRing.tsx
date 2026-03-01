import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import ReanimatedModule, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useState } from 'react';

const AnimatedCircle = ReanimatedModule.createAnimatedComponent(Circle);

export interface HealthScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showGrade?: boolean;
  animated?: boolean;
}

function getGrade(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: 'A+', color: Colors.gradeAPlus };
  if (score >= 80) return { letter: 'A', color: Colors.gradeA };
  if (score >= 70) return { letter: 'B', color: Colors.gradeB };
  if (score >= 60) return { letter: 'C', color: Colors.gradeC };
  if (score >= 50) return { letter: 'D', color: Colors.gradeD };
  return { letter: 'F', color: Colors.gradeF };
}

export const HealthScoreRing: React.FC<HealthScoreRingProps> = ({
  score: rawScore,
  size = 140,
  strokeWidth = 12,
  showGrade = true,
  animated = true,
}) => {
  const score = Math.max(0, Math.min(100, rawScore || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const glowStrokeWidth = strokeWidth * 1.5;

  const targetOffset = circumference * (1 - score / 100);
  const animatedOffset = useSharedValue(animated ? circumference : targetOffset);
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

  const updateDisplay = useCallback((v: number) => {
    const progress = 1 - v / circumference;
    setDisplayScore(Math.round(progress * 100));
  }, [circumference]);

  useEffect(() => {
    animatedOffset.value = withTiming(targetOffset, {
      duration: 1200,
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

  const grade = getGrade(score);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.negative} />
            <Stop offset="50%" stopColor={Colors.warning} />
            <Stop offset="100%" stopColor={Colors.positive} />
          </LinearGradient>
        </Defs>

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
          stroke="url(#scoreGradient)"
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
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />

        {/* Grade letter */}
        {showGrade && (
          <SvgText
            x={center}
            y={center - 6}
            textAnchor="middle"
            alignmentBaseline="central"
            fill={grade.color}
            fontSize={Typography.sizes['2xl']}
            fontWeight={Typography.weights.bold}
          >
            {grade.letter}
          </SvgText>
        )}

        {/* Numeric score */}
        <SvgText
          x={center}
          y={center + (showGrade ? 18 : 4)}
          textAnchor="middle"
          alignmentBaseline="central"
          fill={Colors.textSecondary}
          fontSize={Typography.sizes.sm}
          fontFamily="DMMono_500Medium"
          fontWeight={Typography.weights.medium}
        >
          {displayScore}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
