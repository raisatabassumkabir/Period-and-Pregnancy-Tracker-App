import { ChevronRight, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { GuideAudience } from '@/lib/cycle-education';
import { guideTitleKey, PHASE_GUIDES } from '@/lib/cycle-education';
import type { CycleDietPhase } from '@/lib/diet';
import { translate } from '@/lib/i18n';
import { usePaletteColors } from '@/lib/theme';

import { PhaseGuideSheet } from './phase-guide-sheet';

const ICON_SIZE = 18;

export interface PhaseGuideCardProps {
  phase: CycleDietPhase;
  audience: GuideAudience;
}

const SELF_TONE = { card: 'bg-accent2-100', kicker: 'text-accent2-700' };
const PARTNER_TONE = { card: 'bg-accent-100', kicker: 'text-accent-700' };

/** Today's phase in two lines (mood + the most useful tip), opening the full guide. */
export function PhaseGuideCard({ phase, audience }: PhaseGuideCardProps) {
  const palette = usePaletteColors();
  const [open, setOpen] = React.useState(false);
  const guide = PHASE_GUIDES[phase];
  const tipKey = audience === 'partner' ? guide.partnerKey : guide.selfCareKey;

  // Her own guide sits on lilac; the partner's "how she may feel" on pink.
  const tone = audience === 'partner' ? PARTNER_TONE : SELF_TONE;
  const linkColor =
    audience === 'partner'
      ? palette.accentScale[700]
      : palette.accent2Scale[700];

  return (
    <View
      className={`rounded-[28px] p-5 ${tone.card}`}
      testID="phase-guide-card"
    >
      <View className="absolute right-5 top-5">
        <Sparkles size={ICON_SIZE} color={linkColor} />
      </View>
      <Text className={`font-body-bold text-[13px] ${tone.kicker}`}>
        {translate('cycle_guide.today')} · {translate(guide.nameKey)}
      </Text>
      <Text className="mt-1 pr-8 font-display text-[21px] leading-[27px] text-ink">
        {translate(guideTitleKey(audience))}
      </Text>
      <Text className="mt-2 text-[15px] leading-[22px] text-ink">
        {translate(guide.moodKey)}
      </Text>
      <Text className="mt-2 text-[14px] leading-5 text-tone-700">
        {translate(tipKey)}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        testID="phase-guide-open"
        className="mt-3 flex-row items-center self-start active:opacity-70"
      >
        <Text className={`font-body-bold text-[14px] ${tone.kicker}`}>
          {translate('cycle_guide.learn_more')}
        </Text>
        <ChevronRight size={ICON_SIZE} color={linkColor} />
      </Pressable>
      <PhaseGuideSheet
        visible={open}
        onClose={() => setOpen(false)}
        initialPhase={phase}
        audience={audience}
      />
    </View>
  );
}
