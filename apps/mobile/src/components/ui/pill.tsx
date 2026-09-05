import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from './text';

/**
 * Rounded label for small pieces of state: filter chips, meta tags,
 * "Premium" badges, counters.
 */
export type PillTone =
  | 'accent'
  | 'accent-soft'
  | 'accent2'
  | 'accent2-soft'
  | 'surface'
  | 'neutral';

const CONTAINER_CLASSES: Record<PillTone, string> = {
  accent: 'bg-accent',
  'accent-soft': 'bg-accent-200',
  accent2: 'bg-accent2-700',
  'accent2-soft': 'bg-accent2-200',
  surface: 'bg-surface',
  neutral: 'bg-tone-200',
};

const LABEL_CLASSES: Record<PillTone, string> = {
  accent: 'text-accent-100',
  'accent-soft': 'text-accent-800',
  accent2: 'text-accent2-100',
  'accent2-soft': 'text-accent2-900',
  surface: 'text-tone-700',
  neutral: 'text-tone-700',
};

interface PillProps {
  label: string;
  tone?: PillTone;
  /** Selected chips read bolder than their unselected siblings. */
  strong?: boolean;
  /** Tiny uppercase treatment — the "Premium" / "New" badges. */
  badge?: boolean;
  testID?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

export function Pill({
  label,
  tone = 'neutral',
  strong = false,
  badge = false,
  testID,
  onPress,
  children,
}: PillProps) {
  const container = `flex-row items-center gap-1.5 self-start rounded-full ${
    CONTAINER_CLASSES[tone]
  } ${badge ? 'px-2 py-0.5' : 'px-3 py-1.5'}`;
  const labelClass = `${
    badge
      ? 'font-body-bold text-[9px] uppercase tracking-wider'
      : `text-xs ${strong ? 'font-body-bold' : 'font-body-semibold'}`
  } ${LABEL_CLASSES[tone]}`;

  const content = (
    <>
      {children}
      <Text className={labelClass}>{label}</Text>
    </>
  );

  if (onPress === undefined) {
    return (
      <View testID={testID} className={container}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      className={container}
    >
      {content}
    </Pressable>
  );
}
