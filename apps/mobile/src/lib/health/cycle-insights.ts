import type { Cycle } from '@/api/cycles/types';

import { addDays, daysBetween, parseDateString, toDateString } from './dates';

/** Used until the user has enough history to average their own cycle length. */
export const DEFAULT_CYCLE_LENGTH_DAYS = 28;
/** Two starts = one interval, the fewest that says anything about this user. */
const MIN_CYCLES_FOR_AVERAGE = 2;
/** Intervals outside this range are data-entry noise, not cycles. */
const MIN_PLAUSIBLE_CYCLE_DAYS = 15;
const MAX_PLAUSIBLE_CYCLE_DAYS = 60;

export interface CycleInsights {
  /** 1-based day of the current cycle. */
  currentDay: number;
  cycleLengthDays: number;
  /** `YYYY-MM-DD` of the next expected period start. */
  nextPeriodDate: string;
  daysUntilNextPeriod: number;
  /** True once the average comes from the user's own history. */
  isPersonalised: boolean;
}

/**
 * Mean gap between consecutive cycle starts, ignoring implausible intervals.
 * Returns `null` until there is at least one usable interval.
 */
function averageCycleLength(startDates: Date[]): number | null {
  const intervals: number[] = [];
  for (let index = 1; index < startDates.length; index += 1) {
    const gap = daysBetween(startDates[index], startDates[index - 1]);
    if (gap >= MIN_PLAUSIBLE_CYCLE_DAYS && gap <= MAX_PLAUSIBLE_CYCLE_DAYS) {
      intervals.push(gap);
    }
  }
  if (intervals.length === 0) return null;

  const total = intervals.reduce((sum, gap) => sum + gap, 0);
  return Math.round(total / intervals.length);
}

/**
 * Current cycle day and next expected period from the user's cycle history.
 * `cycles` arrives newest-first from the API. Returns `null` when there is no
 * usable history, so the caller can render its empty state.
 */
export function deriveCycleInsights(
  cycles: readonly Cycle[],
  today: Date = new Date()
): CycleInsights | null {
  const startDates = cycles
    .map((cycle) => parseDateString(cycle.start_date))
    .filter((date): date is Date => date !== null)
    .sort((left, right) => right.getTime() - left.getTime());

  const latestStart = startDates[0];
  if (!latestStart) return null;

  const average =
    startDates.length >= MIN_CYCLES_FOR_AVERAGE
      ? averageCycleLength(startDates)
      : null;
  const cycleLengthDays = average ?? DEFAULT_CYCLE_LENGTH_DAYS;

  const elapsed = daysBetween(latestStart, today);
  // A start date in the future is nonsense for "day of cycle"; clamp to day 1.
  const currentDay = Math.max(1, elapsed + 1);
  const nextPeriod = addDays(latestStart, cycleLengthDays);

  return {
    currentDay,
    cycleLengthDays,
    nextPeriodDate: toDateString(nextPeriod),
    daysUntilNextPeriod: daysBetween(today, nextPeriod),
    isPersonalised: average !== null,
  };
}
