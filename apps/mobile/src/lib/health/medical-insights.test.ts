import {
  derivePcosMedicalInsight,
  hasPcosOrEndometriosis,
  PCOS_LATE_PERIOD_MESSAGE,
} from './medical-insights';

describe('medical-insights', () => {
  describe('hasPcosOrEndometriosis', () => {
    it('returns true when PCOS is present', () => {
      expect(hasPcosOrEndometriosis(['pcos'])).toBe(true);
      expect(hasPcosOrEndometriosis(['PCOS', 'fibroids'])).toBe(true);
    });

    it('returns true when Endometriosis is present', () => {
      expect(hasPcosOrEndometriosis(['endometriosis'])).toBe(true);
      expect(hasPcosOrEndometriosis(['Endometriosis'])).toBe(true);
    });

    it('returns true when PCOD is present', () => {
      expect(hasPcosOrEndometriosis(['pcod'])).toBe(true);
    });

    it('returns false when neither PCOS nor Endometriosis is present', () => {
      expect(hasPcosOrEndometriosis([])).toBe(false);
      expect(hasPcosOrEndometriosis(['fibroids', 'anemia'])).toBe(false);
      expect(hasPcosOrEndometriosis(['none'])).toBe(false);
    });
  });

  describe('derivePcosMedicalInsight', () => {
    it('does not trigger late period card if period is not late by 7+ days', () => {
      const result = derivePcosMedicalInsight({
        medicalConditions: ['pcos'],
        currentCycleDay: 30,
        baselineCycleLength: 28, // only 2 days late
      });

      expect(result.shouldShowLatePeriodCard).toBe(false);
      expect(result.isLateBySevenPlusDays).toBe(false);
    });

    it('does not trigger late period card if period is late by 7+ days but user lacks PCOS/Endometriosis', () => {
      const result = derivePcosMedicalInsight({
        medicalConditions: ['fibroids'],
        currentCycleDay: 38,
        baselineCycleLength: 28, // 10 days late
      });

      expect(result.isLateBySevenPlusDays).toBe(true);
      expect(result.shouldShowLatePeriodCard).toBe(false);
    });

    it('triggers specific PCOS medical guidance card when period is 7+ days late', () => {
      const result = derivePcosMedicalInsight({
        medicalConditions: ['pcos'],
        currentCycleDay: 35,
        baselineCycleLength: 28, // exactly 7 days late
      });

      expect(result.isLateBySevenPlusDays).toBe(true);
      expect(result.shouldShowLatePeriodCard).toBe(true);
      expect(result.title).toBe('Health Profile Insight');
      expect(result.message).toBe(PCOS_LATE_PERIOD_MESSAGE);
    });

    it('triggers guidance card for endometriosis with custom baseline', () => {
      const result = derivePcosMedicalInsight({
        medicalConditions: ['endometriosis'],
        currentCycleDay: 40,
        baselineCycleLength: 30, // 10 days late
      });

      expect(result.shouldShowLatePeriodCard).toBe(true);
      expect(result.message).toBe(
        'Your period is late. Given your logged health profile, cycle irregularities are common. Medical guidelines suggest consulting your doctor if you miss 3 or more consecutive periods.'
      );
    });
  });
});
