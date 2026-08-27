import { Bungee_400Regular } from '@expo-google-fonts/bungee';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import type { Session } from '@supabase/supabase-js';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { installGlobalErrorHandlers } from '@/lib/errorReporter';
import { migrateLocalMealsToSupabase } from '@/lib/mealsRepository';
import { fetchOnboarded } from '@/lib/profile';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { clearGoalsCache, isOnboardingComplete } from '@/utils/storage';

export { RootErrorBoundary as ErrorBoundary } from '@/components/RootErrorBoundary';

installGlobalErrorHandlers();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const CalSnapDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.primaryBg,
    card: Colors.cardBg,
    text: Colors.textPrimary,
    border: Colors.accentPrimary + '30',
    primary: Colors.accentPrimary,
  },
};

// Context so onboarding screen can signal completion to root layout
const OnboardingContext = createContext<{ markOnboarded: () => void }>({
  markOnboarded: () => {},
});
export const useOnboardingContext = () => useContext(OnboardingContext);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Bungee_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  const markOnboarded = useCallback(() => {
    setOnboarded(true);
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Track the Supabase auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      // The OAuth callback lands with the access/refresh token in the URL
      // fragment (#access_token=...). Supabase reads it on load but doesn't
      // clear it — strip it so a live session token never sits in the
      // address bar, browser history, or a shared link.
      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        window.location.hash.includes('access_token')
      ) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if (event === 'SIGNED_IN') {
        migrateLocalMealsToSupabase().finally(() => queryClient.invalidateQueries());
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear();
        clearGoalsCache().catch(() => {});
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Resolve onboarding status for the CURRENT user. Authoritative source is
  // the profile's `onboarded` column (so it's right after a reinstall, on a
  // new device, or when a different account signs in on this browser); the
  // per-user local flag is only a fallback when that fetch fails offline.
  const userId = session?.user?.id;
  useEffect(() => {
    if (session === undefined) return; // auth still resolving
    if (!userId) {
      setOnboarded(false); // no session — value is unused, routing goes to /auth
      return;
    }

    let cancelled = false;
    setOnboarded(null); // recompute for this user
    (async () => {
      const remote = await fetchOnboarded();
      const resolved = remote ?? (await isOnboardingComplete(userId));
      if (!cancelled) setOnboarded(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, session === undefined]);

  useEffect(() => {
    if (loaded && onboarded !== null && session !== undefined) {
      SplashScreen.hideAsync();
    }
  }, [loaded, onboarded, session]);

  // Handle routing based on auth + onboarding status
  useEffect(() => {
    if (onboarded === null || !loaded || session === undefined) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    const inLegal = segments[0] === 'privacy' || segments[0] === 'terms';

    if (!session && inLegal) {
      // Reachable without a session (pre-signup, or an app-store listing link).
      return;
    }
    if (!session && !inAuth) {
      router.replace('/auth');
    } else if (session && inAuth) {
      router.replace(onboarded ? '/(tabs)' : '/onboarding');
    } else if (session && !onboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (session && onboarded && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [session, onboarded, loaded, segments]);

  if (!loaded || onboarded === null || session === undefined) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider value={{ markOnboarded }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider value={CalSnapDarkTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="add-meal"
                options={{ presentation: 'fullScreenModal', animation: 'fade' }}
              />
              <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
              <Stack.Screen name="auth" options={{ animation: 'fade' }} />
              <Stack.Screen name="privacy" options={{ animation: 'fade' }} />
              <Stack.Screen name="terms" options={{ animation: 'fade' }} />
            </Stack>
          </ThemeProvider>
        </GestureHandlerRootView>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}
