import type { ReminderSettings } from './reminder-schedule';
import { planPeriodReminders } from './reminder-schedule';

const SETTINGS: ReminderSettings = {
  enabled: true,
  daysBefore: 2,
  hour: 9,
  minute: 30,
};

describe('planPeriodReminders', () => {
  const now = new Date(2026, 10, 2, 12, 0); // Nov 2, 2026, noon

  it('plans a heads-up and a day-of reminder at the chosen time', () => {
    const plan = planPeriodReminders('2026-11-29', SETTINGS, now);

    expect(plan.map((reminder) => reminder.kind)).toEqual([
      'period-heads-up',
      'period-day',
    ]);
    expect(plan[0].fireAt).toEqual(new Date(2026, 10, 27, 9, 30));
    expect(plan[1].fireAt).toEqual(new Date(2026, 10, 29, 9, 30));
    expect(plan[0].title).toBe('Your period may start in 2 days');
    expect(plan[0].body).toMatch(/Expected around/);
  });

  it('says "1 day" for a one-day heads-up', () => {
    const plan = planPeriodReminders(
      '2026-11-29',
      { ...SETTINGS, daysBefore: 1 },
      now
    );
    expect(plan[0].title).toBe('Your period may start in 1 day');
  });

  it('drops reminders whose time has already passed', () => {
    // Period tomorrow with a 2-day heads-up: only the day-of reminder is left.
    const plan = planPeriodReminders('2026-11-03', SETTINGS, now);
    expect(plan.map((reminder) => reminder.kind)).toEqual(['period-day']);
  });

  it('plans nothing for an unreadable date', () => {
    expect(planPeriodReminders('not-a-date', SETTINGS, now)).toEqual([]);
  });
});
