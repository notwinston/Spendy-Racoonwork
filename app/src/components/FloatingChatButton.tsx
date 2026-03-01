import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useChatStore } from '../stores/chatStore';
import { ChatSheet } from './ChatSheet';

export function FloatingChatButton() {
  const { isOpen, setOpen } = useChatStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <>
      {!isOpen && (
        <Animated.View style={[styles.pulseWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color={Colors.textPrimary} />
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
    bottom: 90,
    right: 20,
    zIndex: 999,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
