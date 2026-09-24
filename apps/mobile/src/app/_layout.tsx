// Import  global CSS file
import '../../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { colorScheme, vars } from 'nativewind';
import React, { useEffect } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { APIProvider } from '@/api';
import { UpgradeSheet } from '@/components/billing';
import { PrivacyShield } from '@/components/security';
import { AppErrorBoundary } from '@/components/ui';
import {
  hydrateAuth,
  loadSelectedPalette,
  loadSelectedTheme,
  useAppReady,
  useAuth,
  useIsFirstTime,
  usePaletteTokens,
  useSelectedTheme,
} from '@/lib';
import { registerNativeIntegrations } from '@/lib/bootstrap';
import { useThemeConfig } from '@/lib/use-theme-config';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(app)',
};

registerNativeIntegrations();
hydrateAuth();
loadSelectedTheme();
loadSelectedPalette();
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/** Top-level routes that are valid for both signed-in and signed-out users. */
const AUTH_ROUTES = new Set(['login', 'register', 'onboarding']);
const APP_GROUP = '(app)';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const { status, token } = useAuth();
  const [isFirstTime, , isFirstTimeReady] = useIsFirstTime();
  const isAppReady = useAppReady();
  const { selectedTheme } = useSelectedTheme();

  // `loadSelectedTheme()` above runs at module scope and is fire-and-forget, so
  // on a cold start nativewind can finish initialising after it and re-apply
  // the OS scheme — leaving Settings reading "Dark" while the app renders
  // light. Re-asserting the stored choice from inside the tree settles it.
  useEffect(() => {
    colorScheme.set(selectedTheme);
  }, [selectedTheme]);

  // Hold the splash until the token read, palette and router state have all
  // landed — hiding it earlier shows an unstyled frame or the wrong screen.
  useEffect(() => {
    if (!isAppReady) return;
    SplashScreen.hideAsync().catch(() => {
      // Already hidden (a fast refresh, or a duplicate call). Nothing to do.
    });
  }, [isAppReady]);

  // The only place that redirects on auth state. Screens never do this themselves.
  useEffect(() => {
    if (!navigationState?.key) return;

    const root = segments[0];
    const onAuthScreen = AUTH_ROUTES.has(root);

    if (!token && !onAuthScreen) {
      if (!isFirstTimeReady) return;
      const target = isFirstTime ? '/onboarding' : '/login';

      // Force dismiss any active modals so they don't block the redirect
      if (router.canDismiss()) {
        router.dismissAll();
      }
      requestAnimationFrame(() => router.replace(target));
    } else if (token && onAuthScreen) {
      // Allow onboarding to stay mounted until completed
      if (root !== 'onboarding') {
        requestAnimationFrame(() => router.replace('/(app)'));
      }
    }
  }, [
    status,
    token,
    segments,
    navigationState,
    router,
    isFirstTime,
    isFirstTimeReady,
  ]);

  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="setup-profile" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  const paletteTokens = usePaletteTokens();

  return (
    // `GestureHandlerRootView` is a third-party component, so
    // react-native-css-interop never processes it — a `className` or a `vars()`
    // style placed on it is silently dropped. The palette variables and the
    // `dark` class therefore live on a plain RN `View` just inside it, which
    // css-interop does handle. Every `bg-accent` / `text-accent-700` below
    // resolves through that node.
    <GestureHandlerRootView style={styles.container}>
      <View
        style={vars(paletteTokens)}
        className={theme.dark ? 'dark flex-1' : 'flex-1'}
      >
        <AppErrorBoundary name="RootLayout">
          <PrivacyShield>
            <KeyboardProvider>
              <ThemeProvider value={theme}>
                <APIProvider>
                  <BottomSheetModalProvider>
                    {children}
                    <UpgradeSheet />
                    <FlashMessage position="top" />
                  </BottomSheetModalProvider>
                </APIProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </PrivacyShield>
        </AppErrorBoundary>
      </View>
    </GestureHandlerRootView>
  );
}

// The one sanctioned StyleSheet: a third-party root that css-interop skips.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
