import React from 'react';

import { useCycles } from '@/api/cycles';
import { activePregnancy, usePregnancies } from '@/api/pregnancy';
import { useProfile } from '@/api/users';
import {
  calculateAge,
  DEMO_CYCLES,
  deriveCycleInsights,
  derivePregnancyProgress,
  todayDateString,
  useDemoSeedAllowed,
  useIsPregnancyMode,
  usePersonalizationProfile,
  withDemoFallback,
} from '@/lib/health';

import type { CycleDietPhase } from './cycle-meal-plans';
import { cycleDietPhaseFor } from './cycle-meal-plans';
import type { DailyPlan } from './daily-plan';
import { generateDailyPlan } from './daily-plan';
import type {
  BodyMetrics,
  NutritionTargets,
  PlanStage,
} from './nutrition-targets';
import { nutritionTargets } from './nutrition-targets';
import { useMealDay } from './use-meal-day';

/** Used before any cycle is logged, so the screen always has a plan. */
const DEFAULT_PHASE: CycleDietPhase = 'menstrual';
/** Keeps rotations distinct per install when the profile hasn't loaded yet. */
const ANONYMOUS_SEED = 'guest';

/** Her phase today, or `null` before any cycle is logged. */
export function useCurrentCyclePhase(): CycleDietPhase | null {
  const { data, isError } = useCycles();
  const allowSeed = useDemoSeedAllowed();
  const { rows } = withDemoFallback({ data, isError }, DEMO_CYCLES, allowSeed);
  const insights = deriveCycleInsights(rows);
  if (!insights) return null;
  return cycleDietPhaseFor(insights.currentDay, insights.cycleLengthDays);
}

function usePlanStage(): PlanStage {
  const isPregnant = useIsPregnancyMode();
  const { data: pregnancies } = usePregnancies();
  const phase = useCurrentCyclePhase();
  if (isPregnant) {
    const progress = derivePregnancyProgress(activePregnancy(pregnancies));
    return { kind: 'pregnancy', trimester: progress?.trimester ?? 1 };
  }
  return { kind: 'cycle', phase: phase ?? DEFAULT_PHASE };
}

function parseMetric(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Server profile first; the on-device onboarding profile while offline. */
function useBodyMetrics(): BodyMetrics & { seed: string } {
  const { data: server } = useProfile();
  const { profile: local } = usePersonalizationProfile();
  const dateOfBirth = server?.date_of_birth || local.dateOfBirth;
  return {
    age: dateOfBirth ? calculateAge(dateOfBirth) : null,
    heightCm: parseMetric(server?.height ?? local.height),
    weightKg: parseMetric(server?.weight ?? local.weight),
    seed: server?.id ?? ANONYMOUS_SEED,
  };
}

export interface DailyMealPlanResult {
  plan: DailyPlan;
  targets: NutritionTargets;
  stage: PlanStage;
}

/** Today's personalised plan: targets from her body, meals from her phase and diet. */
export function useDailyMealPlan(): DailyMealPlanResult {
  const stage = usePlanStage();
  const { seed, ...metrics } = useBodyMetrics();
  const { data: profile } = useProfile();
  const day = useMealDay.use.day();
  const hydrate = useMealDay.use.hydrate();
  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const targets = nutritionTargets(metrics, stage);
  const plan = generateDailyPlan({
    date: day.date || todayDateString(),
    stage,
    diet: profile?.diet ?? 'unspecified',
    targets,
    seed,
    swaps: day.swaps,
  });
  return { plan, targets, stage };
}
