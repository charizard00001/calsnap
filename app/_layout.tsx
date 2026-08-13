import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useMealStore } from '@/store/useMealStore';
import { isOnboardingComplete } from '@/utils/storage';

export { ErrorBoundary } from 'expo-router';

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
    border: Colors.jjkPurple + '30',
    primary: Colors.jjkPurple,
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
  });
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const loadToday = useMealStore((s) => s.loadToday);
  const loadGoals = useMealStore((s) => s.loadGoals);

  const markOnboarded = useCallback(() => {
    setOnboarded(true);
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Check onboarding status and load data
  useEffect(() => {
    (async () => {
      const done = await isOnboardingComplete();
      setOnboarded(done);
      if (done) {
        await Promise.all([loadToday(), loadGoals()]);
      }
    })();
  }, []);

  useEffect(() => {
    if (loaded && onboarded !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, onboarded]);

  // Handle routing based on onboarding status
  useEffect(() => {
    if (onboarded === null || !loaded) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboarded && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [onboarded, loaded]);

  if (!loaded || onboarded === null) {
    return null;
  }

  return (
    <OnboardingContext.Provider value={{ markOnboarded }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={CalSnapDarkTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="add-meal"
              options={{ presentation: 'fullScreenModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="onboarding"
              options={{ animation: 'fade' }}
            />
          </Stack>
        </ThemeProvider>
      </GestureHandlerRootView>
    </OnboardingContext.Provider>
  );
}
