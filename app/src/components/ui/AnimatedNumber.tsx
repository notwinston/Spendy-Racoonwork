import React, { useEffect, useState, useCallback } from 'react';
import { Text, TextStyle } from 'react-native';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Typography } from '../../constants';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: TextStyle;
}

export function AnimatedNumber({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  style,
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  const updateDisplay = useCallback((v: number) => {
    setDisplayValue(Math.round(v));
  }, []);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration });
  }, [value, duration]);

  useAnimatedReaction(
    () => animatedValue.value,
    (current) => {
      runOnJS(updateDisplay)(current);
    },
  );

  return (
    <Text style={[defaultStyle, style]}>
      {`${prefix}${displayValue}${suffix}`}
    </Text>
  );
}

const defaultStyle: TextStyle = {
  fontSize: Typography.sizes['2xl'],
  fontWeight: Typography.weights.bold,
  color: Colors.textPrimary,
};
