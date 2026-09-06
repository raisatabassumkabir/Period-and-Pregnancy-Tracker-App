import type { Cycle } from '@/api/cycles/types';

import { DEFAULT_CYCLE_LENGTH_DAYS } from './cycle-insights';
import { daysBetween, parseDateString } from './dates';

/**
 * Where a calendar day sits in the cycle. Drives the calendar's day colours,
 * the dashboard's "chances of pregnancy" insight and the ring's centre copy.
 *
 * `period` is only ever a *logged* period (a cycle row). Fertile and
 * ovulation days are estimates from the textbook model below, never medical
 * advice — the copy that renders them must say "estimated".
 */
export type CyclePhase = 'period' | 'fertile' | 'ovulation' | 'none';

export type PregnancyChance = 'low' | 'medium' | 'high';

/** Ovulation is assumed a fixed luteal-phase length before the next period. */
const LUTEAL_PHASE_DAYS = 14;
/** Sperm survive ~5 days; the egg ~1 day — the classic six-day window. */
const FERTILE_DAYS_BEFORE_OVULATION = 5;
const FERTILE_DAYS_AFTER_OVULATION = 1;
/** Days either side of the fertile window that still read as "medium". */
const MEDIUM_CHANCE_MARGIN_DAYS = 2;
/** A period predicted by projecting the average forward is shaded this long. */
const PREDICTED_PERIOD_DAYS = 5;

export interface CycleDay {
  /** 1-based day of the (possibly projected) cycle containing `date`. */
  dayOfCycle: number;
  phase: CyclePhase;
  /** True when `date` lies beyond the latest logged cycle, i.e. a projection. */
  isProjected: boolean;
}

export interface CyclePhaseContext {
  cycles: readonly Cycle[];
  /** Personalised average when known; defaults to the textbook 28. */
  cycleLengthDays?: number;
}

function latestStartOnOrBefore(
  cycles: readonly Cycle[],
  date: Date
): Date | null {
  let latest: Date | null = null;
  for (const cycle of cycles) {
    const start = parseDateString(cycle.start_date);
    if (!start || daysBetween(start, date) < 0) continue;
    if (!latest || start.getTime() > latest.getTime()) latest = start;
  }
  return latest;
}

function phaseForDayOfCycle(
  dayOfCycle: number,
  cycleLengthDays: number,
  isProjected: boolean
): CyclePhase {
  const ovulationDay = cycleLengthDays - LUTEAL_PHASE_DAYS;
  if (dayOfCycle === ovulationDay) return 'ovulation';

  const fertileStart = ovulationDay - FERTILE_DAYS_BEFORE_OVULATION;
  const fertileEnd = ovulationDay + FERTILE_DAYS_AFTER_OVULATION;
  if (dayOfCycle >= fertileStart && dayOfCycle <= fertileEnd) return 'fertile';

  if (isProjected && dayOfCycle <= PREDICTED_PERIOD_DAYS) return 'period';
  return 'none';
}

/**
 * Locates `date` within the user's cycles. Days after the latest logged start
 * are projected forward in `cycleLengthDays` steps so future months still
 * show a fertile window and an expected period. Returns `null` with no history.
 */
export function resolveCycleDay(
  date: string,
  context: CyclePhaseContext
): CycleDay | null {
  const parsed = parseDateString(date);
  if (!parsed) return null;

  const cycleLengthDays = context.cycleLengthDays ?? DEFAULT_CYCLE_LENGTH_DAYS;
  const latestStart = latestStartOnOrBefore(context.cycles, parsed);
  if (!latestStart) return null;

  const elapsed = daysBetween(latestStart, parsed);
  const isProjected = elapsed >= cycleLengthDays;
  const dayOfCycle = (elapsed % cycleLengthDays) + 1;

  return {
    dayOfCycle,
    phase: phaseForDayOfCycle(dayOfCycle, cycleLengthDays, isProjected),
    isProjected,
  };
}

export interface CycleWindows {
  /** 1-based, inclusive. */
  periodDays: { start: number; end: number };
  fertileDays: { start: number; end: number };
  ovulationDay: number;
}

/** The ring's coloured arcs: where each phase falls for a cycle of this length. */
export function describeCycleWindows(
  cycleLengthDays: number = DEFAULT_CYCLE_LENGTH_DAYS
): CycleWindows {
  const ovulationDay = cycleLengthDays - LUTEAL_PHASE_DAYS;
  return {
    periodDays: { start: 1, end: PREDICTED_PERIOD_DAYS },
    fertileDays: {
      start: ovulationDay - FERTILE_DAYS_BEFORE_OVULATION,
      end: ovulationDay + FERTILE_DAYS_AFTER_OVULATION,
    },
    ovulationDay,
  };
}

/** Coarse conception likelihood for the insight card — never a diagnosis. */
export function pregnancyChanceFor(
  cycleDay: CycleDay | null,
  cycleLengthDays: number = DEFAULT_CYCLE_LENGTH_DAYS
): PregnancyChance {
  if (!cycleDay) return 'low';
  if (cycleDay.phase === 'fertile' || cycleDay.phase === 'ovulation') {
    return 'high';
  }

  const ovulationDay = cycleLengthDays - LUTEAL_PHASE_DAYS;
  const fertileStart = ovulationDay - FERTILE_DAYS_BEFORE_OVULATION;
  const fertileEnd = ovulationDay + FERTILE_DAYS_AFTER_OVULATION;
  const nearWindow =
    cycleDay.dayOfCycle >= fertileStart - MEDIUM_CHANCE_MARGIN_DAYS &&
    cycleDay.dayOfCycle <= fertileEnd + MEDIUM_CHANCE_MARGIN_DAYS;

  return nearWindow ? 'medium' : 'low';
}
