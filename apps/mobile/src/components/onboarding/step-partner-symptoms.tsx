import { Lock } from 'lucide-react-native';
import React from 'react';
import { ScrollView } from 'react-native';

import { Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { usePaletteColors } from '@/lib/theme';

import type { ChoiceOption } from './choice-chips';
import { ChoiceChips } from './choice-chips';
import { PartnerStepHeading } from './partner-step-heading';

const LOCK_SIZE = 18;

export const NO_SYMPTOMS = 'none';

export const PARTNER_SYMPTOMS: readonly ChoiceOption[] = [
  { id: 'cramps', labelKey: 'partner.onboarding.symptom_cramps' },
  { id: 'headache', labelKey: 'partner.onboarding.symptom_headache' },
  { id: 'mood', labelKey: 'partner.onboarding.symptom_mood' },
  { id: 'tender', labelKey: 'partner.onboarding.symptom_tender' },
  { id: 'cravings', labelKey: 'partner.onboarding.symptom_cravings' },
  { id: 'fatigue', labelKey: 'partner.onboarding.symptom_fatigue' },
  { id: 'bloating', labelKey: 'partner.onboarding.symptom_bloating' },
  { id: 'sleep', labelKey: 'partner.onboarding.symptom_sleep' },
  { id: NO_SYMPTOMS, labelKey: 'partner.onboarding.symptom_none' },
];

interface Props {
  herName: string;
  selected: readonly string[];
  onToggle: (id: string) => void;
}

/** "Does Claire usually get any of these?": his best guess, private to him. */
export function StepPartnerSymptoms({ herName, selected, onToggle }: Props) {
  const palette = usePaletteColors();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-6"
      testID="step-partner-symptoms"
    >
      <PartnerStepHeading
        title={translate('partner.onboarding.symptoms_title', {
          name: herName,
        })}
        body={translate('partner.onboarding.symptoms_body')}
      />
      <ChoiceChips
        options={PARTNER_SYMPTOMS}
        selected={selected}
        onToggle={onToggle}
        testIDPrefix="partner-symptom"
      />
      <View className="mt-6 flex-row items-start gap-3 rounded-[20px] bg-butter p-4">
        <Lock size={LOCK_SIZE} color={palette.ink} strokeWidth={2} />
        <Text className="flex-1 text-[14px] leading-5 text-butter-ink">
          {translate('partner.onboarding.symptoms_note')}
        </Text>
      </View>
    </ScrollView>
  );
}
