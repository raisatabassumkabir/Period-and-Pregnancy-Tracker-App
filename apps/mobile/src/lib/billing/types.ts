export interface BillingProduct {
  productId: string;
  title: string;
  description: string;
  localizedPrice: string;
  currencyCode?: string;
  subscriptionPeriodAndroid?: string;
}

export interface BillingPurchase {
  productId: string;
  purchaseToken: string;
  transactionDate?: number;
  isAcknowledged?: boolean;
}

export interface BillingClient {
  isAvailable(): boolean;
  initialize(): Promise<void>;
  getProducts(productIds: string[]): Promise<BillingProduct[]>;
  requestSubscription(productId: string): Promise<BillingPurchase>;
  acknowledgePurchase(purchaseToken: string): Promise<void>;
  getAvailablePurchases(): Promise<BillingPurchase[]>;
  endConnection(): Promise<void>;
}

export class BillingNotConfiguredError extends Error {
  constructor() {
    super(
      'Google Play Billing is not configured. Register a BillingClient via ' +
        'setBillingClient() before launching the purchase flow.'
    );
    this.name = 'BillingNotConfiguredError';
  }
}

/** The user dismissed the Play purchase dialog. Not a failure — callers should reset quietly. */
export class PurchaseCancelledError extends Error {
  constructor() {
    super('Purchase cancelled.');
    this.name = 'PurchaseCancelledError';
  }
}

/**
 * Google accepted the order but payment is still settling (e.g. cash or bank
 * transfer). Premium is granted once the backend receives the RTDN for it.
 */
export class PurchasePendingError extends Error {
  constructor() {
    super(
      'Your purchase is pending. Premium unlocks automatically once Google confirms the payment.'
    );
    this.name = 'PurchasePendingError';
  }
}

/** Any other Play Billing failure, carrying the store's error code for diagnostics. */
export class BillingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'BillingError';
    this.code = code;
  }
}
