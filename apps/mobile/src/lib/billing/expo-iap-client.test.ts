import type { Purchase, PurchaseError, SubscriptionOffer } from 'expo-iap';
import * as IAP from 'expo-iap';

import { createExpoIapBillingClient, pickOfferToken } from './expo-iap-client';
import {
  BillingError,
  PurchaseCancelledError,
  PurchasePendingError,
} from './types';

type Listener<T> = (event: T) => void;

const listeners: {
  updated: Listener<Purchase>[];
  failed: Listener<PurchaseError>[];
} = { updated: [], failed: [] };

jest.mock('expo-iap', () => ({
  initConnection: jest.fn(async () => true),
  endConnection: jest.fn(async () => true),
  fetchProducts: jest.fn(),
  requestPurchase: jest.fn(async () => null),
  finishTransaction: jest.fn(async () => undefined),
  getAvailablePurchases: jest.fn(async () => []),
  purchaseUpdatedListener: jest.fn((listener: Listener<Purchase>) => {
    listeners.updated.push(listener);
    return {
      remove: () => {
        listeners.updated = listeners.updated.filter((l) => l !== listener);
      },
    };
  }),
  purchaseErrorListener: jest.fn((listener: Listener<PurchaseError>) => {
    listeners.failed.push(listener);
    return {
      remove: () => {
        listeners.failed = listeners.failed.filter((l) => l !== listener);
      },
    };
  }),
}));

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

const PRODUCT_ID = 'premium_monthly';
const TOKEN = 'play-token-123';

const offer = (
  offerTokenAndroid: string,
  priceAmountMicros: string
): SubscriptionOffer =>
  ({
    id: offerTokenAndroid,
    offerTokenAndroid,
    displayPrice: '$1',
    price: 1,
    type: 'introductory',
    pricingPhasesAndroid: {
      pricingPhaseList: [
        {
          billingCycleCount: 1,
          billingPeriod: 'P1M',
          formattedPrice: '$1',
          priceAmountMicros,
          priceCurrencyCode: 'USD',
          recurrenceMode: 2,
        },
      ],
    },
  }) as unknown as SubscriptionOffer;

const androidSubscription = (offers: SubscriptionOffer[]) => ({
  id: PRODUCT_ID,
  platform: 'android',
  type: 'subs',
  title: 'Premium',
  description: 'All features',
  displayPrice: '$4.99',
  currency: 'USD',
  subscriptionOffers: offers,
});

const purchase = (overrides: Partial<Purchase> = {}): Purchase =>
  ({
    id: 'order-1',
    productId: PRODUCT_ID,
    purchaseToken: TOKEN,
    purchaseState: 'purchased',
    transactionDate: 1_700_000_000_000,
    isAcknowledgedAndroid: false,
    store: 'google',
    quantity: 1,
    isAutoRenewing: true,
    ...overrides,
  }) as Purchase;

const emitPurchase = (event: Purchase) =>
  listeners.updated.forEach((listener) => listener(event));
const emitError = (event: Partial<PurchaseError>) =>
  listeners.failed.forEach((listener) => listener(event as PurchaseError));

const mockedIap = IAP as jest.Mocked<typeof IAP>;

beforeEach(() => {
  jest.clearAllMocks();
  listeners.updated = [];
  listeners.failed = [];
  mockedIap.fetchProducts.mockResolvedValue([
    androidSubscription([offer('base', '4990000')]),
  ] as never);
});

describe('pickOfferToken', () => {
  it('prefers the offer with the cheapest opening phase', () => {
    const token = pickOfferToken([
      offer('base', '4990000'),
      offer('trial', '0'),
      offer('intro', '1990000'),
    ]);
    expect(token).toBe('trial');
  });

  it('returns null when no offer carries a token', () => {
    expect(pickOfferToken([])).toBeNull();
  });
});

