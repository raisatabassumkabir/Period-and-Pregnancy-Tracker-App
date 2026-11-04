import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import type { DailyPlan, NutritionTargets } from '@/lib/diet';
import { translate } from '@/lib/i18n';

interface Props {
  plan: DailyPlan;
  targets: NutritionTargets;
  isPregnant: boolean;
}

function Stat({
  value,
  label,
  testID,
}: {
  value: string;
  label: string;
  testID: string;
}) {
  return (
    <View className="flex-1 rounded-[18px] bg-surface p-3" testID={testID}>
      <Text className="font-display text-[22px] leading-[28px] text-ink">
        {value}
      </Text>
      <Text className="text-[12px] text-tone-600">{label}</Text>
    </View>
  );
}

/** Her targets for today, why these meals, and any gentle nudge. */
export function MealTargetsCard({ plan, targets, isPregnant }: Props) {
  return (
    <View className="rounded-[28px] bg-peach p-5" testID="meal-targets-card">
      <Text className="font-display text-[20px] text-ink">
        {translate('meal_library.targets')}
      </Text>
      <View className="mt-3 flex-row gap-2">
        {targets.kcal != null ? (
          <Stat
            value={String(targets.kcal)}
            label={translate('meal_library.kcal')}
            testID="meal-target-kcal"
          />
        ) : null}
        <Stat
          value={`${targets.proteinG}`}
          label={translate('meal_library.protein_g')}
          testID="meal-target-protein"
        />
        <Stat
          value={`${plan.totalProteinG}`}
          label={`${translate('meal_library.plan_total')} · ${translate('meal_library.protein_g')}`}
          testID="meal-plan-protein"
        />
      </View>
      <Text
        className="mt-3 text-[13px] leading-5 text-ink"
        testID="meal-plan-focus"
      >
        {translate(plan.focusKey)}
      </Text>
      {targets.isMinor ? (
        <Text className="mt-2 text-[12px] leading-5 text-peach-ink">
          {translate('meal_library.teen_note')}
        </Text>
      ) : null}
      {!targets.isPersonal && !targets.isMinor ? (
        <Text
          className="mt-2 text-[12px] leading-5 text-peach-ink"
          testID="meal-add-metrics"
        >
          {translate('meal_library.add_metrics')}
        </Text>
      ) : null}
      {plan.proteinShortfallG > 0 ? (
        <Text
          className="mt-2 text-[12px] leading-5 text-peach-ink"
          testID="meal-protein-boost"
        >
          {translate('meal_library.protein_boost')}
        </Text>
      ) : null}
      {isPregnant ? (
        <Text className="mt-2 text-[12px] text-peach-ink">
          {translate('meal_library.pregnancy_safe')}
        </Text>
      ) : null}
      <Text className="mt-2 text-[12px] text-peach-ink">
        {translate('meal_library.new_tomorrow')}
      </Text>
    </View>
  );
}
