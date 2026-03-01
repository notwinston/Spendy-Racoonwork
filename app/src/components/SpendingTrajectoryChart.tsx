import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Line,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { Colors } from '../constants/colors';

interface SpendingTrajectoryChartProps {
  spent: number;
  predicted: number;
  budget: number;
  daysElapsed: number;
  totalDays: number;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 160;
const PADDING_LEFT = 42;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

const PLOT_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

export function SpendingTrajectoryChart({
  spent,
  predicted,
  budget,
  daysElapsed,
  totalDays,
}: SpendingTrajectoryChartProps) {
  const chartData = useMemo(() => {
    const maxY = Math.max(budget * 1.15, spent, predicted) || 1;
    const safeTotalDays = totalDays || 30;
    const safeDaysElapsed = Math.max(0, Math.min(daysElapsed, safeTotalDays));

    // Helper: map data coordinates to SVG coordinates
    const toX = (day: number) =>
      PADDING_LEFT + (day / safeTotalDays) * PLOT_WIDTH;
    const toY = (amount: number) =>
      PADDING_TOP + PLOT_HEIGHT - (amount / maxY) * PLOT_HEIGHT;

    // Generate actual spending curve (simulated as linear from 0 to spent over elapsed days)
    // In a real app this would use daily aggregated transaction data
    const actualPoints: { x: number; y: number }[] = [];
    const steps = Math.max(1, safeDaysElapsed);
    for (let i = 0; i <= steps; i++) {
      const day = (i / steps) * safeDaysElapsed;
      // Slight curve (ease-in) to look more natural
      const fraction = i / steps;
      const curvedFraction = fraction * fraction * (3 - 2 * fraction); // smoothstep
      const amount = curvedFraction * spent;
      actualPoints.push({ x: toX(day), y: toY(amount) });
    }

    // Generate predicted trajectory (from current day/spent to end-of-month/predicted)
    const predictedPoints: { x: number; y: number }[] = [];
    const predSteps = Math.max(1, safeTotalDays - safeDaysElapsed);
    for (let i = 0; i <= predSteps; i++) {
      const day = safeDaysElapsed + (i / predSteps) * (safeTotalDays - safeDaysElapsed);
      const fraction = i / predSteps;
      const amount = spent + fraction * (predicted - spent);
      predictedPoints.push({ x: toX(day), y: toY(amount) });
    }

    // Build SVG path strings
    const buildPath = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return '';
      return points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');
    };

    // Build area fill path (actual line -> down to bottom -> back to start)
    const buildAreaPath = (
      topPoints: { x: number; y: number }[],
      bottomPoints: { x: number; y: number }[],
    ) => {
      if (topPoints.length === 0 || bottomPoints.length === 0) return '';
      const top = topPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');
      const bottom = [...bottomPoints]
        .reverse()
        .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');
      return `${top} ${bottom} Z`;
    };

    const actualPath = buildPath(actualPoints);
    const predictedPath = buildPath(predictedPoints);

    // Shaded area between predicted line and a straight line from (daysElapsed,spent) to (totalDays,spent)
    const baselinePoints = predictedPoints.map((p) => ({
      x: p.x,
      y: toY(spent),
    }));
    const shadedAreaPath = buildAreaPath(predictedPoints, baselinePoints);

    // Budget ceiling line
    const budgetY = toY(budget);
    const budgetLineX1 = toX(0);
    const budgetLineX2 = toX(safeTotalDays);

    // "You are here" marker
    const markerX = toX(safeDaysElapsed);
    const markerY = toY(spent);

    // Y-axis labels
    const yLabels = [
      { value: 0, y: toY(0), label: '$0' },
      { value: maxY / 2, y: toY(maxY / 2), label: `$${Math.round(maxY / 2)}` },
      { value: maxY, y: toY(maxY), label: `$${Math.round(maxY)}` },
    ];

    // X-axis labels
    const xLabels = [
      { day: 1, x: toX(1), label: '1' },
      { day: Math.round(safeTotalDays / 2), x: toX(Math.round(safeTotalDays / 2)), label: `${Math.round(safeTotalDays / 2)}` },
      { day: safeTotalDays, x: toX(safeTotalDays), label: `${safeTotalDays}` },
    ];

    return {
      actualPath,
      predictedPath,
      shadedAreaPath,
      budgetY,
      budgetLineX1,
      budgetLineX2,
      markerX,
      markerY,
      yLabels,
      xLabels,
    };
  }, [spent, predicted, budget, daysElapsed, totalDays]);

  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <Defs>
          <LinearGradient id="shadeFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={Colors.accent} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={Colors.accent} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid background */}
        <Rect
          x={PADDING_LEFT}
          y={PADDING_TOP}
          width={PLOT_WIDTH}
          height={PLOT_HEIGHT}
          fill="none"
          stroke={Colors.cardBorder}
          strokeWidth={0.5}
          opacity={0.3}
        />

        {/* Y-axis labels and grid lines */}
        {chartData.yLabels.map((label, i) => (
          <React.Fragment key={`y-${i}`}>
            <Line
              x1={PADDING_LEFT}
              y1={label.y}
              x2={PADDING_LEFT + PLOT_WIDTH}
              y2={label.y}
              stroke={Colors.cardBorder}
              strokeWidth={0.5}
              opacity={0.4}
            />
            <SvgText
              x={PADDING_LEFT - 6}
              y={label.y + 3}
              textAnchor="end"
              fill={Colors.textMuted}
              fontSize={9}
            >
              {label.label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X-axis labels */}
        {chartData.xLabels.map((label, i) => (
          <SvgText
            key={`x-${i}`}
            x={label.x}
            y={CHART_HEIGHT - 6}
            textAnchor="middle"
            fill={Colors.textMuted}
            fontSize={9}
          >
            {label.label}
          </SvgText>
        ))}

        {/* Budget ceiling (horizontal red dashed line) */}
        <Line
          x1={chartData.budgetLineX1}
          y1={chartData.budgetY}
          x2={chartData.budgetLineX2}
          y2={chartData.budgetY}
          stroke={Colors.danger}
          strokeWidth={1.5}
          strokeDasharray="6,4"
          opacity={0.8}
        />
        <SvgText
          x={chartData.budgetLineX2}
          y={chartData.budgetY - 4}
          textAnchor="end"
          fill={Colors.danger}
          fontSize={8}
          opacity={0.8}
        >
          Budget
        </SvgText>

        {/* Shaded area between actual-to-predicted trajectory and baseline */}
        {chartData.shadedAreaPath ? (
          <Path
            d={chartData.shadedAreaPath}
            fill="url(#shadeFill)"
          />
        ) : null}

        {/* Actual spending curve (solid green line) */}
        {chartData.actualPath ? (
          <Path
            d={chartData.actualPath}
            stroke={Colors.accent}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Predicted trajectory (dashed accent line) */}
        {chartData.predictedPath ? (
          <Path
            d={chartData.predictedPath}
            stroke={Colors.chartPredictionDashed}
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="5,3"
            strokeLinecap="round"
            opacity={0.7}
          />
        ) : null}

        {/* "You are here" marker */}
        <Circle
          cx={chartData.markerX}
          cy={chartData.markerY}
          r={5}
          fill={Colors.accent}
          stroke={Colors.card}
          strokeWidth={2}
        />
        <SvgText
          x={chartData.markerX}
          y={chartData.markerY - 10}
          textAnchor="middle"
          fill={Colors.accent}
          fontSize={8}
          fontWeight="600"
        >
          Today
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
});
