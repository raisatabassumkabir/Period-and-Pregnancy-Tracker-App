import { basalMetabolicRate, nutritionTargets } from './nutrition-targets';

const ADULT = { age: 30, heightCm: 165, weightKg: 60 };

describe('nutritionTargets', () => {
  it('uses Mifflin–St Jeor for women', () => {
    // 600 + 1031.25 - 150 - 161
    expect(basalMetabolicRate(60, 165, 30)).toBeCloseTo(1320.25);
  });

  it('gives an adult a calorie and protein target', () => {
    const targets = nutritionTargets(ADULT, {
      kind: 'cycle',
      phase: 'follicular',
    });
    expect(targets).toEqual({
      kcal: 1850,
      proteinG: 48,
      isPersonal: true,
      isMinor: false,
    });
  });

  it('adds a little energy in the luteal phase', () => {
    const follicular = nutritionTargets(ADULT, {
      kind: 'cycle',
      phase: 'follicular',
    });
    const luteal = nutritionTargets(ADULT, { kind: 'cycle', phase: 'luteal' });
    expect((luteal.kcal ?? 0) - (follicular.kcal ?? 0)).toBe(150);
  });

  it('raises energy and protein in pregnancy', () => {
    const third = nutritionTargets(ADULT, { kind: 'pregnancy', trimester: 3 });
    expect(third.kcal).toBe(2300);
    expect(third.proteinG).toBe(71);
  });

  it('never shows a calorie number to a minor', () => {
    const teen = nutritionTargets(
      { age: 16, heightCm: 160, weightKg: 50 },
      { kind: 'cycle', phase: 'menstrual' }
    );
    expect(teen.kcal).toBeNull();
    expect(teen.isMinor).toBe(true);
    expect(teen.proteinG).toBe(43);
  });

  it('falls back to a protein guide when metrics are missing or implausible', () => {
    const missing = nutritionTargets(
      { age: 30, heightCm: null, weightKg: 5 },
      { kind: 'cycle', phase: 'luteal' }
    );
    expect(missing).toEqual({
      kcal: null,
      proteinG: 50,
      isPersonal: false,
      isMinor: false,
    });
  });
});
