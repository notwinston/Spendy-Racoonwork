import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Path,
  G,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export interface DonutSegment {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  showTotal?: boolean;
  onSegmentPress?: (segment: DonutSegment, index: number) => void;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 160,
  strokeWidth = 30,
  showTotal = true,
  onSegmentPress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const animValue = useSharedValue(0);

  const updateProgress = useCallback((v: number) => {
    setAnimProgress(v);
  }, []);

  useEffect(() => {
    animValue.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, []);

  useAnimatedReaction(
    () => animValue.value,
    (current) => {
      runOnJS(updateProgress)(current);
    },
  );

  const handlePress = useCallback(
    (segment: DonutSegment, index: number) => {
      setSelectedIndex((prev) => (prev === index ? null : index));
      onSegmentPress?.(segment, index);
    },
    [onSegmentPress],
  );

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <SvgText
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            alignmentBaseline="central"
            fill={Colors.textMuted}
            fontSize={Typography.sizes.sm}
          >
            No data
          </SvgText>
        </Svg>
      </View>
    );
  }

  const center = size / 2;
  const outerRadius = size / 2 - 4;
  const innerRadius = outerRadius - strokeWidth;
  const gapDeg = 2;

  // Calculate total for display
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  // Normalize percentages
  const totalPct = data.reduce((sum, d) => sum + d.percentage, 0);
  const normalizedData = totalPct > 0
    ? data.map((d) => ({ ...d, percentage: (d.percentage / totalPct) * 100 }))
    : data;

  // Build segments
  let currentAngle = 0;
  const segments: Array<{
    path: string;
    color: string;
    segment: DonutSegment;
    index: number;
  }> = [];

  normalizedData.forEach((item, index) => {
    const segAngle = (item.percentage / 100) * 360;
    if (segAngle <= 0) return;

    const gapOffset = normalizedData.length > 1 ? gapDeg / 2 : 0;
    const startAngle = currentAngle + gapOffset;
    const endAngle = currentAngle + segAngle - gapOffset;

    if (endAngle > startAngle) {
      // Stagger animation: each segment appears with delay
      const segmentDelay = index * 100;
      const segmentDuration = 800;
      const totalDuration = segmentDuration + (normalizedData.length - 1) * 100;
      const normalizedProgress = Math.max(
        0,
        Math.min(1, (animProgress * totalDuration - segmentDelay) / segmentDuration),
      );

      const animatedEnd = startAngle + (endAngle - startAngle) * normalizedProgress;

      if (animatedEnd > startAngle) {
        const path = describeArc(
          center,
          center,
          outerRadius,
          innerRadius,
          startAngle,
          animatedEnd,
        );
        segments.push({ path, color: item.color, segment: item, index });
      }
    }
    currentAngle += segAngle;
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <Path
          d={describeArc(center, center, outerRadius, innerRadius, 0, 359.99)}
          fill={Colors.border}
          opacity={0.3}
        />

        {/* Segments */}
        {segments.map(({ path, color, segment, index: idx }) => {
          const isSelected = selectedIndex === idx;
          const isDimmed = selectedIndex !== null && !isSelected;
          return (
            <Path
              key={idx}
              d={path}
              fill={color}
              opacity={isDimmed ? 0.4 : 1}
              onPress={() => handlePress(segment, idx)}
            />
          );
        })}

        {/* Center total */}
        {showTotal && (
          <>
            <SvgText
              x={center}
              y={center - 6}
              textAnchor="middle"
              alignmentBaseline="central"
              fill={Colors.textPrimary}
              fontSize={Typography.sizes.xl}
              fontWeight={Typography.weights.bold}
            >
              {formatCurrency(total)}
            </SvgText>
            <SvgText
              x={center}
              y={center + 14}
              textAnchor="middle"
              alignmentBaseline="central"
              fill={Colors.textSecondary}
              fontSize={Typography.sizes.xs}
            >
              Total
            </SvgText>
          </>
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
