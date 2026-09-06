import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from './text';

export interface PillOption<T extends string> {
  value: T;
  label: string;
}

interface OptionPillsProps<T extends string> {
  options: readonly PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  testID?: string;
}

/**
 * Horizontal row of single-select pill buttons — the Happy Women take on a
 * short exclusive choice (flow, discharge). Scrolls when the labels outgrow
 * the width instead of wrapping, so the row keeps its one-line rhythm.
 */
export function OptionPills<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: OptionPillsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <View className="flex-row gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              testID={testID ? `${testID}-${option.value}` : undefined}
              onPress={() => onChange(option.value)}
              // Colour-only toggle — a runtime-toggled shadow crashes css-interop.
              className={`h-11 items-center justify-center rounded-pill border px-5 ${
                selected
                  ? 'border-accent bg-accent'
                  : 'border-divider bg-surface'
              }`}
            >
              <Text
                className={`text-[14px] ${
                  selected
                    ? 'font-body-bold text-accent-100'
                    : 'font-body-semibold text-ink'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
