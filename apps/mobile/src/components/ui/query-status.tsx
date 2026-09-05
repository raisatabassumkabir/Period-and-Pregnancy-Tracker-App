import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { usePaletteColors } from '@/lib/theme';

import { Text } from './text';

interface QueryStatusProps {
  isPending: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyCopy: string;
  loadingTestID: string;
  onRetry: () => void;
}

/**
 * Loading / error / empty branch for one query-backed section. Returns `null`
 * when rows should render, so a caller reads as
 * `<QueryStatus … />{rows.map(…)}`.
 */
export function QueryStatus(props: QueryStatusProps) {
  const colors = usePaletteColors();

  if (props.isPending) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator color={colors.accent} testID={props.loadingTestID} />
      </View>
    );
  }

  if (props.isError) {
    return (
      <View className="mt-3 items-center rounded-card bg-surface p-4">
        <Text className="text-sm text-tone-700">
          {"Couldn't load this section."}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={props.onRetry}
          className="mt-3 rounded-full bg-tone-200 px-4 py-2"
        >
          <Text className="font-body-semibold text-[13px] text-ink">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (props.isEmpty) {
    return (
      <View className="mt-3 rounded-card bg-surface p-4">
        <Text className="text-sm leading-5 text-tone-600">
          {props.emptyCopy}
        </Text>
      </View>
    );
  }

  return null;
}
