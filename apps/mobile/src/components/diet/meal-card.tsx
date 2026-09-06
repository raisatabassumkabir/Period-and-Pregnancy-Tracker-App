import React from 'react';
import { View } from 'react-native';

import { Pill, Text } from '@/components/ui';
import type { MealSuggestion } from '@/lib/diet';
import { MEAL_SLOT_KEYS } from '@/lib/diet';
import { translate } from '@/lib/i18n';

interface Props {
  meal: MealSuggestion;
}

export function MealCard({ meal }: Props) {
  return (
    <View
      className="mt-3 rounded-card bg-surface p-4"
      testID={`meal-card-${meal.slot}`}
    >
      <Pill label={translate(MEAL_SLOT_KEYS[meal.slot])} tone="accent-soft" />
      <Text className="mt-2.5 font-heading text-[17px] leading-6 text-ink">
        {translate(meal.nameKey)}
      </Text>
      <Text className="mt-1.5 text-[14px] leading-5 text-tone-600">
        {translate(meal.focusKey)}
      </Text>
    </View>
  );
}
