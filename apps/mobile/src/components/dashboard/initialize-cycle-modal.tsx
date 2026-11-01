import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useInitCycle } from '@/api/cycles';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  addDays,
  buildMonthMatrix,
  daysBetween,
  formatCalendarDate,
  parseDateString,
  toDateString,
  todayDateString,
} from '@/lib/health';
import { usePaletteColors } from '@/lib/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const NAV_ICON_SIZE = 18;
const CLOSE_ICON_SIZE = 18;
const SHEET_BOTTOM_PADDING = 16;
const UNAUTHORIZED = 401;
const DEFAULT_ERROR = 'Failed to initialize cycle. Please try again.';
const SKIP_ERROR = 'Failed to skip. Please try again.';
/** Offline demo/test accounts have no server session, so writes get a 401. */
const DEMO_TOKEN_ERROR =
  "This is an offline test account, so your cycle can't be saved. Sign in with your own account to save it.";

const QUICK_PICKS = [
  { label: 'Today', daysAgo: 0 },
  { label: 'Yesterday', daysAgo: 1 },
  { label: '3 days ago', daysAgo: 3 },
  { label: '1 week ago', daysAgo: 7 },
] as const;

const CYCLE_QUERY_KEYS = [
  ['cycles'],
  ['dashboard'],
  ['dashboard', 'current-cycle'],
  ['daily-logs'],
] as const;

export interface InitializeCycleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/** `today`, `yesterday`, `5 days ago` — how long ago the chosen start was. */
function relativeDayLabel(date: string): string {
  const parsed = parseDateString(date);
  if (!parsed) return '';
  const elapsed = daysBetween(parsed, new Date());
  if (elapsed <= 0) return 'today';
  if (elapsed === 1) return 'yesterday';
  return `${elapsed} days ago`;
}

function monthStartOf(date: string): Date | null {
  const parsed = parseDateString(date);
  return parsed ? new Date(parsed.getFullYear(), parsed.getMonth(), 1) : null;
}

function messageFromError(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : DEFAULT_ERROR;
  }
  // The interceptor purged the token: we are being signed out, say nothing.
  if (error.response?.status === UNAUTHORIZED) {
    return useAuth.getState().token ? DEMO_TOKEN_ERROR : null;
  }
  const body: unknown = error.response?.data;
  if (body && typeof body === 'object') {
    const { message, detail } = body as Record<string, unknown>;
    if (typeof message === 'string') return message;
    if (typeof detail === 'string') return detail;
    return JSON.stringify(body);
  }
  return body ? String(body) : error.message || DEFAULT_ERROR;
}

interface QuickPicksProps {
  selectedDate: string;
  onSelect: (date: string) => void;
}

function QuickPicks({ selectedDate, onSelect }: QuickPicksProps) {
  const options = React.useMemo(
    () =>
      QUICK_PICKS.map((pick) => ({
        label: pick.label,
        date: toDateString(addDays(new Date(), -pick.daysAgo)),
      })),
    []
  );

  return (
    <View className="mt-5 flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = option.date === selectedDate;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(option.date)}
            testID={`init-cycle-quick-${option.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`rounded-pill border px-4 py-2 ${
              isSelected
                ? 'border-accent bg-accent'
                : 'border-divider bg-canvas active:bg-accent-200'
            }`}
          >
            <Text
              className={`font-body-semibold text-[13px] ${
                isSelected ? 'text-white' : 'text-ink'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface DayProps {
  date: string;
  today: string;
  isSelected: boolean;
  onSelect: (date: string) => void;
}

function dayTextClass({ date, today, isSelected }: Omit<DayProps, 'onSelect'>) {
  if (isSelected) return 'font-body-bold text-white';
  if (date > today) return 'font-body text-tone-400';
  if (date === today) return 'font-body-bold text-accent';
  return 'font-body-semibold text-ink';
}

function Day({ date, today, isSelected, onSelect }: DayProps) {
  const isFuture = date > today;
  const isToday = date === today;
  const ring = isToday && !isSelected ? 'border-accent' : 'border-transparent';
  const fill = isSelected ? 'bg-accent' : 'active:bg-accent-200';

  return (
    <View className="h-11 w-[14.28%] items-center justify-center">
      <Pressable
        disabled={isFuture}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected, disabled: isFuture }}
        accessibilityLabel={formatCalendarDate(date)}
        onPress={() => onSelect(date)}
        testID={`init-cycle-day-${date}`}
        className={`size-10 items-center justify-center rounded-pill border ${ring} ${fill}`}
      >
        <Text
          className={`text-sm ${dayTextClass({ date, today, isSelected })}`}
        >
          {String(Number(date.slice(-2)))}
        </Text>
      </Pressable>
    </View>
  );
}

interface MonthCalendarProps {
  month: Date;
  today: string;
  selectedDate: string;
  onSelect: (date: string) => void;
  onChangeMonth: (month: Date) => void;
}

function MonthCalendar(props: MonthCalendarProps) {
  const { month, today, selectedDate, onSelect, onChangeMonth } = props;
  const palette = usePaletteColors();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const weeks = React.useMemo(
    () => buildMonthMatrix(year, monthIndex),
    [year, monthIndex]
  );
  const now = new Date();
  const isLatestMonth =
    year > now.getFullYear() ||
    (year === now.getFullYear() && monthIndex >= now.getMonth());
  const title = month.toLocaleDateString('en', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View className="mt-5 rounded-panel border border-divider bg-canvas px-2 pb-2 pt-3">
      <View className="flex-row items-center justify-between px-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => onChangeMonth(new Date(year, monthIndex - 1, 1))}
          className="size-10 items-center justify-center rounded-pill active:bg-accent-200"
          testID="init-cycle-prev-month"
        >
          <ChevronLeft size={NAV_ICON_SIZE} color={palette.ink} />
        </Pressable>
        <Text className="font-heading text-[15px] text-ink">{title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: isLatestMonth }}
          disabled={isLatestMonth}
          onPress={() => onChangeMonth(new Date(year, monthIndex + 1, 1))}
          className={`size-10 items-center justify-center rounded-pill ${
            isLatestMonth ? 'opacity-30' : 'active:bg-accent-200'
          }`}
          testID="init-cycle-next-month"
        >
          <ChevronRight size={NAV_ICON_SIZE} color={palette.ink} />
        </Pressable>
      </View>

      <View className="mt-2 flex-row">
        {WEEKDAYS.map((weekday, index) => (
          <View key={index} className="w-[14.28%] items-center py-1">
            <Text className="font-body-semibold text-[11px] text-tone-500">
              {weekday}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} className="flex-row">
          {week.map((date, dayIndex) =>
            date ? (
              <Day
                key={date}
                date={date}
                today={today}
                isSelected={date === selectedDate}
                onSelect={onSelect}
              />
            ) : (
              <View
                key={`empty-${weekIndex}-${dayIndex}`}
                className="h-11 w-[14.28%]"
              />
            )
          )}
        </View>
      ))}
    </View>
  );
}

