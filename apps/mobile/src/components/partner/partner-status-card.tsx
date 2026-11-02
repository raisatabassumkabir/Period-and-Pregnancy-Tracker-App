import { CalendarHeart } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { PHASE_GUIDES } from '@/lib/cycle-education';
import { formatCalendarDate } from '@/lib/health';
import { translate } from '@/lib/i18n';
import type { PartnerView } from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 22;

function countdown(view: PartnerView): string | null {
  const days = view.daysUntilPeriod;
  if (days === null) return null;
  if (days === 0) return translate('partner.home.period_today');
  if (days === 1) return translate('partner.home.period_in_one');
  if (days < 0) return translate('partner.home.period_late', { count: -days });
  return translate('partner.home.period_in', { count: days });
}

function headline(view: PartnerView): string {
  if (view.kind === 'pregnancy') {
    return translate('partner.home.pregnant', {
      week: view.pregnancyWeek ?? 1,
    });
  }
  if (view.kind === 'private') return translate('partner.home.private');
  if (view.kind === 'no-data' || !view.phase)
    return translate('partner.home.no_data');
  if (view.phase === 'menstrual') {
    return translate('partner.home.on_period', { day: view.cycleDay ?? 1 });
  }
  return translate('partner.home.cycle_day', {
    day: view.cycleDay ?? 1,
    phase: translate(PHASE_GUIDES[view.phase].nameKey),
  });
}

/** Her name, where she is in her cycle, and the period countdown. */
export function PartnerStatusCard({
  view,
  name,
}: {
  view: PartnerView;
  name: string;
}) {
  const palette = usePaletteColors();
  const next = countdown(view);
  return (
    <View className="rounded-card bg-surface p-5" testID="partner-status-card">
      <Text className="font-body-bold text-[11px] uppercase tracking-[1.5px] text-accent">
        {translate('partner.home.kicker')}
      </Text>
      <View className="mt-2 flex-row items-center gap-3">
        <View className="size-12 items-center justify-center rounded-full bg-accent-200">
          <CalendarHeart size={ICON_SIZE} color={palette.accent} />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-[22px] text-ink">{name}</Text>
          <Text
            className="text-[14px] text-tone-700"
            testID="partner-status-headline"
          >
            {headline(view)}
          </Text>
        </View>
      </View>
      {next ? (
        <View className="mt-4 rounded-panel bg-accent-100 p-3">
          <Text
            className="font-body-bold text-[16px] text-ink"
            testID="partner-status-countdown"
          >
            {next}
          </Text>
          {view.nextPeriodDate ? (
            <Text className="text-[12px] text-tone-600">
              {formatCalendarDate(view.nextPeriodDate)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
