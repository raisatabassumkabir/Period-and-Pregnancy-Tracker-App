import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import * as syncHook from '@/api/billing/use-subscription-sync';
import {
  BackendSyncPendingError,
  NoActiveSubscriptionError,
  PurchaseCancelledError,
  setBillingClient,
} from '@/lib/billing';

import { usePurchasePremium } from './use-purchase-premium';

const PRODUCT_ID = 'premium_monthly';

describe('usePurchasePremium', () => {
  let queryClient: QueryClient;
  const mockSyncMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.spyOn(syncHook, 'useSubscriptionSync').mockReturnValue({
      mutateAsync: mockSyncMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      reset: jest.fn(),
    } as never);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('runs the full buy flow: purchase -> backend sync -> success', async () => {
    const requestSubscription = jest.fn().mockResolvedValue({
      productId: PRODUCT_ID,
      transactionDate: Date.now(),
      isAcknowledged: true,
    });

    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription,
      purchasePackage: async () => ({
        productId: PRODUCT_ID,
        isAcknowledged: true,
      }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    mockSyncMutate.mockResolvedValueOnce({
      is_premium: true,
      subscription_status: 'active',
      subscription_ends_at: '2027-04-29T12:00:00Z',
      entitlement_id: 'premium',
      product_id: PRODUCT_ID,
    });

    const { result } = renderHook(() => usePurchasePremium(), { wrapper });

    let purchaseResult: unknown;
    await act(async () => {
      purchaseResult = await result.current.buy(PRODUCT_ID);
    });

    expect(requestSubscription).toHaveBeenCalledWith(PRODUCT_ID);
    expect(mockSyncMutate).toHaveBeenCalled();
    expect(result.current.status).toBe('success');
    expect(result.current.result?.is_premium).toBe(true);
    expect(purchaseResult).toEqual(result.current.result);
  });

  it('handles user cancellation by resetting quietly to idle', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => {
        throw new PurchaseCancelledError();
      },
      purchasePackage: async () => {
        throw new PurchaseCancelledError();
      },
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const { result } = renderHook(() => usePurchasePremium(), { wrapper });

    await act(async () => {
      const outcome = await result.current.buy(PRODUCT_ID);
      expect(outcome).toBeNull();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(mockSyncMutate).not.toHaveBeenCalled();
  });

  it('enters pending_sync state when purchase succeeds in store but backend sync fails', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => ({
        productId: PRODUCT_ID,
        isAcknowledged: true,
      }),
      purchasePackage: async () => ({
        productId: PRODUCT_ID,
        isAcknowledged: true,
      }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    mockSyncMutate.mockRejectedValueOnce(new Error('Network timeout'));

    const { result } = renderHook(() => usePurchasePremium(), { wrapper });

    await act(async () => {
      const outcome = await result.current.buy(PRODUCT_ID);
      expect(outcome).toBeNull();
    });

    expect(result.current.status).toBe('pending_sync');
    expect(result.current.error).toBeInstanceOf(BackendSyncPendingError);

    // Now retry sync and verify it recovers
    mockSyncMutate.mockResolvedValueOnce({
      is_premium: true,
      subscription_status: 'active',
      subscription_ends_at: '2027-04-29T12:00:00Z',
    });

    await act(async () => {
      const recovered = await result.current.retrySync();
      expect(recovered?.is_premium).toBe(true);
    });

    expect(result.current.status).toBe('success');
  });

  it('restores purchases and syncs with backend when entitlement exists', async () => {
    const restorePurchases = jest.fn().mockResolvedValue([
      {
        productId: PRODUCT_ID,
        transactionDate: Date.now(),
        isAcknowledged: true,
      },
    ]);

    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => ({
        productId: PRODUCT_ID,
        isAcknowledged: true,
      }),
      purchasePackage: async () => ({
        productId: PRODUCT_ID,
        isAcknowledged: true,
      }),
      restorePurchases,
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    mockSyncMutate.mockResolvedValueOnce({
      is_premium: true,
      subscription_status: 'active',
      subscription_ends_at: '2027-04-29T12:00:00Z',
    });

    const { result } = renderHook(() => usePurchasePremium(), { wrapper });

    await act(async () => {
      const restored = await result.current.restore();
      expect(restored?.is_premium).toBe(true);
    });

    expect(restorePurchases).toHaveBeenCalled();
    expect(mockSyncMutate).toHaveBeenCalled();
    expect(result.current.status).toBe('success');
  });

  it('surfaces NoActiveSubscriptionError when restore returns no active purchases', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => ({
        productId: PRODUCT_ID,
        isAcknowledged: true,
      }),
      purchasePackage: async () => ({
        productId: PRODUCT_ID,
        isAcknowledged: true,
      }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const { result } = renderHook(() => usePurchasePremium(), { wrapper });

    await act(async () => {
      const restored = await result.current.restore();
      expect(restored).toBeNull();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeInstanceOf(NoActiveSubscriptionError);
    expect(mockSyncMutate).not.toHaveBeenCalled();
  });
});
