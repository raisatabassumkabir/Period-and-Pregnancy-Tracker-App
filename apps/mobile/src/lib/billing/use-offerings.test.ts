import { renderHook, waitFor } from '@testing-library/react-native';
import { PACKAGE_TYPE } from 'react-native-purchases';

import { setBillingClient } from './index';
import { useOfferings } from './use-offerings';

describe('useOfferings', () => {
  afterEach(() => {
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

  it('returns empty packages when billing client is not available', async () => {
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

    const { result } = renderHook(() => useOfferings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.offerings).toBeNull();
    expect(result.current.monthlyPackage).toBeNull();
    expect(result.current.annualPackage).toBeNull();
  });

  it('matches monthly and annual packages by canonical product IDs and package types', async () => {
    const monthlyPkg = {
      identifier: '$rc_monthly',
      packageType: PACKAGE_TYPE.MONTHLY,
      product: {
        identifier: 'premium_monthly',
        priceString: '$4.99',
      },
    } as any;

    const annualPkg = {
      identifier: '$rc_annual',
      packageType: PACKAGE_TYPE.ANNUAL,
      product: {
        identifier: 'premium_annual',
        priceString: '$29.99',
      },
    } as any;

    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () =>
        ({
          current: {
            availablePackages: [annualPkg, monthlyPkg],
            monthly: monthlyPkg,
            annual: annualPkg,
          },
        }) as any,
      requestSubscription: async () => ({ productId: 'premium_monthly' }),
      purchasePackage: async () => ({ productId: 'premium_monthly' }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const { result } = renderHook(() => useOfferings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.monthlyPackage).toBe(monthlyPkg);
    expect(result.current.annualPackage).toBe(annualPkg);
    expect(result.current.currentPackages).toHaveLength(2);
  });

  it('handles empty offerings gracefully', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () =>
        ({
          current: null,
          all: {},
        }) as any,
      requestSubscription: async () => ({ productId: 'premium_monthly' }),
      purchasePackage: async () => ({ productId: 'premium_monthly' }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const { result } = renderHook(() => useOfferings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.monthlyPackage).toBeNull();
    expect(result.current.annualPackage).toBeNull();
  });

  it('sets error state when getOfferings throws', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => {
        throw new Error('Store connection failed');
      },
      requestSubscription: async () => ({ productId: 'premium_monthly' }),
      purchasePackage: async () => ({ productId: 'premium_monthly' }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const { result } = renderHook(() => useOfferings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe('Store connection failed');
    expect(result.current.monthlyPackage).toBeNull();
  });
});
