import { CANONICAL_ENTITLEMENT_ID } from '@repo/api-contract';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  PURCHASES_ERROR_CODE,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

import { Env } from '@/lib/env';

import {
  type BillingClient,
  BillingError,
  BillingNotConfiguredError,
  type BillingProduct,
  PurchaseCancelledError,
  PurchasePendingError,
} from './types';

const ERROR_CODE_SKU_NOT_FOUND = 'sku-not-found';

export interface RevenueCatClientOptions {
  apiKey?: string;
}

const mapPackageToBillingProduct = (pkg: PurchasesPackage): BillingProduct => ({
  productId: pkg.product.identifier,
  title: pkg.product.title,
  description: pkg.product.description,
  localizedPrice: pkg.product.priceString,
  currencyCode: pkg.product.currencyCode,
  subscriptionPeriodAndroid: pkg.product.subscriptionPeriod ?? undefined,
});

const isUserCancelled = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const rcErr = error as { code?: unknown; userCancelled?: unknown };
  return (
    rcErr.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    rcErr.code === '1' ||
    rcErr.code === 1 ||
    rcErr.userCancelled === true
  );
};

const toBillingError = (error: unknown): Error => {
  if (isUserCancelled(error)) {
    return new PurchaseCancelledError();
  }
  const rcErr = error as {
    code?: unknown;
    message?: string;
    readableErrorCode?: string;
  } | null;
  const code = String(
    rcErr?.readableErrorCode ?? rcErr?.code ?? 'revenuecat-error'
  );
  if (code.toLowerCase().includes('pending')) {
    return new PurchasePendingError();
  }
  const message =
    rcErr?.message ??
    (error instanceof Error ? error.message : 'RevenueCat purchase failed.');
  return new BillingError(code, message);
};

export function createRevenueCatBillingClient(
  options: RevenueCatClientOptions = {}
): BillingClient {
  const apiKey =
    options.apiKey ??
    (typeof Env !== 'undefined' ? Env.REVENUECAT_ANDROID_API_KEY : '') ??
    '';

  let isInitialized = false;
  let currentAppUserId: string | null = null;

  const ensureConfigured = async (appUserId?: string) => {
    if (!apiKey) {
      throw new BillingNotConfiguredError(
        'RevenueCat Android SDK key is not configured. Set EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY.'
      );
    }
    const alreadyConfigured = await Purchases.isConfigured();
    if (!alreadyConfigured && !isInitialized) {
      Purchases.configure({
        apiKey,
        appUserID: appUserId ?? null,
      });
      isInitialized = true;
      currentAppUserId = appUserId ?? null;
      return;
    }
    if (appUserId && appUserId !== currentAppUserId) {
      await Purchases.logIn(appUserId);
      currentAppUserId = appUserId;
    }
  };

  return {
    isAvailable: () => Platform.OS === 'android' && Boolean(apiKey),

    initialize: async (appUserId) => {
      await ensureConfigured(appUserId);
    },

    identifyUser: async (appUserId) => {
      if (!appUserId) return;
      await ensureConfigured(appUserId);
    },

    resetUser: async () => {
      currentAppUserId = null;
      try {
        const configured = await Purchases.isConfigured();
        if (configured) {
          const isAnon = await Purchases.isAnonymous();
          if (!isAnon) {
            await Purchases.logOut();
          }
        }
      } catch {
        // Deliberately swallow errors during sign-out cleanup
      }
    },

    getOfferings: async (): Promise<PurchasesOfferings | null> => {
      await ensureConfigured();
      return Purchases.getOfferings();
    },

    getProducts: async (productIds) => {
      await ensureConfigured();
      const offerings = await Purchases.getOfferings();
      const current = offerings?.current;
      const packages = current ? current.availablePackages : [];
      const billingProducts = packages.map(mapPackageToBillingProduct);

      if (!productIds || productIds.length === 0) {
        return billingProducts;
      }
      return billingProducts.filter((p) => productIds.includes(p.productId));
    },

    purchasePackage: async (pkg) => {
      await ensureConfigured();
      try {
        const purchaseResult = await Purchases.purchasePackage(pkg);
        return {
          productId: purchaseResult.productIdentifier,
          customerInfo: purchaseResult.customerInfo,
          transactionDate: Date.now(),
          isAcknowledged: true,
        };
      } catch (e) {
        throw toBillingError(e);
      }
    },

    requestSubscription: async (productIdOrPackage) => {
      await ensureConfigured();
      if (typeof productIdOrPackage !== 'string') {
        const result = await Purchases.purchasePackage(productIdOrPackage);
        return {
          productId: result.productIdentifier,
          customerInfo: result.customerInfo,
          transactionDate: Date.now(),
          isAcknowledged: true,
        };
      }

      const offerings = await Purchases.getOfferings();
      const available = offerings?.current?.availablePackages ?? [];
      const targetPackage = available.find(
        (p) =>
          p.product.identifier === productIdOrPackage ||
          p.identifier === productIdOrPackage
      );

      if (!targetPackage) {
        throw new BillingError(
          ERROR_CODE_SKU_NOT_FOUND,
          `Subscription "${productIdOrPackage}" is not available in the current RevenueCat offering.`
        );
      }

      try {
        const purchaseResult = await Purchases.purchasePackage(targetPackage);
        return {
          productId: purchaseResult.productIdentifier,
          customerInfo: purchaseResult.customerInfo,
          transactionDate: Date.now(),
          isAcknowledged: true,
        };
      } catch (e) {
        throw toBillingError(e);
      }
    },

    restorePurchases: async () => {
      await ensureConfigured();
      try {
        const customerInfo = await Purchases.restorePurchases();
        const activeEntitlement =
          customerInfo.entitlements.active[CANONICAL_ENTITLEMENT_ID];

        if (activeEntitlement) {
          return [
            {
              productId: activeEntitlement.productIdentifier,
              customerInfo,
              transactionDate: Date.now(),
              isAcknowledged: true,
            },
          ];
        }
        return [];
      } catch (e) {
        throw toBillingError(e);
      }
    },

    getCustomerInfo: async (): Promise<CustomerInfo | null> => {
      await ensureConfigured();
      return Purchases.getCustomerInfo();
    },

    addCustomerInfoUpdateListener: (listener) => {
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(listener);
      };
    },

    acknowledgePurchase: async () => {
      // RevenueCat automatically acknowledges purchases on Android
    },

    getAvailablePurchases: async () => {
      await ensureConfigured();
      const info = await Purchases.getCustomerInfo();
      const active = info.entitlements.active[CANONICAL_ENTITLEMENT_ID];
      if (!active) return [];
      return [
        {
          productId: active.productIdentifier,
          customerInfo: info,
          transactionDate: Date.now(),
          isAcknowledged: true,
        },
      ];
    },

    endConnection: async () => {
      isInitialized = false;
      currentAppUserId = null;
    },
  };
}
