/**
 * Date helpers for health data. The API speaks `YYYY-MM-DD` calendar dates with
 * no timezone, so everything here works in local time and formats back to the
 * same string — never `Date.toISOString()`, which shifts the day across UTC.
 */

const MS_PER_DAY = 86_400_000;

/** `YYYY-MM-DD` for a local date. */
export function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Today as `YYYY-MM-DD` in the device's timezone. */
export function todayDateString(): string {
  return toDateString(new Date());
}

/** Parses `YYYY-MM-DD` as local midnight. Invalid input yields `null`. */
export function parseDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Calendar days from `from` to `to`; negative when `to` precedes `from`.
 *
 * Both ends are floored to local midnight first: callers compare a stored
 * `YYYY-MM-DD` against `new Date()`, and without that a mid-afternoon "now"
 * would round up and report an extra day. Rounding after the floor absorbs the
 * 23- and 25-hour days either side of a DST change.
 */
export function daysBetween(from: Date, to: Date): number {
  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** `12 Mar 2026` — locale-aware, day-first, no time component. */
export function formatCalendarDate(value: string, locale = 'en'): string {
  const date = parseDateString(value);
  if (!date) return value;

  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
