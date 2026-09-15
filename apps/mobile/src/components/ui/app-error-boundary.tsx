import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import React from 'react';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Pressable, StyleSheet, View } from 'react-native';
import RNRestart from 'react-native-restart';

import { Text } from './text';

export function ErrorFallback({ resetErrorBoundary }: FallbackProps) {
  const handleReload = () => {
    try {
      if (RNRestart && typeof RNRestart.restart === 'function') {
        RNRestart.restart();
        return;
      }
      if (RNRestart && typeof (RNRestart as any).Restart === 'function') {
        (RNRestart as any).Restart();
        return;
      }
    } catch {
      // Fall back to resetting boundary
    }
    resetErrorBoundary();
  };

  return (
    <View style={styles.container} testID="error-boundary-fallback">
      <View style={styles.iconCircle}>
        <AlertTriangle size={32} color="#B83253" strokeWidth={2.2} />
      </View>
      <Text className="font-heading mt-4 text-center text-2xl text-[#2D2D2D]">
        Something went wrong
      </Text>
      <Text className="font-body mt-2 max-w-[280px] text-center text-sm leading-5 text-[#7A7A7A]">
        We encountered an unexpected issue. Your health data remains safely stored. Tap below to reload the app.
      </Text>
      <Pressable
        accessibilityRole="button"
        testID="reload-app-button"
        onPress={handleReload}
        className="mt-7 h-12 flex-row items-center justify-center gap-2 rounded-pill bg-[#B83253] px-8 active:opacity-90"
        style={styles.buttonShadow}
      >
        <RotateCcw size={18} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="font-body-bold text-[16px] text-white">
          Reload App
        </Text>
      </Pressable>
    </View>
  );
}

export function AppErrorBoundary({
  children,
  name,
}: {
  children: React.ReactNode;
  name?: string;
}) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error(
          `[AppErrorBoundary${name ? ` - ${name}` : ''}] Caught error:`,
          error,
          info
        );
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonShadow: {
    shadowColor: '#B83253',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
});
