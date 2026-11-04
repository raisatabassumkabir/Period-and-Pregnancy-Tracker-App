import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import {
  FERTILE_DAYS_BEFORE,
  LUTEAL_PHASE_DAYS,
} from '@/lib/partner/partner-view';

const FERTILE_DAYS_AFTER = 1;
const MARKER_SIZE = 20;

interface Props {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
}

interface Segments {
  period: number;
  follicular: number;
  fertile: number;
  luteal: number;
}

/** Day counts per phase, using the same ovulation estimate as the partner view. */
export function phaseSegments(
  cycleLength: number,
  periodLength: number
): Segments {
  const ovulationDay = cycleLength - LUTEAL_PHASE_DAYS;
  const fertileStart = Math.max(
    periodLength,
    ovulationDay - FERTILE_DAYS_BEFORE
  );
  const fertileEnd = Math.min(cycleLength, ovulationDay + FERTILE_DAYS_AFTER);
  return {
    period: periodLength,
    follicular: Math.max(0, fertileStart - periodLength),
    fertile: Math.max(0, fertileEnd - fertileStart),
    luteal: Math.max(0, cycleLength - fertileEnd),
  };
}

/** Her cycle as four pastel segments with a dot on today. */
export function PartnerPhaseBar({
  cycleDay,
  cycleLength,
  periodLength,
}: Props) {
  const segments = phaseSegments(cycleLength, periodLength);
  const position = Math.min(1, Math.max(0, (cycleDay - 0.5) / cycleLength));
  return (
    <View testID="partner-phase-bar">
      <View className="flex-row gap-1">
        <View
          className="h-2.5 rounded-full bg-accent-300"
          style={{ flex: segments.period }}
        />
        <View
          className="h-2.5 rounded-full bg-surface"
          style={{ flex: segments.follicular }}
        />
        <View
          className="h-2.5 rounded-full bg-mint"
          style={{ flex: segments.fertile }}
        />
        <View
          className="h-2.5 rounded-full bg-butter"
          style={{ flex: segments.luteal }}
        />
      </View>
      <View
        className="absolute rounded-full border-[3px] border-surface bg-accent2"
        style={{
          width: MARKER_SIZE,
          height: MARKER_SIZE,
          top: -5,
          left: `${position * 100}%`,
          marginLeft: -MARKER_SIZE / 2,
        }}
      />
      <View className="mt-2 flex-row justify-between">
        {(
          [
            'phase_period',
            'phase_follicular',
            'phase_fertile',
            'phase_luteal',
          ] as const
        ).map((key) => (
          <Text
            key={key}
            className="font-body-bold text-[12px] text-accent2-700"
          >
            {translate(`partner.home.${key}`)}
          </Text>
        ))}
      </View>
    </View>
  );
}
