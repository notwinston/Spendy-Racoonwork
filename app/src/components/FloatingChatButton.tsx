import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useChatStore } from '../stores/chatStore';
import { ChatSheet } from './ChatSheet';

const BUTTON_SIZE = 52;
const GLOW_SIZE = 64;
const SCREEN_PADDING = 10;
const DRAG_THRESHOLD = 5;

export function FloatingChatButton() {
  const { isOpen, setOpen } = useChatStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const { width: screenW, height: screenH } = Dimensions.get('window');

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isDragging = useRef(false);
  const lastOffset = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > DRAG_THRESHOLD || Math.abs(gesture.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({ x: lastOffset.current.x, y: lastOffset.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        if (
          Math.abs(gesture.dx) > DRAG_THRESHOLD ||
          Math.abs(gesture.dy) > DRAG_THRESHOLD
        ) {
          isDragging.current = true;
        }
        // Clamp within screen bounds
        const baseRight = 20;
        const baseBottom = 32;
        const baseX = screenW - baseRight - BUTTON_SIZE;
        const baseY = screenH - baseBottom - BUTTON_SIZE;

        const newX = lastOffset.current.x + gesture.dx;
        const newY = lastOffset.current.y + gesture.dy;

        const clampedX = Math.max(-baseX + SCREEN_PADDING, Math.min(SCREEN_PADDING, newX));
        const clampedY = Math.max(-baseY + SCREEN_PADDING, Math.min(SCREEN_PADDING, newY));

        pan.setValue({
          x: clampedX - lastOffset.current.x,
          y: clampedY - lastOffset.current.y,
        });
      },
      onPanResponderRelease: (_, gesture) => {
        const newX = lastOffset.current.x + gesture.dx;
        const newY = lastOffset.current.y + gesture.dy;

        const baseRight = 20;
        const baseBottom = 32;
        const baseX = screenW - baseRight - BUTTON_SIZE;
        const baseY = screenH - baseBottom - BUTTON_SIZE;

        const clampedX = Math.max(-baseX + SCREEN_PADDING, Math.min(SCREEN_PADDING, newX));
        const clampedY = Math.max(-baseY + SCREEN_PADDING, Math.min(SCREEN_PADDING, newY));

        lastOffset.current = { x: clampedX, y: clampedY };
        pan.setOffset({ x: clampedX, y: clampedY });
        pan.setValue({ x: 0, y: 0 });

        if (!isDragging.current) {
          setOpen(true);
        }
      },
    }),
  ).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [pulseAnim, glowAnim]);

  return (
    <>
      {!isOpen && (
        <Animated.View
          style={[
            styles.pulseWrapper,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale: pulseAnim },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Breathing glow ring */}
          <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
          <View style={styles.button}>
            <Ionicons name="chatbubble-ellipses" size={22} color={Colors.textPrimary} />
          </View>
        </Animated.View>
      )}
      <ChatSheet />
    </>
  );
}

const styles = StyleSheet.create({
  pulseWrapper: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentBright,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.glowTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
