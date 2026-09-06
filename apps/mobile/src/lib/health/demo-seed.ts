import type { Cycle, DailyLog } from '@/api/cycles/types';
import type { Pregnancy } from '@/api/pregnancy/types';

import { addDays, toDateString, todayDateString } from './dates';

/**
 * Typed sample data shown when the backend is unreachable, so every screen
 * stays interactive offline. Screens label it with a "Demo data" pill — it must
 * never be mistakable for the user's own records, and it is never persisted.
 */

/** Derived gestational week of the demo pregnancy (mid second trimester). */
export const DEMO_PREGNANCY_WEEK = 18;

const DAYS_PER_WEEK = 7;
/** `weekFromLmp` counts `floor(elapsed / 7) + 1`, so week N spans these days. */
const DEMO_LMP_DAYS_AGO = (DEMO_PREGNANCY_WEEK - 1) * DAYS_PER_WEEK + 2;
const GESTATION_DAYS = 280;

const DEMO_TIMESTAMP = '2026-01-01T00:00:00Z';
const PERIOD_LENGTH_DAYS = 5;
const DEMO_CYCLE_STARTS_DAYS_AGO = [10, 38, 67] as const;

const today = new Date();

export const DEMO_PREGNANCY: Pregnancy = {
  id: 'demo-pregnancy',
  lmp_date: toDateString(addDays(today, -DEMO_LMP_DAYS_AGO)),
  due_date: toDateString(addDays(today, GESTATION_DAYS - DEMO_LMP_DAYS_AGO)),
  status: 'active',
  notes: '',
  current_week: null,
  created_at: DEMO_TIMESTAMP,
  updated_at: DEMO_TIMESTAMP,
};

export const DEMO_CYCLES: readonly Cycle[] = DEMO_CYCLE_STARTS_DAYS_AGO.map(
  (daysAgo, index) => ({
    id: `demo-cycle-${index}`,
    start_date: toDateString(addDays(today, -daysAgo)),
    end_date: toDateString(addDays(today, -daysAgo + PERIOD_LENGTH_DAYS - 1)),
    notes: '',
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  })
);

export const DEMO_DAILY_LOGS: readonly DailyLog[] = [
  {
    id: 'demo-log-0',
    date: todayDateString(),
    flow: 'none',
    mood: 'good',
    symptoms: ['back_pain', 'food_cravings'],
    temperature_celsius: null,
    notes: '',
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: 'demo-log-1',
    date: toDateString(addDays(today, -1)),
    flow: 'none',
    mood: 'neutral',
    symptoms: ['fatigue', 'nausea'],
    temperature_celsius: null,
    notes: '',
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: 'demo-log-2',
    date: toDateString(addDays(today, -9)),
    flow: 'light',
    mood: 'low',
    symptoms: ['cramps', 'headache'],
    temperature_celsius: null,
    notes: '',
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
];
