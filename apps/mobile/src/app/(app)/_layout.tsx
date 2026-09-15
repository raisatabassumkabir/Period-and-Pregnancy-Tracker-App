import { Tabs, useRouter } from 'expo-router';
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
import { usePersonalizationProfile } from '@/lib/health/use-personalization-profile';
import { AppErrorBoundary } from '@/components/ui';

const TAB_ICON_SIZE = 23;

export default function TabLayout() {
  const status = useAuth.use.status();
  const palette = usePaletteColors();
  const { profile, isLoading } = usePersonalizationProfile();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'signIn' && !isLoading && !profile.hasCompletedOnboarding) {
      requestAnimationFrame(() => router.replace('/onboarding'));
    }
  }, [status, isLoading, profile.hasCompletedOnboarding, router]);

  if (!status) return null;
  return (
    <AppErrorBoundary name="TabLayout">
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
          href: null,
          headerShown: false,
          tabBarButtonTestID: 'settings-tab',
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="symptoms"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
    </AppErrorBoundary>
  );
}
