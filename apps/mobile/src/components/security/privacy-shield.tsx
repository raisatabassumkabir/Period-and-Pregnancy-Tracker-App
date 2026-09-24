import { Shield } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';

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

  return (
    <View style={styles.container}>
      {children}
      {isObscured && (
        <View style={styles.overlay} testID="privacy-shield-overlay">
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Shield size={36} color="#B83253" strokeWidth={2.2} />
            </View>
            <Text className="mt-4 font-heading text-xl text-[#2D2D2D]">
              Happy Women
            </Text>
            <Text className="mt-1 font-body text-sm text-[#7A7A7A]">
              Protected for your privacy
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FCF8F5',
    zIndex: 999999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFE5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
