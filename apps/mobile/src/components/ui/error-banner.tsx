import React from 'react';
import { View } from 'react-native';

import { Text } from './text';

interface ErrorBannerProps {
  message?: string;
}

/** Form-level error. Renders nothing without a message so it can stay mounted. */
export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <View className="mb-2 rounded-panel border border-danger-200 bg-danger-50 p-4">
      <Text className="font-body-semibold text-sm text-danger-600">
        {message}
      </Text>
    </View>
  );
}
