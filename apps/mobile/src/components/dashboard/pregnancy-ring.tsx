import React from 'react';

import { BabyStageGlyph } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import type { PregnancyProgress } from '@/lib/health';
import { FULL_TERM_WEEKS } from '@/lib/health';
import { usePaletteColors } from '@/lib/theme';

import { ProgressRing } from './progress-ring';

const GLYPH_SIZE = 40;
const TRIMESTER_LABELS = ['First', 'Second', 'Third'] as const;

interface Props {
  progress: PregnancyProgress;
  testID?: string;
}

/**
 * Gestation ring: week N of 40 on a linear sweep, with the baby glyph growing
 * by trimester in the centre.
 */
export function PregnancyRing({ progress, testID }: Props) {
  const palette = usePaletteColors();

  return (
    <ProgressRing
      progress={progress.completion}
      color={palette.accent}
      trackColor={palette.tone[200]}
      testID={testID}
    >
      <BabyStageGlyph
        trimester={progress.trimester}
        size={GLYPH_SIZE}
        color={palette.accent}
      />
      <Text className="mt-1 font-body-semibold text-[13px] uppercase tracking-wider text-tone-600">
        Week
      </Text>
      <Text
        className="font-heading text-[56px] leading-[62px] text-ink"
        testID="pregnancy-ring-week"
      >
        {progress.week}
      </Text>
      <Text className="font-body-semibold text-[13px] text-tone-600">
        of {FULL_TERM_WEEKS}
      </Text>
      <Text className="mt-1 font-body-bold text-[12px] text-accent-700">
        {TRIMESTER_LABELS[progress.trimester - 1]} trimester
      </Text>
    </ProgressRing>
  );
}
