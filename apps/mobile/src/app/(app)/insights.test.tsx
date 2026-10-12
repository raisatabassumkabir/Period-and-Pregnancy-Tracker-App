import React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import InsightsScreen from './insights';

afterEach(() => {
  cleanup();
});

describe('InsightsScreen', () => {
  it('renders privacy-focused security card and does not contain zero-knowledge claims', () => {
    render(<InsightsScreen />);

    expect(screen.getByText('Privacy-Focused Security')).toBeOnTheScreen();
    expect(
      screen.getByText(
        /Your sensitive reproductive health metrics are stored locally/i
      )
    ).toBeOnTheScreen();
    expect(screen.queryByText(/zero-knowledge/i)).toBeNull();
    expect(screen.queryByText(/zero knowledge/i)).toBeNull();
  });
});