function SelectedDateSummary({ date }: { date: string }) {
  return (
    <View className="mt-4 flex-row items-center justify-between rounded-panel bg-accent-100 px-4 py-3">
      <Text className="font-body text-[13px] text-tone-600">
        Period started
      </Text>
      <Text
        testID="init-cycle-selected-date"
        className="font-body-bold text-[13px] text-accent"
      >
        {formatCalendarDate(date)} · {relativeDayLabel(date)}
      </Text>
    </View>
  );
}

function SheetHeader({
  onClose,
  disabled,
}: {
  onClose: () => void;
  disabled: boolean;
}) {
  const palette = usePaletteColors();
  return (
    <>
      <View className="mb-4 h-1 w-10 self-center rounded-pill bg-tone-300" />
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-body-bold text-[11px] uppercase tracking-[1.5px] text-accent">
            Cycle setup
          </Text>
          <Text className="mt-1 font-heading text-[22px] leading-7 text-ink">
            When did your last period start?
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          disabled={disabled}
          hitSlop={8}
          testID="init-cycle-cancel-button"
          className="size-9 items-center justify-center rounded-pill bg-canvas active:opacity-70"
        >
          <X size={CLOSE_ICON_SIZE} color={palette.ink} />
        </Pressable>
      </View>
      <Text className="mt-2 font-body text-[13px] leading-5 text-tone-600">
        Pick the first day of bleeding. We use it to estimate your cycle day,
        fertile window and next period.
      </Text>
    </>
  );
}

/** Starts a cycle on `date` and refreshes everything derived from cycles. */
function useStartCycle(onDone: () => void) {
  const queryClient = useQueryClient();
  const initCycle = useInitCycle();

  return React.useCallback(
    async (date: string) => {
      await initCycle.mutateAsync({ start_date: date });
      await Promise.all(
        CYCLE_QUERY_KEYS.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey: [...queryKey] })
        )
      );
      onDone();
    },
    [initCycle, queryClient, onDone]
  );
}

export function InitializeCycleModal({
  visible,
  onClose,
  onSuccess,
}: InitializeCycleModalProps) {
  const insets = React.useContext(SafeAreaInsetsContext);
  const today = todayDateString();
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [month, setMonth] = React.useState(() => new Date());
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setSelectedDate(todayDateString());
    setMonth(new Date());
    setErrorMessage(null);
    setIsSubmitting(false);
  }, [visible]);

  const handleDone = React.useCallback(() => {
    onSuccess?.();
    onClose();
  }, [onSuccess, onClose]);
  const startCycle = useStartCycle(handleDone);

  const submit = async (date: string, fallbackMessage?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await startCycle(date);
    } catch (error: unknown) {
      setErrorMessage(fallbackMessage ?? messageFromError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelect = (date: string) => {
    setSelectedDate(date);
    const start = monthStartOf(date);
    if (start) setMonth(start);
  };

  const handleDismiss = () => {
    if (isSubmitting) return;
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
      testID="initialize-cycle-modal"
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="absolute inset-0" onPress={handleDismiss} />
        <View
          className="max-h-[92%] rounded-t-[28px] bg-surface px-5 pt-3"
          style={{
            paddingBottom: (insets?.bottom ?? 0) + SHEET_BOTTOM_PADDING,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <SheetHeader onClose={handleDismiss} disabled={isSubmitting} />
            <QuickPicks selectedDate={selectedDate} onSelect={handleSelect} />
            <MonthCalendar
              month={month}
              today={today}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onChangeMonth={setMonth}
            />
            <SelectedDateSummary date={selectedDate} />

            {errorMessage ? (
              <View className="mt-3 rounded-panel bg-danger-50 px-4 py-3">
                <Text className="font-body text-[13px] text-danger-600">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <Button
              label="Confirm & start cycle"
              size="lg"
              loading={isSubmitting}
              onPress={() => submit(selectedDate)}
              testID="init-cycle-confirm-button"
              className="mt-5 rounded-pill shadow-none"
            />
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => submit(todayDateString(), SKIP_ERROR)}
              testID="init-cycle-skip-button"
              className="items-center py-3 active:opacity-60"
            >
              <Text className="font-body-semibold text-sm text-tone-600">
                Skip for now
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default InitializeCycleModal;
