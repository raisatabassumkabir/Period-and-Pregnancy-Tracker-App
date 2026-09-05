import { SplashScreen, Tabs } from 'expo-router';
import { House, Settings } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';

import { useAuth, usePaletteColors } from '@/lib';

const TAB_ICON_SIZE = 23;
const SPLASH_HIDE_DELAY_MS = 1000;

/**
 * Auth-gated tab bar. Add a tab by adding a file under `(app)/` and a
 * `Tabs.Screen` here; hide a route from the bar with `href: null`.
 */
export default function TabLayout() {
  const status = useAuth.use.status();
  const palette = usePaletteColors();

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);
  useEffect(() => {
    if (status !== 'idle') {
      setTimeout(() => {
        hideSplash();
      }, SPLASH_HIDE_DELAY_MS);
    }
  }, [hideSplash, status]);

  // Auth checks handled by Root Layout
  if (!status) return null;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.tone[600],
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: palette.divider,
          backgroundColor: palette.tone[100],
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <House color={color} size={TAB_ICON_SIZE} />
          ),
          tabBarButtonTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Settings color={color} size={TAB_ICON_SIZE} />
          ),
          tabBarButtonTestID: 'settings-tab',
        }}
      />
    </Tabs>
  );
}
