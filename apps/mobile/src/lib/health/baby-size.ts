import type { TxKeyPath } from '@/lib/i18n';

/** Before week 4 there is nothing meaningful to compare; past 40, stay at 40. */
export const FIRST_SIZED_WEEK = 4;
export const LAST_SIZED_WEEK = 40;

/**
 * Translation key for "about the size of …" at a pregnancy week, the familiar
 * produce comparison. Null before week 4. Keys live under `baby_sizes.wN`
 * in every locale, one per week from 4 to 40.
 */
export function babySizeKey(week: number | null): TxKeyPath | null {
  if (week === null || week < FIRST_SIZED_WEEK) return null;
  const clamped = Math.min(Math.floor(week), LAST_SIZED_WEEK);
  return `baby_sizes.w${clamped}` as TxKeyPath;
}
