import React from 'react';

import { useCycles } from '@/api/cycles';
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
import type { CycleDietPhase } from '@/lib/diet';
import {
  CYCLE_DIET_PHASES,
  CYCLE_MEAL_PLANS,
  CYCLE_PHASE_KEYS,
  cycleDietPhaseFor,
  MEAL_PLANS,
  TRIMESTER_KEYS,
} from '@/lib/diet';
import type { Trimester } from '@/lib/health';
import {
  DEMO_CYCLES,
  deriveCycleInsights,
  derivePregnancyProgress,
  useDemoSeedAllowed,
  useIsPregnancyMode,
  withDemoFallback,
} from '@/lib/health';
import { translate } from '@/lib/i18n';

const TRIMESTERS: readonly Trimester[] = [1, 2, 3];

const trimesterOptions = (): readonly SegmentOption<Trimester>[] =>
  TRIMESTERS.map((trimester) => ({
    value: trimester,
    label: translate(TRIMESTER_KEYS[trimester]),
  }));

const phaseOptions = (): readonly SegmentOption<CycleDietPhase>[] =>
  CYCLE_DIET_PHASES.map((phase) => ({
    value: phase,
    label: translate(CYCLE_PHASE_KEYS[phase]),
  }));

function PregnancyMealPlan() {
  const { data } = usePregnancies();
  const progress = derivePregnancyProgress(activePregnancy(data));
  const [selected, setSelected] = React.useState<Trimester | null>(null);
  const trimester = selected ?? progress?.trimester ?? 1;

  return (
    <>
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
    </>
  );
}

/** The user's phase today, or `null` before any cycle is logged. */
function useCurrentCyclePhase(): CycleDietPhase | null {
  const { data, isError } = useCycles();
  const allowSeed = useDemoSeedAllowed();
  const { rows } = withDemoFallback({ data, isError }, DEMO_CYCLES, allowSeed);
  const insights = deriveCycleInsights(rows);
  if (!insights) return null;
  return cycleDietPhaseFor(insights.currentDay, insights.cycleLengthDays);
}

function CycleMealPlan() {
  const currentPhase = useCurrentCyclePhase();
  const [selected, setSelected] = React.useState<CycleDietPhase | null>(null);
  const phase = selected ?? currentPhase ?? 'menstrual';

  return (
    <>
      {currentPhase && (
        <Text
          className="mb-3 font-body-semibold text-[13px] text-accent"
          testID="diet-current-phase"
        >
          {translate('diet.current_phase')}:{' '}
          {translate(CYCLE_PHASE_KEYS[currentPhase])}
        </Text>
      )}
      <SegmentedControl
        options={phaseOptions()}
        value={phase}
        onChange={setSelected}
        accessibilityLabel={translate('diet.title')}
        testID="phase-selector"
      />
      {CYCLE_MEAL_PLANS[phase].map((meal) => (
        <MealCard key={meal.slot} meal={meal} />
      ))}
    </>
  );
}

export default function Diet() {
  const isPregnant = useIsPregnancyMode();
  const { data: profile } = useProfile();
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

        {isPregnant ? <PregnancyMealPlan /> : <CycleMealPlan />}

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
