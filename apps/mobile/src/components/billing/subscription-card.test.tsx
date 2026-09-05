import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import * as statusHook from '@/api/billing/use-subscription-status';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';
import { getUpgradeState, hideUpgrade } from '@/lib/upgrade';

import { SubscriptionCard } from './subscription-card';

afterEach(() => {
  cleanup();
  hideUpgrade();
  jest.restoreAllMocks();
});

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const mockStatus = (data: any, isLoading = false) => {
  jest
    .spyOn(statusHook, 'usePaymentSubscriptionStatus')
    .mockReturnValue({ data, isLoading } as any);
};

describe('SubscriptionCard', () => {
  it('renders the upgrade CTA for free users and dispatches showUpgrade', () => {
    mockStatus({
      is_premium: false,
      subscription_status: 'free',
      subscription_ends_at: null,
    });
    wrap(<SubscriptionCard />);

    const upgrade = screen.getByTestId('subscription-card-upgrade');
    expect(upgrade).toBeOnTheScreen();

    fireEvent.press(upgrade);
    expect(getUpgradeState().visible).toBe(true);
    expect(getUpgradeState().detail?.feature).toBe('premium');
  });

  it('renders the premium card for active subscribers with the renewal date', () => {
    mockStatus({
      is_premium: true,
      subscription_status: 'active',
      subscription_ends_at: '2027-04-29T00:00:00Z',
    });
    wrap(<SubscriptionCard />);

    expect(screen.getByTestId('subscription-card-premium')).toBeOnTheScreen();
    expect(screen.getByText(/Premium Member/)).toBeOnTheScreen();
  });

  it('shows "Premium until" copy when status is cancelled', () => {
    mockStatus({
      is_premium: true,
      subscription_status: 'cancelled',
      subscription_ends_at: '2026-12-31T00:00:00Z',
    });
    wrap(<SubscriptionCard />);

    expect(screen.getByText(/Premium until/i)).toBeOnTheScreen();
  });

  it('renders a loading state while the status is being fetched', () => {
    mockStatus(undefined, true);
    wrap(<SubscriptionCard />);
    expect(screen.getByTestId('subscription-card-loading')).toBeOnTheScreen();
  });
});
