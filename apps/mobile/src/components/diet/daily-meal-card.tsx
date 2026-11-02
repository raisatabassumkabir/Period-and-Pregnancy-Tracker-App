import { Check, Shuffle } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Pill, Text } from '@/components/ui';
import type { PlannedMeal } from '@/lib/diet';
import { MEAL_SLOT_KEYS } from '@/lib/diet';
import { translate } from '@/lib/i18n';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 16;
const MAX_NUTRIENT_TAGS = 3;

interface Props {
  planned: PlannedMeal;
  eaten: boolean;
  onToggleEaten: () => void;
  onSwap: () => void;
}

/** One meal of today's plan: what, how much, why, plus eaten and swap actions. */
export function DailyMealCard({
  planned,
  eaten,
  onToggleEaten,
  onSwap,
}: Props) {
  const palette = usePaletteColors();
  const { slot, meal } = planned;

  return (
    <View
      className="mt-3 rounded-card border border-divider bg-surface p-4"
      testID={`daily-meal-${slot}`}
    >
      <View className="flex-row items-center justify-between">
        <Pill label={translate(MEAL_SLOT_KEYS[slot])} tone="accent-soft" />
        <Text className="text-[12px] text-tone-600">
          {planned.kcal} {translate('meal_library.kcal')} · {planned.proteinG}{' '}
          {translate('meal_library.protein_g')}
        </Text>
      </View>
      <Text className="mt-2.5 font-heading text-[17px] leading-6 text-ink">
        {translate(planned.nameKey)}
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-1.5">
        {meal.nutrients.slice(0, MAX_NUTRIENT_TAGS).map((nutrient) => (
          <Pill
            key={nutrient}
            label={translate(`meal_library.nutrients.${nutrient}`)}
            tone="neutral"
          />
        ))}
      </View>
      <View className="mt-3 flex-row gap-2">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: eaten }}
          onPress={onToggleEaten}
          testID={`daily-meal-${slot}-eaten`}
          // Colour-only toggle: a runtime-toggled shadow crashes css-interop.
          className={`h-9 flex-row items-center gap-1.5 rounded-pill border px-3 ${
            eaten ? 'border-accent bg-accent' : 'border-divider bg-canvas'
          }`}
        >
          <Check
            size={ICON_SIZE}
            color={eaten ? '#FFFFFF' : palette.tone[500]}
          />
          <Text
            className={`text-[13px] ${eaten ? 'font-body-bold text-white' : 'text-ink'}`}
          >
            {translate('meal_library.eaten')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onSwap}
          testID={`daily-meal-${slot}-swap`}
          className="h-9 flex-row items-center gap-1.5 rounded-pill border border-divider bg-canvas px-3 active:opacity-70"
        >
          <Shuffle size={ICON_SIZE} color={palette.accent} />
          <Text className="text-[13px] text-ink">
            {translate('meal_library.swap')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
