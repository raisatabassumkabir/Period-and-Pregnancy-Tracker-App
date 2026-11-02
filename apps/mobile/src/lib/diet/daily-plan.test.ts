import { addDays, toDateString } from '@/lib/health/dates';

import type { DailyPlanInput } from './daily-plan';
import { eligibleMeals, generateDailyPlan } from './daily-plan';
import { MEAL_LIBRARY } from './meal-library';
import { MEAL_SLOTS } from './meal-plans';
import { nutritionTargets } from './nutrition-targets';

const STAGE = { kind: 'cycle', phase: 'luteal' } as const;
const BASE: DailyPlanInput = {
  date: '2026-11-02',
  stage: STAGE,
  diet: 'omnivore',
  targets: nutritionTargets({ age: 30, heightCm: 165, weightKg: 60 }, STAGE),
  seed: 'user-1',
};
const DAYS_CHECKED = 60;
const NO_REPEAT_DAYS = 3;

function ids(input: DailyPlanInput): string[] {
  return generateDailyPlan(input).meals.map((planned) => planned.meal.id);
}

function dateAfter(days: number): string {
  return toDateString(addDays(new Date(2026, 10, 2), days));
}

describe('generateDailyPlan', () => {
  it('gives one meal per slot', () => {
    expect(generateDailyPlan(BASE).meals.map((m) => m.slot)).toEqual(
      MEAL_SLOTS
    );
  });

  it('is stable for the same day and user', () => {
    expect(ids(BASE)).toEqual(ids({ ...BASE }));
  });

  it('changes from one day to the next', () => {
    expect(ids(BASE)).not.toEqual(ids({ ...BASE, date: dateAfter(1) }));
  });

  it.each(['omnivore', 'vegan', 'vegetarian', 'kosher'] as const)(
    'never repeats a meal within 3 days for a %s diet',
    (diet) => {
      const plans = Array.from({ length: DAYS_CHECKED }, (_, day) =>
        ids({ ...BASE, diet, date: dateAfter(day) })
      );
      plans.forEach((today, day) => {
        const recent = plans
          .slice(Math.max(0, day - NO_REPEAT_DAYS), day)
          .flat();
        today.forEach((id) => expect(recent).not.toContain(id));
      });
    }
  );

  it('respects a vegan diet', () => {
    const plan = generateDailyPlan({ ...BASE, diet: 'vegan' });
    plan.meals.forEach(({ meal }) => expect(meal.contains).toEqual([]));
  });

  it('never offers pregnancy-unsafe food in pregnancy', () => {
    const stage = { kind: 'pregnancy', trimester: 2 } as const;
    MEAL_SLOTS.forEach((slot) =>
      eligibleMeals(slot, 'omnivore', stage).forEach((meal) =>
        expect(meal.pregnancyUnsafe).toBeUndefined()
      )
    );
    expect(MEAL_LIBRARY.some((meal) => meal.pregnancyUnsafe)).toBe(true);
  });

  it('keeps kosher meals free of shellfish and meat-with-dairy', () => {
    MEAL_SLOTS.forEach((slot) =>
      eligibleMeals(slot, 'kosher', STAGE).forEach(({ contains }) => {
        expect(contains).not.toContain('shellfish');
        const meatWithDairy =
          contains.includes('dairy') &&
          (contains.includes('meat') || contains.includes('poultry'));
        expect(meatWithDairy).toBe(false);
      })
    );
  });

  it('scales portions toward the calorie target and meets protein within 15%', () => {
    for (let day = 0; day < DAYS_CHECKED; day++) {
      const plan = generateDailyPlan({ ...BASE, date: dateAfter(day) });
      expect(plan.totalProteinG).toBeGreaterThanOrEqual(
        BASE.targets.proteinG * 0.85
      );
      expect(plan.portionScale).toBeGreaterThanOrEqual(0.75);
      expect(plan.portionScale).toBeLessThanOrEqual(1.35);
    }
  });

  it('swapping a slot changes only that slot', () => {
    const before = ids(BASE);
    const after = ids({ ...BASE, swaps: { lunch: 1 } });
    expect(after[0]).toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
    expect(after[2]).toBe(before[2]);
  });

  it('names the focus for the phase', () => {
    expect(generateDailyPlan(BASE).focusKey).toBe('meal_library.focus.luteal');
  });
});
