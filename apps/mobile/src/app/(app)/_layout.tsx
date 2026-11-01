import { Tabs } from 'expo-router';
import {
  Apple,
  CalendarDays,
  HeartPulse,
  House,
  Sparkles,
} from 'lucide-react-native';
import React from 'react';

import { useCycles, useDailyLogs } from '@/api/cycles';
import { CalendarEmojiWarmup } from '@/components/calendar/calendar-emoji-warmup';
import { MedicalDisclaimerGate } from '@/components/legal';
import { AppErrorBoundary } from '@/components/ui';
import { useAuth, usePaletteColors } from '@/lib';
import { FEATURES } from '@/lib/features';
import { usePeriodReminderSync } from '@/lib/reminders';

const TAB_ICON_SIZE = 23;

/**
 * Starts the cycle and daily-log queries the moment the signed-in shell
 * mounts. Tabs mount lazily, so without this the Calendar only began fetching
 * when opened and its period / fertile / ovulation markings arrived late.
 */
function WarmHealthCache() {
  useCycles();
  useDailyLogs();
  return null;
}

/** Re-plans period reminders whenever the prediction or the settings change. */
function PeriodReminderSync() {
  usePeriodReminderSync();
  return null;
}

export default function TabLayout() {
  const status = useAuth.use.status();
  const palette = usePaletteColors();

  if (!status) return null;
  return (
    <AppErrorBoundary name="TabLayout">
      <MedicalDisclaimerGate>
        <WarmHealthCache />
        <PeriodReminderSync />
        <CalendarEmojiWarmup />
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
              // Mounted at startup, not on first tap: its month grid is the
              // heaviest render in the app, so the first open was visibly slow.
              lazy: false,
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
              href: FEATURES.assistant ? undefined : null,
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
      </MedicalDisclaimerGate>
    </AppErrorBoundary>
  );
}
