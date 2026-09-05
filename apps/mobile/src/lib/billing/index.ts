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
export const PREMIUM_PRODUCT_IDS = ['premium_monthly', 'premium_yearly'];

export const DEFAULT_PRODUCT_ID = 'premium_monthly';

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
