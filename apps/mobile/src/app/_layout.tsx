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
import { vars } from 'nativewind';
import React, { useEffect } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { APIProvider } from '@/api';
import { UpgradeSheet } from '@/components/billing';
import {
  hydrateAuth,
  loadSelectedPalette,
  loadSelectedTheme,
  useAuth,
  usePaletteTokens,
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

  const { status } = useAuth();

  // The only place that redirects on auth state. Screens never do this themselves.
  useEffect(() => {
    if (!navigationState?.key) return;

    const root = segments[0];
    const inAppGroup = root === APP_GROUP;
    const onAuthScreen = AUTH_ROUTES.has(root);

    if (status === 'signOut' && inAppGroup) {
      requestAnimationFrame(() => router.replace('/login'));
    } else if (status === 'signIn' && onAuthScreen) {
      requestAnimationFrame(() => router.replace('/(app)/'));
    }
  }, [status, segments, navigationState, router]);

  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  const paletteTokens = usePaletteTokens();

  return (
    <GestureHandlerRootView style={styles.container}>
      <View
        style={vars(paletteTokens)}
        className={theme.dark ? 'dark flex-1' : 'flex-1'}
      >
        <KeyboardProvider>
          <ThemeProvider value={theme}>
            <APIProvider>
              {isExpoGo ? (
                <>
                  {children}
                  <FlashMessage position="top" />
                </>
              ) : (
                <BottomSheetModalProvider>
                  {children}
                  <UpgradeSheet />
                  <FlashMessage position="top" />
                </BottomSheetModalProvider>
              )}
            </APIProvider>
          </ThemeProvider>
        </KeyboardProvider>
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
