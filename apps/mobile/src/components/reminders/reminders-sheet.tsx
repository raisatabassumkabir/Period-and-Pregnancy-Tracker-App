import { BellRing, CalendarHeart, X } from 'lucide-react-native';
import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import type { PillOption } from '@/components/ui';
import { Button, OptionPills, Text } from '@/components/ui';
import type { CycleInsights } from '@/lib/health';
import { formatCalendarDate } from '@/lib/health';
import type { ReminderSettings } from '@/lib/reminders';
import {
  areRemindersSupported,
  DAYS_BEFORE_OPTIONS,
  planPeriodReminders,
  REMINDER_TIME_OPTIONS,
  requestReminderPermission,
  sendTestReminder,
  useNextPeriod,
  useReminderSettings,
} from '@/lib/reminders';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 20;
const SHEET_BOTTOM_PADDING = 16;
const PERMISSION_DENIED =
  'Notifications are off for Happy Women. Turn them on in your phone settings to get reminders.';

const DAYS_OPTIONS: readonly PillOption<string>[] = DAYS_BEFORE_OPTIONS.map(
  (days) => ({
    value: String(days),
    label: days === 1 ? '1 day before' : `${days} days before`,
  })
);

const TIME_OPTIONS: readonly PillOption<string>[] = REMINDER_TIME_OPTIONS.map(
  (option) => ({ value: option.label, label: option.label })
);

function describeCountdown(daysUntil: number): string {
  if (daysUntil === 0) return 'Expected today';
  if (daysUntil === 1) return 'Expected tomorrow';
  if (daysUntil > 0) return `In ${daysUntil} days`;
  return `${Math.abs(daysUntil)} days late`;
}

function timeLabel({ hour, minute }: ReminderSettings): string {
  return (
    REMINDER_TIME_OPTIONS.find((o) => o.hour === hour && o.minute === minute)
      ?.label ?? REMINDER_TIME_OPTIONS[0].label
  );
}

function NextPeriodCard({ insights }: { insights: CycleInsights | null }) {
  const palette = usePaletteColors();
  return (
    <View className="mt-5 flex-row items-center gap-3.5 rounded-card border border-divider bg-canvas p-4">
      <View className="size-11 items-center justify-center rounded-full bg-accent-200">
        <CalendarHeart size={ICON_SIZE} color={palette.accent} />
      </View>
      <View className="flex-1">
        <Text className="font-body-bold text-[11px] uppercase tracking-widest text-tone-600">
          Next period
        </Text>
        <Text
          className="mt-0.5 font-display text-[18px] text-ink"
          testID="reminders-next-period"
        >
          {insights
            ? formatCalendarDate(insights.nextPeriodDate)
            : 'Not predicted yet'}
        </Text>
        <Text className="text-[13px] text-tone-600">
          {insights
            ? describeCountdown(insights.daysUntilNextPeriod)
            : 'Log your first period to get a prediction'}
        </Text>
      </View>
    </View>
  );
}

function ScheduleSummary({
  insights,
  settings,
}: {
  insights: CycleInsights | null;
  settings: ReminderSettings;
}) {
  if (!insights) return null;
  const plan = planPeriodReminders(insights.nextPeriodDate, settings);
  const text =
    plan.length === 0
      ? 'Your next reminder will be planned once a new period is predicted.'
      : `You'll be reminded on ${plan
          .map((reminder) => formatCalendarDate(dateKey(reminder.fireAt)))
          .join(' and ')} at ${timeLabel(settings)}.`;
  return (
    <Text
      className="mt-4 text-[13px] leading-5 text-tone-700"
      testID="reminders-summary"
    >
      {text}
    </Text>
  );
}

function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function ReminderToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  const palette = usePaletteColors();
  return (
    <View className="mt-5 flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        <Text className="font-body-bold text-[16px] text-ink">Remind me</Text>
        <Text className="text-[13px] text-tone-600">
          An alert with sound before your period is due
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: palette.tone[300], true: palette.accent }}
        thumbColor="#FFFFFF"
        accessibilityLabel="Period reminders"
        testID="reminders-toggle"
      />
    </View>
  );
}

function ReminderOptions({ settings }: { settings: ReminderSettings }) {
  const update = useReminderSettings((state) => state.update);
  const setTime = (label: string) => {
    const option = REMINDER_TIME_OPTIONS.find((o) => o.label === label);
    if (option) update({ hour: option.hour, minute: option.minute });
  };
  return (
    <>
      <Text className="mb-2 mt-5 font-body-bold text-[13px] text-ink">
        How early
      </Text>
      <OptionPills
        options={DAYS_OPTIONS}
        value={String(settings.daysBefore)}
        onChange={(value) => update({ daysBefore: Number(value) })}
        accessibilityLabel="How many days before"
        testID="reminders-days"
      />
      <Text className="mb-2 mt-4 font-body-bold text-[13px] text-ink">
        At what time
      </Text>
      <OptionPills
        options={TIME_OPTIONS}
        value={timeLabel(settings)}
        onChange={setTime}
        accessibilityLabel="Reminder time"
        testID="reminders-time"
      />
    </>
  );
}

