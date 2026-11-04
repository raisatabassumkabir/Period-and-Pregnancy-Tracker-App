import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';

/** Pastel card tones from the design system; `surface` is a plain white card. */
export type StatusCardTone = 'surface' | 'mint' | 'butter' | 'peach';

interface Props {
  label: string;
  value: string;
  caption?: string;
  /** Hex for the tiny indicator dot beside the value; omitted = no dot. */
  indicatorColor?: string;
  tone?: StatusCardTone;
  testID?: string;
}

const INDICATOR_SIZE = 10;

/** Fill and the AA-safe text colour that goes on it, per tone. */
const TONE_CLASSES: Record<StatusCardTone, { card: string; ink: string }> = {
  surface: { card: 'bg-surface', ink: 'text-tone-600' },
  mint: { card: 'bg-mint', ink: 'text-mint-ink' },
  butter: { card: 'bg-butter', ink: 'text-butter-ink' },
  peach: { card: 'bg-peach', ink: 'text-peach-ink' },
};

/** One insight tile: small label, large serif value, optional caption. */
export function StatusCard({
  label,
  value,
  caption,
  indicatorColor,
  tone = 'surface',
  testID,
}: Props) {
  const classes = TONE_CLASSES[tone];
  return (
    <View
      className={`flex-1 rounded-[24px] p-4 ${classes.card}`}
      testID={testID}
    >
      <Text className={`font-body-bold text-[13px] ${classes.ink}`}>
        {label}
      </Text>
      <View className="mt-1 flex-row items-center gap-2">
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
        <Text className="font-display text-[24px] leading-[30px] text-ink">
          {value}
        </Text>
      </View>
      {caption ? (
        <Text className={`mt-1 text-[13px] leading-5 ${classes.ink}`}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
