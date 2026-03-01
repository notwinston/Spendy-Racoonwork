import React, { ReactNode } from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants';

type GlassIntensity = 'subtle' | 'medium' | 'strong';
type AccentEdge = 'left' | 'top' | 'none';

interface GlassCardProps {
  children: ReactNode;
  intensity?: GlassIntensity;
  accentEdge?: AccentEdge;
  accentColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

const INTENSITY_OPACITY: Record<GlassIntensity, number> = {
  subtle: 0.45,
  medium: 0.65,
  strong: 0.85,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  intensity = 'medium',
  accentEdge = 'none',
  accentColor = '#00D09C',
  style,
  onPress,
}: GlassCardProps) {
  const scale = useSharedValue(1);
  const opacity = INTENSITY_OPACITY[intensity];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const cardContent = (
    <>
      <LinearGradient
        colors={[
          `rgba(10, 22, 40, ${opacity})`,
          `rgba(15, 30, 50, ${opacity * 0.8})`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {accentEdge === 'left' && (
        <LinearGradient
          colors={[accentColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.accentLeft}
        />
      )}
      {accentEdge === 'top' && (
        <LinearGradient
          colors={[accentColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentTop}
        />
      )}
      <View style={styles.content}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        style={[styles.card, style, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return <View style={[styles.card, style]}>{cardContent}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.lg,
  },
  accentLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  accentTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});
