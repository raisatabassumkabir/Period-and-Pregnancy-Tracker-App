import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import type { ViewStyle } from 'react-native';

import type { Cycle, DailyLog, Mood } from '@/api/cycles/types';
import { Pressable, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import type { CyclePhase, DayClassification } from '@/lib/health';
import { buildMonthMatrix, classifyDay, todayDateString } from '@/lib/health';
import { usePaletteColors } from '@/lib/theme';

import { MonthPicker } from './month-picker';

/** Monday-first, matching `buildMonthMatrix`'s week order. */
const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const NAV_ICON_SIZE = 20;

/** Google Play strict touch target: minimum 48x48dp */
const MIN_TOUCH_TARGET = 48;
/** Fixed circle size for day cells — leaves natural gaps inside the 14.28% wrapper. */
const DAY_CIRCLE_SIZE = 40;
const STATE_CIRCLE_SIZE = 22;
const LEGEND_DOT_SIZE = 10;
const PROJECTED_OPACITY = 0.72;
/** Vertical gap between week rows in the calendar grid. */
const WEEK_ROW_GAP = 8;

/** Emoji-style faces for a logged mood. */
const MOOD_FACES: Record<Exclude<Mood, 'unspecified'>, string> = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  low: '😕',
  bad: '😢',
};

const PHASE_FACES: Record<Exclude<CyclePhase, 'none'>, string> = {
  period: '😣',
  fertile: '😊',
  ovulation: '😌',
};

const PHASE_COLORS: Record<Exclude<CyclePhase, 'none'>, string> = {
  period: colors.cycle.period,
  fertile: colors.cycle.fertile,
  ovulation: colors.cycle.ovulation,
};

function faceFor(classification: DayClassification): string | null {
  if (classification.mood) return MOOD_FACES[classification.mood];
  if (classification.phase !== 'none') return PHASE_FACES[classification.phase];
  return null;
}

const LEGEND: readonly { phase: Exclude<CyclePhase, 'none'>; label: string }[] =
  [
    { phase: 'period', label: 'Period' },
    { phase: 'fertile', label: 'Fertile' },
    { phase: 'ovulation', label: 'Ovulation' },
  ];

export interface DayCellProps {
  date: string | null;
  classification: DayClassification | null;
  isSelected?: boolean;
  onPress?: (date: string) => void;
}

/** The coloured face-circle inside a cell; a bare dot on an unmarked day. */
const StateCircle = React.memo(function StateCircle({
  classification,
  isSelected,
}: {
  classification: DayClassification;
  isSelected?: boolean;
}) {
  const { phase, isProjected } = classification;
  const color = phase === 'none' ? undefined : PHASE_COLORS[phase];
  const face = faceFor(classification);

  if (!color && !face) {
    return (
      <View
        className="size-1.5 rounded-full"
        style={{
          backgroundColor: isSelected ? '#FFFFFF' : '#D1C8C5',
        }}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: STATE_CIRCLE_SIZE,
        height: STATE_CIRCLE_SIZE,
        backgroundColor: color ?? colors.cycle.lavender,
        opacity: isProjected ? PROJECTED_OPACITY : 1,
      }}
      testID={`calendar-state-${phase}`}
    >
      {face ? (
        <Text testID="calendar-face" className="text-[12px]">
          {face}
        </Text>
      ) : null}
    </View>
  );
});

export function areDayCellPropsEqual(
  prevProps: DayCellProps,
  nextProps: DayCellProps
): boolean {
  if (prevProps.date !== nextProps.date) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (!prevProps.date && !nextProps.date) return true;
  if (prevProps.classification === nextProps.classification) return true;
  if (!prevProps.classification || !nextProps.classification) return false;

  const prev = prevProps.classification;
  const next = nextProps.classification;

  return (
    prev.phase === next.phase &&
    prev.mood === next.mood &&
    prev.isToday === next.isToday &&
    prev.isProjected === next.isProjected &&
    prev.isPeriod === next.isPeriod &&
    prev.isLogged === next.isLogged
  );
}

