import React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { FetalActivityLogger } from './fetal-activity-logger';

afterEach(() => {
  cleanup();
});

describe('FetalActivityLogger', () => {
  it('renders kick counter and clinical safety warning without creating false reassurance', () => {
    render(<FetalActivityLogger />);

    expect(screen.getByText('Fetal Activity Counter')).toBeOnTheScreen();
    expect(
      screen.getByTestId('fetal-clinical-safety-notice')
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        /If you perceive a decrease or cessation in your baby's movements/i
      )
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/Kick counting does not replace clinical evaluation/i)
    ).toBeOnTheScreen();
  });
});
