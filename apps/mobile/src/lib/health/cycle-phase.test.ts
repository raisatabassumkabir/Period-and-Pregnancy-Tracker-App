import type { Cycle } from '@/api/cycles/types';

import { pregnancyChanceFor, resolveCycleDay } from './cycle-phase';

const TIMESTAMP = '2026-01-01T00:00:00Z';

function makeCycle(start_date: string): Cycle {
  return {
    id: `cycle-${start_date}`,
    start_date,
    end_date: null,
    notes: '',
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  };
}

// One 28-day cycle starting 1 March: ovulation on day 14 (14 Mar), fertile
// window days 9–15 (9–15 Mar), next period projected from 29 Mar.
const cycles = [makeCycle('2026-03-01')];

describe('resolveCycleDay', () => {
  it('returns null with no history or an unparseable date', () => {
    expect(resolveCycleDay('2026-03-10', { cycles: [] })).toBeNull();
    expect(resolveCycleDay('not-a-date', { cycles })).toBeNull();
  });

  it('ignores cycles that start after the date', () => {
    expect(resolveCycleDay('2026-02-20', { cycles })).toBeNull();
  });

  it('counts the day of cycle from the latest start on or before the date', () => {
    expect(resolveCycleDay('2026-03-01', { cycles })).toMatchObject({
      dayOfCycle: 1,
      isProjected: false,
    });
    expect(resolveCycleDay('2026-03-14', { cycles })?.dayOfCycle).toBe(14);
  });

  it('marks ovulation and the six-day fertile window', () => {
    expect(resolveCycleDay('2026-03-14', { cycles })?.phase).toBe('ovulation');
    expect(resolveCycleDay('2026-03-09', { cycles })?.phase).toBe('fertile');
    expect(resolveCycleDay('2026-03-15', { cycles })?.phase).toBe('fertile');
    expect(resolveCycleDay('2026-03-08', { cycles })?.phase).toBe('none');
    expect(resolveCycleDay('2026-03-16', { cycles })?.phase).toBe('none');
  });

  it('never labels a logged cycle day as period — that is the cycle row’s job', () => {
    // Day 2 of a real cycle is `none` here; `classifyDay` overlays the period.
    expect(resolveCycleDay('2026-03-02', { cycles })?.phase).toBe('none');
  });

  it('projects future cycles forward, including a predicted period', () => {
    const projected = resolveCycleDay('2026-03-30', { cycles });
    expect(projected).toEqual({
      dayOfCycle: 2,
      phase: 'period',
      isProjected: true,
    });
    // Day 14 of the projected second cycle is 11 April.
    expect(resolveCycleDay('2026-04-11', { cycles })?.phase).toBe('ovulation');
  });

  it('respects a personalised cycle length', () => {
    // 30-day cycle: ovulation on day 16 (16 Mar).
    const context = { cycles, cycleLengthDays: 30 };
    expect(resolveCycleDay('2026-03-16', context)?.phase).toBe('ovulation');
    expect(resolveCycleDay('2026-03-14', context)?.phase).toBe('fertile');
  });
});

describe('pregnancyChanceFor', () => {
  it('is low without history', () => {
    expect(pregnancyChanceFor(null)).toBe('low');
  });

  it('is high across the fertile window and on ovulation day', () => {
    expect(pregnancyChanceFor(resolveCycleDay('2026-03-09', { cycles }))).toBe(
      'high'
    );
    expect(pregnancyChanceFor(resolveCycleDay('2026-03-14', { cycles }))).toBe(
      'high'
    );
  });

  it('is medium just outside the window and low elsewhere', () => {
    expect(pregnancyChanceFor(resolveCycleDay('2026-03-07', { cycles }))).toBe(
      'medium'
    );
    expect(pregnancyChanceFor(resolveCycleDay('2026-03-17', { cycles }))).toBe(
      'medium'
    );
    expect(pregnancyChanceFor(resolveCycleDay('2026-03-02', { cycles }))).toBe(
      'low'
    );
    expect(pregnancyChanceFor(resolveCycleDay('2026-03-25', { cycles }))).toBe(
      'low'
    );
  });
});
