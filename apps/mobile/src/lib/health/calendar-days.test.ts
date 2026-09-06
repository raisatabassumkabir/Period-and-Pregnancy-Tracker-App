import type { Cycle, DailyLog } from '@/api/cycles/types';

import { buildMonthMatrix, classifyDay } from './calendar-days';

const TIMESTAMP = '2026-01-01T00:00:00Z';

function makeCycle(overrides: Partial<Cycle> = {}): Cycle {
  return {
    id: 'cycle-1',
    start_date: '2026-02-10',
    end_date: '2026-02-14',
    notes: '',
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    ...overrides,
  };
}

function makeLog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    id: 'log-1',
    date: '2026-02-11',
    flow: 'light',
    mood: 'neutral',
    symptoms: [],
    temperature_celsius: null,
    notes: '',
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    ...overrides,
  };
}

describe('buildMonthMatrix', () => {
  it('has no leading blanks when the 1st is a Monday', () => {
    const matrix = buildMonthMatrix(2024, 0); // January 2024, 1st is a Monday

    expect(matrix).toHaveLength(5);
    matrix.forEach((week) => expect(week).toHaveLength(7));
    expect(matrix[0][0]).toBe('2024-01-01');
    expect(matrix[4]).toEqual([
      '2024-01-29',
      '2024-01-30',
      '2024-01-31',
      null,
      null,
      null,
      null,
    ]);
  });

  it('pads leading blanks when the 1st is a Sunday', () => {
    const matrix = buildMonthMatrix(2026, 1); // February 2026, 1st is a Sunday

    expect(matrix[0]).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      '2026-02-01',
    ]);
    expect(matrix[0]).toHaveLength(7);
  });
});

describe('classifyDay', () => {
  const today = '2026-02-12';

  it('marks a date inside a closed cycle as a period day', () => {
    const cycles = [
      makeCycle({ start_date: '2026-02-10', end_date: '2026-02-14' }),
    ];

    expect(
      classifyDay('2026-02-12', { cycles, logs: [], today }).isPeriod
    ).toBe(true);
    expect(
      classifyDay('2026-02-09', { cycles, logs: [], today }).isPeriod
    ).toBe(false);
    expect(
      classifyDay('2026-02-15', { cycles, logs: [], today }).isPeriod
    ).toBe(false);
  });

  it('assumes a default window for an open-ended cycle', () => {
    const cycles = [makeCycle({ start_date: '2026-02-10', end_date: null })];

    // OPEN_CYCLE_PERIOD_DAYS = 5, so the window is Feb 10-14 inclusive.
    expect(
      classifyDay('2026-02-14', { cycles, logs: [], today }).isPeriod
    ).toBe(true);
    expect(
      classifyDay('2026-02-15', { cycles, logs: [], today }).isPeriod
    ).toBe(false);
  });

  it('flags a logged day', () => {
    const logs = [makeLog({ date: '2026-02-11' })];

    expect(
      classifyDay('2026-02-11', { cycles: [], logs, today }).isLogged
    ).toBe(true);
    expect(
      classifyDay('2026-02-12', { cycles: [], logs, today }).isLogged
    ).toBe(false);
  });

  it('flags today', () => {
    expect(classifyDay(today, { cycles: [], logs: [], today }).isToday).toBe(
      true
    );
    expect(
      classifyDay('2026-02-11', { cycles: [], logs: [], today }).isToday
    ).toBe(false);
  });

  it('colours a logged period as period even inside an estimated window', () => {
    // Cycle starts Feb 10; a logged period on day 1 beats any phase estimate.
    const cycles = [makeCycle({ start_date: '2026-02-10', end_date: null })];
    const day = classifyDay('2026-02-10', { cycles, logs: [], today });

    expect(day.phase).toBe('period');
    expect(day.isProjected).toBe(false);
  });

  it('estimates fertile and ovulation days from the cycle start', () => {
    const cycles = [makeCycle({ start_date: '2026-02-10', end_date: null })];

    // 28-day model: ovulation on day 14 (Feb 23), fertile days 9–15.
    expect(classifyDay('2026-02-23', { cycles, logs: [], today }).phase).toBe(
      'ovulation'
    );
    expect(classifyDay('2026-02-19', { cycles, logs: [], today }).phase).toBe(
      'fertile'
    );
  });

  it('exposes the logged mood and hides an unspecified one', () => {
    const logs = [
      makeLog({ date: '2026-02-11', mood: 'great' }),
      makeLog({ id: 'log-2', date: '2026-02-12', mood: 'unspecified' }),
    ];

    expect(classifyDay('2026-02-11', { cycles: [], logs, today }).mood).toBe(
      'great'
    );
    expect(
      classifyDay('2026-02-12', { cycles: [], logs, today }).mood
    ).toBeNull();
  });
});
