import type {
  ProductOrSubscription,
  ProductSubscriptionAndroid,
  Purchase,
  PurchaseError,
  SubscriptionOffer,
} from 'expo-iap';
import * as IAP from 'expo-iap';
import { Platform } from 'react-native';

import {
  type BillingClient,
  BillingError,
  type BillingProduct,
  type BillingPurchase,
  PurchaseCancelledError,
  PurchasePendingError,
} from './types';

const SUBSCRIPTION_QUERY = 'subs' as const;
const ERROR_CODE_USER_CANCELLED = 'user-cancelled';
const ERROR_CODE_PENDING = 'pending';
const ERROR_CODE_SKU_NOT_FOUND = 'sku-not-found';
const ERROR_CODE_MISSING_TOKEN = 'missing-purchase-token';
const ERROR_CODE_UNKNOWN_PURCHASE = 'unknown-purchase';

const isAndroidSubscription = (
  product: ProductOrSubscription
): product is ProductSubscriptionAndroid =>
  product.platform === 'android' && product.type === SUBSCRIPTION_QUERY;

const firstPhasePriceMicros = (offer: SubscriptionOffer): number => {
  const phase = offer.pricingPhasesAndroid?.pricingPhaseList[0];
  return phase ? Number(phase.priceAmountMicros) : Number.POSITIVE_INFINITY;
};

/**
 * Play returns every offer the user is eligible for (base plan, intro price,
 * free trial). The cheapest opening phase is the best deal for the user.
 */
export const pickOfferToken = (offers: SubscriptionOffer[]): string | null => {
  const withToken = offers.filter((offer) => !!offer.offerTokenAndroid);
  if (withToken.length === 0) return null;
  const best = withToken.reduce((cheapest, offer) =>
    firstPhasePriceMicros(offer) < firstPhasePriceMicros(cheapest)
      ? offer
      : cheapest
  );
  return best.offerTokenAndroid ?? null;
};

const toBillingProduct = (
  product: ProductSubscriptionAndroid
): BillingProduct => ({
  productId: product.id,
  title: product.title,
  description: product.description,
  localizedPrice: product.displayPrice,
  currencyCode: product.currency,
  subscriptionPeriodAndroid:
    product.subscriptionOffers[0]?.pricingPhasesAndroid?.pricingPhaseList[0]
      ?.billingPeriod,
});

const toBillingError = (error: unknown): Error => {
  const playError = error as Partial<PurchaseError> | null;
  const code = playError?.code ?? 'unknown';
  if (code === ERROR_CODE_USER_CANCELLED) return new PurchaseCancelledError();
  if (code === ERROR_CODE_PENDING) return new PurchasePendingError();
  const message =
    playError?.message ??
    (error instanceof Error ? error.message : 'Google Play Billing failed.');
  return new BillingError(code, message);
};

const purchaseMatches = (purchase: Purchase, productId: string): boolean =>
  purchase.productId === productId || (purchase.ids ?? []).includes(productId);

/** Resolve the next purchase event for `productId`; requestPurchase itself only reports via listeners. */
const awaitPurchase = (
  productId: string,
  start: () => Promise<unknown>
): Promise<Purchase> =>
  new Promise<Purchase>((resolve, reject) => {
    const subscriptions: { remove: () => void }[] = [];
    const settle = <T>(finish: (value: T) => void, value: T) => {
      subscriptions.forEach((subscription) => subscription.remove());
      finish(value);
    };
    subscriptions.push(
      IAP.purchaseUpdatedListener((purchase) => {
        if (!purchaseMatches(purchase, productId)) return;
        if (purchase.purchaseState === 'pending') {
          settle(reject, new PurchasePendingError());
          return;
        }
        settle(resolve, purchase);
      }),
      IAP.purchaseErrorListener((error) =>
        settle(reject, toBillingError(error))
      )
    );
    start().catch((error: unknown) => settle(reject, toBillingError(error)));
  });

export function createExpoIapBillingClient(): BillingClient {
  let connected = false;
  // finishTransaction needs the full Purchase, but the facade only hands back a token.
  const purchasesByToken = new Map<string, Purchase>();

  const remember = (purchase: Purchase): BillingPurchase => {
    const purchaseToken = purchase.purchaseToken;
    if (!purchaseToken) {
      throw new BillingError(
        ERROR_CODE_MISSING_TOKEN,
        'Google Play returned a purchase without a token.'
      );
    }
    purchasesByToken.set(purchaseToken, purchase);
    return {
      productId: purchase.productId,
      purchaseToken,
      transactionDate: purchase.transactionDate,
      isAcknowledged:
        'isAcknowledgedAndroid' in purchase
          ? (purchase.isAcknowledgedAndroid ?? false)
          : undefined,
    };
  };

  const fetchSubscriptions = async (
    productIds: string[]
  ): Promise<ProductSubscriptionAndroid[]> => {
    const products = await IAP.fetchProducts({
      skus: productIds,
      type: SUBSCRIPTION_QUERY,
    });
    return (products ?? []).filter(isAndroidSubscription);
  };

  return {
    isAvailable: () => Platform.OS === 'android',

    initialize: async () => {
      if (connected) return;
      await IAP.initConnection();
      connected = true;
    },

    getProducts: async (productIds) =>
      (await fetchSubscriptions(productIds)).map(toBillingProduct),

    requestSubscription: async (productId) => {
      const [subscription] = await fetchSubscriptions([productId]);
      if (!subscription) {
        throw new BillingError(
          ERROR_CODE_SKU_NOT_FOUND,
          `Subscription "${productId}" is not available on Google Play.`
        );
      }
      const offerToken = pickOfferToken(subscription.subscriptionOffers);
      const purchase = await awaitPurchase(productId, () =>
        IAP.requestPurchase({
          type: SUBSCRIPTION_QUERY,
          request: {
            google: {
              skus: [productId],
              subscriptionOffers: offerToken
                ? [{ sku: productId, offerToken }]
                : undefined,
            },
          },
        })
      );
      return remember(purchase);
    },

    acknowledgePurchase: async (purchaseToken) => {
      const purchase = purchasesByToken.get(purchaseToken);
      if (!purchase) {
        throw new BillingError(
          ERROR_CODE_UNKNOWN_PURCHASE,
          'Cannot acknowledge a purchase that was not returned by this client.'
        );
      }
      await IAP.finishTransaction({ purchase, isConsumable: false });
    },

    getAvailablePurchases: async () =>
      (await IAP.getAvailablePurchases()).map(remember),

    endConnection: async () => {
      await IAP.endConnection();
      connected = false;
      purchasesByToken.clear();
    },
  };
}
