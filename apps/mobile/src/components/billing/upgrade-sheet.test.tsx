import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import * as verifyHook from '@/api/billing/use-verify-purchase';
import { PurchaseCancelledError, setBillingClient } from '@/lib/billing';
import { cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';
import { showUpgrade } from '@/lib/upgrade';

import { UpgradeSheet } from './upgrade-sheet';

const PRODUCT_ID = 'premium_monthly';

afterEach(() => {
  cleanup();
  // Reset billing impl
  setBillingClient({
    isAvailable: () => false,
    initialize: async () => {},
    getProducts: async () => [],
    requestSubscription: async () => {
      throw new Error('not configured');
    },
    acknowledgePurchase: async () => {},
    getAvailablePurchases: async () => [],
    endConnection: async () => {},
  });
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('UpgradeSheet', () => {
  it('renders the fallback title and the message from the upgrade detail', async () => {
    renderWithProviders(<UpgradeSheet />);
    showUpgrade({
      message: 'Daily limit reached. Upgrade to keep going.',
      feature: 'feature_without_a_title',
    });

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-sheet-title')).toBeOnTheScreen();
    });
    expect(screen.getByTestId('upgrade-sheet-title')).toHaveTextContent(
      /Upgrade to Premium/i
    );
    expect(screen.getByTestId('upgrade-sheet-message')).toHaveTextContent(
      'Daily limit reached. Upgrade to keep going.'
    );
    expect(screen.getByTestId('upgrade-sheet-cta')).toBeOnTheScreen();
  });

  it('runs the buy flow: requestSubscription → verify-purchase → acknowledge → success state', async () => {
    const requestSubscription = jest.fn().mockResolvedValue({
      productId: PRODUCT_ID,
      purchaseToken: 'token-123',
    });
    const acknowledgePurchase = jest.fn().mockResolvedValue(undefined);

    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      getProducts: async () => [],
      requestSubscription,
      acknowledgePurchase,
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const verifyMutate = jest.fn().mockResolvedValue({
      is_premium: true,
      subscription_status: 'active',
      subscription_ends_at: '2027-04-29T00:00:00Z',
      google_play_subscription_id: PRODUCT_ID,
    });

    jest.spyOn(verifyHook, 'useVerifyPurchase').mockReturnValue({
      mutateAsync: verifyMutate,
      // these fields are not used by the component but match the shape
      isPending: false,
      isError: false,
      isSuccess: false,
      reset: jest.fn(),
    } as never);

    renderWithProviders(<UpgradeSheet />);
    showUpgrade({ message: 'Go premium', feature: 'premium' });

    expect(await screen.findByTestId('upgrade-sheet-cta')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('upgrade-sheet-cta'));

    await waitFor(() => {
      expect(verifyMutate).toHaveBeenCalledWith({
        subscription_id: PRODUCT_ID,
        purchase_token: 'token-123',
      });
    });

    await waitFor(() => {
      expect(acknowledgePurchase).toHaveBeenCalledWith('token-123');
    });

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-sheet-success')).toBeOnTheScreen();
    });
  });

  it('returns to idle without an error banner when the user cancels the Play dialog', async () => {
    const requestSubscription = jest
      .fn()
      .mockRejectedValue(new PurchaseCancelledError());
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      getProducts: async () => [],
      requestSubscription,
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    renderWithProviders(<UpgradeSheet />);
    showUpgrade({ message: 'Go premium', feature: 'premium' });

    expect(await screen.findByTestId('upgrade-sheet-cta')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-cta'));

    await waitFor(() => expect(requestSubscription).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByTestId('upgrade-sheet-cta')).not.toBeDisabled();
    });
    expect(screen.queryByTestId('upgrade-sheet-error')).toBeNull();
    expect(screen.queryByTestId('upgrade-sheet-success')).toBeNull();
  });

  it('shows an error banner when billing is not configured', async () => {
    renderWithProviders(<UpgradeSheet />);
    showUpgrade({ message: 'Go premium', feature: 'premium' });

    expect(await screen.findByTestId('upgrade-sheet-cta')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-cta'));

    expect(await screen.findByTestId('upgrade-sheet-error')).toBeOnTheScreen();
    expect(screen.getByTestId('upgrade-sheet-error')).toHaveTextContent(
      /Google Play Billing is not configured/i
    );
  });
});
