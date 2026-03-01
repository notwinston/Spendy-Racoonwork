import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextStyle } from 'react-native';
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
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.setValue(0);

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration, animatedValue]);

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
