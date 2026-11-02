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

/** Today's phase in two lines (mood + the most useful tip), opening the full guide. */
export function PhaseGuideCard({ phase, audience }: PhaseGuideCardProps) {
  const palette = usePaletteColors();
  const [open, setOpen] = React.useState(false);
  const guide = PHASE_GUIDES[phase];
  const tipKey = audience === 'partner' ? guide.partnerKey : guide.selfCareKey;

  return (
    <View
      className="rounded-card border border-divider bg-surface p-4"
      testID="phase-guide-card"
    >
      <View className="flex-row items-center gap-2">
        <View className="size-8 items-center justify-center rounded-full bg-accent-200">
          <Sparkles size={ICON_SIZE} color={palette.accent} />
        </View>
        <View className="flex-1">
          <Text className="font-body-bold text-[16px] text-ink">
            {translate(guideTitleKey(audience))}
          </Text>
          <Text className="text-[12px] text-tone-600">
            {translate('cycle_guide.today')} · {translate(guide.nameKey)}
          </Text>
        </View>
      </View>
      <Text className="mt-3 text-[14px] leading-5 text-ink">
        {translate(guide.moodKey)}
      </Text>
      <Text className="mt-2 text-[13px] leading-5 text-tone-700">
        {translate(tipKey)}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        testID="phase-guide-open"
        className="mt-3 flex-row items-center self-start active:opacity-70"
      >
        <Text className="font-body-bold text-[13px] text-accent">
          {translate('cycle_guide.learn_more')}
        </Text>
        <ChevronRight size={ICON_SIZE} color={palette.accent} />
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
