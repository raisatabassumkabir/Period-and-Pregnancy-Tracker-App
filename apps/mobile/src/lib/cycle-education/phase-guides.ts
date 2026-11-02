import type { CycleDietPhase } from '@/lib/diet';
import type { Trimester } from '@/lib/health';
import type { TxKeyPath } from '@/lib/i18n';

/**
 * Plain-language guide to each cycle phase: hormones, typical mood, energy,
 * what helps her, and what a partner can do. Shared by her Home screen and
 * the partner's view, so both read the same, reviewed copy.
 *
 * Phases come from `cycleDietPhaseFor()` so the guide, the meal plan and the
 * partner nudges always agree on "today's phase".
 */
export type GuideAudience = 'self' | 'partner';

export interface PhaseGuide {
  phase: CycleDietPhase;
  nameKey: TxKeyPath;
  daysKey: TxKeyPath;
  hormonesKey: TxKeyPath;
  moodKey: TxKeyPath;
  energyKey: TxKeyPath;
  selfCareKey: TxKeyPath;
  partnerKey: TxKeyPath;
}

function guideFor(phase: CycleDietPhase): PhaseGuide {
  return {
    phase,
    nameKey: `diet.phases.${phase}`,
    daysKey: `cycle_guide.phases.${phase}.days`,
    hormonesKey: `cycle_guide.phases.${phase}.hormones`,
    moodKey: `cycle_guide.phases.${phase}.mood`,
    energyKey: `cycle_guide.phases.${phase}.energy`,
    selfCareKey: `cycle_guide.phases.${phase}.self_care`,
    partnerKey: `cycle_guide.phases.${phase}.partner`,
  };
}

export const PHASE_GUIDES: Readonly<Record<CycleDietPhase, PhaseGuide>> = {
  menstrual: guideFor('menstrual'),
  follicular: guideFor('follicular'),
  ovulation: guideFor('ovulation'),
  luteal: guideFor('luteal'),
};

export const PREGNANCY_GUIDE_KEYS: Readonly<Record<Trimester, TxKeyPath>> = {
  1: 'cycle_guide.pregnancy.1',
  2: 'cycle_guide.pregnancy.2',
  3: 'cycle_guide.pregnancy.3',
};

/** Card title: "How you may feel" for her, "How she may feel" for a partner. */
export function guideTitleKey(audience: GuideAudience): TxKeyPath {
  return audience === 'partner'
    ? 'cycle_guide.partner_title'
    : 'cycle_guide.title';
}
