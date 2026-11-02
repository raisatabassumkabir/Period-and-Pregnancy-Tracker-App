import type { SharedStatus } from '@/api/types';

import { planPartnerNudges } from './partner-nudges';
import { derivePartnerView } from './partner-view';
import { isPartnerCode } from './share-invite';
import { kindMessageKey, supportIdeaKey } from './support-ideas';

const TODAY = new Date(2026, 10, 2); // 2 Nov 2026, local
const STATUS: SharedStatus = {
  owner_name: 'Raisa',
  mode: 'trying_to_conceive',
  cycle_length: 28,
  period_length: 5,
  last_period_start: '2026-10-20',
  next_period_date: '2026-11-17',
  ovulation_date: '2026-11-03',
  pregnancy_due_date: null,
  updated_at: '2026-10-20T08:00:00Z',
};

describe('derivePartnerView', () => {
  it('works out her phase, countdown and fertile window', () => {
    const view = derivePartnerView(STATUS, TODAY);
    expect(view).toMatchObject({
      kind: 'cycle',
      cycleDay: 14,
      phase: 'ovulation',
      nextPeriodDate: '2026-11-17',
      daysUntilPeriod: 15,
      fertileStart: '2026-10-29',
      fertileEnd: '2026-11-04',
      bestDays: ['2026-11-01', '2026-11-02', '2026-11-03'],
    });
  });

  it('hides the fertile window when she does not share it', () => {
    const view = derivePartnerView({ ...STATUS, ovulation_date: null }, TODAY);
    expect(view.fertileStart).toBeNull();
    expect(view.bestDays).toEqual([]);
  });

  it('reports a few days late instead of rolling forward', () => {
    const view = derivePartnerView(
      { ...STATUS, last_period_start: '2026-10-01' },
      TODAY
    );
    expect(view.daysUntilPeriod).toBe(-4);
  });

  it('rolls forward when she has not logged for a long time', () => {
    const view = derivePartnerView(
      { ...STATUS, last_period_start: '2026-08-01' },
      TODAY
    );
    expect(view.daysUntilPeriod).toBeGreaterThanOrEqual(0);
    expect(view.cycleDay).toBeLessThanOrEqual(28);
  });

  it('shows the pregnancy week, or nothing when private', () => {
    const pregnant = derivePartnerView(
      { ...STATUS, mode: 'pregnancy', pregnancy_due_date: '2027-03-01' },
      TODAY
    );
    expect(pregnant).toMatchObject({ kind: 'pregnancy', pregnancyWeek: 23 });
    expect(derivePartnerView({ ...STATUS, mode: 'private' }, TODAY).kind).toBe(
      'private'
    );
    expect(derivePartnerView(null, TODAY).kind).toBe('no-data');
  });
});

describe('planPartnerNudges', () => {
  const view = derivePartnerView(STATUS, TODAY);
  const on = { enabled: true, hour: 18 };

  it('plans period and fertility nudges in time order, in the future only', () => {
    const plan = planPartnerNudges({
      view: view,
      settings: on,
      cycleLength: 28,
      now: TODAY,
    });
    expect(plan.map((n) => n.kind)).toEqual([
      'pms',
      'period-soon',
      'period-start',
      'check-in',
    ]);
    plan.forEach((n) => expect(n.fireAt.getHours()).toBe(18));
  });

  it('plans the next fertile window once it is within three weeks', () => {
    const plan = planPartnerNudges({
      view: view,
      settings: on,
      cycleLength: 28,
      now: new Date(2026, 10, 10),
    });
    expect(plan.map((n) => n.kind)).toContain('fertile-open');
    const hidden = derivePartnerView(
      { ...STATUS, ovulation_date: null },
      TODAY
    );
    const noFertility = planPartnerNudges({
      view: hidden,
      settings: on,
      cycleLength: 28,
      now: new Date(2026, 10, 10),
    });
    expect(noFertility.map((n) => n.kind)).not.toContain('fertile-open');
  });

  it('plans nothing when switched off or not in cycle mode', () => {
    const off = { ...on, enabled: false };
    expect(
      planPartnerNudges({ view, settings: off, cycleLength: 28, now: TODAY })
    ).toEqual([]);
    const pregnant = derivePartnerView(
      { ...STATUS, mode: 'pregnancy', pregnancy_due_date: '2027-03-01' },
      TODAY
    );
    expect(
      planPartnerNudges({
        view: pregnant,
        settings: on,
        cycleLength: 28,
        now: TODAY,
      })
    ).toEqual([]);
  });
});

describe('support ideas', () => {
  it('rotates daily and resolves to real copy keys', () => {
    const today = supportIdeaKey('luteal', TODAY);
    const tomorrow = supportIdeaKey('luteal', new Date(2026, 10, 3));
    expect(today).not.toBe(tomorrow);
    expect(today).toMatch(/^partner\.ideas\.luteal\.[0-3]$/);
    expect(kindMessageKey('menstrual', TODAY)).toMatch(
      /^partner\.messages\.menstrual\.[01]$/
    );
  });
});

describe('isPartnerCode', () => {
  it('accepts our codes and rejects anything else', () => {
    expect(isPartnerCode('HW-7K3M-Q9XA')).toBe(true);
    expect(isPartnerCode('hw7k3mq9xa')).toBe(true);
    expect(isPartnerCode('https://evil.example')).toBe(false);
    expect(isPartnerCode('HW-0000-1111')).toBe(false);
  });
});
