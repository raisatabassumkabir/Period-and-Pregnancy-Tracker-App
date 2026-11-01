import type { TxKeyPath } from '@/lib/i18n';

import type { MealSlot, MealSuggestion } from './meal-plans';
import { MEAL_SLOTS } from './meal-plans';

/**
 * The four textbook cycle phases. The calendar's `CyclePhase` only marks the
 * days it colours (period / fertile / ovulation); nutrition advice needs the
 * follicular and luteal stretches between them too.
 */
export type CycleDietPhase =
  | 'menstrual'
  | 'follicular'
  | 'ovulation'
  | 'luteal';

export const CYCLE_DIET_PHASES: readonly CycleDietPhase[] = [
  'menstrual',
  'follicular',
  'ovulation',
  'luteal',
];

export const CYCLE_PHASE_KEYS: Readonly<Record<CycleDietPhase, TxKeyPath>> = {
  menstrual: 'diet.phases.menstrual',
  follicular: 'diet.phases.follicular',
  ovulation: 'diet.phases.ovulation',
  luteal: 'diet.phases.luteal',
};

/** Typical bleed length; the phase only steers meal ideas, not predictions. */
const MENSTRUAL_DAYS = 5;
/** Same constant the calendar uses: ovulation sits 14 days before the next period. */
const LUTEAL_PHASE_DAYS = 14;
/** Ovulation advice covers the day itself plus one either side. */
const OVULATION_HALF_WINDOW_DAYS = 1;

/** Which phase a 1-based cycle day falls in, for a cycle of the given length. */
export function cycleDietPhaseFor(
  cycleDay: number,
  cycleLengthDays: number
): CycleDietPhase {
  const ovulationDay = cycleLengthDays - LUTEAL_PHASE_DAYS;
  if (cycleDay <= MENSTRUAL_DAYS) return 'menstrual';
  if (cycleDay < ovulationDay - OVULATION_HALF_WINDOW_DAYS) return 'follicular';
  if (cycleDay <= ovulationDay + OVULATION_HALF_WINDOW_DAYS) return 'ovulation';
  return 'luteal';
}

function planFor(phase: CycleDietPhase): readonly MealSuggestion[] {
  return MEAL_SLOTS.map((slot: MealSlot) => ({
    slot,
    nameKey: `diet.plans.${phase}.${slot}.name`,
    focusKey: `diet.plans.${phase}.${slot}.focus`,
  }));
}

/** Phase-matched meal ideas for cycle tracking. General guidance only. */
export const CYCLE_MEAL_PLANS: Readonly<
  Record<CycleDietPhase, readonly MealSuggestion[]>
> = {
  menstrual: planFor('menstrual'),
  follicular: planFor('follicular'),
  ovulation: planFor('ovulation'),
  luteal: planFor('luteal'),
};
