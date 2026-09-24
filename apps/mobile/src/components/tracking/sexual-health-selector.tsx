import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';

export interface SexualHealthOption {
  id: string;
  label: string;
}

export const SEXUAL_HEALTH_OPTIONS: readonly SexualHealthOption[] = [
  { id: 'none', label: "Didn't have sex" },
  { id: 'unprotected', label: 'Unprotected' },
  { id: 'condom', label: 'Condom' },
  { id: 'pill', label: 'Birth Control Pill' },
  { id: 'copper_iud', label: 'Copper IUD' },
  { id: 'hormonal_iud', label: 'Hormonal IUD' },
  { id: 'other', label: 'Other Protection' },
];

export interface SexualHealthSelectorProps {
  intercourseLogged: boolean;
  contraceptionUsed: readonly string[];
  onChange: (intercourseLogged: boolean, contraceptionUsed: string[]) => void;
  testID?: string;
}

export function SexualHealthSelector({
  intercourseLogged,
  contraceptionUsed,
  onChange,
  testID = 'sexual-health-selector',
}: SexualHealthSelectorProps) {
  const isNoneSelected =
    !intercourseLogged && contraceptionUsed.includes('none');

  const handleToggle = (id: string) => {
    if (id === 'none') {
      if (isNoneSelected) {
        onChange(false, []);
      } else {
        onChange(false, ['none']);
      }
      return;
    }

    if (id === 'unprotected') {
      const isCurrentlyUnprotected =
        intercourseLogged && contraceptionUsed.includes('unprotected');
      if (isCurrentlyUnprotected) {
        onChange(false, []);
      } else {
        onChange(true, ['unprotected']);
      }
      return;
    }

    // Any other protection method
    const isCurrentlySelected =
      intercourseLogged && contraceptionUsed.includes(id);
    const cleaned = contraceptionUsed.filter(
      (item) => item !== 'none' && item !== 'unprotected'
    );

    if (isCurrentlySelected) {
      const next = cleaned.filter((item) => item !== id);
      onChange(next.length > 0, next);
    } else {
      const next = [...cleaned, id];
      onChange(true, next);
    }
  };

  const isOptionSelected = (id: string): boolean => {
    if (id === 'none') {
      return isNoneSelected;
    }
    if (id === 'unprotected') {
      return intercourseLogged && contraceptionUsed.includes('unprotected');
    }
    return intercourseLogged && contraceptionUsed.includes(id);
  };

  return (
    <View
      className="flex-row flex-wrap gap-2.5"
      accessibilityRole="radiogroup"
      accessibilityLabel="Sexual health and contraception"
      testID={testID}
    >
      {SEXUAL_HEALTH_OPTIONS.map((opt) => {
        const selected = isOptionSelected(opt.id);
        return (
          <Pressable
            key={opt.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            testID={`sexual-health-${opt.id}`}
            onPress={() => handleToggle(opt.id)}
            className={`h-11 items-center justify-center rounded-pill border px-4 active:scale-[0.98] ${
              selected ? 'border-accent bg-accent' : 'border-divider bg-surface'
            }`}
          >
            <Text
              className={`text-[13px] ${
                selected
                  ? 'font-body-bold text-accent-100'
                  : 'font-body-semibold text-ink'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
