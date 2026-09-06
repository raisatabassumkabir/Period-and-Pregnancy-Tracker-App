import type { Pregnancy } from '@/api/pregnancy/types';

import {
  derivePregnancyProgress,
  FULL_TERM_WEEKS,
  trimesterForWeek,
} from './pregnancy-insights';

const pregnancy = (overrides: Partial<Pregnancy> = {}): Pregnancy => ({
  id: 'pregnancy-1',
  lmp_date: '2026-01-01',
  due_date: '2026-10-08',
  status: 'active',
  notes: '',
  current_week: 10,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const at = (value: string) => new Date(`${value}T12:00:00`);

describe('trimesterForWeek', () => {
  it('maps weeks to clinical trimester boundaries', () => {
    expect(trimesterForWeek(1)).toBe(1);
    expect(trimesterForWeek(13)).toBe(1);
    expect(trimesterForWeek(14)).toBe(2);
    expect(trimesterForWeek(27)).toBe(2);
    expect(trimesterForWeek(28)).toBe(3);
  });
});

describe('derivePregnancyProgress', () => {
  it('returns null without a pregnancy', () => {
    expect(derivePregnancyProgress(undefined)).toBeNull();
  });

  it('prefers the server-computed week', () => {
    const progress = derivePregnancyProgress(
      pregnancy({ current_week: 20 }),
      at('2026-05-01')
    );
    expect(progress?.week).toBe(20);
    expect(progress?.trimester).toBe(2);
    expect(progress?.completion).toBeCloseTo(20 / FULL_TERM_WEEKS);
  });

  it('counts from the LMP date when the server has no week yet', () => {
    const progress = derivePregnancyProgress(
      pregnancy({ current_week: null, lmp_date: '2026-01-01' }),
      at('2026-01-15')
    );
    expect(progress?.week).toBe(3);
  });

  it('returns null when neither the week nor a usable LMP date exists', () => {
    const progress = derivePregnancyProgress(
      pregnancy({ current_week: null, lmp_date: null })
    );
    expect(progress).toBeNull();
  });

  it('counts down to the due date and past it', () => {
    const before = derivePregnancyProgress(pregnancy(), at('2026-10-01'));
    expect(before?.daysUntilDue).toBe(7);

    const after = derivePregnancyProgress(pregnancy(), at('2026-10-11'));
    expect(after?.daysUntilDue).toBe(-3);
  });

  it('clamps completion to 1 past full term', () => {
    const progress = derivePregnancyProgress(
      pregnancy({ current_week: 42 }),
      at('2026-10-20')
    );
    expect(progress?.completion).toBe(1);
  });
});
