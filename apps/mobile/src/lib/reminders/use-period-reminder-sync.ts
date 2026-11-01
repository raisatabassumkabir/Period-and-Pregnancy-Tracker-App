import React from 'react';

import { cancelPeriodReminders, replacePeriodReminders } from './notifications';
import { planPeriodReminders } from './reminder-schedule';
import { useNextPeriod } from './use-next-period';
import { useReminderSettings } from './use-reminder-settings';

/**
 * Keeps the scheduled notifications equal to "reminders for the current
 * prediction". Logging a period moves the prediction, which re-plans here;
 * switching reminders off cancels them. Mounted once in the signed-in shell.
 */
export function usePeriodReminderSync(): void {
  const nextPeriodDate = useNextPeriod()?.nextPeriodDate ?? null;
  const settings = useReminderSettings((state) => state.settings);
  const hydrated = useReminderSettings((state) => state.hydrated);
  const hydrate = useReminderSettings((state) => state.hydrate);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync =
      settings.enabled && nextPeriodDate
        ? replacePeriodReminders(planPeriodReminders(nextPeriodDate, settings))
        : cancelPeriodReminders();
    sync.catch((error: unknown) => {
      console.warn('Could not update period reminders', error);
    });
  }, [hydrated, settings, nextPeriodDate]);
}
