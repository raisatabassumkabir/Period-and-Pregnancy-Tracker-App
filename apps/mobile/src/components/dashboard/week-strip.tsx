import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { addDays, parseDateString, toDateString } from '@/lib/health';

const DAYS_IN_WEEK = 7;
/** Monday-first, matching the calendar tab. */
const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** The seven `YYYY-MM-DD` dates of the Monday-first week containing `anchor`. */
export function weekContaining(anchor: string): string[] {
  const date = parseDateString(anchor) ?? new Date();
  const daysSinceMonday = (date.getDay() + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK;
  const monday = addDays(date, -daysSinceMonday);
  return Array.from({ length: DAYS_IN_WEEK }, (_, index) =>
    toDateString(addDays(monday, index))
  );
}

interface Props {
  /** `YYYY-MM-DD` — the week shown is the one containing this date. */
  today: string;
  selectedDate: string;
  onSelect: (date: string) => void;
}

/** Horizontal week view; the selected day is a coral pill. */
export function WeekStrip({ today, selectedDate, onSelect }: Props) {
  const week = React.useMemo(() => weekContaining(today), [today]);

  return (
    <View className="flex-row justify-between" testID="week-strip">
      {week.map((date, index) => {
        const selected = date === selectedDate;
        const isToday = date === today;
        return (
          <Pressable
            key={date}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={date}
            testID={`week-day-${date}`}
            onPress={() => onSelect(date)}
            // Colour-only toggle; never a runtime-toggled shadow class.
            className={`h-[68px] w-11 items-center justify-center rounded-pill ${
              selected
                ? 'bg-accent'
                : isToday
                  ? 'border border-accent bg-surface'
                  : 'bg-surface'
            }`}
          >
            <Text
              className={`font-body-semibold text-[11px] ${
                selected ? 'text-accent-100' : 'text-tone-600'
              }`}
            >
              {WEEKDAY_INITIALS[index]}
            </Text>
            <Text
              className={`mt-1 font-body-bold text-[16px] ${
                selected ? 'text-accent-100' : 'text-ink'
              }`}
            >
              {Number(date.slice(-2))}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
