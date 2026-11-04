import { Check } from 'lucide-react-native';
import React from 'react';

import { Pressable, Text, View } from '@/components/ui';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';

const CHECK_SIZE = 14;
const CHECK_STROKE = 3;

export interface ChoiceOption {
  id: string;
  labelKey: TxKeyPath;
}

/** Selected chip colours: lilac on the partner's own questions, rose for shared ones. */
export type ChoiceTone = 'lilac' | 'rose';

const SELECTED: Record<ChoiceTone, string> = {
  lilac: 'border-accent2-800 bg-accent2',
  rose: 'border-accent-700 bg-accent',
};

interface Props {
  options: readonly ChoiceOption[];
  selected: readonly string[];
  onToggle: (id: string) => void;
  tone?: ChoiceTone;
  testIDPrefix: string;
}

/** Capsule chips that wrap; tap to pick or unpick. */
export function ChoiceChips({
  options,
  selected,
  onToggle,
  tone = 'lilac',
  testIDPrefix,
}: Props) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {options.map((option) => {
        const isOn = selected.includes(option.id);
        return (
          <Pressable
            key={option.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isOn }}
            onPress={() => onToggle(option.id)}
            testID={`${testIDPrefix}-${option.id}`}
            className={`min-h-[46px] flex-row items-center gap-1.5 rounded-pill border-[1.5px] px-[18px] py-2.5 active:opacity-80 ${
              isOn ? SELECTED[tone] : 'border-accent2-200 bg-surface'
            }`}
          >
            {isOn ? (
              <Check
                size={CHECK_SIZE}
                color="white"
                strokeWidth={CHECK_STROKE}
              />
            ) : null}
            <Text
              className={`font-body-bold text-[16px] ${isOn ? 'text-white' : 'text-ink'}`}
            >
              {translate(option.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Toggle `id` in a multi-select; `exclusiveId` ("None of these") clears the rest. */
export function toggleChoice(
  current: readonly string[],
  id: string,
  exclusiveId?: string
): string[] {
  if (id === exclusiveId) return current.includes(id) ? [] : [id];
  const rest = current.filter((value) => value !== exclusiveId);
  return rest.includes(id)
    ? rest.filter((value) => value !== id)
    : [...rest, id];
}
