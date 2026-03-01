import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Line,
  Circle,
  G,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface TrendDataPoint {
  label: string;
  value: number;
}

export interface TrendLineChartProps {
  data: TrendDataPoint[];
  budgetLine?: number;
  width?: number;
  height?: number;
  period?: 'weekly' | 'monthly' | '6month';
}

function formatYValue(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  budgetLine,
  width = SCREEN_WIDTH - 40,
  height = 200,
  period = 'monthly',
}) => {
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 800;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handlePointPress = useCallback((index: number) => {
    setTooltipIndex((prev) => (prev === index ? null : index));
  }, []);

  if (!data || data.length === 0) {
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
            No data
          </SvgText>
        </Svg>
      </View>
    );
  }

  const paddingLeft = 50;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const allValues = budgetLine != null ? [...values, budgetLine] : values;
  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const yPadding = range * 0.1;
  const yMin = minVal - yPadding;
  const yMax = maxVal + yPadding;
  const yRange = yMax - yMin || 1;

  const getX = (index: number) =>
    paddingLeft + (data.length > 1 ? (index / (data.length - 1)) * chartWidth : chartWidth / 2);
  const getY = (value: number) =>
    paddingTop + chartHeight - ((value - yMin) / yRange) * chartHeight;

  // Build the trend line path
  const linePoints = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

  // Animated clipping: only show up to animProgress fraction
  const animatedCount = Math.ceil(animProgress * linePoints.length);
  const visiblePoints = linePoints.slice(0, animatedCount);

  const linePath =
    visiblePoints.length > 0
      ? visiblePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      : '';

  // Budget line Y
  const budgetY = budgetLine != null ? getY(budgetLine) : null;

  // Fill paths: green below budget, red above
  let greenFillPath = '';
  let redFillPath = '';
  if (budgetY != null && visiblePoints.length >= 2) {
    const bottomY = paddingTop + chartHeight;

    // Green fill: area below both the line and the budget
    const greenPoints = visiblePoints.map((p) => ({
      x: p.x,
      y: Math.max(p.y, budgetY),
    }));
    greenFillPath =
      `M ${greenPoints[0].x} ${bottomY} ` +
      greenPoints.map((p) => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${greenPoints[greenPoints.length - 1].x} ${bottomY} Z`;

    // Red fill: area above budget line
    const hasAbove = visiblePoints.some((p) => p.y < budgetY);
    if (hasAbove) {
      const redPoints = visiblePoints.map((p) => ({
        x: p.x,
        y: Math.min(p.y, budgetY),
      }));
      redFillPath =
        `M ${redPoints[0].x} ${budgetY} ` +
        redPoints.map((p) => `L ${p.x} ${p.y}`).join(' ') +
        ` L ${redPoints[redPoints.length - 1].x} ${budgetY} Z`;
    }
  } else if (visiblePoints.length >= 2) {
    // No budget line: just fill under the curve with accent
    const bottomY = paddingTop + chartHeight;
    greenFillPath =
      `M ${visiblePoints[0].x} ${bottomY} ` +
      visiblePoints.map((p) => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${visiblePoints[visiblePoints.length - 1].x} ${bottomY} Z`;
  }

  // Y-axis ticks
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const val = yMin + (yRange / yTickCount) * i;
    return { value: val, y: getY(val) };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Y-axis gridlines and labels */}
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
              {formatYValue(tick.value)}
            </SvgText>
          </G>
        ))}

        {/* Green fill (below budget or under curve) */}
        {greenFillPath ? (
          <Path d={greenFillPath} fill={Colors.positive} opacity={0.15} />
        ) : null}

        {/* Red fill (above budget) */}
        {redFillPath ? (
          <Path d={redFillPath} fill={Colors.danger} opacity={0.15} />
        ) : null}

        {/* Budget line */}
        {budgetY != null && (
          <Line
            x1={paddingLeft}
            y1={budgetY}
            x2={width - paddingRight}
            y2={budgetY}
            stroke={Colors.warning}
            strokeWidth={1.5}
            strokeDasharray="6,4"
          />
        )}

        {/* Trend line */}
        {linePath ? (
          <Path
            d={linePath}
            stroke={Colors.accent}
            strokeWidth={2}
            fill="none"
          />
        ) : null}

        {/* Data points */}
        {visiblePoints.map((p, i) => (
          <Circle
            key={`pt-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={Colors.accent}
            stroke={Colors.background}
            strokeWidth={2}
            onPress={() => handlePointPress(i)}
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          // Show a subset of labels to avoid overlap
          const showEvery = data.length > 8 ? Math.ceil(data.length / 6) : 1;
          if (i % showEvery !== 0 && i !== data.length - 1) return null;
          return (
            <SvgText
              key={`xlabel-${i}`}
              x={getX(i)}
              y={height - 6}
              textAnchor="middle"
              fill={Colors.textMuted}
              fontSize={Typography.sizes.xs}
            >
              {d.label}
            </SvgText>
          );
        })}

        {/* Tooltip */}
        {tooltipIndex != null && tooltipIndex < visiblePoints.length && (
          <G>
            <Rect
              x={visiblePoints[tooltipIndex].x - 30}
              y={visiblePoints[tooltipIndex].y - 28}
              width={60}
              height={20}
              rx={4}
              fill={Colors.card}
              stroke={Colors.accent}
              strokeWidth={1}
            />
            <SvgText
              x={visiblePoints[tooltipIndex].x}
              y={visiblePoints[tooltipIndex].y - 15}
              textAnchor="middle"
              fill={Colors.textPrimary}
              fontSize={Typography.sizes.xs}
              fontWeight={Typography.weights.semibold}
            >
              {formatYValue(data[tooltipIndex].value)}
            </SvgText>
          </G>
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
