import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing } from '../constants/spacing';

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

    // Forecast formula: (spent / daysElapsed) * totalDays
    const dailyRate = safeDaysElapsed > 0 ? spent / safeDaysElapsed : 0;
    const forecastTotal = dailyRate * safeTotalDays;

    // Confidence band: +/- 15% of forecast
    const confidenceHigh = spent + (forecastTotal - spent) * 1.15;
    const confidenceLow = spent + (forecastTotal - spent) * 0.85;

    // Helper: map data coordinates to SVG coordinates
    const toX = (day: number) =>
      PADDING_LEFT + (day / safeTotalDays) * PLOT_WIDTH;
    const toY = (amount: number) =>
      PADDING_TOP + PLOT_HEIGHT - (amount / maxY) * PLOT_HEIGHT;

    // Generate actual spending curve (simulated as linear from 0 to spent over elapsed days)
    const actualPoints: { x: number; y: number }[] = [];
    const steps = Math.max(1, safeDaysElapsed);
    for (let i = 0; i <= steps; i++) {
      const day = (i / steps) * safeDaysElapsed;
      const fraction = i / steps;
      const curvedFraction = fraction * fraction * (3 - 2 * fraction); // smoothstep
      const amount = curvedFraction * spent;
      actualPoints.push({ x: toX(day), y: toY(amount) });
    }

    // Generate predicted trajectory (dashed projection from today to end of month)
    const predictedPoints: { x: number; y: number }[] = [];
    const predSteps = Math.max(1, safeTotalDays - safeDaysElapsed);
    for (let i = 0; i <= predSteps; i++) {
      const day = safeDaysElapsed + (i / predSteps) * (safeTotalDays - safeDaysElapsed);
      const fraction = i / predSteps;
      const amount = spent + fraction * (forecastTotal - spent);
      predictedPoints.push({ x: toX(day), y: toY(amount) });
    }

    // Confidence band points
    const confHighPoints: { x: number; y: number }[] = [];
    const confLowPoints: { x: number; y: number }[] = [];
    for (let i = 0; i <= predSteps; i++) {
      const day = safeDaysElapsed + (i / predSteps) * (safeTotalDays - safeDaysElapsed);
      const fraction = i / predSteps;
      const highAmount = spent + fraction * (confidenceHigh - spent);
      const lowAmount = spent + fraction * (confidenceLow - spent);
      confHighPoints.push({ x: toX(day), y: toY(highAmount) });
      confLowPoints.push({ x: toX(day), y: toY(lowAmount) });
    }

    // Build SVG path strings
    const buildPath = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return '';
      return points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');
    };

    // Build area fill path between two lines
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
    const confidenceBandPath = buildAreaPath(confHighPoints, confLowPoints);

    // Shaded area under actual spending
    const actualBottomPoints = actualPoints.map((p) => ({
      x: p.x,
      y: toY(0),
    }));
    const actualAreaPath = buildAreaPath(actualPoints, actualBottomPoints);

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

    // Forecast callout
    const isOverBudget = forecastTotal > budget;
    const forecastDelta = isOverBudget
      ? forecastTotal - budget
      : budget - forecastTotal;

    return {
      actualPath,
      actualAreaPath,
      predictedPath,
      confidenceBandPath,
      budgetY,
      budgetLineX1,
      budgetLineX2,
      markerX,
      markerY,
      yLabels,
      xLabels,
      forecastTotal,
      isOverBudget,
      forecastDelta,
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
          <LinearGradient id="actualFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={Colors.accentBright} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={Colors.accentBright} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid background */}
        <Rect
          x={PADDING_LEFT}
          y={PADDING_TOP}
          width={PLOT_WIDTH}
          height={PLOT_HEIGHT}
          fill="none"
          stroke={Colors.borderSubtle}
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
              stroke={Colors.borderSubtle}
              strokeWidth={0.5}
              opacity={0.4}
            />
            <SvgText
              x={PADDING_LEFT - 6}
              y={label.y + 3}
              textAnchor="end"
              fill={Colors.textMuted}
              fontSize={10}
              fontFamily="DMMono_400Regular"
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
            fontSize={10}
            fontFamily="DMMono_400Regular"
          >
            {label.label}
          </SvgText>
        ))}

        {/* Budget ceiling (horizontal warning dashed line) */}
        <Line
          x1={chartData.budgetLineX1}
          y1={chartData.budgetY}
          x2={chartData.budgetLineX2}
          y2={chartData.budgetY}
          stroke={Colors.warning}
          strokeWidth={1.5}
          strokeDasharray="6,4"
          opacity={0.8}
        />
        <SvgText
          x={chartData.budgetLineX2}
          y={chartData.budgetY - 4}
          textAnchor="end"
          fill={Colors.warning}
          fontSize={8}
          fontFamily="DMMono_400Regular"
          opacity={0.8}
        >
          Budget
        </SvgText>

        {/* Gradient fill under actual spending */}
        {chartData.actualAreaPath ? (
          <Path
            d={chartData.actualAreaPath}
            fill="url(#actualFill)"
          />
        ) : null}

        {/* Confidence band (translucent shaded area) */}
        {chartData.confidenceBandPath ? (
          <Path
            d={chartData.confidenceBandPath}
            fill={Colors.chartConfidenceFill}
            opacity={0.5}
          />
        ) : null}

        {/* Actual spending curve (solid accent line) */}
        {chartData.actualPath ? (
          <Path
            d={chartData.actualPath}
            stroke={Colors.accentBright}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Predicted trajectory (dashed projection line, 20% opacity for future) */}
        {chartData.predictedPath ? (
          <Path
            d={chartData.predictedPath}
            stroke={Colors.accentBright}
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="5,3"
            strokeLinecap="round"
            opacity={0.2}
          />
        ) : null}

        {/* "You are here" marker */}
        <Circle
          cx={chartData.markerX}
          cy={chartData.markerY}
          r={5}
          fill={Colors.accentBright}
          stroke={Colors.bgCard}
          strokeWidth={2}
        />
        <SvgText
          x={chartData.markerX}
          y={chartData.markerY - 10}
          textAnchor="middle"
          fill={Colors.accentBright}
          fontSize={8}
          fontFamily="DMSans_600SemiBold"
          fontWeight="600"
        >
          Today
        </SvgText>
      </Svg>

      {/* Forecast Callout */}
      {daysElapsed > 0 && (
        <View
          style={[
            styles.forecastCallout,
            {
              backgroundColor: chartData.isOverBudget
                ? 'rgba(239,68,68,0.1)'
                : 'rgba(16,185,129,0.1)',
              borderColor: chartData.isOverBudget
                ? Colors.negative
                : Colors.positive,
            },
          ]}
        >
          <Ionicons
            name={chartData.isOverBudget ? 'warning' : 'checkmark-circle'}
            size={16}
            color={chartData.isOverBudget ? Colors.negative : Colors.positive}
            style={styles.forecastIcon}
          />
          <Text
            style={[
              styles.forecastText,
              {
                color: chartData.isOverBudget
                  ? Colors.negative
                  : Colors.positive,
              },
            ]}
          >
            {chartData.isOverBudget
              ? "At this pace, you'll overspend by "
              : "You're on pace to save "}
            <Text style={styles.forecastAmount}>
              ${Math.round(chartData.forecastDelta).toLocaleString()}
            </Text>
            {chartData.isOverBudget ? '' : ' this month'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  forecastCallout: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastIcon: {
    marginRight: Spacing.xs,
  },
  forecastText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  forecastAmount: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 12,
    fontWeight: '600',
  },
});
