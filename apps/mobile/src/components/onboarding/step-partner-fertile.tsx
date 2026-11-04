import React from 'react';
import { ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Pressable, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

import { PartnerStepHeading } from './partner-step-heading';

const ENTRANCE_MS = 400;
/** Typical day counts, only to draw the explainer bar. */
const EXAMPLE_PHASES = { period: 5, follicular: 8, fertile: 6, luteal: 9 };

interface Props {
  /** null until he picks one. */
  knewFertileDays: boolean | null;
  onAnswer: (knew: boolean) => void;
}

function AnswerCard(props: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { label, selected, onPress, testID } = props;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      className={`h-[76px] flex-1 items-center justify-center rounded-[22px] border-2 border-b-4 active:opacity-80 ${
        selected
          ? 'border-accent2 border-b-accent2-800 bg-accent2'
          : 'border-accent2-200 border-b-accent2-200 bg-surface'
      }`}
    >
      <Text
        className={`font-body-bold text-[17px] ${selected ? 'text-white' : 'text-ink'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FertileExplainer({ knew }: { knew: boolean }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(ENTRANCE_MS)}
      className="mt-5 rounded-[28px] bg-mint p-5"
      testID="partner-fertile-explainer"
    >
      <Text className="font-display text-[20px] leading-[26px] text-ink">
        {translate(
          knew
            ? 'partner.onboarding.fertile_reply_yes'
            : 'partner.onboarding.fertile_reply_no'
        )}
      </Text>
      <Text className="mt-3 text-[15px] leading-[22px] text-mint-ink">
        {translate('partner.onboarding.fertile_body')}
      </Text>
      <View className="mt-4 rounded-[18px] bg-surface p-3.5">
        <View className="flex-row gap-1">
          <View
            className="h-3 rounded-full bg-accent-300"
            style={{ flex: EXAMPLE_PHASES.period }}
          />
          <View
            className="h-3 rounded-full bg-accent2-200"
            style={{ flex: EXAMPLE_PHASES.follicular }}
          />
          <View
            className="h-3 rounded-full bg-mint-ink/60"
            style={{ flex: EXAMPLE_PHASES.fertile }}
          />
          <View
            className="h-3 rounded-full bg-butter"
            style={{ flex: EXAMPLE_PHASES.luteal }}
          />
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="font-body-bold text-[12px] text-tone-600">
            {translate('partner.home.phase_period')}
          </Text>
          <Text className="font-body-bold text-[12px] text-mint-ink">
            {translate('partner.onboarding.fertile_window')}
          </Text>
          <Text className="font-body-bold text-[12px] text-tone-600">
            {translate('partner.onboarding.before_period')}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/** "Did you know some days she's more likely to get pregnant?" and the short answer. */
export function StepPartnerFertile({ knewFertileDays, onAnswer }: Props) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-6"
      testID="step-partner-fertile"
    >
      <PartnerStepHeading
        title={translate('partner.onboarding.fertile_title')}
      />
      <View className="flex-row gap-3">
        <AnswerCard
          label={translate('partner.onboarding.fertile_yes')}
          selected={knewFertileDays === true}
          onPress={() => onAnswer(true)}
          testID="partner-fertile-yes"
        />
        <AnswerCard
          label={translate('partner.onboarding.fertile_no')}
          selected={knewFertileDays === false}
          onPress={() => onAnswer(false)}
          testID="partner-fertile-no"
        />
      </View>
      {knewFertileDays === null ? null : (
        <FertileExplainer knew={knewFertileDays} />
      )}
    </ScrollView>
  );
}
