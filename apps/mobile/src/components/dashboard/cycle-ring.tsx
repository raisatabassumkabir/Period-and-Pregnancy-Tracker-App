import React from 'react';

import colors from '@/components/ui/colors';
import { UterusGlyph } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import type { CycleDay, CycleInsights } from '@/lib/health';
import { describeCycleWindows } from '@/lib/health';
import { usePaletteColors } from '@/lib/theme';

import type { RingSegment } from './progress-ring';
import { ProgressRing } from './progress-ring';

const GLYPH_SIZE = 36;

const PHASE_CAPTIONS: Record<CycleDay['phase'], string> = {
  period: 'Period',
  fertile: 'Fertile window (est.)',
  ovulation: 'Ovulation day (est.)',
  none: 'Regular day',
};

interface Props {
  insights: CycleInsights;
  /** Today's place in the cycle; `null` before any period is logged. */
  today: CycleDay | null;
  testID?: string;
}

/** Fractions of the circle for each phase, so the ring previews the month ahead. */
function buildSegments(cycleLengthDays: number): RingSegment[] {
  const windows = describeCycleWindows(cycleLengthDays);
  const fraction = (day: number) => (day - 1) / cycleLengthDays;
  return [
    {
      start: fraction(windows.periodDays.start),
      end: fraction(windows.periodDays.end + 1),
      color: colors.cycle.period,
    },
    {
      start: fraction(windows.fertileDays.start),
      end: fraction(windows.fertileDays.end + 1),
      color: colors.cycle.fertile,
    },
    {
      start: fraction(windows.ovulationDay),
      end: fraction(windows.ovulationDay + 1),
      color: colors.cycle.ovulation,
    },
  ];
}

/** Cycle-day ring: day N of L, with the phase arcs and a uterus glyph. */
export function CycleRing({ insights, today, testID }: Props) {
  const palette = usePaletteColors();
  const dayWithinCycle = Math.min(
    insights.currentDay,
    insights.cycleLengthDays
  );
  const progress = dayWithinCycle / insights.cycleLengthDays;
  const segments = React.useMemo(
    () => buildSegments(insights.cycleLengthDays),
    [insights.cycleLengthDays]
  );

  // Past the expected length, "day 41 of 29" reads like a bug and the phase
  // estimate has wrapped into a window it cannot vouch for. Say the one thing
  // that is actually known instead: how overdue the period is.
  const daysLate = -insights.daysUntilNextPeriod;
  const isOverdue = daysLate > 0;

  return (
    <ProgressRing
      progress={progress}
      color={palette.accent}
      trackColor={palette.tone[200]}
      segments={segments}
      testID={testID}
    >
      <UterusGlyph size={GLYPH_SIZE} color={palette.accent} />
      <Text className="mt-1 font-body-semibold text-[13px] uppercase tracking-wider text-tone-600">
        Day
      </Text>
      <Text
        className="font-heading text-[56px] leading-[62px] text-ink"
        testID="cycle-ring-day"
      >
        {insights.currentDay}
      </Text>
      {!isOverdue && (
        <Text className="font-body-semibold text-[13px] text-tone-600">
          of {insights.cycleLengthDays}
        </Text>
      )}
      <Text
        className="mt-1 text-center font-body-bold text-[12px] text-accent-700"
        testID="cycle-ring-caption"
      >
        {isOverdue
          ? `Period ${daysLate} ${daysLate === 1 ? 'day' : 'days'} late`
          : PHASE_CAPTIONS[today?.phase ?? 'none']}
      </Text>
    </ProgressRing>
  );
}
