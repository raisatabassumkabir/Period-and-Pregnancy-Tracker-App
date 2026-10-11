import { Platform } from 'react-native';
import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

import { createRevenueCatBillingClient } from './revenuecat-client';
import {
  BillingError,
  BillingNotConfiguredError,
  PurchaseCancelledError,
  PurchasePendingError,
} from './types';

jest.mock('react-native-purchases', () => {
  return {
    __esModule: true,
    default: {
      isConfigured: jest.fn(),
      configure: jest.fn(),
      logIn: jest.fn(),
      logOut: jest.fn(),
      isAnonymous: jest.fn(),
      getOfferings: jest.fn(),
      getCustomerInfo: jest.fn(),
      purchasePackage: jest.fn(),
      restorePurchases: jest.fn(),
      addCustomerInfoUpdateListener: jest.fn(),
      removeCustomerInfoUpdateListener: jest.fn(),
    },
    PURCHASES_ERROR_CODE: {
      PURCHASE_CANCELLED_ERROR: 1,
      STORE_PROBLEM_ERROR: 2,
      PURCHASE_NOT_ALLOWED_ERROR: 3,
      PAYMENT_PENDING_ERROR: 24,
    },
    PACKAGE_TYPE: {
      UNKNOWN: 'UNKNOWN',
      CUSTOM: 'CUSTOM',
      LIFETIME: 'LIFETIME',
      ANNUAL: 'ANNUAL',
      SIX_MONTH: 'SIX_MONTH',
      THREE_MONTH: 'THREE_MONTH',
      TWO_MONTH: 'TWO_MONTH',
      MONTHLY: 'MONTHLY',
      WEEKLY: 'WEEKLY',
    },
  };
});

const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;

const TEST_API_KEY = 'goog_test_public_key_123';
const USER_ID = 'test-user-uuid-1';
const OTHER_USER_ID = 'test-user-uuid-2';

const mockPackage: PurchasesPackage = {
  identifier: '$rc_monthly',
  packageType: PACKAGE_TYPE.MONTHLY,
  product: {
    identifier: 'premium_monthly',
    description: 'Full monthly access',
    title: 'Happy Women Premium Monthly',
    price: 4.99,
    priceString: '$4.99',
    currencyCode: 'USD',
    subscriptionPeriod: 'P1M',
  } as any,
  offeringIdentifier: 'default',
} as PurchasesPackage;

const mockOfferings: PurchasesOfferings = {
  all: {
    default: {
      identifier: 'default',
      serverDescription: 'Default offering',
      availablePackages: [mockPackage],
      monthly: mockPackage,
      annual: null,
      weekly: null,
      twoMonth: null,
      threeMonth: null,
      sixMonth: null,
      lifetime: null,
    } as any,
  },
  current: {
    identifier: 'default',
    serverDescription: 'Default offering',
    availablePackages: [mockPackage],
    monthly: mockPackage,
    annual: null,
    weekly: null,
    twoMonth: null,
    threeMonth: null,
    sixMonth: null,
    lifetime: null,
  } as any,
};

