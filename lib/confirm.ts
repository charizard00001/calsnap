import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirmation dialog.
 *
 * react-native-web ships Alert as an empty no-op stub
 * (`class Alert { static alert() {} }`), so every Alert.alert-based
 * confirmation silently does nothing on web — which is CalSnap's primary
 * platform. This routes to window.confirm there and keeps the native
 * Alert on iOS/Android.
 *
 * Resolves true when the user confirms, false otherwise.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel = 'OK'
): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return Promise.resolve(false);
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/**
 * Cross-platform informational alert (no choice, just acknowledgement).
 */
export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
