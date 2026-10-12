import React from 'react';

import { CONTRACEPTION_SAFETY_DISCLAIMER } from '@/lib/health';
import { cleanup, render, screen } from '@/lib/test-utils';

import { CycleStatusCards } from './cycle-status-cards';

afterEach(() => {
  cleanup();
});

describe('CycleStatusCards', () => {
  const mockInsights = {
    currentDay: 14,
    cycleLengthDays: 28,
    nextPeriodDate: '2026-10-25',
    daysUntilNextPeriod: 14,
    isPersonalised: true,
  };

  it('renders pregnancy chance, next period, and explicit contraception safety disclaimer', () => {
    render(
      <CycleStatusCards
        insights={mockInsights}
        chance="high"
        chanceDate="2026-10-11"
        today="2026-10-11"
      />
    );

    expect(screen.getByTestId('pregnancy-chance-card')).toHaveTextContent(
      /High/
    );
    expect(screen.getByTestId('next-period-card')).toBeOnTheScreen();
    expect(
      screen.getByTestId('contraception-safety-disclaimer')
    ).toHaveTextContent(CONTRACEPTION_SAFETY_DISCLAIMER);
  });
});
