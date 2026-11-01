import { Shield } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { AppState, type AppStateStatus, View } from 'react-native';

import { Text } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

/**
 * HealthTech Background Privacy Shield.
 *
 * When the app transitions to the `background` or `inactive` state (such as
 * when navigating the Android recent apps / multitasking carousel), this component
 * immediately mounts an opaque privacy overlay over the UI. This prevents
 * sensitive health data (cycles, symptoms, pregnancy logs) from being captured
 * in OS app-switcher snapshots or seen by bystanders.
 */
export function PrivacyShield({ children }: { children: React.ReactNode }) {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const isObscured = appState === 'inactive' || appState === 'background';
  const palette = usePaletteColors();

  return (
    <View className="flex-1">
      {children}
      {isObscured && (
        <View
          className="absolute inset-0 z-50 items-center justify-center bg-canvas"
          testID="privacy-shield-overlay"
        >
          <View className="items-center justify-center">
            <View className="size-[72px] items-center justify-center rounded-full bg-accent-200">
              <Shield size={36} color={palette.accent} strokeWidth={2.2} />
            </View>
            <Text className="mt-4 font-heading text-xl text-ink">
              Happy Women
            </Text>
            <Text className="mt-1 font-body text-sm text-tone-600">
              Protected for your privacy
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
