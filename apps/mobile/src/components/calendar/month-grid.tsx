import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import {
  Pressable as RNPressable,
  Text as RNText,
  View as RNView,
} from 'react-native';

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

/** Fixed circle size for day cells — leaves natural gaps inside the 14.28% wrapper. */
const DAY_CIRCLE_SIZE = 40;
const STATE_CIRCLE_SIZE = 22;
const LEGEND_DOT_SIZE = 10;
const PROJECTED_OPACITY = 0.72;
/** Phase tint behind a day: the legend colour at ~20% alpha, so it sits on any canvas. */
const PHASE_TINT_ALPHA_HEX = '33';
/** Vertical gap between week rows in the calendar grid. */
const WEEK_ROW_GAP = 8;

/** Emoji faces for a logged mood. */
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

/**
 * Every emoji the calendar can draw, for {@link CalendarEmojiWarmup}: drawing
 * them once at app start loads Android's colour-emoji font and caches the
 * glyphs, so the month grid's faces paint immediately instead of popping in.
 */
export const CALENDAR_FACE_EMOJIS: string = [
  ...Object.values(MOOD_FACES),
  ...Object.values(PHASE_FACES),
].join('');

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

/**
 * Day cells render with plain React Native primitives and precomputed style
 * objects, not className. A month is ~42 cells of 3-4 nodes each, and every
 * css-interop wrapper resolves its classes on each render: measured at ~300ms
 * per month change in a dev build, and the faces only appeared once it was
 * done. Colours still come from the active palette via {@link DayCellColors}.
 */
export interface DayCellColors {
  accent: string;
  surface: string;
  ink: string;
  dot: string;
}

export interface DayCellProps {
  date: string | null;
  classification: DayClassification | null;
  isSelected?: boolean;
  onPress?: (date: string) => void;
  colors: DayCellColors;
}

/** Selection fills use the accent, which is mid-tone in every palette and mode. */
const ON_ACCENT_COLOR = '#FFFFFF';
const DOT_SIZE = 6;
const TODAY_RING_WIDTH = 1.5;
const DAY_FONT_SIZE = 12;
const FACE_FONT_SIZE = 12;
const COLUMN_WIDTH = '14.28%';

const DAY_CELL_BASE: ViewStyle = {
  width: DAY_CIRCLE_SIZE,
  height: DAY_CIRCLE_SIZE,
  borderRadius: DAY_CIRCLE_SIZE / 2,
  borderWidth: TODAY_RING_WIDTH,
  alignItems: 'center',
  justifyContent: 'center',
};
const STATE_CIRCLE_BASE: ViewStyle = {
  width: STATE_CIRCLE_SIZE,
  height: STATE_CIRCLE_SIZE,
  borderRadius: STATE_CIRCLE_SIZE / 2,
  alignItems: 'center',
  justifyContent: 'center',
};
const DOT_BASE: ViewStyle = {
  width: DOT_SIZE,
  height: DOT_SIZE,
  borderRadius: DOT_SIZE / 2,
};
/**
 * Android draws colour-emoji glyphs with the text colour's alpha, and its
 * default text colour is semi-transparent, so an uncoloured face renders
 * washed out. Any fully opaque colour keeps the emoji at full strength.
 */
export const CALENDAR_FACE_TEXT_STYLE: TextStyle = {
  fontSize: FACE_FONT_SIZE,
  color: '#000000',
};
const DAY_TEXT: TextStyle = {
  fontSize: DAY_FONT_SIZE,
  fontFamily: 'Nunito-SemiBold',
};
const DAY_TEXT_SELECTED: TextStyle = {
  fontSize: DAY_FONT_SIZE,
  fontFamily: 'Nunito-Bold',
  color: ON_ACCENT_COLOR,
};
const CELL_SLOT: ViewStyle = {
  width: COLUMN_WIDTH,
  aspectRatio: 1,
  alignItems: 'center',
  justifyContent: 'center',
};
const BLANK_SLOT: ViewStyle = { width: COLUMN_WIDTH, aspectRatio: 1 };
const WEEK_ROW: ViewStyle = { marginTop: WEEK_ROW_GAP, flexDirection: 'row' };

