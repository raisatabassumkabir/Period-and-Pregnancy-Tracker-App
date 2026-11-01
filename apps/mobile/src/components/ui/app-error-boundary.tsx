import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import React from 'react';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Pressable, View } from 'react-native';
import RNRestart from 'react-native-restart';

import { captureException } from '@/lib/monitoring';
import { usePaletteColors } from '@/lib/theme';

import { Text } from './text';

/** Accent fills are mid-tone in every palette and mode, so white reads on all. */
const ON_ACCENT_COLOR = '#FFFFFF';

export function ErrorFallback({ resetErrorBoundary }: FallbackProps) {
  const palette = usePaletteColors();
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
    <View
      className="flex-1 items-center justify-center bg-canvas px-6"
      testID="error-boundary-fallback"
    >
      <View className="size-16 items-center justify-center rounded-full bg-accent-200">
        <AlertTriangle size={32} color={palette.accent} strokeWidth={2.2} />
      </View>
      <Text className="mt-4 text-center font-heading text-2xl text-ink">
        Something went wrong
      </Text>
      <Text className="mt-2 max-w-[280px] text-center font-body text-sm leading-5 text-tone-600">
        We encountered an unexpected issue. Your health data remains safely
        stored. Tap below to reload the app.
      </Text>
      <Pressable
        accessibilityRole="button"
        testID="reload-app-button"
        onPress={handleReload}
        className="mt-7 h-12 flex-row items-center justify-center gap-2 rounded-pill bg-accent px-8 active:opacity-90"
      >
        <RotateCcw size={18} color={ON_ACCENT_COLOR} strokeWidth={2.5} />
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
        captureException(error, name);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
