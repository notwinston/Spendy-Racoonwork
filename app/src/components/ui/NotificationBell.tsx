import React, { useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants';

interface NotificationBellProps {
  count?: number;
  onPress?: () => void;
}

export function NotificationBell({ count = 0, onPress }: NotificationBellProps) {
  const rotation = useSharedValue(0);
  const badgeScale = useSharedValue(count > 0 ? 1 : 0);

  useEffect(() => {
    if (count > 0) {
      // Tilt animation on count change
      rotation.value = withSequence(
        withTiming(15, { duration: 100 }),
        withTiming(-15, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );
      // Badge scale in
      badgeScale.value = withSpring(1, { damping: 12 });
    } else {
      badgeScale.value = withTiming(0, { duration: 150 });
    }
  }, [count]);

  const bellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={bellAnimatedStyle}>
        <Ionicons
          name="notifications-outline"
          size={24}
          color={Colors.textPrimary}
        />
      </Animated.View>
      {count > 0 ? (
        <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
          <Text style={styles.badgeText}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </Animated.View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.destructiveRed,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
});
