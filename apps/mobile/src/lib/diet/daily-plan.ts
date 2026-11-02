import type { DietPreference } from '@/api/types';
import type { TxKeyPath } from '@/lib/i18n';

import type { Ingredient, LibraryMeal, Nutrient } from './meal-library';
import { MEAL_LIBRARY } from './meal-library';
import type { MealSlot } from './meal-plans';
import { MEAL_SLOTS } from './meal-plans';
import type { NutritionTargets, PlanStage } from './nutrition-targets';

/**
 * Builds a new, deterministic meal plan for every day.
 *
 * How variety is guaranteed: each slot's eligible meals are shuffled ONCE per
 * user (seeded), and day N reads its own window of that cycle. Consecutive
 * days use disjoint windows, so a meal never repeats within at least three
 * days, with no need to remember past plans. Inside a window the meal that
 * best fits today's phase (and, for the snack, today's protein gap) wins.
 */
export interface DailyPlanInput {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  stage: PlanStage;
  diet: DietPreference;
  targets: NutritionTargets;
  /** Stable per user (the user id), so two users don't see the same rotation. */
  seed: string;
  /** How many times each slot was swapped today. */
  swaps?: Partial<Record<MealSlot, number>>;
}

export interface PlannedMeal {
  slot: MealSlot;
  meal: LibraryMeal;
  nameKey: TxKeyPath;
  kcal: number;
  proteinG: number;
}

export interface DailyPlan {
  meals: readonly PlannedMeal[];
  totalKcal: number;
  totalProteinG: number;
  portionScale: number;
  /** Grams still missing after scaling; 0 when the target is met. */
  proteinShortfallG: number;
  focusKey: TxKeyPath;
}

const DAYS_WITHOUT_REPEAT = 4;
const MS_PER_DAY = 86_400_000;
const MIN_PORTION = 0.75;
const MAX_PORTION = 1.35;
const PORTION_STEP = 0.05;
/** A shortfall under this share of the target is within normal day-to-day noise. */
const SHORTFALL_TOLERANCE = 0.1;
const PROTEIN_GAP_WEIGHT = 0.1;

const EXCLUDED_BY_DIET: Readonly<
  Record<DietPreference, readonly Ingredient[]>
> = {
  unspecified: [],
  omnivore: [],
  halal: [],
  vegan: ['meat', 'poultry', 'fish', 'shellfish', 'dairy', 'egg'],
  vegetarian: ['meat', 'poultry', 'fish', 'shellfish'],
  pescatarian: ['meat', 'poultry'],
  kosher: ['shellfish'],
};

const FOCUS_NUTRIENTS: Readonly<Record<string, readonly Nutrient[]>> = {
  menstrual: ['iron', 'vitamin_c', 'omega3'],
  follicular: ['protein', 'fibre', 'folate'],
  ovulation: ['fibre', 'vitamin_c', 'omega3'],
  luteal: ['magnesium', 'b6', 'complex_carbs', 'calcium'],
  t1: ['folate', 'b6', 'complex_carbs'],
  t2: ['iron', 'calcium', 'protein'],
  t3: ['fibre', 'omega3', 'calcium', 'protein'],
};

function stageKey(stage: PlanStage): string {
  return stage.kind === 'pregnancy' ? `t${stage.trimester}` : stage.phase;
}

