import { addDays, parseDateString } from '@/lib/health/dates';
import type { TxKeyPath } from '@/lib/i18n';

import type { PartnerView } from './partner-view';
import {
  BEST_DAYS_BEFORE,
  FERTILE_DAYS_BEFORE,
  LUTEAL_PHASE_DAYS,
} from './partner-view';

/**
 * The partner's reminders for the next few weeks, worked out from her shared
 * anchors on the partner's own phone (no push server). Pure: the sync hook
 * translates the keys and hands the plan to the notifications facade.
 */
export type PartnerNudgeKind =
  | 'period-soon'
  | 'period-start'
  | 'check-in'
  | 'pms'
  | 'fertile-open'
  | 'best-day';

export interface PartnerNudge {
  kind: PartnerNudgeKind;
  fireAt: Date;
  titleKey: TxKeyPath;
  bodyKey: TxKeyPath;
}

export interface PartnerNudgeSettings {
  enabled: boolean;
  hour: number;
}

/** Evening by default: most partners can act on it after work. */
export const DEFAULT_PARTNER_NUDGE_SETTINGS: PartnerNudgeSettings = {
  enabled: false,
  hour: 18,
};

const HORIZON_DAYS = 21;
/** Android caps scheduled alarms per app; stay well under. */
const MAX_NUDGES = 12;
const PERIOD_SOON_DAYS = 2;
const CHECK_IN_DAY = 3;
/** PMS usually peaks in the last few days before a period. */
const PMS_DAYS_BEFORE = 5;
const MAX_CYCLES_AHEAD = 2;

const COPY: Readonly<Record<PartnerNudgeKind, [TxKeyPath, TxKeyPath]>> = {
  'period-soon': [
    'partner.nudges.period_soon_title',
    'partner.nudges.period_soon_body',
  ],
  'period-start': [
    'partner.nudges.period_start_title',
    'partner.nudges.period_start_body',
  ],
  'check-in': ['partner.nudges.check_in_title', 'partner.nudges.check_in_body'],
  pms: ['partner.nudges.pms_title', 'partner.nudges.pms_body'],
  'fertile-open': [
    'partner.nudges.fertile_title',
    'partner.nudges.fertile_body',
  ],
  'best-day': ['partner.nudges.best_day_title', 'partner.nudges.best_day_body'],
};

function nudge(kind: PartnerNudgeKind, day: Date, hour: number): PartnerNudge {
  const fireAt = new Date(day);
  fireAt.setHours(hour, 0, 0, 0);
  const [titleKey, bodyKey] = COPY[kind];
  return { kind, fireAt, titleKey, bodyKey };
}

function cycleNudges(period: Date, hour: number): PartnerNudge[] {
  return [
    nudge('pms', addDays(period, -PMS_DAYS_BEFORE), hour),
    nudge('period-soon', addDays(period, -PERIOD_SOON_DAYS), hour),
    nudge('period-start', period, hour),
    nudge('check-in', addDays(period, CHECK_IN_DAY - 1), hour),
  ];
}

/** The fertile window of the cycle that ends with `period`. */
function fertilityNudges(period: Date, hour: number): PartnerNudge[] {
  const ovulation = addDays(period, -LUTEAL_PHASE_DAYS);
  return [
    nudge('fertile-open', addDays(ovulation, -FERTILE_DAYS_BEFORE), hour),
    nudge('best-day', addDays(ovulation, -BEST_DAYS_BEFORE), hour),
  ];
}

export interface PartnerNudgeInput {
  view: PartnerView;
  settings: PartnerNudgeSettings;
  cycleLength: number;
  now?: Date;
}

export function planPartnerNudges({
  view,
  settings,
  cycleLength,
  now = new Date(),
}: PartnerNudgeInput): PartnerNudge[] {
  if (!settings.enabled || view.kind !== 'cycle') return [];
  const nextPeriod = parseDateString(view.nextPeriodDate ?? '');
  if (!nextPeriod) return [];
  const horizon = addDays(now, HORIZON_DAYS);
  const periods = Array.from({ length: MAX_CYCLES_AHEAD }, (_, i) =>
    addDays(nextPeriod, i * cycleLength)
  );
  // Fertility nudges only when she shares her fertile window.
  const sharesFertility = view.fertileStart !== null;
  const all = periods.flatMap((period) => [
    ...cycleNudges(period, settings.hour),
    ...(sharesFertility ? fertilityNudges(period, settings.hour) : []),
  ]);
  return all
    .filter((item) => item.fireAt > now && item.fireAt <= horizon)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, MAX_NUDGES);
}
