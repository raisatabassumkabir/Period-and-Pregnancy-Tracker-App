export interface MedicalInsightParams {
  medicalConditions: readonly string[];
  currentCycleDay: number;
  baselineCycleLength: number;
}

export interface MedicalInsightResult {
  isLateBySevenPlusDays: boolean;
  shouldShowLatePeriodCard: boolean;
  title: string;
  message: string;
}

export const LATE_PERIOD_THRESHOLD_DAYS = 7;

export const PCOS_LATE_PERIOD_MESSAGE =
  'Your period is late. Given your logged health profile, cycle irregularities are common. Medical guidelines suggest consulting your doctor if you miss 3 or more consecutive periods.';

/**
 * Checks if the user's recorded health profile contains PCOS or Endometriosis.
 */
export function hasPcosOrEndometriosis(
  conditions: readonly string[] = []
): boolean {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return false;
  }

  return conditions.some((cond) => {
    const normalized = cond.toLowerCase().trim();
    return (
      normalized === 'pcos' ||
      normalized === 'pcod' ||
      normalized === 'endometriosis'
    );
  });
}

/**
 * Derives personalized medical guidance for PCOS/Endometriosis patients when
 * their current cycle exceeds baseline by 7 or more days.
 */
export function derivePcosMedicalInsight(
  params: MedicalInsightParams
): MedicalInsightResult {
  const { medicalConditions, currentCycleDay, baselineCycleLength } = params;
  const hasCondition = hasPcosOrEndometriosis(medicalConditions);
  const lateDays = currentCycleDay - baselineCycleLength;
  const isLateBySevenPlusDays = lateDays >= LATE_PERIOD_THRESHOLD_DAYS;

  if (hasCondition && isLateBySevenPlusDays) {
    return {
      isLateBySevenPlusDays: true,
      shouldShowLatePeriodCard: true,
      title: 'Health Profile Insight',
      message: PCOS_LATE_PERIOD_MESSAGE,
    };
  }

  return {
    isLateBySevenPlusDays,
    shouldShowLatePeriodCard: false,
    title: '',
    message: '',
  };
}