/** The coloured face-circle inside a cell; a bare dot on an unmarked day. */
function StateCircle({
  classification,
  isSelected,
  dotColor,
}: {
  classification: DayClassification;
  isSelected: boolean;
  dotColor: string;
}) {
  const { phase, isProjected } = classification;
  const color = phase === 'none' ? undefined : PHASE_COLORS[phase];
  const face = faceFor(classification);

  if (!color && !face) {
    return (
      <RNView
        style={[
          DOT_BASE,
          { backgroundColor: isSelected ? ON_ACCENT_COLOR : dotColor },
        ]}
      />
    );
  }

  return (
    <RNView
      style={[
        STATE_CIRCLE_BASE,
        {
          backgroundColor: color ?? colors.cycle.lavender,
          opacity: isProjected ? PROJECTED_OPACITY : 1,
        },
      ]}
      testID={`calendar-state-${phase}`}
    >
      {face ? (
        <RNText testID="calendar-face" style={CALENDAR_FACE_TEXT_STYLE}>
          {face}
        </RNText>
      ) : null}
    </RNView>
  );
}

export function areDayCellPropsEqual(
  prevProps: DayCellProps,
  nextProps: DayCellProps
): boolean {
  if (prevProps.date !== nextProps.date) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.colors !== nextProps.colors) return false;
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

function dayFillColor(
  phase: CyclePhase,
  isSelected: boolean,
  palette: DayCellColors
): string {
  if (isSelected) return palette.accent;
  if (phase === 'none') return palette.surface;
  return PHASE_COLORS[phase] + PHASE_TINT_ALPHA_HEX;
}

export const DayCell = React.memo(function DayCell({
  date,
  classification,
  isSelected = false,
  onPress,
  colors: palette,
}: DayCellProps) {
  if (!date || !classification) {
    return null;
  }

  const dayNumber = String(Number(date.slice(-2)));
  const { isToday, phase } = classification;

  return (
    <RNPressable
      accessibilityRole="button"
      accessibilityLabel={`Day ${dayNumber}${isToday ? ', today' : ''}`}
      accessibilityState={{ selected: isSelected }}
      testID={`calendar-day-${date}`}
      onPress={onPress ? () => onPress(date) : undefined}
      style={[
        DAY_CELL_BASE,
        {
          backgroundColor: dayFillColor(phase, isSelected, palette),
          borderColor: isToday && !isSelected ? palette.accent : 'transparent',
        },
      ]}
    >
      <RNText
        style={
          isSelected ? DAY_TEXT_SELECTED : [DAY_TEXT, { color: palette.ink }]
        }
      >
        {dayNumber}
      </RNText>
      <StateCircle
        classification={classification}
        isSelected={isSelected}
        dotColor={palette.dot}
      />
    </RNPressable>
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
  const cellColors = React.useMemo<DayCellColors>(
    () => ({
      accent: palette.accent,
      surface: palette.surface,
      ink: palette.ink,
      dot: palette.tone[400],
    }),
    [palette]
  );
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
          className="size-12 items-center justify-center rounded-full border border-divider bg-surface active:opacity-70"
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
          className="size-12 items-center justify-center rounded-full border border-divider bg-surface active:opacity-70"
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
        <RNView key={`week-${weekIndex}`} style={WEEK_ROW}>
          {week.map((date, dayIndex) => {
            if (!date) {
              return (
                <RNView
                  key={`blank-${weekIndex}-${dayIndex}`}
                  style={BLANK_SLOT}
                />
              );
            }
            const isSelected = Boolean(date === activeSelectedDate);
            return (
              <RNView key={date} style={CELL_SLOT}>
                <DayCell
                  date={date}
                  classification={classifyDay(date, context)}
                  isSelected={isSelected}
                  onPress={handleDayPress}
                  colors={cellColors}
                />
              </RNView>
            );
          })}
        </RNView>
      ))}

      <Legend />
    </View>
  );
}

/** Backward compatibility alias for MonthGrid */
export const MonthGrid = CalendarGrid;
export type MonthGridProps = CalendarGridProps;
