import * as Notifications from 'expo-notifications';

import {
  cancelPeriodReminders,
  replacePeriodReminders,
  requestReminderPermission,
} from './notifications';
import type { PlannedReminder } from './reminder-schedule';

const mocked = Notifications as jest.Mocked<typeof Notifications>;

const PLAN: PlannedReminder[] = [
  {
    kind: 'period-heads-up',
    fireAt: new Date(2026, 10, 27, 9, 0),
    title: 'Your period may start in 2 days',
    body: 'Expected around 29 Nov 2026.',
  },
];

function scheduled(identifier: string, kind?: string) {
  return {
    identifier,
    content: { data: kind ? { kind } : {} },
    trigger: null,
  } as unknown as Notifications.NotificationRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('cancelPeriodReminders', () => {
  it('cancels only the notifications this feature scheduled', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
      scheduled('ours', 'period-reminder'),
      scheduled('someone-else', 'other'),
      scheduled('untagged'),
    ]);

    await cancelPeriodReminders();

    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'ours'
    );
  });
});

describe('replacePeriodReminders', () => {
  it('schedules each planned reminder at its date on the reminder channel', async () => {
    await replacePeriodReminders(PLAN);

    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const request = mocked.scheduleNotificationAsync.mock.calls[0][0];
    expect(request.content.title).toBe('Your period may start in 2 days');
    expect(request.content.data).toEqual({
      kind: 'period-reminder',
      reminder: 'period-heads-up',
    });
    expect(request.trigger).toEqual({
      type: 'date',
      date: PLAN[0].fireAt,
      channelId: 'period-reminders',
    });
  });
});

describe('requestReminderPermission', () => {
  it('is true when already granted, without prompting again', async () => {
    await expect(requestReminderPermission()).resolves.toBe(true);
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('is false without prompting when the user blocked notifications', async () => {
    mocked.getPermissionsAsync.mockResolvedValueOnce({
      granted: false,
      canAskAgain: false,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);

    await expect(requestReminderPermission()).resolves.toBe(false);
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
