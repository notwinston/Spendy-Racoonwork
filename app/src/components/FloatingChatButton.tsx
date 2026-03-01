import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useChatStore } from '../stores/chatStore';
import { ChatSheet } from './ChatSheet';

export function FloatingChatButton() {
  const { isOpen, setOpen } = useChatStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

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
        <Animated.View style={[styles.pulseWrapper, { transform: [{ scale: pulseAnim }] }]}>
          {/* Breathing glow ring */}
          <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
          <TouchableOpacity
            style={styles.button}
            onPress={() => setOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
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
