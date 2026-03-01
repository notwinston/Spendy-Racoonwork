import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { Colors } from '../../constants';

interface ConfettiAnimationProps {
  active: boolean;
  duration?: number;
}

const CONFETTI_COLORS = [
  Colors.negative,
  Colors.warning,
  Colors.positive,
  Colors.accentBright,
  Colors.accentGlow,
  '#8B5CF6',
  '#F97316',
];

const PARTICLE_COUNT = 30;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  x: number;
  animY: Animated.Value;
  animOpacity: Animated.Value;
  color: string;
  size: number;
}

export function ConfettiAnimation({
  active,
  duration = 3000,
}: ConfettiAnimationProps) {
  const particles = useRef<Particle[]>([]);
  const hasInitialized = useRef(false);

  if (!hasInitialized.current) {
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      animY: new Animated.Value(-20),
      animOpacity: new Animated.Value(1),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
    }));
    hasInitialized.current = true;
  }

  useEffect(() => {
    if (!active) return;

    const animations = particles.current.map((p) => {
      p.animY.setValue(-20);
      p.animOpacity.setValue(1);

      const delay = Math.random() * (duration * 0.3);

      return Animated.parallel([
        Animated.timing(p.animY, {
          toValue: SCREEN_HEIGHT + 20,
          duration: duration - delay,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.animOpacity, {
          toValue: 0,
          duration: duration - delay,
          delay: delay + (duration * 0.5),
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  }, [active, duration]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              left: p.x,
              transform: [{ translateY: p.animY }],
              opacity: p.animOpacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
  },
});