describe('createRevenueCatBillingClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'android';
    mockPurchases.isConfigured.mockResolvedValue(false);
    mockPurchases.isAnonymous.mockResolvedValue(false);
    mockPurchases.getOfferings.mockResolvedValue(mockOfferings);
  });

  describe('configuration & availability', () => {
    it('isAvailable returns false when API key is missing', () => {
      const client = createRevenueCatBillingClient({ apiKey: '' });
      expect(client.isAvailable()).toBe(false);
    });

    it('isAvailable returns true on Android with API key', () => {
      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      expect(client.isAvailable()).toBe(true);
    });

    it('throws BillingNotConfiguredError when initialize is called without key', async () => {
      const client = createRevenueCatBillingClient({ apiKey: '' });
      await expect(client.initialize()).rejects.toBeInstanceOf(
        BillingNotConfiguredError
      );
    });

    it('configures SDK idempotently with App User ID', async () => {
      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      await client.initialize(USER_ID);
      expect(mockPurchases.configure).toHaveBeenCalledTimes(1);
      expect(mockPurchases.configure).toHaveBeenCalledWith({
        apiKey: TEST_API_KEY,
        appUserID: USER_ID,
      });

      // Second call should be a no-op
      mockPurchases.isConfigured.mockResolvedValue(true);
      await client.initialize(USER_ID);
      expect(mockPurchases.configure).toHaveBeenCalledTimes(1);
    });
  });

  describe('identity lifecycle', () => {
    it('switches customer identity via Purchases.logIn when user changes', async () => {
      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      await client.initialize(USER_ID);

      mockPurchases.isConfigured.mockResolvedValue(true);
      mockPurchases.logIn.mockResolvedValue({
        customerInfo: {} as any,
        created: false,
      });

      await client.identifyUser(OTHER_USER_ID);
      expect(mockPurchases.logIn).toHaveBeenCalledWith(OTHER_USER_ID);
    });

    it('resetUser calls logOut only when user is not anonymous', async () => {
      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      await client.initialize(USER_ID);

      mockPurchases.isConfigured.mockResolvedValue(true);
      mockPurchases.isAnonymous.mockResolvedValue(false);
      mockPurchases.logOut.mockResolvedValue({} as any);

      await client.resetUser();
      expect(mockPurchases.logOut).toHaveBeenCalledTimes(1);
    });

    it('resetUser skips logOut if user is already anonymous', async () => {
      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      await client.initialize();

      mockPurchases.isConfigured.mockResolvedValue(true);
      mockPurchases.isAnonymous.mockResolvedValue(true);

      await client.resetUser();
      expect(mockPurchases.logOut).not.toHaveBeenCalled();
    });
  });

  describe('offerings & products', () => {
    it('returns available offerings from SDK', async () => {
      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      const offerings = await client.getOfferings();
      expect(offerings).toEqual(mockOfferings);
      expect(mockPurchases.getOfferings).toHaveBeenCalled();
    });

    it('maps RevenueCat package products to BillingProduct', async () => {
      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      const products = await client.getProducts(['premium_monthly']);
      expect(products).toHaveLength(1);
      expect(products[0]).toEqual({
        productId: 'premium_monthly',
        title: 'Happy Women Premium Monthly',
        description: 'Full monthly access',
        localizedPrice: '$4.99',
        currencyCode: 'USD',
        subscriptionPeriodAndroid: 'P1M',
      });
    });

    it('handles empty offerings gracefully', async () => {
      mockPurchases.getOfferings.mockResolvedValue({
        all: {},
        current: null,
      } as any);
      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      const products = await client.getProducts();
      expect(products).toEqual([]);
    });
  });

  describe('purchases', () => {
    it('purchases a package directly and returns BillingPurchase', async () => {
      const mockCustomerInfo = {
        entitlements: {
          active: { premium: { productIdentifier: 'premium_monthly' } },
        },
      } as any;
      mockPurchases.purchasePackage.mockResolvedValue({
        productIdentifier: 'premium_monthly',
        customerInfo: mockCustomerInfo,
      } as any);

      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      const purchase = await client.purchasePackage(mockPackage);

      expect(mockPurchases.purchasePackage).toHaveBeenCalledWith(mockPackage);
      expect(purchase).toMatchObject({
        productId: 'premium_monthly',
        customerInfo: mockCustomerInfo,
        isAcknowledged: true,
      });
    });

    it('surfaces user cancellation as PurchaseCancelledError', async () => {
      mockPurchases.purchasePackage.mockRejectedValue({
        code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
        message: 'User cancelled',
      });

      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      await expect(client.purchasePackage(mockPackage)).rejects.toBeInstanceOf(
        PurchaseCancelledError
      );
    });

    it('surfaces pending purchases as PurchasePendingError', async () => {
      mockPurchases.purchasePackage.mockRejectedValue({
        code: 'PAYMENT_PENDING_ERROR',
        message: 'Payment pending',
      });

      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      await expect(client.purchasePackage(mockPackage)).rejects.toBeInstanceOf(
        PurchasePendingError
      );
    });

    it('surfaces store errors as BillingError', async () => {
      mockPurchases.purchasePackage.mockRejectedValue({
        code: 2,
        message: 'Google Play unavailable',
      });

      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      await expect(client.purchasePackage(mockPackage)).rejects.toBeInstanceOf(
        BillingError
      );
    });
  });

  describe('restore purchases', () => {
    it('returns active purchases when entitlement is active', async () => {
      const mockCustomerInfo = {
        entitlements: {
          active: {
            premium: {
              identifier: 'premium',
              productIdentifier: 'premium_monthly',
              isActive: true,
            },
          },
        },
      } as any;
      mockPurchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      const restored = await client.restorePurchases();

      expect(restored).toHaveLength(1);
      expect(restored[0].productId).toBe('premium_monthly');
    });

    it('returns empty array when no active entitlement exists', async () => {
      const mockCustomerInfo = {
        entitlements: { active: {} },
      } as any;
      mockPurchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      const restored = await client.restorePurchases();
      expect(restored).toEqual([]);
    });
  });

  describe('listeners', () => {
    it('registers and removes customer info update listener', () => {
      const client = createRevenueCatBillingClient({ apiKey: TEST_API_KEY });
      const listener = jest.fn();
      const unsubscribe = client.addCustomerInfoUpdateListener(listener);

      expect(mockPurchases.addCustomerInfoUpdateListener).toHaveBeenCalledWith(
        listener
      );
      unsubscribe();
      expect(
        mockPurchases.removeCustomerInfoUpdateListener
      ).toHaveBeenCalledWith(listener);
    });
  });
});
