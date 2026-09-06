import type { Cycle } from '@/api/cycles/types';

import {
  DEFAULT_CYCLE_LENGTH_DAYS,
  deriveCycleInsights,
} from './cycle-insights';

const cycle = (start: string): Cycle => ({
  id: `cycle-${start}`,
  start_date: start,
  end_date: null,
  notes: '',
  created_at: `${start}T00:00:00Z`,
  updated_at: `${start}T00:00:00Z`,
});

const at = (value: string) => new Date(`${value}T12:00:00`);

describe('deriveCycleInsights', () => {
  it('returns null without any usable cycle history', () => {
    expect(deriveCycleInsights([])).toBeNull();
  });

  it('counts the current cycle day from the latest start, 1-based', () => {
    const insights = deriveCycleInsights(
      [cycle('2026-03-01')],
      at('2026-03-10')
    );
    expect(insights?.currentDay).toBe(10);
  });

  it('falls back to the default length with only one logged cycle', () => {
    const insights = deriveCycleInsights(
      [cycle('2026-03-01')],
      at('2026-03-10')
    );
    expect(insights?.cycleLengthDays).toBe(DEFAULT_CYCLE_LENGTH_DAYS);
    expect(insights?.isPersonalised).toBe(false);
    expect(insights?.nextPeriodDate).toBe('2026-03-29');
  });

  it('averages the user own history once two cycles exist', () => {
    const insights = deriveCycleInsights(
      [cycle('2026-03-01'), cycle('2026-02-01')],
      at('2026-03-10')
    );
    // 1 Feb -> 1 Mar is 28 days here, so the average matches that interval.
    expect(insights?.cycleLengthDays).toBe(28);
    expect(insights?.isPersonalised).toBe(true);
  });

  it('ignores implausible intervals when averaging', () => {
    // A three-day gap is a data-entry slip, not a cycle.
    const insights = deriveCycleInsights(
      [cycle('2026-03-01'), cycle('2026-02-26'), cycle('2026-01-27')],
      at('2026-03-10')
    );
    expect(insights?.cycleLengthDays).toBe(30);
  });

  it('reports a negative countdown when the period is late', () => {
    const insights = deriveCycleInsights(
      [cycle('2026-03-01')],
      at('2026-04-05')
    );
    expect(insights?.daysUntilNextPeriod).toBeLessThan(0);
  });
});
