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

  it('falls back to a generic upgrade detail when the body is malformed', async () => {
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
    expect(state.visible).toBe(true);
    expect(state.detail?.feature).toBe('premium');
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
