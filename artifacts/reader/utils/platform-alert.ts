import { Alert as RNAlert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertOptions = {
  cancelable?: boolean;
  onDismiss?: () => void;
};

function webAlert(
  title: string,
  message?: string,
  buttons?: AlertButtons,
): void {
  const text = message ? `${title}\n\n${message}` : title;
  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }
  const hasDestructive = buttons.some((b) => b.style === 'destructive');
  const hasCancel = buttons.some((b) => b.style === 'cancel');
  if (hasDestructive && window.confirm(text)) {
    const destructive = buttons.find((b) => b.style === 'destructive');
    destructive?.onPress?.();
    return;
  }
  if (hasCancel && buttons.length === 2) {
    const confirmBtn = buttons.find((b) => b.style !== 'cancel');
    if (confirmBtn && window.confirm(text)) {
      confirmBtn.onPress?.();
      return;
    }
    return;
  }
  window.alert(text);
}

type AlertButtons = AlertButton[];

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButtons,
  options?: AlertOptions,
): void {
  if (Platform.OS === 'web') {
    webAlert(title, message, buttons);
    return;
  }
  if (buttons && buttons.length > 0) {
    RNAlert.alert(title, message, buttons, options);
  } else {
    RNAlert.alert(title, message);
  }
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    } else {
      onCancel?.();
    }
    return;
  }
  RNAlert.alert(title, message, [
    { text: 'İptal', style: 'cancel', onPress: onCancel },
    { text: 'Tamam', onPress: onConfirm },
  ]);
}
