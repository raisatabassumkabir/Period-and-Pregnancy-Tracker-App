import React from 'react';
import { Text, View } from 'react-native';

import type { Pregnancy } from '@/api/pregnancy/types';
import type { PregnancyProgress } from '@/lib/health';
import { DUE_DATE_DATING_NOTICE, formatCalendarDate } from '@/lib/health';

import { StatusCard } from './status-card';

interface Props {
  pregnancy: Pregnancy;
  progress: PregnancyProgress;
}

const TRIMESTER_LABELS = ['First', 'Second', 'Third'] as const;

function describeDue(daysUntilDue: number | null): string | undefined {
  if (daysUntilDue === null) return undefined;
  if (daysUntilDue === 0) return 'Due today';
  if (daysUntilDue > 0) return `${daysUntilDue} days to go`;
  return `${Math.abs(daysUntilDue)} days overdue`;
}

/** Trimester + due date for the active pregnancy. */
export function PregnancyStatusCards({ pregnancy, progress }: Props) {
  return (
    <View testID="pregnancy-status-cards">
      <View className="flex-row gap-3">
        <StatusCard
          label="Trimester"
          value={TRIMESTER_LABELS[progress.trimester - 1]}
          caption={`Week ${progress.week}`}
          testID="trimester-card"
        />
        <StatusCard
          label="Due date"
          value={formatCalendarDate(pregnancy.due_date)}
          caption={describeDue(progress.daysUntilDue)}
          testID="due-date-card"
        />
      </View>
      <Text
        className="mt-2 text-center font-body text-[11px] text-tone-600"
        testID="due-date-dating-notice"
      >
        {DUE_DATE_DATING_NOTICE}
      </Text>
    </View>
  );
}
