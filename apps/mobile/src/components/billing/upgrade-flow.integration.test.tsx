import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import * as verifyHook from '@/api/billing/use-verify-purchase';
import { client } from '@/api/common';
import { setBillingClient } from '@/lib/billing';
import { cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';
import { getUpgradeState, hideUpgrade } from '@/lib/upgrade';

import { UpgradeSheet } from './upgrade-sheet';

const PRODUCT_ID = 'premium_monthly';

const getRejectHandler = () => {
  const handlers = (
    client.interceptors.response as never as {
      handlers: ({ rejected?: (e: unknown) => Promise<unknown> } | null)[];
    }
  ).handlers;
  const fn = handlers
    .filter((h): h is { rejected?: (e: unknown) => Promise<unknown> } => !!h)
    .map((h) => h.rejected)
    .find(
      (f): f is (e: unknown) => Promise<unknown> => typeof f === 'function'
    );
  if (!fn) throw new Error('No rejected handler found on response interceptor');
  return fn;
};

afterEach(() => {
  cleanup();
  hideUpgrade();
  jest.restoreAllMocks();
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

const renderApp = () => {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={qc}>
      <UpgradeSheet />
    </QueryClientProvider>
  );
};

const fire402 = async (detail: {
  message: string;
  feature: string;
  current_usage?: number;
  limit?: number;
}) => {
  const onRejected = getRejectHandler();
  const error = { response: { status: 402, data: { detail } } };
  await onRejected(error).catch(() => {});
};

describe('Upgrade flow (integration)', () => {
  it('402 response from any endpoint surfaces the upgrade sheet', async () => {
    renderApp();

    await fire402({
      message: 'Upgrade to Premium to use this feature.',
      feature: 'premium',
    });

    expect(await screen.findByTestId('upgrade-sheet-title')).toBeOnTheScreen();
    expect(screen.getByTestId('upgrade-sheet-title')).toHaveTextContent(
      /Upgrade to Premium/i
    );
    expect(screen.getByTestId('upgrade-sheet-message')).toHaveTextContent(
      'Upgrade to Premium to use this feature.'
    );
  });

  it('completes the full Play Billing happy path: 402 → buy → verify → success', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      getProducts: async () => [],
      requestSubscription: async () => ({
        productId: PRODUCT_ID,
        purchaseToken: 'play-token-xyz',
      }),
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const verifyMutate = jest.fn().mockResolvedValue({
      is_premium: true,
      subscription_status: 'active',
      subscription_ends_at: '2027-04-29T12:00:00Z',
      google_play_subscription_id: PRODUCT_ID,
    });
    jest.spyOn(verifyHook, 'useVerifyPurchase').mockReturnValue({
      mutateAsync: verifyMutate,
      isPending: false,
      reset: jest.fn(),
    } as never);

    renderApp();

    await fire402({
      message: 'Daily limit reached.',
      feature: 'premium',
      current_usage: 15,
      limit: 15,
    });

    expect(await screen.findByTestId('upgrade-sheet-cta')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-cta'));

    await waitFor(() =>
      expect(verifyMutate).toHaveBeenCalledWith({
        subscription_id: PRODUCT_ID,
        purchase_token: 'play-token-xyz',
      })
    );

    expect(
      await screen.findByTestId('upgrade-sheet-success')
    ).toBeOnTheScreen();
  });

  it('does not surface the upgrade sheet for 401/500 errors', async () => {
    renderApp();
    const onRejected = getRejectHandler();

    await onRejected({
      response: { status: 401, data: { detail: 'unauth' } },
    }).catch(() => {});
    await onRejected({
      response: { status: 500, data: { detail: 'boom' } },
    }).catch(() => {});

    await new Promise((r) => setTimeout(r, 30));
    expect(getUpgradeState().visible).toBe(false);
  });
});
