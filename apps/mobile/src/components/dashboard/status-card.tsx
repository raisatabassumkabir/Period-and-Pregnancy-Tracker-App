import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';

interface Props {
  label: string;
  value: string;
  caption?: string;
  /** Hex for the tiny indicator dot beside the value; omitted = no dot. */
  indicatorColor?: string;
  testID?: string;
}

const INDICATOR_SIZE = 8;

/**
 * One insight tile: small label, large value, optional caption. Slightly
 * translucent surface so the dark ground shows through, per the brand cards.
 */
export function StatusCard({
  label,
  value,
  caption,
  indicatorColor,
  testID,
}: Props) {
  return (
    <View className="flex-1 rounded-card bg-surface/80 p-4" testID={testID}>
      <Text className="font-body-semibold text-[12px] uppercase tracking-wider text-tone-600">
        {label}
      </Text>
      <View className="mt-1.5 flex-row items-center gap-2">
        {indicatorColor ? (
          <View
            testID={testID ? `${testID}-indicator` : undefined}
            style={{
              width: INDICATOR_SIZE,
              height: INDICATOR_SIZE,
              borderRadius: INDICATOR_SIZE / 2,
              backgroundColor: indicatorColor,
            }}
          />
        ) : null}
        <Text className="font-heading text-[22px] text-ink">{value}</Text>
      </View>
      {caption ? (
        <Text className="mt-1 text-[13px] leading-5 text-tone-600">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
