import type { InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

import { useAuth } from '@/lib/auth';
import { getUpgradeState, hideUpgrade } from '@/lib/upgrade';

import { queryClient } from './api-provider';
import { client, REFRESH_PATH } from './client';

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

// ---------------------------------------------------------------------------
// 401 → silent refresh
// ---------------------------------------------------------------------------

type RejectedHandler = (error: unknown) => Promise<unknown>;
type InterceptorStack = {
  handlers: ({ rejected?: RejectedHandler } | null)[];
};

const getResponseRejectedHandler = (): RejectedHandler => {
  const stack = client.interceptors.response as unknown as InterceptorStack;
  const rejected = stack.handlers
    .map((handler) => handler?.rejected)
    .find((fn): fn is RejectedHandler => typeof fn === 'function');
  if (!rejected) throw new Error('response interceptor not registered');
  return rejected;
};

const expiredSessionError = (url: string) => ({
  config: { url, headers: {} as Record<string, string> },
  response: { status: 401, data: {} },
});

const OLD_TOKEN = { access: 'old-access', refresh: 'old-refresh' };
const NEW_TOKEN = { access: 'new-access', refresh: 'new-refresh' };

describe('axios client 401 refresh', () => {
  const originalBaseURL = client.defaults.baseURL;
  const originalAdapter = client.defaults.adapter;
  let postSpy: jest.SpyInstance;
  let retryAdapter: jest.Mock;

  beforeEach(() => {
    useAuth.setState({ status: 'signIn', token: OLD_TOKEN });
    postSpy = jest.spyOn(axios, 'post');
    retryAdapter = jest.fn(async (config: InternalAxiosRequestConfig) => ({
      data: 'retried',
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    client.defaults.adapter = retryAdapter;
  });

  afterEach(() => {
    postSpy.mockRestore();
    client.defaults.baseURL = originalBaseURL;
    client.defaults.adapter = originalAdapter;
  });

  it.each([
    ['https://x.test/api/', 'https://x.test/api/auth/token/refresh/'],
    ['https://x.test/api/v1', 'https://x.test/api/v1/auth/token/refresh/'],
  ])(
    'posts the refresh to a single-slash URL for base %s',
    async (baseURL, expectedUrl) => {
      client.defaults.baseURL = baseURL;
      postSpy.mockResolvedValue({ data: NEW_TOKEN });

      await getResponseRejectedHandler()(expiredSessionError('me'));

      const [url, body, config] = postSpy.mock.calls[0];
      expect(url).toBe(REFRESH_PATH);
      expect(body).toEqual({ refresh: OLD_TOKEN.refresh });
      expect(axios.getUri({ ...config, url })).toBe(expectedUrl);
    }
  );

  it('retries the original request with the new access token', async () => {
    postSpy.mockResolvedValue({ data: NEW_TOKEN });

    const result = await getResponseRejectedHandler()(
      expiredSessionError('me')
    );

    expect(result).toMatchObject({ data: 'retried' });
    expect(retryAdapter).toHaveBeenCalledTimes(1);
    const retriedConfig = retryAdapter.mock.calls[0][0];
    expect(retriedConfig.headers.Authorization).toBe('Bearer new-access');
    expect(useAuth.getState().token).toEqual(NEW_TOKEN);
  });

  it('coalesces concurrent 401s behind one refresh call', async () => {
    let resolveRefresh: (value: { data: typeof NEW_TOKEN }) => void = () => {};
    postSpy.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      })
    );

    const onRejected = getResponseRejectedHandler();
    const first = onRejected(expiredSessionError('cycles/'));
    const second = onRejected(expiredSessionError('daily-logs/'));
    resolveRefresh({ data: NEW_TOKEN });
    await Promise.all([first, second]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(retryAdapter).toHaveBeenCalledTimes(2);
  });

  it('signs out and clears the query cache when the refresh fails', async () => {
    postSpy.mockRejectedValue(new Error('404 Not Found'));
    const clearSpy = jest.spyOn(queryClient, 'clear');
    const error = expiredSessionError('me');

    await expect(getResponseRejectedHandler()(error)).rejects.toBe(error);

    expect(useAuth.getState().status).toBe('signOut');
    expect(useAuth.getState().token).toBeNull();
    expect(clearSpy).toHaveBeenCalled();
    expect(retryAdapter).not.toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
