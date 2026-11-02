import type { Trimester } from '@/lib/health';

import type { CycleDietPhase } from './cycle-meal-plans';

/**
 * Daily energy and protein targets for one woman. General guidance from
 * standard references (Mifflin–St Jeor BMR; WHO/IOM protein and pregnancy
 * energy increments), not a clinical prescription.
 */
export type PlanStage =
  | { kind: 'cycle'; phase: CycleDietPhase }
  | { kind: 'pregnancy'; trimester: Trimester };

export interface BodyMetrics {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
}

export interface NutritionTargets {
  /** `null` when we deliberately show no calorie number (minors, missing metrics). */
  kcal: number | null;
  proteinG: number;
  /** True when height and weight were known, so the numbers are personal. */
  isPersonal: boolean;
  isMinor: boolean;
}

const ADULT_AGE = 18;
const TEEN_PROTEIN_AGE = 19;
/** Light activity: most users, safest default when we don't ask. */
const ACTIVITY_FACTOR = 1.4;
/** Small, evidence-modest rise in appetite/energy use before a period. */
const LUTEAL_EXTRA_KCAL = 150;
const PREGNANCY_EXTRA_KCAL: Readonly<Record<Trimester, number>> = {
  1: 0,
  2: 340,
  3: 450,
};
const PROTEIN_G_PER_KG = 0.8;
const TEEN_PROTEIN_G_PER_KG = 0.85;
const PREGNANCY_PROTEIN_G_PER_KG = 1.1;
const PREGNANCY_MIN_PROTEIN_G = 71;
/** Protein guide when weight is unknown: the adult-female RDA, rounded. */
const FALLBACK_PROTEIN_G = 50;
const MIN_PLAUSIBLE_KG = 30;
const MAX_PLAUSIBLE_KG = 250;
const MIN_PLAUSIBLE_CM = 120;
const MAX_PLAUSIBLE_CM = 230;
const KCAL_ROUNDING = 10;

function plausibleWeight(kg: number | null): number | null {
  if (kg == null || kg < MIN_PLAUSIBLE_KG || kg > MAX_PLAUSIBLE_KG) return null;
  return kg;
}

function plausibleHeight(cm: number | null): number | null {
  if (cm == null || cm < MIN_PLAUSIBLE_CM || cm > MAX_PLAUSIBLE_CM) return null;
  return cm;
}

/** Mifflin–St Jeor resting energy for women. */
export function basalMetabolicRate(
  kg: number,
  cm: number,
  age: number
): number {
  return 10 * kg + 6.25 * cm - 5 * age - 161;
}

function stageExtraKcal(stage: PlanStage): number {
  if (stage.kind === 'pregnancy') return PREGNANCY_EXTRA_KCAL[stage.trimester];
  return stage.phase === 'luteal' ? LUTEAL_EXTRA_KCAL : 0;
}

function proteinTarget(
  kg: number | null,
  age: number | null,
  stage: PlanStage
): number {
  if (kg == null) {
    return stage.kind === 'pregnancy'
      ? PREGNANCY_MIN_PROTEIN_G
      : FALLBACK_PROTEIN_G;
  }
  if (stage.kind === 'pregnancy') {
    return Math.max(
      PREGNANCY_MIN_PROTEIN_G,
      Math.round(kg * PREGNANCY_PROTEIN_G_PER_KG)
    );
  }
  const perKg =
    age != null && age < TEEN_PROTEIN_AGE
      ? TEEN_PROTEIN_G_PER_KG
      : PROTEIN_G_PER_KG;
  return Math.round(kg * perKg);
}

export function nutritionTargets(
  metrics: BodyMetrics,
  stage: PlanStage
): NutritionTargets {
  const kg = plausibleWeight(metrics.weightKg);
  const cm = plausibleHeight(metrics.heightCm);
  const isMinor = metrics.age != null && metrics.age < ADULT_AGE;
  const proteinG = proteinTarget(kg, metrics.age, stage);
  const isPersonal = kg != null && cm != null && metrics.age != null;

  // Minors never see a calorie number: growth needs, and eating-disorder risk.
  if (
    !isPersonal ||
    isMinor ||
    kg == null ||
    cm == null ||
    metrics.age == null
  ) {
    return { kcal: null, proteinG, isPersonal, isMinor };
  }
  const daily =
    basalMetabolicRate(kg, cm, metrics.age) * ACTIVITY_FACTOR +
    stageExtraKcal(stage);
  const kcal = Math.round(daily / KCAL_ROUNDING) * KCAL_ROUNDING;
  return { kcal, proteinG, isPersonal, isMinor };
}
