import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';

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
/** Vertical pill: number on top, state circle underneath. */
const CELL_CLASS = 'h-16 w-10';
const STATE_CIRCLE_SIZE = 22;
const LEGEND_DOT_SIZE = 10;
/** Predicted days read lighter than logged ones, without hiding the face. */
const PROJECTED_OPACITY = 0.72;

/** Emoji-style faces for a logged mood. */
const MOOD_FACES: Record<Exclude<Mood, 'unspecified'>, string> = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  low: '😕',
  bad: '😢',
};

/**
 * Face shown on a coloured day the user hasn't logged a mood for, so every
 * marked day reads as a face rather than a bare dot. A logged mood always wins
 * over these — see `faceFor`.
 */
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

/** The user's own mood if they logged one, else the phase's stock face. */
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

interface DayCellProps {
  date: string | null;
  classification: DayClassification | null;
}

/** The coloured face-circle inside a cell; a bare dot on an unmarked day. */
function StateCircle({
  classification,
}: {
  classification: DayClassification;
}) {
  const { phase, isProjected } = classification;
  const color = phase === 'none' ? undefined : PHASE_COLORS[phase];
  const face = faceFor(classification);
  if (!color && !face) {
    return <View className="size-1.5 rounded-full bg-tone-300" />;
  }

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: STATE_CIRCLE_SIZE,
        height: STATE_CIRCLE_SIZE,
        backgroundColor: color ?? colors.cycle.lavender,
        // A predicted period/window is a forecast, so it reads lighter — but
        // not so light that the face stops being legible.
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
}

function DayCell({ date, classification }: DayCellProps) {
  if (!date || !classification) return <View className={CELL_CLASS} />;

  const dayNumber = String(Number(date.slice(-2)));
  // Colour-only toggles; never a runtime-toggled shadow class.
  const containerClass = `${CELL_CLASS} items-center justify-between rounded-pill bg-surface py-2 ${
    classification.isToday
      ? 'border-2 border-accent'
      : 'border-2 border-transparent'
  }`;

  return (
    <View className={containerClass} testID={`calendar-day-${date}`}>
      <Text className="font-body-semibold text-[13px] text-ink">
        {dayNumber}
      </Text>
      <StateCircle classification={classification} />
    </View>
  );
}

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

interface Props {
  year: number;
  monthIndex: number;
  cycles: readonly Cycle[];
  logs: readonly DailyLog[];
  /** Personalised average when known. */
  cycleLengthDays?: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: (monthIndex: number) => void;
}

/** Month calendar: month dropdown, weekday initials, pill-shaped day cells, legend. */
export function MonthGrid({
  year,
  monthIndex,
  cycles,
  logs,
  cycleLengthDays,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
}: Props) {
  const palette = usePaletteColors();
  const weeks = buildMonthMatrix(year, monthIndex);
  const today = todayDateString();
  const context = { cycles, logs, today, cycleLengthDays };

  return (
    <View testID="calendar-month-grid">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          testID="calendar-prev-month"
          onPress={onPrevMonth}
          className="size-10 items-center justify-center rounded-full bg-surface"
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
          className="size-10 items-center justify-center rounded-full bg-surface"
        >
          <ChevronRight color={palette.ink} size={NAV_ICON_SIZE} />
        </Pressable>
      </View>

      <View className="mt-5 flex-row justify-between">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <Text
            key={`weekday-${index}`}
            className="w-10 text-center font-body-semibold text-[12px] text-tone-600"
          >
            {initial}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View
          key={`week-${weekIndex}`}
          className="mt-2 flex-row justify-between"
        >
          {week.map((date, dayIndex) => (
            <DayCell
              key={date ?? `blank-${weekIndex}-${dayIndex}`}
              date={date}
              classification={date ? classifyDay(date, context) : null}
            />
          ))}
        </View>
      ))}

      <Legend />
    </View>
  );
}
