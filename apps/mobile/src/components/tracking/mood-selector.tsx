import React from 'react';
import { Pressable, View } from 'react-native';

import type { Mood } from '@/api/cycles/types';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

const FACE_SIZE = 56;

interface MoodOption {
  value: Exclude<Mood, 'unspecified'>;
  label: string;
  face: string;
  color: string;
}

/** One face per API mood, each with its own brand colour. */
const MOOD_OPTIONS: readonly MoodOption[] = [
  { value: 'great', label: 'Happy', face: '😄', color: colors.mood.great },
  { value: 'good', label: 'Good', face: '🙂', color: colors.mood.good },
  { value: 'neutral', label: 'Fine', face: '😐', color: colors.mood.neutral },
  { value: 'low', label: 'Moody', face: '😕', color: colors.mood.low },
  { value: 'bad', label: 'Sad', face: '😢', color: colors.mood.bad },
];

interface Props {
  value: Mood;
  onChange: (value: Mood) => void;
}

/** Single-choice row of coloured faces. Tapping the active one clears it. */
export function MoodSelector({ value, onChange }: Props) {
  return (
    <View className="flex-row justify-between" testID="mood-selector">
      {MOOD_OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            testID={`mood-${option.value}`}
            onPress={() => onChange(selected ? 'unspecified' : option.value)}
            className="items-center"
          >
            <View
              // Colour-only toggle; never a runtime-toggled shadow class.
              className={`items-center justify-center rounded-full border-[3px] ${
                selected ? 'border-ink' : 'border-transparent'
              }`}
              style={{
                width: FACE_SIZE,
                height: FACE_SIZE,
                backgroundColor: option.color,
              }}
            >
              <Text className="text-[26px]">{option.face}</Text>
            </View>
            <Text
              className={`mt-1.5 text-[11px] ${
                selected
                  ? 'font-body-bold text-ink'
                  : 'font-body-semibold text-tone-700'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
