import { Platform } from 'react-native';

import type { PlannedReminder } from './reminder-schedule';

/**
 * Local-notification facade for period reminders. Everything is on-device:
 * no push token, no server. Only this file touches `expo-notifications`.
 *
 * The module is loaded OPTIONALLY. It has a native half, so there are two
 * states where importing it would take the whole app down: the package is not
 * installed yet (Metro: "Unable to resolve module"), or it is installed but
 * the dev client was not rebuilt ("Cannot find native module"). In both, the
 * app keeps working and reminders report themselves unavailable instead.
 */
type NotificationsApi = typeof import('expo-notifications');

function loadNotifications(): NotificationsApi | null {
  try {
    // A require inside try/catch is an optional dependency for Metro (Expo
    // enables `allowOptionalDependencies`), so a missing package bundles fine.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsApi;
  } catch {
    return null;
  }
}

const Notifications = loadNotifications();

const CHANNEL_ID = 'period-reminders';
/** Tags our scheduled notifications so cancelling never touches anyone else's. */
const REMINDER_DATA_KIND = 'period-reminder';
/** Long-short-long buzz: noticeable like an alarm, not alarming. */
const VIBRATION_PATTERN = [0, 400, 250, 400];
const LIGHT_COLOR = '#B24C74';
const TEST_DELAY_SECONDS = 3;

// Show the banner and play the sound even while the app is open.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** False when this build has no notification module (see file header). */
export function areRemindersSupported(): boolean {
  return Notifications !== null;
}

/** Android needs a channel before anything can ring; high importance = heads-up + sound. */
async function ensureChannel(api: NotificationsApi): Promise<void> {
  if (Platform.OS !== 'android') return;
  await api.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Period reminders',
    description: 'Alerts before your next predicted period',
    importance: api.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: VIBRATION_PATTERN,
    lightColor: LIGHT_COLOR,
    lockscreenVisibility: api.AndroidNotificationVisibility.PRIVATE,
  });
}

/** True when reminders may be shown; asks the OS once if it has not yet. */
export async function requestReminderPermission(): Promise<boolean> {
  if (!Notifications) return false;
  await ensureChannel(Notifications);
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** A notification to schedule; `kind` says which one within its group. */
export interface TaggedReminder {
  kind: string;
  fireAt: Date;
  title: string;
  body: string;
}

/**
 * Removes every notification this app scheduled under `tag`, and nothing
 * else. Each feature (her period reminders, a partner's nudges) owns a tag.
 */
export async function cancelTaggedReminders(tag: string): Promise<void> {
  if (!Notifications) return;
  const api = Notifications;
  const scheduled = await api.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter(
    (request) => request.content.data?.kind === tag
  );
  await Promise.all(
    ours.map((request) =>
      api.cancelScheduledNotificationAsync(request.identifier)
    )
  );
}

/** Removes every period reminder this app scheduled, and nothing else. */
export function cancelPeriodReminders(): Promise<void> {
  return cancelTaggedReminders(REMINDER_DATA_KIND);
}

/** Replaces any existing period reminders with `plan`. */
export function replacePeriodReminders(
  plan: readonly PlannedReminder[]
): Promise<void> {
  return replaceTaggedReminders(REMINDER_DATA_KIND, plan);
}

/** Replaces everything scheduled under `tag` with `plan`. */
export async function replaceTaggedReminders(
  tag: string,
  plan: readonly TaggedReminder[]
): Promise<void> {
  if (!Notifications) return;
  const api = Notifications;
  await ensureChannel(api);
  await cancelTaggedReminders(tag);
  await Promise.all(
    plan.map((reminder) =>
      api.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: 'default',
          priority: api.AndroidNotificationPriority.MAX,
          data: { kind: tag, reminder: reminder.kind },
        },
        trigger: {
          type: api.SchedulableTriggerInputTypes.DATE,
          date: reminder.fireAt,
          channelId: CHANNEL_ID,
        },
      })
    )
  );
}

/** Fires a sample reminder in a few seconds so the user can hear and see it. */
export async function sendTestReminder(reminder: {
  title: string;
  body: string;
}): Promise<void> {
  if (!Notifications) return;
  const api = Notifications;
  await ensureChannel(api);
  await api.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.body,
      sound: 'default',
      priority: api.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: api.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TEST_DELAY_SECONDS,
      channelId: CHANNEL_ID,
    },
  });
}
