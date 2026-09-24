import React from 'react';

import { activePregnancy, usePregnancies } from '@/api/pregnancy';
import { useProfile } from '@/api/users';
import { MealCard } from '@/components/diet';
import { DietNudgeCard } from '@/components/diet/diet-nudge-card';
import { PersonalizationOptionsModal } from '@/components/settings/personalization-modal';
import type { SegmentOption } from '@/components/ui';
import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  SegmentedControl,
  Text,
  View,
} from '@/components/ui';
import { AppHeader } from '@/components/ui/app-header';
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

export default function Diet() {
  const { data } = usePregnancies();
  const progress = derivePregnancyProgress(activePregnancy(data));
  const { data: profile } = useProfile();

  const [selected, setSelected] = React.useState<Trimester | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const trimester = selected ?? progress?.trimester ?? 1;

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

      <PersonalizationOptionsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
