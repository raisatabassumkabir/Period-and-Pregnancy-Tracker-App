import type { Cycle, DailyLog, Mood } from '@/api/cycles/types';

import type { CyclePhase } from './cycle-phase';
import { resolveCycleDay } from './cycle-phase';
import { addDays, daysBetween, parseDateString, toDateString } from './dates';

/**
 * Month-grid helpers for the calendar tab. Weeks start Monday (ISO), matching
 * the weekday-initials row the grid renders above the dates.
 */

const DAYS_IN_WEEK = 7;
/**
 * A cycle with no `end_date` yet (still in progress) is assumed to run this
 * many days from its start — long enough to shade the days already logged
 * without guessing a length the user hasn't confirmed.
 */
const OPEN_CYCLE_PERIOD_DAYS = 5;

/** JS `getDay()` is 0=Sunday..6=Saturday; this maps it to 0=Monday..6=Sunday. */
function mondayWeekday(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/**
 * Weeks × 7 for the given month, Monday-first. Cells outside the month are
 * `null` so the grid can render blank padding squares.
 */
export function buildMonthMatrix(
  year: number,
  monthIndex: number
): (string | null)[][] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = mondayWeekday(firstOfMonth.getDay());

  const monthDates = Array.from({ length: daysInMonth }, (_, index) =>
    toDateString(new Date(year, monthIndex, index + 1))
  );
  const cells: (string | null)[] = [
    ...(Array(leadingBlanks).fill(null) as null[]),
    ...monthDates,
  ];
  const trailingBlanks =
    (DAYS_IN_WEEK - (cells.length % DAYS_IN_WEEK)) % DAYS_IN_WEEK;
  cells.push(...(Array(trailingBlanks).fill(null) as null[]));

  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += DAYS_IN_WEEK) {
    weeks.push(cells.slice(index, index + DAYS_IN_WEEK));
  }
  return weeks;
}

/** True when `date` falls within `cycle`'s period, open or closed. */
function isWithinCycle(date: Date, cycle: Cycle): boolean {
  const start = parseDateString(cycle.start_date);
  if (!start) return false;

  const end = cycle.end_date
    ? parseDateString(cycle.end_date)
    : addDays(start, OPEN_CYCLE_PERIOD_DAYS - 1);
  if (!end) return false;

  return daysBetween(start, date) >= 0 && daysBetween(date, end) >= 0;
}

export interface DayClassification {
  /** Falls inside a logged cycle's period window. */
  isPeriod: boolean;
  /** A daily log exists for this date. */
  isLogged: boolean;
  isToday: boolean;
  /**
   * Colour the cell takes. A logged period always wins; fertile/ovulation are
   * estimates and a predicted period is flagged through `isProjected`.
   */
  phase: CyclePhase;
  isProjected: boolean;
  /** The face drawn in the cell, when a log with a mood exists. */
  mood: Exclude<Mood, 'unspecified'> | null;
}

/** The month grid's own data, bundled so `classifyDay` stays inside the 3-param limit. */
export interface CalendarDayContext {
  cycles: readonly Cycle[];
  logs: readonly DailyLog[];
  today: string;
  /** Personalised average when known; the phase model defaults to 28. */
  cycleLengthDays?: number;
}

/** Classifies a single `YYYY-MM-DD` cell for the month grid. */
export function classifyDay(
  date: string,
  context: CalendarDayContext
): DayClassification {
  const { cycles, logs, today, cycleLengthDays } = context;
  const parsed = parseDateString(date);
  const isPeriod =
    parsed !== null && cycles.some((cycle) => isWithinCycle(parsed, cycle));
  const log = logs.find((entry) => entry.date === date);
  const cycleDay = resolveCycleDay(date, { cycles, cycleLengthDays });

  return {
    isPeriod,
    isLogged: log !== undefined,
    isToday: date === today,
    phase: isPeriod ? 'period' : (cycleDay?.phase ?? 'none'),
    isProjected: !isPeriod && (cycleDay?.isProjected ?? false),
    mood: log && log.mood !== 'unspecified' ? log.mood : null,
  };
}
