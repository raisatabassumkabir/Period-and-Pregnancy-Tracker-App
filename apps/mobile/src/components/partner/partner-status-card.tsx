import { Baby, Moon } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { PHASE_GUIDES } from '@/lib/cycle-education';
import { babySizeKey, formatCalendarDate } from '@/lib/health';
import { translate } from '@/lib/i18n';
import type { PartnerView } from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

import { PartnerPhaseBar } from './partner-phase-bar';

const ICON_SIZE = 24;
const BABY_ICON_SIZE = 28;

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

function Countdown({ view, next }: { view: PartnerView; next: string }) {
  return (
    <View className="mt-4 rounded-[20px] bg-surface p-4">
      <Text
        className="font-display text-[24px] leading-[30px] text-ink"
        testID="partner-status-countdown"
      >
        {next}
      </Text>
      {view.nextPeriodDate ? (
        <Text className="mt-0.5 text-[13px] text-tone-600">
          {formatCalendarDate(view.nextPeriodDate)}
        </Text>
      ) : null}
    </View>
  );
}

function BabySize({ week }: { week: number | null }) {
  const palette = usePaletteColors();
  const sizeKey = babySizeKey(week);
  if (!sizeKey) return null;
  return (
    <View
      className="mt-4 flex-row items-center gap-4 rounded-[20px] bg-surface p-4"
      testID="partner-baby-size"
    >
      <View className="size-14 items-center justify-center rounded-full bg-peach">
        <Baby size={BABY_ICON_SIZE} color={palette.ink} />
      </View>
      <View className="flex-1">
        <Text className="font-body-bold text-[13px] text-mint-ink">
          {translate('partner.home.baby_size')}
        </Text>
        <Text className="font-display text-[22px] leading-[28px] text-ink">
          {translate(sizeKey)}
        </Text>
      </View>
    </View>
  );
}

/** Her name, where she is, and the countdown: lilac for her cycle, mint in pregnancy. */
export function PartnerStatusCard({
  view,
  name,
}: {
  view: PartnerView;
  name: string;
}) {
  const palette = usePaletteColors();
  const next = countdown(view);
  const isPregnancy = view.kind === 'pregnancy';
  const showBar =
    view.kind === 'cycle' &&
    view.cycleDay !== null &&
    view.cycleLength !== null &&
    view.periodLength !== null;
  return (
    <View
      className={`rounded-[32px] p-5 ${isPregnancy ? 'bg-mint' : 'bg-accent2-100'}`}
      testID="partner-status-card"
    >
      <View className="absolute right-5 top-5">
        <Moon size={ICON_SIZE} color={palette.accent2Scale[700]} />
      </View>
      <Text
        className={`pr-8 font-body-bold text-[14px] ${isPregnancy ? 'text-mint-ink' : 'text-accent2-700'}`}
        testID="partner-status-headline"
      >
        {headline(view)}
      </Text>
      <Text className="mt-1 font-display text-[30px] leading-[36px] text-ink">
        {name}
      </Text>
      {isPregnancy ? <BabySize week={view.pregnancyWeek} /> : null}
      {!isPregnancy && next ? <Countdown view={view} next={next} /> : null}
      {showBar ? (
        <View className="mt-5">
          <PartnerPhaseBar
            cycleDay={view.cycleDay ?? 1}
            cycleLength={view.cycleLength ?? 1}
            periodLength={view.periodLength ?? 1}
          />
        </View>
      ) : null}
    </View>
  );
}
