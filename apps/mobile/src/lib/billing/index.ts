import {
  CANONICAL_ENTITLEMENT_ID,
  CANONICAL_PRODUCT_IDS,
  TARGET_PRICING_USD,
} from '@repo/api-contract';

import { createRevenueCatBillingClient } from './revenuecat-client';
import {
  BackendSyncPendingError,
  type BillingClient,
  BillingError,
  BillingNotConfiguredError,
  type BillingProduct,
  type BillingPurchase,
  NoActiveSubscriptionError,
  PurchaseCancelledError,
  PurchasePendingError,
} from './types';

/** Play Console subscription product ids. Must match the backend's allowed list. */
export const PREMIUM_PRODUCT_IDS = [
  CANONICAL_PRODUCT_IDS.MONTHLY,
  CANONICAL_PRODUCT_IDS.ANNUAL,
];

export const DEFAULT_PRODUCT_ID = CANONICAL_PRODUCT_IDS.MONTHLY;

export { CANONICAL_ENTITLEMENT_ID, CANONICAL_PRODUCT_IDS, TARGET_PRICING_USD };

const stubClient: BillingClient = {
  isAvailable: () => false,
  initialize: async () => {},
  identifyUser: async () => {},
  resetUser: async () => {},
  getProducts: async () => [],
  getOfferings: async () => null,
  requestSubscription: async () => {
    throw new BillingNotConfiguredError();
  },
  purchasePackage: async () => {
    throw new BillingNotConfiguredError();
  },
  restorePurchases: async () => [],
  getCustomerInfo: async () => null,
  addCustomerInfoUpdateListener: () => () => {},
  acknowledgePurchase: async () => {},
  getAvailablePurchases: async () => [],
  endConnection: async () => {},
};

let active: BillingClient = stubClient;

export const setBillingClient = (impl: BillingClient) => {
  active = impl;
};

export const getBillingClient = (): BillingClient => active;

export const isBillingAvailable = () => active.isAvailable();

export { createRevenueCatBillingClient };
export type { BillingClient, BillingProduct, BillingPurchase };
export {
  BackendSyncPendingError,
  BillingError,
  BillingNotConfiguredError,
  NoActiveSubscriptionError,
  PurchaseCancelledError,
  PurchasePendingError,
};
