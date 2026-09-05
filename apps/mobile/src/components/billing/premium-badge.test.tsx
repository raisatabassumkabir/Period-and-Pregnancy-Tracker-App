import React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { PremiumBadge } from './premium-badge';

afterEach(cleanup);

describe('PremiumBadge', () => {
  it('renders the Premium label', () => {
    render(<PremiumBadge />);
    expect(screen.getByText('Premium')).toBeOnTheScreen();
  });

  it('renders with the default test id', () => {
    render(<PremiumBadge />);
    expect(screen.getByTestId('premium-badge')).toBeOnTheScreen();
  });

  it('respects compact mode by rendering smaller text', () => {
    render(<PremiumBadge compact testID="badge-compact" />);
    expect(screen.getByTestId('badge-compact')).toBeOnTheScreen();
  });
});