/** FNV-1a: tiny, stable string hash for seeding. */
function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32: small seeded PRNG, good enough for shuffling a menu. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], seed: number): T[] {
  const random = seededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function fitsDiet(meal: LibraryMeal, diet: DietPreference): boolean {
  const excluded = EXCLUDED_BY_DIET[diet];
  if (meal.contains.some((item) => excluded.includes(item))) return false;
  // Kosher: never meat or poultry with dairy in the same dish.
  const mixesMeatAndDairy =
    meal.contains.includes('dairy') &&
    (meal.contains.includes('meat') || meal.contains.includes('poultry'));
  return !(diet === 'kosher' && mixesMeatAndDairy);
}

export function eligibleMeals(
  slot: MealSlot,
  diet: DietPreference,
  stage: PlanStage
): LibraryMeal[] {
  return MEAL_LIBRARY.filter(
    (meal) =>
      meal.slot === slot &&
      fitsDiet(meal, diet) &&
      !(stage.kind === 'pregnancy' && meal.pregnancyUnsafe)
  );
}

function dayIndex(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function focusScore(meal: LibraryMeal, focus: readonly Nutrient[]): number {
  return meal.nutrients.filter((nutrient) => focus.includes(nutrient)).length;
}

interface SlotPick {
  slot: MealSlot;
  input: DailyPlanInput;
  /** Protein still to cover; only the snack uses it. */
  proteinGap: number | null;
}

function pickForSlot({
  slot,
  input,
  proteinGap,
}: SlotPick): LibraryMeal | null {
  const pregnant = input.stage.kind === 'pregnancy';
  const pool = eligibleMeals(slot, input.diet, input.stage);
  if (pool.length === 0) return null;
  const order = shuffled(
    pool,
    hashString(`${input.seed}|${slot}|${input.diet}|${pregnant}`)
  );
  const windowSize = Math.max(
    1,
    Math.floor(order.length / DAYS_WITHOUT_REPEAT)
  );
  const swaps = input.swaps?.[slot] ?? 0;
  const start = dayIndex(input.date) * windowSize + swaps * windowSize;
  const candidates = Array.from(
    { length: windowSize },
    (_, offset) => order[(start + offset) % order.length]
  );
  const focus = FOCUS_NUTRIENTS[stageKey(input.stage)];
  const score = (meal: LibraryMeal) =>
    focusScore(meal, focus) -
    (proteinGap == null
      ? 0
      : Math.abs(proteinGap - meal.proteinG) * PROTEIN_GAP_WEIGHT);
  return candidates.reduce((best, meal) =>
    score(meal) > score(best) ? meal : best
  );
}

function roundPortion(value: number): number {
  const clamped = Math.min(MAX_PORTION, Math.max(MIN_PORTION, value));
  return Math.round(clamped / PORTION_STEP) * PORTION_STEP;
}

function sum(meals: readonly LibraryMeal[], key: 'kcal' | 'proteinG'): number {
  return meals.reduce((total, meal) => total + meal[key], 0);
}

function pickMeals(input: DailyPlanInput): LibraryMeal[] {
  const mains = MEAL_SLOTS.filter((slot) => slot !== 'snack')
    .map((slot) => pickForSlot({ slot, input, proteinGap: null }))
    .filter((meal): meal is LibraryMeal => meal !== null);
  const proteinGap = input.targets.proteinG - sum(mains, 'proteinG');
  const snack = pickForSlot({ slot: 'snack', input, proteinGap });
  return snack ? [...mains, snack] : mains;
}

export function generateDailyPlan(input: DailyPlanInput): DailyPlan {
  const picked = pickMeals(input);
  const baseKcal = sum(picked, 'kcal');
  const portionScale =
    input.targets.kcal == null || baseKcal === 0
      ? 1
      : roundPortion(input.targets.kcal / baseKcal);
  const meals = picked.map((meal) => ({
    slot: meal.slot,
    meal,
    nameKey: `meal_library.meals.${meal.id}` as const,
    kcal: Math.round(meal.kcal * portionScale),
    proteinG: Math.round(meal.proteinG * portionScale),
  }));
  const totalProteinG = meals.reduce((total, meal) => total + meal.proteinG, 0);
  const shortfall = input.targets.proteinG - totalProteinG;
  return {
    meals,
    totalKcal: meals.reduce((total, meal) => total + meal.kcal, 0),
    totalProteinG,
    portionScale,
    proteinShortfallG:
      shortfall > input.targets.proteinG * SHORTFALL_TOLERANCE ? shortfall : 0,
    focusKey: `meal_library.focus.${stageKey(input.stage)}` as TxKeyPath,
  };
}
