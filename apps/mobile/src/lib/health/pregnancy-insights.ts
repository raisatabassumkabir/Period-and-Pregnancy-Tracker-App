import type { Pregnancy } from '@/api/pregnancy/types';

import { daysBetween, parseDateString } from './dates';

/** Full-term gestation, and the denominator of the dashboard ring. */
export const FULL_TERM_WEEKS = 40;

export type Trimester = 1 | 2 | 3;

/** Clinical boundaries: T1 is weeks 1–13, T2 is 14–27, T3 is 28 onward. */
const SECOND_TRIMESTER_START_WEEK = 14;
const THIRD_TRIMESTER_START_WEEK = 28;

export interface PregnancyProgress {
  week: number;
  trimester: Trimester;
  /** 0–1, clamped — the ring's sweep. */
  completion: number;
  daysUntilDue: number | null;
}

export function trimesterForWeek(week: number): Trimester {
  if (week >= THIRD_TRIMESTER_START_WEEK) return 3;
  if (week >= SECOND_TRIMESTER_START_WEEK) return 2;
  return 1;
}

/**
 * Ring + status-card inputs for an active pregnancy. Prefers the server's
 * `current_week`; falls back to counting from `lmp_date` when the server has
 * not computed one yet. Returns `null` when neither is usable.
 */
export function derivePregnancyProgress(
  pregnancy: Pregnancy | undefined,
  today: Date = new Date()
): PregnancyProgress | null {
  if (!pregnancy) return null;

  const week = pregnancy.current_week ?? weekFromLmp(pregnancy.lmp_date, today);
  if (week === null) return null;

  const dueDate = parseDateString(pregnancy.due_date);

  return {
    week,
    trimester: trimesterForWeek(week),
    completion: Math.min(1, Math.max(0, week / FULL_TERM_WEEKS)),
    daysUntilDue: dueDate ? daysBetween(today, dueDate) : null,
  };
}

const DAYS_PER_WEEK = 7;

function weekFromLmp(lmpDate: string | null, today: Date): number | null {
  if (!lmpDate) return null;

  const lmp = parseDateString(lmpDate);
  if (!lmp) return null;

  const elapsedDays = daysBetween(lmp, today);
  if (elapsedDays < 0) return null;

  return Math.floor(elapsedDays / DAYS_PER_WEEK) + 1;
}
