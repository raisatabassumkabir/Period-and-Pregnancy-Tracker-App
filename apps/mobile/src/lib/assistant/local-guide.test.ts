import { formatCalendarDate } from '@/lib/health';

import { localGuide } from './local-guide';
import type { AssistantContext } from './types';

const baseContext: AssistantContext = {
  cycleInsights: {
    currentDay: 12,
    cycleLengthDays: 28,
    nextPeriodDate: '2026-09-20',
    daysUntilNextPeriod: 14,
    isPersonalised: true,
  },
  pregnancyProgress: null,
  dueDate: null,
  recentSymptoms: [],
  kicksToday: 0,
  isDemoData: false,
};

const pregnantContext: AssistantContext = {
  ...baseContext,
  cycleInsights: null,
  pregnancyProgress: {
    week: 18,
    trimester: 2,
    completion: 0.45,
    daysUntilDue: 154,
  },
};

describe('localGuide', () => {
  it('mentions the formatted next period date', async () => {
    const reply = await localGuide.ask('When is my next period?', baseContext);
    expect(reply.text).toContain(formatCalendarDate('2026-09-20'));
    expect(reply.text).toContain('in 14 days');
  });

  it('phrases an overdue period as elapsed, never as negative days', async () => {
    const reply = await localGuide.ask('When is my next period?', {
      ...baseContext,
      cycleInsights: {
        ...baseContext.cycleInsights!,
        daysUntilNextPeriod: -11,
      },
    });

    expect(reply.text).toContain('11 days ago');
    expect(reply.text).not.toContain('-11');
  });

  it('says "today" rather than "in 0 days"', async () => {
    const reply = await localGuide.ask('When is my next period?', {
      ...baseContext,
      cycleInsights: { ...baseContext.cycleInsights!, daysUntilNextPeriod: 0 },
    });

    expect(reply.text).toContain('expected today');
  });

  it('singularises a one-day countdown', async () => {
    const reply = await localGuide.ask('When is my next period?', {
      ...baseContext,
      cycleInsights: { ...baseContext.cycleInsights!, daysUntilNextPeriod: 1 },
    });

    expect(reply.text).toContain('in 1 day');
    expect(reply.text).not.toContain('1 days');
  });

  it('phrases a passed due date as elapsed', async () => {
    const reply = await localGuide.ask('When is my due date?', {
      ...pregnantContext,
      // `pregnantContext` inherits `dueDate: null`, which short-circuits the
      // handler before it ever formats a countdown.
      dueDate: '2026-09-04',
      pregnancyProgress: {
        ...pregnantContext.pregnancyProgress!,
        daysUntilDue: -3,
      },
    });

    expect(reply.text).toContain('3 days ago');
    expect(reply.text).not.toContain('-3');
  });

  it('mentions the pregnancy week', async () => {
    const reply = await localGuide.ask('How far along am I?', pregnantContext);
    expect(reply.text).toContain('week 18');
  });

  it('falls back to the help text for an unrecognised question', async () => {
    const reply = await localGuide.ask('asdkjhasd', baseContext);
    expect(reply.text).toContain('I can answer questions like:');
  });

  it('appends the demo-data suffix when the context is demo data', async () => {
    const reply = await localGuide.ask('When is my next period?', {
      ...baseContext,
      isDemoData: true,
    });
    expect(reply.text).toContain(
      '…(based on demo data — start the backend to use your own.)'
    );
  });
});
