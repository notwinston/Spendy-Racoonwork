import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

type AlertVariant = 'default' | 'success' | 'error' | 'warning';

export interface ThemedAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ThemedAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: ThemedAlertButton[];
  variant?: AlertVariant;
  onDismiss?: () => void;
}

const VARIANT_COLORS: Record<AlertVariant, string> = {
  default: Colors.textPrimary,
  success: Colors.positive,
  error: Colors.negative,
  warning: Colors.warning,
};

export function ThemedAlert({
  visible,
  title,
  message,
  buttons,
  variant = 'default',
  onDismiss,
}: ThemedAlertProps) {
  const resolvedButtons: ThemedAlertButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];

  const handleButtonPress = (btn: ThemedAlertButton) => {
    btn.onPress?.();
    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <TouchableOpacity activeOpacity={1}>
          <Animated.View
            entering={ZoomIn.springify().damping(18).stiffness(200)}
            style={styles.card}
          >
            <LinearGradient
              colors={[
                'rgba(10, 22, 40, 0.95)',
                'rgba(15, 30, 50, 0.9)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardContent}>
              <Text style={[styles.title, { color: VARIANT_COLORS[variant] }]}>
                {title}
              </Text>
              {message ? (
                <Text style={styles.message}>{message}</Text>
              ) : null}
              <View style={styles.buttonRow}>
                {resolvedButtons.map((btn, i) => {
                  let bgColor: string = Colors.accent;
                  let textColor: string = Colors.textPrimary;
                  if (btn.style === 'cancel') {
                    bgColor = Colors.bgHover;
                    textColor = Colors.textSecondary;
                  } else if (btn.style === 'destructive') {
                    bgColor = Colors.negative;
                    textColor = Colors.textPrimary;
                  }

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.button, { backgroundColor: bgColor }]}
                      onPress={() => handleButtonPress(btn)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.buttonText, { color: textColor }]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  card: {
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    maxWidth: 340,
    width: '100%',
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  title: {
    ...Typography.heading.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusMd,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.heading.h3,
  },
});
