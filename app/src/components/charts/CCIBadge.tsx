import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

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

  const [displayProgress, setDisplayProgress] = useState(0);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 800;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayProgress(eased * score);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [score]);

  const strokeDashoffset =
    circumference - (displayProgress / 100) * circumference;
  const color = getCCIColor(score);
  const label = getCCILabel(score);

  const totalHeight = size + (showLabel ? 20 : 0);

  return (
    <View style={[styles.container, { width: size, height: totalHeight }]}>
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

        {/* Score arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
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
          {`${Math.round(displayProgress)}%`}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
