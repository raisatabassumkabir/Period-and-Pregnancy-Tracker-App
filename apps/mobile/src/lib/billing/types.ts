import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';

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
  purchaseToken?: string;
  transactionDate?: number;
  isAcknowledged?: boolean;
  customerInfo?: CustomerInfo;
}

export interface BillingClient {
  isAvailable(): boolean;
  initialize(appUserId?: string): Promise<void>;
  identifyUser(appUserId: string): Promise<void>;
  resetUser(): Promise<void>;
  getProducts(productIds?: string[]): Promise<BillingProduct[]>;
  getOfferings(): Promise<PurchasesOfferings | null>;
  requestSubscription(
    productIdOrPackage: string | PurchasesPackage
  ): Promise<BillingPurchase>;
  purchasePackage(pkg: PurchasesPackage): Promise<BillingPurchase>;
  restorePurchases(): Promise<BillingPurchase[]>;
  getCustomerInfo(): Promise<CustomerInfo | null>;
  addCustomerInfoUpdateListener(
    listener: (info: CustomerInfo) => void
  ): () => void;
  acknowledgePurchase(purchaseToken?: string): Promise<void>;
  getAvailablePurchases(): Promise<BillingPurchase[]>;
  endConnection(): Promise<void>;
}

export class BillingNotConfiguredError extends Error {
  constructor(
    message = 'In-app purchases are not configured. Please check your configuration.'
  ) {
    super(message);
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
 * Payment is pending settlement (e.g. slow payment method / cash).
 */
export class PurchasePendingError extends Error {
  constructor() {
    super(
      'Your purchase is pending. Premium unlocks automatically once payment settles.'
    );
    this.name = 'PurchasePendingError';
  }
}

/** Store / RevenueCat error carrying error code. */
export class BillingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'BillingError';
    this.code = code;
  }
}

/** Purchase completed in store, but backend synchronization could not complete yet. */
export class BackendSyncPendingError extends Error {
  constructor(
    message = 'Purchase succeeded in store, but verification is still completing. Please tap Restore or Retry.'
  ) {
    super(message);
    this.name = 'BackendSyncPendingError';
  }
}

/** Restoring purchases returned no active entitlement for this user. */
export class NoActiveSubscriptionError extends Error {
  constructor() {
    super('No active premium subscription found for your account.');
    this.name = 'NoActiveSubscriptionError';
  }
}
