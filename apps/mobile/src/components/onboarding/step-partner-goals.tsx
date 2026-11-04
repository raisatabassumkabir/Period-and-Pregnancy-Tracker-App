import { Check } from 'lucide-react-native';
import React from 'react';
import { ScrollView } from 'react-native';

import { Pressable, Text, View } from '@/components/ui';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';

import { PartnerStepHeading } from './partner-step-heading';

const CHECK_SIZE = 14;
const CHECK_STROKE = 3;

export interface PartnerGoalOption {
  id: string;
  labelKey: TxKeyPath;
  /** Each row gets its own pastel, so the list never reads as one grey block. */
  tint: string;
}

export const PARTNER_GOALS: readonly PartnerGoalOption[] = [
  {
    id: 'plan_cycle',
    labelKey: 'partner.onboarding.goal_plan_cycle',
    tint: 'bg-accent-100',
  },
  {
    id: 'learn_science',
    labelKey: 'partner.onboarding.goal_learn_science',
    tint: 'bg-accent2-100',
  },
  {
    id: 'support_partner',
    labelKey: 'partner.onboarding.goal_support_partner',
    tint: 'bg-peach',
  },
  {
    id: 'communication',
    labelKey: 'partner.onboarding.goal_communication',
    tint: 'bg-mint',
  },
  {
    id: 'anticipate',
    labelKey: 'partner.onboarding.goal_anticipate',
    tint: 'bg-butter',
  },
  {
    id: 'sex_life',
    labelKey: 'partner.onboarding.goal_sex_life',
    tint: 'bg-accent-100',
  },
];

interface Props {
  selectedGoals: readonly string[];
  onToggleGoal: (id: string) => void;
}

function GoalRow(props: {
  goal: PartnerGoalOption;
  selected: boolean;
  onPress: () => void;
}) {
  const { goal, selected, onPress } = props;
  return (
    <Pressable
      testID={`partner-goal-${goal.id}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-[60px] flex-row items-center rounded-[20px] border-2 px-4 py-3.5 active:opacity-80 ${goal.tint} ${
        selected ? 'border-accent2' : 'border-transparent'
      }`}
    >
      <Text className="flex-1 pr-3 font-body-bold text-[16px] leading-[22px] text-ink">
        {translate(goal.labelKey)}
      </Text>
      <View
        className={`size-[26px] items-center justify-center rounded-full border-2 ${
          selected
            ? 'border-accent2 bg-accent2'
            : 'border-accent2-300 bg-surface'
        }`}
      >
        {selected ? (
          <Check size={CHECK_SIZE} color="white" strokeWidth={CHECK_STROKE} />
        ) : null}
      </View>
    </Pressable>
  );
}

/** "What would you like Happy Women to help with?": pick as many as you like. */
export function StepPartnerGoals({ selectedGoals, onToggleGoal }: Props) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-6"
      testID="step-partner-goals"
    >
      <PartnerStepHeading
        title={translate('partner.onboarding.goals_title')}
        body={translate('partner.onboarding.goals_body')}
      />
      <View className="gap-2.5">
        {PARTNER_GOALS.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            selected={selectedGoals.includes(goal.id)}
            onPress={() => onToggleGoal(goal.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
