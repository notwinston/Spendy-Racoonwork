import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Line,
  Circle,
  G,
  Text as SvgText,
} from 'react-native-svg';
import {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface GrowthDataPoint {
  month: number;
  value: number;
}

export interface GrowthScenarios {
  conservative: GrowthDataPoint[];
  expected: GrowthDataPoint[];
  optimistic: GrowthDataPoint[];
}

export interface GrowthCurveChartProps {
  scenarios: GrowthScenarios;
  currentSavings: number;
  width?: number;
  height?: number;
}

function formatDollar(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

export const GrowthCurveChart: React.FC<GrowthCurveChartProps> = ({
  scenarios,
  currentSavings,
  width = SCREEN_WIDTH - 40,
  height = 200,
}) => {
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

  // Validate data
  const hasData =
    scenarios.conservative.length > 0 &&
    scenarios.expected.length > 0 &&
    scenarios.optimistic.length > 0;

  if (!hasData) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height}>
          <SvgText
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            fill={Colors.textMuted}
            fontSize={Typography.sizes.sm}
          >
            No scenario data
          </SvgText>
        </Svg>
      </View>
    );
  }

  const paddingLeft = 55;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Collect all months and values for scaling
  const allPoints = [
    ...scenarios.conservative,
    ...scenarios.expected,
    ...scenarios.optimistic,
  ];
  const allMonths = allPoints.map((p) => p.month);
  const allValues = [...allPoints.map((p) => p.value), currentSavings];

  const minMonth = Math.min(...allMonths);
  const maxMonth = Math.max(...allMonths);
  const monthRange = maxMonth - minMonth || 1;

  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;
  const valRange = maxVal - minVal || 1;

  const getX = (month: number) =>
    paddingLeft + ((month - minMonth) / monthRange) * chartWidth;
  const getY = (value: number) =>
    paddingTop + chartHeight - ((value - minVal) / valRange) * chartHeight;

  // Build line paths with animation
  const buildLinePath = (points: GrowthDataPoint[]): string => {
    const sorted = [...points].sort((a, b) => a.month - b.month);
    const visibleCount = Math.ceil(animProgress * sorted.length);
    const visible = sorted.slice(0, visibleCount);
    if (visible.length === 0) return '';
    return visible
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.month)} ${getY(p.value)}`)
      .join(' ');
  };

  // Build fill path between two scenario lines
  const buildFillPath = (
    top: GrowthDataPoint[],
    bottom: GrowthDataPoint[],
  ): string => {
    const sortedTop = [...top].sort((a, b) => a.month - b.month);
    const sortedBottom = [...bottom].sort((a, b) => a.month - b.month);
    const visibleCountTop = Math.ceil(animProgress * sortedTop.length);
    const visibleCountBottom = Math.ceil(animProgress * sortedBottom.length);
    const visTop = sortedTop.slice(0, visibleCountTop);
    const visBottom = sortedBottom.slice(0, visibleCountBottom);

    if (visTop.length < 2 || visBottom.length < 2) return '';

    const forward = visTop
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.month)} ${getY(p.value)}`)
      .join(' ');
    const backward = [...visBottom]
      .reverse()
      .map((p) => `L ${getX(p.month)} ${getY(p.value)}`)
      .join(' ');

    return `${forward} ${backward} Z`;
  };

  const conservativePath = buildLinePath(scenarios.conservative);
  const expectedPath = buildLinePath(scenarios.expected);
  const optimisticPath = buildLinePath(scenarios.optimistic);
  const fillPath = buildFillPath(scenarios.optimistic, scenarios.conservative);

  // "You are here" marker at month 0
  const hereX = getX(0);
  const hereY = getY(currentSavings);

  // X-axis labels
  const xLabels = [3, 6, 12, 24].filter(
    (m) => m >= minMonth && m <= maxMonth,
  );

  // Y-axis ticks
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const val = minVal + (valRange / yTickCount) * i;
    return { value: val, y: getY(val) };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Y-axis */}
        {yTicks.map((tick, i) => (
          <G key={`ytick-${i}`}>
            <Line
              x1={paddingLeft}
              y1={tick.y}
              x2={width - paddingRight}
              y2={tick.y}
              stroke={Colors.border}
              strokeWidth={0.5}
            />
            <SvgText
              x={paddingLeft - 6}
              y={tick.y + 3}
              textAnchor="end"
              fill={Colors.textMuted}
              fontSize={Typography.sizes.xs}
            >
              {formatDollar(tick.value)}
            </SvgText>
          </G>
        ))}

        {/* Fill between optimistic and conservative */}
        {fillPath ? (
          <Path d={fillPath} fill={Colors.accent} opacity={0.1} />
        ) : null}

        {/* Conservative line (light) */}
        {conservativePath ? (
          <Path
            d={conservativePath}
            stroke={Colors.accent}
            strokeWidth={1.5}
            fill="none"
            opacity={0.35}
          />
        ) : null}

        {/* Expected line (medium) */}
        {expectedPath ? (
          <Path
            d={expectedPath}
            stroke={Colors.accent}
            strokeWidth={2}
            fill="none"
            opacity={0.7}
          />
        ) : null}

        {/* Optimistic line (full accent) */}
        {optimisticPath ? (
          <Path
            d={optimisticPath}
            stroke={Colors.accent}
            strokeWidth={2}
            fill="none"
            opacity={1}
          />
        ) : null}

        {/* "You are here" vertical dashed line */}
        <Line
          x1={hereX}
          y1={paddingTop}
          x2={hereX}
          y2={paddingTop + chartHeight}
          stroke={Colors.textSecondary}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <Circle
          cx={hereX}
          cy={hereY}
          r={5}
          fill={Colors.accent}
          stroke={Colors.background}
          strokeWidth={2}
        />
        <SvgText
          x={hereX}
          y={paddingTop - 4}
          textAnchor="middle"
          fill={Colors.textSecondary}
          fontSize={Typography.sizes.xs}
        >
          Now
        </SvgText>

        {/* X-axis labels */}
        {xLabels.map((m) => (
          <SvgText
            key={`xm-${m}`}
            x={getX(m)}
            y={height - 6}
            textAnchor="middle"
            fill={Colors.textMuted}
            fontSize={Typography.sizes.xs}
          >
            {m}mo
          </SvgText>
        ))}

        {/* Month 0 label */}
        <SvgText
          x={getX(0)}
          y={height - 6}
          textAnchor="middle"
          fill={Colors.textMuted}
          fontSize={Typography.sizes.xs}
        >
          0
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
