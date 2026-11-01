import { addDays, formatCalendarDate, parseDateString } from '@/lib/health';

export interface ReminderSettings {
  enabled: boolean;
  /** How many days ahead of the predicted start the heads-up fires. */
  daysBefore: number;
  /** Local time of day both reminders fire at. */
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  daysBefore: 2,
  hour: 9,
  minute: 0,
};

export const DAYS_BEFORE_OPTIONS = [1, 2, 3] as const;

export interface ReminderTimeOption {
  label: string;
  hour: number;
  minute: number;
}

export const REMINDER_TIME_OPTIONS: readonly ReminderTimeOption[] = [
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '8:00 PM', hour: 20, minute: 0 },
];

export type ReminderKind = 'period-heads-up' | 'period-day';

export interface PlannedReminder {
  kind: ReminderKind;
  fireAt: Date;
  title: string;
  body: string;
}

function atTimeOfDay(day: Date, hour: number, minute: number): Date {
  const fireAt = new Date(day);
  fireAt.setHours(hour, minute, 0, 0);
  return fireAt;
}

function daysWord(days: number): string {
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * The reminders for one predicted period: a heads-up `daysBefore` days ahead
 * and one on the day itself, both at the chosen time. Anything already in the
 * past is dropped, so a late prediction never fires a stale alert.
 */
export function planPeriodReminders(
  nextPeriodDate: string,
  settings: ReminderSettings,
  now: Date = new Date()
): PlannedReminder[] {
  const periodDay = parseDateString(nextPeriodDate);
  if (!periodDay) return [];

  const expected = formatCalendarDate(nextPeriodDate);
  const { daysBefore, hour, minute } = settings;

  const planned: PlannedReminder[] = [
    {
      kind: 'period-heads-up',
      fireAt: atTimeOfDay(addDays(periodDay, -daysBefore), hour, minute),
      title: `Your period may start in ${daysWord(daysBefore)}`,
      body: `Expected around ${expected}. A gentle reminder to keep your essentials close.`,
    },
    {
      kind: 'period-day',
      fireAt: atTimeOfDay(periodDay, hour, minute),
      title: 'Your period may start today',
      body: 'Log it in Happy Women when it begins so your predictions stay accurate.',
    },
  ];

  return planned.filter((reminder) => reminder.fireAt > now);
}
