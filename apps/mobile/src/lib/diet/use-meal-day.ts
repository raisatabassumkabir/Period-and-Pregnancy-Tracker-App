import { create } from 'zustand';

import { todayDateString } from '@/lib/health/dates';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

import type { MealId } from './meal-library';
import type { MealSlot } from './meal-plans';

/** What she did with today's plan. Belongs to one date; a new day starts fresh. */
export interface MealDay {
  date: string;
  swaps: Partial<Record<MealSlot, number>>;
  eaten: readonly MealId[];
}

interface MealDayState {
  day: MealDay;
  hydrate: () => Promise<void>;
  swap: (slot: MealSlot) => void;
  toggleEaten: (id: MealId) => void;
}

const freshDay = (date: string): MealDay => ({ date, swaps: {}, eaten: [] });

/** Yesterday's state is discarded so swaps and ticks never leak into today. */
function forToday(day: MealDay | null): MealDay {
  const today = todayDateString();
  return day && day.date === today ? day : freshDay(today);
}

const _useMealDay = create<MealDayState>((set, get) => {
  const save = (day: MealDay) => {
    set({ day });
    void setItem(STORAGE_KEYS.MEAL_DAY, day);
  };
  return {
    day: freshDay(todayDateString()),
    hydrate: async () => {
      set({ day: forToday(await getItem<MealDay>(STORAGE_KEYS.MEAL_DAY)) });
    },
    swap: (slot) => {
      const day = forToday(get().day);
      const swapCount = (day.swaps[slot] ?? 0) + 1;
      save({ ...day, swaps: { ...day.swaps, [slot]: swapCount } });
    },
    toggleEaten: (id) => {
      const day = forToday(get().day);
      const eaten = day.eaten.includes(id)
        ? day.eaten.filter((item) => item !== id)
        : [...day.eaten, id];
      save({ ...day, eaten });
    },
  };
});

export const useMealDay = createSelectors(_useMealDay);
