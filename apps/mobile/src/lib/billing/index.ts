import {
  CANONICAL_ENTITLEMENT_ID,
  CANONICAL_PRODUCT_IDS,
  TARGET_PRICING_USD,
} from '@repo/api-contract';

import {
  type BillingClient,
  BillingError,
  BillingNotConfiguredError,
  type BillingProduct,
  type BillingPurchase,
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
  getProducts: async () => [],
  requestSubscription: async () => {
    throw new BillingNotConfiguredError();
  },
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

export type { BillingClient, BillingProduct, BillingPurchase };
export {
  BillingError,
  BillingNotConfiguredError,
  PurchaseCancelledError,
  PurchasePendingError,
};
