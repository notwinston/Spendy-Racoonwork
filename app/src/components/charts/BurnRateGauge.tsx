import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Line,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export interface BurnRateGaugeProps {
  rate: number;
  size?: number;
  showLabel?: boolean;
}

function getZoneColor(rate: number): string {
  if (rate < 0.8) return Colors.burnExcellent;
  if (rate < 1.0) return Colors.burnOnTrack;
  if (rate < 1.2) return Colors.burnCaution;
  return Colors.burnOver;
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export const BurnRateGauge: React.FC<BurnRateGaugeProps> = ({
  rate: rawRate,
  size = 120,
  showLabel = true,
}) => {
  const rate = Math.max(0.5, Math.min(1.5, rawRate || 0.5));
  const cx = size / 2;
  const cy = size / 2 + 5;
  const radius = size / 2 - 12;
  const strokeW = 10;

  // Reanimated needle sweep animation
  const rateToAngle = (r: number) => 180 + ((r - 0.5) / 1.0) * 180;

  const targetAngle = rateToAngle(rate);
  const animatedAngle = useSharedValue(180); // start from left
  const [displayAngle, setDisplayAngle] = useState(180);

  const updateAngle = useCallback((v: number) => {
    setDisplayAngle(v);
  }, []);

  useEffect(() => {
    animatedAngle.value = withSpring(targetAngle, { damping: 12, stiffness: 80 });
  }, [targetAngle]);

  useAnimatedReaction(
    () => animatedAngle.value,
    (current) => {
      runOnJS(updateAngle)(current);
    },
  );

  // Pulse scale for over-budget
  const scale = useSharedValue(1);

  useEffect(() => {
    if (rate > 1.0) {
      const runPulse = () => {
        scale.value = withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }, () => {
          scale.value = withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) }, () => {
            runPulse();
          });
        });
      };
      runPulse();
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [rate]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Zone boundaries in rate space
  const zones = [
    { start: 0.5, end: 0.8, color: Colors.burnExcellent },
    { start: 0.8, end: 1.0, color: Colors.burnOnTrack },
    { start: 1.0, end: 1.2, color: Colors.burnCaution },
    { start: 1.2, end: 1.5, color: Colors.burnOver },
  ];

  // Needle position derived from animated angle
  const needleRad = (displayAngle * Math.PI) / 180;
  const needleLength = radius - 8;
  const needleX = cx + needleLength * Math.cos(needleRad);
  const needleY = cy + needleLength * Math.sin(needleRad);

  const zoneColor = getZoneColor(rate);
  const svgHeight = size / 2 + 30 + (showLabel ? 24 : 0);

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: svgHeight },
        animatedContainerStyle,
      ]}
    >
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`}>
        {/* Zone arcs */}
        {zones.map((zone, i) => (
          <Path
            key={i}
            d={describeArc(cx, cy, radius, rateToAngle(zone.start), rateToAngle(zone.end))}
            stroke={zone.color}
            strokeWidth={strokeW}
            fill="none"
            strokeLinecap="butt"
          />
        ))}

        {/* Needle */}
        <Line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={Colors.textPrimary}
          strokeWidth={2}
        />
        <Circle cx={cx} cy={cy} r={4} fill={Colors.textPrimary} />

        {/* Scale labels */}
        <SvgText
          x={cx - radius - 4}
          y={cy + 16}
          textAnchor="middle"
          fill={Colors.textMuted}
          fontSize={Typography.sizes.xs}
        >
          0.5x
        </SvgText>
        <SvgText
          x={cx}
          y={cy - radius - 6}
          textAnchor="middle"
          fill={Colors.textMuted}
          fontSize={Typography.sizes.xs}
        >
          1.0x
        </SvgText>
        <SvgText
          x={cx + radius + 4}
          y={cy + 16}
          textAnchor="middle"
          fill={Colors.textMuted}
          fontSize={Typography.sizes.xs}
        >
          1.5x
        </SvgText>

        {/* Rate label */}
        {showLabel && (
          <SvgText
            x={cx}
            y={cy + 30}
            textAnchor="middle"
            fill={zoneColor}
            fontSize={Typography.sizes.lg}
            fontWeight={Typography.weights.bold}
          >
            {rawRate.toFixed(2)}x
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
