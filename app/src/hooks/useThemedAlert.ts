import { useState, useCallback } from 'react';
import type { ThemedAlertProps, ThemedAlertButton } from '../components/ui/ThemedAlert';

type AlertVariant = 'default' | 'success' | 'error' | 'warning';

interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function useThemedAlert() {
  const [state, setState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: ThemedAlertButton[];
    variant?: AlertVariant;
  }>({
    visible: false,
    title: '',
  });

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const info = useCallback((title: string, message?: string) => {
    setState({ visible: true, title, message, variant: 'default', buttons: [{ text: 'OK' }] });
  }, []);

  const error = useCallback((title: string, message?: string) => {
    setState({ visible: true, title, message, variant: 'error', buttons: [{ text: 'OK' }] });
  }, []);

  const success = useCallback((title: string, message?: string) => {
    setState({ visible: true, title, message, variant: 'success', buttons: [{ text: 'OK' }] });
  }, []);

  const warning = useCallback((title: string, message?: string) => {
    setState({ visible: true, title, message, variant: 'warning', buttons: [{ text: 'OK' }] });
  }, []);

  const confirm = useCallback(
    (title: string, message: string, options: ConfirmOptions) => {
      setState({
        visible: true,
        title,
        message,
        variant: options.destructive ? 'error' : 'default',
        buttons: [
          {
            text: options.cancelText ?? 'Cancel',
            style: 'cancel',
            onPress: options.onCancel,
          },
          {
            text: options.confirmText ?? 'Confirm',
            style: options.destructive ? 'destructive' : 'default',
            onPress: options.onConfirm,
          },
        ],
      });
    },
    [],
  );

  const custom = useCallback(
    (title: string, message: string | undefined, buttons: ThemedAlertButton[], variant?: AlertVariant) => {
      setState({ visible: true, title, message, buttons, variant: variant ?? 'default' });
    },
    [],
  );

  const alertProps: ThemedAlertProps = {
    visible: state.visible,
    title: state.title,
    message: state.message,
    buttons: state.buttons,
    variant: state.variant,
    onDismiss: dismiss,
  };

  return { alertProps, info, error, success, warning, confirm, custom, dismiss };
}
