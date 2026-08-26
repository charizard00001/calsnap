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
 *
 * On web this used to call window.alert, which blocks the entire renderer
 * until dismissed — a bad fit for a fire-and-forget confirmation (e.g. the
 * "Re-logged" toast after cloning a meal). It now shows a self-dismissing
 * DOM toast instead. Native still uses the OS Alert.
 */
export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') showWebToast(title, message);
    return;
  }
  Alert.alert(title, message);
}

let toastContainer: HTMLElement | null = null;

function showWebToast(title: string, message: string): void {
  if (!toastContainer || !toastContainer.isConnected) {
    toastContainer = document.createElement('div');
    Object.assign(toastContainer.style, {
      position: 'fixed',
      left: '0',
      right: '0',
      bottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      zIndex: '99999',
      pointerEvents: 'none',
    });
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.textContent = message ? `${title} — ${message}` : title;
  Object.assign(toast.style, {
    maxWidth: '90vw',
    padding: '12px 18px',
    borderRadius: '12px',
    background: '#17171F',
    color: '#F5F5FA',
    border: '1px solid rgba(255,77,122,0.35)',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'opacity 180ms ease, transform 180ms ease',
  });
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 220);
  }, 2600);
}
