import { getUpgradeState, hideUpgrade } from '@/lib/upgrade';

import { client } from './client';

describe('axios client interceptors', () => {
  beforeEach(() => {
    hideUpgrade();
  });

  it('dispatches showUpgrade when the response is a 402 problem', async () => {
    const handler = client.interceptors.response;
    // Run all attached error handlers in order.
    const onRejected = (handler as any).handlers
      .filter(Boolean)
      .map((h: any) => h.rejected)
      .find((fn: any) => typeof fn === 'function');

    expect(typeof onRejected).toBe('function');

    const error = {
      response: {
        status: 402,
        data: {
          type: 'https://apiguide.dev/status-codes/402/',
          title: 'Payment Required',
          status: 402,
          detail: 'Daily limit reached (15/day). Upgrade to Premium.',
          instance: '/api/example/',
          feature: 'example_feature',
          current_usage: 15,
          limit: 15,
        },
      },
    };

    await expect(onRejected(error)).rejects.toBe(error);

    const state = getUpgradeState();
    expect(state.visible).toBe(true);
    expect(state.detail?.feature).toBe('example_feature');
    expect(state.detail?.message).toBe(
      'Daily limit reached (15/day). Upgrade to Premium.'
    );
    expect(state.detail?.limit).toBe(15);
  });

  it('does not trigger upgrade prompt for unknown or malformed 402 responses', async () => {
    const handler = client.interceptors.response;
    const onRejected = (handler as any).handlers
      .filter(Boolean)
      .map((h: any) => h.rejected)
      .find((fn: any) => typeof fn === 'function');

    const error = {
      response: { status: 402, data: 'not-json' },
    };

    await expect(onRejected(error)).rejects.toBe(error);
    const state = getUpgradeState();
    expect(state.visible).toBe(false);
  });

  it('does not intercept subscription synchronization 402 responses as upgrade prompts', async () => {
    const handler = client.interceptors.response;
    const onRejected = (handler as any).handlers
      .filter(Boolean)
      .map((h: any) => h.rejected)
      .find((fn: any) => typeof fn === 'function');

    const error = {
      config: { url: '/api/v1/payments/subscription-sync/' },
      response: {
        status: 402,
        data: {
          type: 'https://apiguide.dev/status-codes/402/',
          title: 'Payment Required',
          status: 402,
          detail: 'Subscription sync error',
          feature: 'premium',
        },
      },
    };

    await expect(onRejected(error)).rejects.toBe(error);
    expect(getUpgradeState().visible).toBe(false);
  });

  it('suppresses duplicate upgrade prompts when the sheet is already visible', async () => {
    const handler = client.interceptors.response;
    const onRejected = (handler as any).handlers
      .filter(Boolean)
      .map((h: any) => h.rejected)
      .find((fn: any) => typeof fn === 'function');

    const firstError = {
      response: {
        status: 402,
        data: {
          type: 'https://apiguide.dev/status-codes/402/',
          title: 'Payment Required',
          status: 402,
          detail: 'First prompt',
          feature: 'first_feature',
        },
      },
    };

    await expect(onRejected(firstError)).rejects.toBe(firstError);
    expect(getUpgradeState().visible).toBe(true);
    expect(getUpgradeState().detail?.feature).toBe('first_feature');

    const secondError = {
      response: {
        status: 402,
        data: {
          type: 'https://apiguide.dev/status-codes/402/',
          title: 'Payment Required',
          status: 402,
          detail: 'Second prompt',
          feature: 'second_feature',
        },
      },
    };

    await expect(onRejected(secondError)).rejects.toBe(secondError);
    // Detail remains 'first_feature' because duplicate prompt was suppressed
    expect(getUpgradeState().visible).toBe(true);
    expect(getUpgradeState().detail?.feature).toBe('first_feature');
  });

  it('does not show the upgrade sheet for non-402 errors', async () => {
    const handler = client.interceptors.response;
    const onRejected = (handler as any).handlers
      .filter(Boolean)
      .map((h: any) => h.rejected)
      .find((fn: any) => typeof fn === 'function');

    const error = {
      response: {
        status: 500,
        data: {
          type: 'https://apiguide.dev/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred. It has been logged.',
        },
      },
    };
    await expect(onRejected(error)).rejects.toBe(error);
    expect(getUpgradeState().visible).toBe(false);
  });
});