/** Switch, timing options, summary and test button: the working sheet. */
function ReminderControls({ insights }: { insights: CycleInsights | null }) {
  const settings = useReminderSettings((state) => state.settings);
  const { toggle, denied } = useReminderToggle();
  return (
    <>
      <ReminderToggle enabled={settings.enabled} onToggle={toggle} />
      {denied ? <PermissionBanner /> : null}
      {settings.enabled ? <ReminderOptions settings={settings} /> : null}
      {settings.enabled ? (
        <ScheduleSummary insights={insights} settings={settings} />
      ) : null}
      <Button
        variant="outline"
        size="lg"
        label="Send a test reminder"
        onPress={() => sendTest(insights)}
        testID="reminders-test"
        className="mt-6 rounded-pill"
      />
    </>
  );
}

/** Shown by a build without the notification module, instead of a dead switch. */
function UnavailableBanner() {
  return (
    <View
      className="mt-5 rounded-panel bg-accent-100 p-4"
      testID="reminders-unavailable"
    >
      <Text className="font-body-bold text-[14px] text-ink">
        Reminders need the latest app update
      </Text>
      <Text className="mt-1 text-[13px] leading-5 text-tone-700">
        Update Happy Women to get an alert before your next period. Your
        prediction above still updates as usual.
      </Text>
    </View>
  );
}

function PermissionBanner() {
  return (
    <View
      className="mt-4 rounded-panel bg-accent-100 p-4"
      testID="reminders-permission-denied"
    >
      <Text className="text-[13px] leading-5 text-ink">
        {PERMISSION_DENIED}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => Linking.openSettings()}
        className="mt-2 self-start"
      >
        <Text className="font-body-bold text-[13px] text-accent">
          Open settings
        </Text>
      </Pressable>
    </View>
  );
}

/** Hook: turning reminders on asks for permission first; off needs nothing. */
function useReminderToggle() {
  const update = useReminderSettings((state) => state.update);
  const [denied, setDenied] = React.useState(false);
  const toggle = async (next: boolean) => {
    if (!next) {
      update({ enabled: false });
      return;
    }
    const granted = await requestReminderPermission();
    setDenied(!granted);
    if (granted) update({ enabled: true });
  };
  return { toggle, denied };
}

async function sendTest(insights: CycleInsights | null) {
  const granted = await requestReminderPermission();
  if (!granted) {
    showMessage({ message: PERMISSION_DENIED, type: 'warning' });
    return;
  }
  await sendTestReminder({
    title: 'Happy Women reminder',
    body: insights
      ? `Your next period is expected around ${formatCalendarDate(insights.nextPeriodDate)}.`
      : 'Reminders are working. Log a period to get your prediction.',
  });
  showMessage({ message: 'Test reminder on its way', type: 'success' });
}

function SheetHeader({ onClose }: { onClose: () => void }) {
  const palette = usePaletteColors();
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <Text className="font-body-bold text-[11px] uppercase tracking-[1.5px] text-accent">
          Reminders
        </Text>
        <Text className="mt-1 font-display text-[22px] leading-7 text-ink">
          Period reminders
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        hitSlop={8}
        testID="reminders-close"
        className="size-9 items-center justify-center rounded-full bg-canvas active:opacity-70"
      >
        <X size={18} color={palette.ink} />
      </Pressable>
    </View>
  );
}

export interface RemindersSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Opened by the header bell: next period, the reminder switch, its options, a test. */
export function RemindersSheet({ visible, onClose }: RemindersSheetProps) {
  const insets = React.useContext(SafeAreaInsetsContext);
  const palette = usePaletteColors();
  const insights = useNextPeriod();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="reminders-sheet"
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View
          className="max-h-[92%] rounded-t-[28px] bg-surface px-5 pt-3"
          style={{
            paddingBottom: (insets?.bottom ?? 0) + SHEET_BOTTOM_PADDING,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View className="mb-4 h-1 w-10 self-center rounded-pill bg-tone-300" />
            <SheetHeader onClose={onClose} />
            <NextPeriodCard insights={insights} />
            {areRemindersSupported() ? (
              <ReminderControls insights={insights} />
            ) : (
              <UnavailableBanner />
            )}
            <View className="mt-3 flex-row items-center justify-center gap-1.5">
              <BellRing size={14} color={palette.tone[500]} />
              <Text className="text-[12px] text-tone-500">
                Reminders stay on this phone. Predictions are estimates.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
