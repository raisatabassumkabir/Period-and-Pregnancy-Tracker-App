import React from 'react';

import { useProfile } from '@/api/users';
import { DailyMealCard, MealTargetsCard } from '@/components/diet';
import { DietNudgeCard } from '@/components/diet/diet-nudge-card';
import { PersonalizationOptionsModal } from '@/components/settings/personalization-modal';
import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { AppHeader } from '@/components/ui/app-header';
import { useDailyMealPlan, useMealDay } from '@/lib/diet';
import { translate } from '@/lib/i18n';

/** Today's personalised meals: targets, then one card per slot. */
function TodaysMeals() {
  const { plan, targets, stage } = useDailyMealPlan();
  const eaten = useMealDay.use.day().eaten;
  const swap = useMealDay.use.swap();
  const toggleEaten = useMealDay.use.toggleEaten();

  return (
    <>
      <MealTargetsCard
        plan={plan}
        targets={targets}
        isPregnant={stage.kind === 'pregnancy'}
      />
      <Text className="mb-1 mt-6 font-display text-[18px] text-ink">
        {translate('meal_library.today_title')}
      </Text>
      {plan.meals.map((planned) => (
        <DailyMealCard
          key={planned.slot}
          planned={planned}
          eaten={eaten.includes(planned.meal.id)}
          onToggleEaten={() => toggleEaten(planned.meal.id)}
          onSwap={() => swap(planned.slot)}
        />
      ))}
    </>
  );
}

export default function Diet() {
  const { data: profile } = useProfile();
  const { stage } = useDailyMealPlan();
  const isPregnant = stage.kind === 'pregnancy';
  const [modalVisible, setModalVisible] = React.useState(false);
  const showNudge =
    profile && (profile.height == null || profile.weight == null);

  return (
    <View className="flex-1 bg-canvas" testID="diet-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-2">
          <AppHeader title={translate('diet.title')} />
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-8 pt-4"
      >
        {showNudge && <DietNudgeCard onPress={() => setModalVisible(true)} />}

        <Text className="mb-4 text-[14px] leading-5 text-tone-600">
          {translate(isPregnant ? 'diet.subtitle' : 'diet.cycle_subtitle')}
        </Text>

        <TodaysMeals />

        <Text className="mt-5 text-[13px] leading-5 text-tone-600">
          {translate(isPregnant ? 'diet.disclaimer' : 'diet.cycle_disclaimer')}
        </Text>
      </ScrollView>

      <PersonalizationOptionsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
