import React from 'react';

import { cleanup, screen, setup } from '@/lib/test-utils';

import { PhaseGuideCard } from './phase-guide-card';

afterEach(cleanup);

describe('PhaseGuideCard', () => {
  it('shows her self-care tip for her own view', () => {
    setup(<PhaseGuideCard phase="menstrual" audience="self" />);
    expect(screen.getByText('How you may feel')).toBeOnTheScreen();
    expect(screen.getByText(/Warmth on your tummy/)).toBeOnTheScreen();
  });

  it('shows the partner tip for a partner', () => {
    setup(<PhaseGuideCard phase="luteal" audience="partner" />);
    expect(screen.getByText('How she may feel')).toBeOnTheScreen();
    expect(screen.getByText(/Be patient and kind/)).toBeOnTheScreen();
  });

  it('opens the full guide and switches phases', async () => {
    const { user } = setup(
      <PhaseGuideCard phase="menstrual" audience="self" />
    );
    await user.press(screen.getByTestId('phase-guide-open'));
    expect(screen.getByTestId('phase-guide-menstrual')).toBeOnTheScreen();
    await user.press(screen.getByTestId('phase-guide-tabs-ovulation'));
    expect(screen.getByTestId('phase-guide-ovulation')).toBeOnTheScreen();
  });
});
