import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Web-only for now (matches the app's web-first distribution) — native
// would need @react-native-community/netinfo, not yet a dependency here.
// Native always reports "online" rather than guessing.
export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState(
    Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
