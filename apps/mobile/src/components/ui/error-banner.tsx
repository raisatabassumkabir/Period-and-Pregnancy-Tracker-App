import React from 'react';
import { View } from 'react-native';

import { Text } from './text';

interface ErrorBannerProps {
  message?: string;
  testID?: string;
}

/**
 * Form-level error. Renders nothing without a message so it can stay mounted.
 *
 * `danger-*` comes from the fixed legacy scale in `colors.js`, not the palette
 * ramp, so it does not flip with the theme the way `tone-*` does — hence the
 * explicit `dark:` variants. A tinted, translucent panel reads as part of the
 * dark UI, where the light scale's near-white card would glare against it.
 */
export function ErrorBanner({ message, testID }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      className="mb-4 rounded-panel border border-danger-200 bg-danger-50 p-4 dark:border-danger-500/40 dark:bg-danger-500/10"
    >
      <Text className="font-body-semibold text-sm text-danger-600 dark:text-danger-300">
        {message}
      </Text>
    </View>
  );
}
