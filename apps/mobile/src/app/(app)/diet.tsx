import React from 'react';

import { activePregnancy, usePregnancies } from '@/api/pregnancy';
import { MealCard } from '@/components/diet';
import type { SegmentOption } from '@/components/ui';
import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScreenHeader,
  ScrollView,
  SegmentedControl,
  Text,
  View,
} from '@/components/ui';
import { MEAL_PLANS, TRIMESTER_KEYS } from '@/lib/diet';
import type { Trimester } from '@/lib/health';
import { derivePregnancyProgress } from '@/lib/health';
import { translate } from '@/lib/i18n';

const TRIMESTERS: readonly Trimester[] = [1, 2, 3];

function trimesterOptions(): readonly SegmentOption<Trimester>[] {
  return TRIMESTERS.map((trimester) => ({
    value: trimester,
    label: translate(TRIMESTER_KEYS[trimester]),
  }));
}

/** Localized meal plan, defaulting to the trimester of the active pregnancy. */
export default function Diet() {
  const { data } = usePregnancies();
  const progress = derivePregnancyProgress(activePregnancy(data));

  const [selected, setSelected] = React.useState<Trimester | null>(null);
  const trimester = selected ?? progress?.trimester ?? 1;

  return (
    <View className="flex-1 bg-canvas" testID="diet-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-3">
          <ScreenHeader title={translate('diet.title')} />
          <Text className="text-[13px] text-tone-600">
            {translate('diet.subtitle')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-8 pt-4"
      >
        <SegmentedControl
          options={trimesterOptions()}
          value={trimester}
          onChange={setSelected}
          accessibilityLabel={translate('diet.title')}
          testID="trimester-selector"
        />

        {MEAL_PLANS[trimester].map((meal) => (
          <MealCard key={meal.slot} meal={meal} />
        ))}

        <Text className="mt-5 text-[13px] leading-5 text-tone-600">
          {translate('diet.disclaimer')}
        </Text>
      </ScrollView>
    </View>
  );
}