export const DayCell = React.memo(function DayCell({
  date,
  classification,
  isSelected,
  onPress,
}: DayCellProps) {
  if (!date || !classification) {
    return null;
  }

  const dayNumber = String(Number(date.slice(-2)));
  const { phase } = classification;

  // Determine soft pill styling per design specifications
  let backgroundColor = '#FFFFFF';
  let textColor = '#2A2321';
  let shadowStyle: ViewStyle = {};

  if (isSelected) {
    backgroundColor = '#FF9FA8';
    textColor = '#FFFFFF';
    shadowStyle = {
      shadowColor: '#FF9FA8',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
      elevation: 2,
    };
  } else if (phase === 'period') {
    backgroundColor = '#FFF0F2';
    textColor = '#2A2321';
  } else if (phase === 'fertile' || phase === 'ovulation') {
    backgroundColor = '#E6F9EC';
    textColor = '#1F402B';
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Day ${dayNumber}${classification.isToday ? ', today' : ''}`}
      testID={`calendar-day-${date}`}
      onPress={onPress ? () => onPress(date) : undefined}
      style={[
        {
          width: DAY_CIRCLE_SIZE,
          height: DAY_CIRCLE_SIZE,
          borderRadius: DAY_CIRCLE_SIZE / 2,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shadowStyle,
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: isSelected ? '700' : '600',
          color: textColor,
        }}
      >
        {dayNumber}
      </Text>
      <StateCircle classification={classification} isSelected={isSelected} />
    </Pressable>
  );
}, areDayCellPropsEqual);

function Legend() {
  return (
    <View className="mt-5 flex-row flex-wrap gap-x-4 gap-y-2 self-start">
      {LEGEND.map(({ phase, label }) => (
        <View
          key={phase}
          className="flex-row items-center gap-1.5"
          testID={`calendar-legend-${phase}`}
        >
          <View
            style={{
              width: LEGEND_DOT_SIZE,
              height: LEGEND_DOT_SIZE,
              borderRadius: LEGEND_DOT_SIZE / 2,
              backgroundColor: PHASE_COLORS[phase],
            }}
          />
          <Text className="font-body-semibold text-[12px] text-tone-700">
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export interface CalendarGridProps {
  year: number;
  monthIndex: number;
  cycles: readonly Cycle[];
  logs: readonly DailyLog[];
  cycleLengthDays?: number;
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: (monthIndex: number) => void;
}

/**
 * CalendarGrid: High polish calendar grid adhering to Google Play touch targets (min 48x48dp),
 * soft pill shapes, accessible contrast, and subtle elevation for active selection.
 */
export function CalendarGrid({
  year,
  monthIndex,
  cycles,
  logs,
  cycleLengthDays,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
}: CalendarGridProps) {
  const palette = usePaletteColors();
  const today = React.useMemo(() => todayDateString(), []);
  const [internalSelectedDate, setInternalSelectedDate] =
    React.useState<string>(selectedDate ?? today);

  const activeSelectedDate = selectedDate ?? internalSelectedDate;

  const handleDayPress = React.useCallback(
    (date: string) => {
      setInternalSelectedDate(date);
      onSelectDate?.(date);
    },
    [onSelectDate]
  );

  const weeks = React.useMemo(
    () => buildMonthMatrix(year, monthIndex),
    [year, monthIndex]
  );

  const context = React.useMemo(
    () => ({ cycles, logs, today, cycleLengthDays }),
    [cycles, logs, today, cycleLengthDays]
  );

  return (
    <View testID="calendar-month-grid">
      {/* Month Navigation with min 48x48 touch targets */}
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          testID="calendar-prev-month"
          onPress={onPrevMonth}
          style={{
            minWidth: MIN_TOUCH_TARGET,
            minHeight: MIN_TOUCH_TARGET,
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <ChevronLeft color={palette.ink} size={NAV_ICON_SIZE} />
        </Pressable>

        <MonthPicker
          year={year}
          monthIndex={monthIndex}
          onSelectMonth={onSelectMonth}
        />

        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          testID="calendar-next-month"
          onPress={onNextMonth}
          style={{
            minWidth: MIN_TOUCH_TARGET,
            minHeight: MIN_TOUCH_TARGET,
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <ChevronRight color={palette.ink} size={NAV_ICON_SIZE} />
        </Pressable>
      </View>

      {/* Weekday Initials */}
      <View className="mt-5 flex-row">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <View
            key={`weekday-${index}`}
            style={{ width: '14.28%', alignItems: 'center' }}
          >
            <Text className="font-body-semibold text-[12px] text-tone-600">
              {initial}
            </Text>
          </View>
        ))}
      </View>

      {/* Day Cells Grid */}
      {weeks.map((week, weekIndex) => (
        <View
          key={`week-${weekIndex}`}
          style={{ marginTop: WEEK_ROW_GAP, flexDirection: 'row' }}
        >
          {week.map((date, dayIndex) => {
            if (!date) {
              return (
                <View
                  key={`blank-${weekIndex}-${dayIndex}`}
                  style={{ width: '14.28%', aspectRatio: 1 }}
                />
              );
            }
            const isSelected = Boolean(date === activeSelectedDate);
            return (
              <View
                key={date}
                style={{
                  width: '14.28%',
                  aspectRatio: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DayCell
                  date={date}
                  classification={classifyDay(date, context)}
                  isSelected={isSelected}
                  onPress={handleDayPress}
                />
              </View>
            );
          })}
        </View>
      ))}

      <Legend />
    </View>
  );
}

/** Backward compatibility alias for MonthGrid */
export const MonthGrid = CalendarGrid;
export type MonthGridProps = CalendarGridProps;
