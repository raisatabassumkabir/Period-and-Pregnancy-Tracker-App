import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from './text';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  testID?: string;
}

/**
 * Pill-in-a-trough selector for a short exclusive choice. Rendered as tabs so
 * screen readers announce the selected segment.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      className="flex-row gap-1 rounded-full bg-tone-200 p-[5px]"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            testID={testID ? `${testID}-${option.value}` : undefined}
            onPress={() => onChange(option.value)}
            // No shadow utility here on purpose. Toggling one inside a
            // className that flips at runtime makes react-native-css-interop
            // re-walk this element's props and recurse until it reads React
            // Navigation's context getter, which throws "Couldn't find a
            // navigation context" and takes the screen down. Toggle colour,
            // keep shadows constant.
            className={`h-10 flex-1 items-center justify-center rounded-full ${
              selected ? 'bg-accent' : ''
            }`}
          >
            <Text
              className={
                selected
                  ? 'font-heading text-[15px] text-accent-100'
                  : 'font-body-semibold text-sm text-tone-700'
              }
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
