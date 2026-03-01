import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

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

  const [displayProgress, setDisplayProgress] = useState(animated ? 0 : score);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    if (!animated) {
      setDisplayProgress(score);
      return;
    }

    const startTime = Date.now();
    const duration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayProgress(eased * score);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [score, animated]);

  const strokeDashoffset =
    circumference - (displayProgress / 100) * circumference;
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

        {/* Score arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
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
          fontWeight={Typography.weights.medium}
        >
          {Math.round(displayProgress)}
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
