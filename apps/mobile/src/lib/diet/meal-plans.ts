import type { TxKeyPath } from '@/lib/i18n';

import type { Trimester } from '../health';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_SLOTS: readonly MealSlot[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
];

export interface MealSuggestion {
  slot: MealSlot;
  /** i18n keys, not literals — the plan is rendered in the user's language. */
  nameKey: TxKeyPath;
  focusKey: TxKeyPath;
}

/**
 * Trimester-appropriate meal guidance. Nutrient emphasis follows standard
 * prenatal advice: folate early, iron and calcium mid, fibre and energy late.
 * This is general guidance, not personalised medical advice.
 */
export const MEAL_PLANS: Readonly<
  Record<Trimester, readonly MealSuggestion[]>
> = {
  1: [
    {
      slot: 'breakfast',
      nameKey: 'diet.plans.t1.breakfast.name',
      focusKey: 'diet.plans.t1.breakfast.focus',
    },
    {
      slot: 'lunch',
      nameKey: 'diet.plans.t1.lunch.name',
      focusKey: 'diet.plans.t1.lunch.focus',
    },
    {
      slot: 'dinner',
      nameKey: 'diet.plans.t1.dinner.name',
      focusKey: 'diet.plans.t1.dinner.focus',
    },
    {
      slot: 'snack',
      nameKey: 'diet.plans.t1.snack.name',
      focusKey: 'diet.plans.t1.snack.focus',
    },
  ],
  2: [
    {
      slot: 'breakfast',
      nameKey: 'diet.plans.t2.breakfast.name',
      focusKey: 'diet.plans.t2.breakfast.focus',
    },
    {
      slot: 'lunch',
      nameKey: 'diet.plans.t2.lunch.name',
      focusKey: 'diet.plans.t2.lunch.focus',
    },
    {
      slot: 'dinner',
      nameKey: 'diet.plans.t2.dinner.name',
      focusKey: 'diet.plans.t2.dinner.focus',
    },
    {
      slot: 'snack',
      nameKey: 'diet.plans.t2.snack.name',
      focusKey: 'diet.plans.t2.snack.focus',
    },
  ],
  3: [
    {
      slot: 'breakfast',
      nameKey: 'diet.plans.t3.breakfast.name',
      focusKey: 'diet.plans.t3.breakfast.focus',
    },
    {
      slot: 'lunch',
      nameKey: 'diet.plans.t3.lunch.name',
      focusKey: 'diet.plans.t3.lunch.focus',
    },
    {
      slot: 'dinner',
      nameKey: 'diet.plans.t3.dinner.name',
      focusKey: 'diet.plans.t3.dinner.focus',
    },
    {
      slot: 'snack',
      nameKey: 'diet.plans.t3.snack.name',
      focusKey: 'diet.plans.t3.snack.focus',
    },
  ],
};

export const MEAL_SLOT_KEYS: Readonly<Record<MealSlot, TxKeyPath>> = {
  breakfast: 'diet.slots.breakfast',
  lunch: 'diet.slots.lunch',
  dinner: 'diet.slots.dinner',
  snack: 'diet.slots.snack',
};

export const TRIMESTER_KEYS: Readonly<Record<Trimester, TxKeyPath>> = {
  1: 'diet.trimesters.first',
  2: 'diet.trimesters.second',
  3: 'diet.trimesters.third',
};