describe('createExpoIapBillingClient', () => {
  it('is only available on Android', () => {
    expect(createExpoIapBillingClient().isAvailable()).toBe(true);
  });

  it('initializes the Play connection once', async () => {
    const client = createExpoIapBillingClient();
    await client.initialize();
    await client.initialize();
    expect(mockedIap.initConnection).toHaveBeenCalledTimes(1);
  });

  it('maps Play subscriptions to BillingProduct', async () => {
    const client = createExpoIapBillingClient();
    const [product] = await client.getProducts([PRODUCT_ID]);
    expect(mockedIap.fetchProducts).toHaveBeenCalledWith({
      skus: [PRODUCT_ID],
      type: 'subs',
    });
    expect(product).toEqual({
      productId: PRODUCT_ID,
      title: 'Premium',
      description: 'All features',
      localizedPrice: '$4.99',
      currencyCode: 'USD',
      subscriptionPeriodAndroid: 'P1M',
    });
  });

  it('requests the subscription with the chosen offer and resolves on the purchase event', async () => {
    const client = createExpoIapBillingClient();
    const pending = client.requestSubscription(PRODUCT_ID);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockedIap.requestPurchase).toHaveBeenCalledWith({
      type: 'subs',
      request: {
        google: {
          skus: [PRODUCT_ID],
          subscriptionOffers: [{ sku: PRODUCT_ID, offerToken: 'base' }],
        },
      },
    });

    emitPurchase(purchase());
    await expect(pending).resolves.toEqual({
      productId: PRODUCT_ID,
      purchaseToken: TOKEN,
      transactionDate: 1_700_000_000_000,
      isAcknowledged: false,
    });
    expect(listeners.updated).toHaveLength(0);
    expect(listeners.failed).toHaveLength(0);
  });

  it('ignores purchase events for other products', async () => {
    const client = createExpoIapBillingClient();
    const pending = client.requestSubscription(PRODUCT_ID);
    await Promise.resolve();
    await Promise.resolve();

    emitPurchase(purchase({ productId: 'other_sku', ids: ['other_sku'] }));
    expect(listeners.updated).toHaveLength(1);

    emitPurchase(purchase());
    await expect(pending).resolves.toMatchObject({ purchaseToken: TOKEN });
  });

  it('surfaces a user cancel as PurchaseCancelledError', async () => {
    const client = createExpoIapBillingClient();
    const pending = client.requestSubscription(PRODUCT_ID);
    await Promise.resolve();
    await Promise.resolve();

    emitError({ code: 'user-cancelled' as PurchaseError['code'] });
    await expect(pending).rejects.toBeInstanceOf(PurchaseCancelledError);
  });

  it('surfaces a pending purchase as PurchasePendingError', async () => {
    const client = createExpoIapBillingClient();
    const pending = client.requestSubscription(PRODUCT_ID);
    await Promise.resolve();
    await Promise.resolve();

    emitPurchase(purchase({ purchaseState: 'pending' }));
    await expect(pending).rejects.toBeInstanceOf(PurchasePendingError);
  });

  it('rejects when the SKU is not on Play', async () => {
    mockedIap.fetchProducts.mockResolvedValue([] as never);
    const client = createExpoIapBillingClient();
    await expect(client.requestSubscription(PRODUCT_ID)).rejects.toMatchObject({
      name: 'BillingError',
      code: 'sku-not-found',
    });
  });

  it('acknowledges via finishTransaction with the remembered purchase', async () => {
    const client = createExpoIapBillingClient();
    const pending = client.requestSubscription(PRODUCT_ID);
    await Promise.resolve();
    await Promise.resolve();
    const event = purchase();
    emitPurchase(event);
    await pending;

    await client.acknowledgePurchase(TOKEN);
    expect(mockedIap.finishTransaction).toHaveBeenCalledWith({
      purchase: event,
      isConsumable: false,
    });
  });

  it('refuses to acknowledge an unknown token', async () => {
    const client = createExpoIapBillingClient();
    await expect(client.acknowledgePurchase('nope')).rejects.toBeInstanceOf(
      BillingError
    );
  });

  it('lists available purchases and makes them acknowledgeable', async () => {
    mockedIap.getAvailablePurchases.mockResolvedValue([
      purchase({ isAcknowledgedAndroid: true }),
    ]);
    const client = createExpoIapBillingClient();
    const [restored] = await client.getAvailablePurchases();
    expect(restored).toMatchObject({
      purchaseToken: TOKEN,
      isAcknowledged: true,
    });
    await expect(client.acknowledgePurchase(TOKEN)).resolves.toBeUndefined();
  });

  it('ends the connection and forgets purchases', async () => {
    const client = createExpoIapBillingClient();
    await client.initialize();
    await client.endConnection();
    expect(mockedIap.endConnection).toHaveBeenCalledTimes(1);
    await client.initialize();
    expect(mockedIap.initConnection).toHaveBeenCalledTimes(2);
  });
});
