import { Heart } from 'lucide-react-native';
import React from 'react';
import { ScrollView } from 'react-native';

import { View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { usePaletteColors } from '@/lib/theme';

import type { ChoiceOption } from './choice-chips';
import { ChoiceChips } from './choice-chips';
import { PartnerStepHeading } from './partner-step-heading';

const HEART_SIZE = 52;
const HEART_OVERLAP = -14;

export const PARTNER_INTIMACY_GOALS: readonly ChoiceOption[] = [
  { id: 'talk', labelKey: 'partner.onboarding.intimacy_talk' },
  { id: 'desires', labelKey: 'partner.onboarding.intimacy_desires' },
  { id: 'pleasure', labelKey: 'partner.onboarding.intimacy_pleasure' },
  { id: 'new', labelKey: 'partner.onboarding.intimacy_new' },
  { id: 'timing', labelKey: 'partner.onboarding.intimacy_timing' },
  { id: 'fine', labelKey: 'partner.onboarding.intimacy_fine' },
];

interface Props {
  selected: readonly string[];
  onToggle: (id: string) => void;
}

/** Two small hearts leaning together: her rose, his lilac. Decorative. */
function TwoHearts() {
  const palette = usePaletteColors();
  return (
    <View
      className="mt-9 flex-row justify-center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Heart
        size={HEART_SIZE}
        color={palette.accent}
        fill={palette.accentScale[200]}
      />
      <View style={{ marginLeft: HEART_OVERLAP, marginTop: 8 }}>
        <Heart
          size={HEART_SIZE - 6}
          color={palette.accent2}
          fill={palette.accent2Scale[200]}
        />
      </View>
    </View>
  );
}

/** Optional: what they'd both like to grow. Private to him. */
export function StepPartnerIntimacy({ selected, onToggle }: Props) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-6"
      testID="step-partner-intimacy"
    >
      <PartnerStepHeading
        title={translate('partner.onboarding.intimacy_title')}
        body={translate('partner.onboarding.intimacy_body')}
      />
      <ChoiceChips
        options={PARTNER_INTIMACY_GOALS}
        selected={selected}
        onToggle={onToggle}
        tone="rose"
        testIDPrefix="partner-intimacy"
      />
      <TwoHearts />
    </ScrollView>
  );
}
