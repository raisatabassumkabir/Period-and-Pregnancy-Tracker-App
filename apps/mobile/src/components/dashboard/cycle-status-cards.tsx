import React from 'react';
import { View } from 'react-native';

import colors from '@/components/ui/colors';
import type { CycleInsights, PregnancyChance } from '@/lib/health';
import { formatCalendarDate } from '@/lib/health';

import { StatusCard } from './status-card';

interface Props {
  insights: CycleInsights;
  chance: PregnancyChance;
  /** Which day the chance refers to — today unless the week strip says otherwise. */
  chanceDate: string;
  today: string;
}

const CHANCE_LABELS: Record<PregnancyChance, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const CHANCE_COLORS: Record<PregnancyChance, string> = {
  low: colors.cycle.lavender,
  medium: colors.cycle.fertile,
  high: colors.cycle.ovulation,
};

function describeNextPeriod(daysUntil: number): string {
  if (daysUntil === 0) return 'Expected today';
  if (daysUntil === 1) return 'Expected tomorrow';
  if (daysUntil > 0) return `In ${daysUntil} days`;
  return `${Math.abs(daysUntil)} days late`;
}

/** Next expected period + estimated chance of pregnancy, side by side. */
export function CycleStatusCards({
  insights,
  chance,
  chanceDate,
  today,
}: Props) {
  const chanceCaption =
    chanceDate === today
      ? 'Estimated for today'
      : `Estimated for ${formatCalendarDate(chanceDate)}`;

  return (
    <View className="flex-row gap-3" testID="cycle-status-cards">
      <StatusCard
        label="Chances of pregnancy"
        value={CHANCE_LABELS[chance]}
        caption={chanceCaption}
        indicatorColor={CHANCE_COLORS[chance]}
        testID="pregnancy-chance-card"
      />
      <StatusCard
        label="Next period"
        value={formatCalendarDate(insights.nextPeriodDate)}
        caption={describeNextPeriod(insights.daysUntilNextPeriod)}
        testID="next-period-card"
      />
    </View>
  );
}
