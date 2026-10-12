import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppState } from 'react-native';

import { useMe } from '@/api/auth';
import * as authLib from '@/lib/auth';
import * as upgradeLib from '@/lib/upgrade';

import { setBillingClient } from './index';
import { useBillingIdentity } from './use-billing-identity';

jest.mock('@/api/auth', () => ({
  useMe: jest.fn(),
}));

describe('useBillingIdentity', () => {
  let queryClient: QueryClient;
  const mockUseMe = useMe as jest.MockedFunction<typeof useMe>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockUseMe.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setBillingClient({
      isAvailable: () => false,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => {
        throw new Error();
      },
      purchasePackage: async () => {
        throw new Error();
      },
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('identifies user with RevenueCat when authenticated', async () => {
    const identifyUser = jest.fn().mockResolvedValue(undefined);
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser,
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => ({ productId: 'premium_monthly' }),
      purchasePackage: async () => ({ productId: 'premium_monthly' }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    jest.spyOn(authLib, 'useAuth').mockImplementation((selector: any) =>
      selector({
        token: { access: 'valid-token', refresh: 'valid-refresh' },
        status: 'signIn',
      })
    );
    mockUseMe.mockReturnValue({
      data: { id: 'user-uuid-1', email: 'test@example.com' },
    } as any);

    renderHook(() => useBillingIdentity(), { wrapper });

    await waitFor(() => {
      expect(identifyUser).toHaveBeenCalledWith('user-uuid-1');
    });
  });

  it('purges queries and resets user on sign out to prevent leakage', async () => {
    const resetUser = jest.fn().mockResolvedValue(undefined);
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser,
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => ({ productId: 'premium_monthly' }),
      purchasePackage: async () => ({ productId: 'premium_monthly' }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const hideUpgradeSpy = jest.spyOn(upgradeLib, 'hideUpgrade');
    const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');

    let currentStatus = 'signIn';
    let currentToken: any = { access: 'token-1', refresh: 'refresh-1' };

    jest.spyOn(authLib, 'useAuth').mockImplementation((selector: any) =>
      selector({
        token: currentToken,
        status: currentStatus,
      })
    );
    mockUseMe.mockReturnValue({ data: { id: 'user-1' } } as any);

    const { rerender } = renderHook(() => useBillingIdentity(), { wrapper });

    // Transition to signed out
    currentStatus = 'signOut';
    currentToken = null;
    mockUseMe.mockReturnValue({ data: null } as any);
    rerender({});

    await waitFor(() => {
      expect(resetUser).toHaveBeenCalled();
      expect(hideUpgradeSpy).toHaveBeenCalled();
      expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: ['payments'] });
    });
  });

  it('refreshes subscription queries on foreground AppState change', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => ({ productId: 'premium_monthly' }),
      purchasePackage: async () => ({ productId: 'premium_monthly' }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    jest.spyOn(authLib, 'useAuth').mockImplementation((selector: any) =>
      selector({
        token: { access: 'valid-token', refresh: 'valid-refresh' },
        status: 'signIn',
      })
    );
    mockUseMe.mockReturnValue({
      data: { id: 'user-uuid-1' },
    } as any);

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    let appStateCallback: ((state: string) => void) | null = null;
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event: any, handler: any) => {
        appStateCallback = handler;
        return { remove: jest.fn() } as any;
      });

    renderHook(() => useBillingIdentity(), { wrapper });

    expect(appStateCallback).not.toBeNull();
    appStateCallback!('active');

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['payments', 'subscription-status'],
    });
  });
});
