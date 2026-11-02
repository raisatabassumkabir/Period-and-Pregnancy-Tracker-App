import type { SharedStatus } from '@/api/types';
import type { CycleDietPhase } from '@/lib/diet';
import { cycleDietPhaseFor } from '@/lib/diet';
import {
  addDays,
  daysBetween,
  parseDateString,
  toDateString,
} from '@/lib/health/dates';

/**
 * What the partner's app shows, derived on the partner's phone from her
 * shared date anchors. The server stores anchors, not "today", so this is
 * always current without anyone refreshing it.
 */
export interface PartnerView {
  kind: 'cycle' | 'pregnancy' | 'private' | 'no-data';
  phase: CycleDietPhase | null;
  cycleDay: number | null;
  /** Projected forward when the shared date has passed without a new log. */
  nextPeriodDate: string | null;
  daysUntilPeriod: number | null;
  /** Fertile window and best days: only when she shares them. */
  fertileStart: string | null;
  fertileEnd: string | null;
  bestDays: readonly string[];
  pregnancyWeek: number | null;
}

export const LUTEAL_PHASE_DAYS = 14;
export const FERTILE_DAYS_BEFORE = 5;
const FERTILE_DAYS_AFTER = 1;
/** The two days before ovulation and the day itself carry the highest odds. */
export const BEST_DAYS_BEFORE = 2;
const PREGNANCY_DAYS = 280;
const DAYS_PER_WEEK = 7;
/** A shared date this late is treated as "late period", not rolled forward. */
const LATE_GRACE_DAYS = 7;

const EMPTY: Omit<PartnerView, 'kind'> = {
  phase: null,
  cycleDay: null,
  nextPeriodDate: null,
  daysUntilPeriod: null,
  fertileStart: null,
  fertileEnd: null,
  bestDays: [],
  pregnancyWeek: null,
};

function pregnancyView(status: SharedStatus, today: Date): PartnerView {
  const due = parseDateString(status.pregnancy_due_date ?? '');
  if (!due) return { ...EMPTY, kind: 'private' };
  const daysPregnant = PREGNANCY_DAYS - daysBetween(today, due);
  const week = Math.max(1, Math.floor(daysPregnant / DAYS_PER_WEEK));
  return { ...EMPTY, kind: 'pregnancy', pregnancyWeek: week };
}

function fertileWindow(nextPeriod: Date, sharesFertility: boolean) {
  if (!sharesFertility)
    return { fertileStart: null, fertileEnd: null, bestDays: [] };
  const ovulation = addDays(nextPeriod, -LUTEAL_PHASE_DAYS);
  const bestDays = Array.from({ length: BEST_DAYS_BEFORE + 1 }, (_, i) =>
    toDateString(addDays(ovulation, i - BEST_DAYS_BEFORE))
  );
  return {
    fertileStart: toDateString(addDays(ovulation, -FERTILE_DAYS_BEFORE)),
    fertileEnd: toDateString(addDays(ovulation, FERTILE_DAYS_AFTER)),
    bestDays,
  };
}

function cycleView(status: SharedStatus, today: Date): PartnerView {
  const lastStart = parseDateString(status.last_period_start ?? '');
  if (!lastStart) return { ...EMPTY, kind: 'no-data' };
  const length = status.cycle_length;
  const daysSinceStart = daysBetween(lastStart, today);
  // Roll whole cycles forward unless she's only a little late (then say "late").
  const overdue = daysSinceStart - length;
  const cyclesPassed =
    overdue >= 0 && overdue < LATE_GRACE_DAYS
      ? 0
      : Math.floor(daysSinceStart / length);
  const cycleStart = addDays(lastStart, cyclesPassed * length);
  const nextPeriod = addDays(cycleStart, length);
  const cycleDay = daysBetween(cycleStart, today) + 1;
  return {
    ...EMPTY,
    kind: 'cycle',
    cycleDay,
    phase: cycleDietPhaseFor(Math.min(cycleDay, length), length),
    nextPeriodDate: toDateString(nextPeriod),
    daysUntilPeriod: daysBetween(today, nextPeriod),
    ...fertileWindow(nextPeriod, status.ovulation_date !== null),
  };
}

export function derivePartnerView(
  status: SharedStatus | null,
  today = new Date()
): PartnerView {
  if (!status) return { ...EMPTY, kind: 'no-data' };
  if (status.mode === 'private') return { ...EMPTY, kind: 'private' };
  if (status.mode === 'pregnancy' || status.mode === 'postpartum') {
    return pregnancyView(status, today);
  }
  return cycleView(status, today);
}
