import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { useChatStore } from '../stores/chatStore';
import { ChatSheet } from './ChatSheet';

export function FloatingChatButton() {
  const { isOpen, setOpen } = useChatStore();

  return (
    <>
      {!isOpen && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      )}
      <ChatSheet />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 90,
    right: 20,
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
    zIndex: 999,
  },
});
