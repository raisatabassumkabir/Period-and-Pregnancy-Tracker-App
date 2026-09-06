import { Tabs } from 'expo-router';
import {
  Apple,
  CalendarDays,
  HeartPulse,
  House,
  Settings,
  Sparkles,
} from 'lucide-react-native';
import React from 'react';

import { useAuth, usePaletteColors } from '@/lib';

const TAB_ICON_SIZE = 23;

/**
 * Auth-gated tab bar. Add a tab by adding a file under `(app)/` and a
 * `Tabs.Screen` here; hide a route from the bar with `href: null`.
 */
export default function TabLayout() {
  const status = useAuth.use.status();
  const palette = usePaletteColors();

  // The splash is hidden by the root layout once every startup read has
  // landed (`useAppReady`), so this layout only draws the bar.
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
        name="calendar"
        options={{
          title: 'Calendar',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <CalendarDays color={color} size={TAB_ICON_SIZE} />
          ),
          tabBarButtonTestID: 'calendar-tab',
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Track',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <HeartPulse color={color} size={TAB_ICON_SIZE} />
          ),
          tabBarButtonTestID: 'tracking-tab',
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: 'Diet',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Apple color={color} size={TAB_ICON_SIZE} />
          ),
          tabBarButtonTestID: 'diet-tab',
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Sparkles color={color} size={TAB_ICON_SIZE} />
          ),
          tabBarButtonTestID: 'assistant-tab',
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
