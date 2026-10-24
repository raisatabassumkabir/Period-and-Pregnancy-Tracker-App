import '@testing-library/react-native/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: () => [true],
  isLoaded: () => true,
  loadAsync: jest.fn().mockResolvedValue(undefined),
}));

// The encrypted preference store (`src/lib/storage.tsx`) needs the OS keystore
// and a random key at open time. Both are native; give them in-memory stand-ins
// so any test that touches a preference works without a device. A test file may
// still `jest.mock('expo-secure-store')` itself to assert on the calls.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (length: number) =>
    Uint8Array.from({ length }, (_, index) => index)
  ),
  randomUUID: jest.fn(() => '00000000-0000-4000-8000-000000000000'),
}));

// `@env` reads `Constants.expoConfig.extra`, which jest-expo leaves empty — so
// anything rendering `Env.NAME` (the brand lockup, onboarding's welcome step)
// would render blank in tests while working on device. Mirror what
// `app.config.ts` injects, keeping the rest of expo-constants intact.
jest.mock('expo-constants', () => {
  const actual = jest.requireActual('expo-constants');
  return {
    ...actual,
    __esModule: true,
    default: {
      ...actual.default,
      expoConfig: {
        ...(actual.default?.expoConfig ?? {}),
        extra: {
          APP_ENV: 'development',
          NAME: 'Happy Women',
          SCHEME: 'apptemplate',
          BUNDLE_ID: 'com.example.app.development',
          PACKAGE: 'com.example.app.development',
          VERSION: '0.1.0',
          API_URL: 'http://localhost:8000/api/',
          AMPLITUDE_API_KEY: '',
          PRIVACY_POLICY_URL: 'https://example.com/privacy',
          TERMS_URL: 'https://example.com/terms',
          SUPPORT_EMAIL: 'support@example.com',
          REVENUECAT_ANDROID_API_KEY: 'goog_test_key_123',
        },
      },
    },
  };
});

// Dev-only TanStack Query Devtools — pure ESM, swap with a no-op for tests.
jest.mock('@dev-plugins/react-query', () => ({
  useReactQueryDevTools: () => undefined,
}));

// Flash messages aren't useful in unit tests; stub the surface we use.
jest.mock('react-native-flash-message', () => ({
  __esModule: true,
  default: () => null,
  showMessage: jest.fn(),
  hideMessage: jest.fn(),
}));

// Amplitude Analytics & Session Replay mocks for tests
jest.mock('@amplitude/analytics-react-native', () => {
  class MockIdentify {
    properties: Record<string, unknown> = {};
    set(key: string, value: unknown) {
      this.properties[key] = value;
      return this;
    }
    setOnce(key: string, value: unknown) {
      this.properties[key] = value;
      return this;
    }
  }

  return {
    init: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    add: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    track: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    identify: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    setUserId: jest.fn(),
    reset: jest.fn(),
    setOptOut: jest.fn(),
    flush: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    Identify: MockIdentify,
  };
});

// react-hook form setup for testing
// @ts-ignore
global.window = {};
// @ts-ignore
global.window = global;

// RevenueCat purchases mock
jest.mock('react-native-purchases', () => {
  const mockPkg = {
    identifier: '$rc_monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: 'premium_monthly',
      description: 'Full monthly access',
      title: 'Premium Monthly',
      price: 4.99,
      priceString: '$4.99',
      currencyCode: 'USD',
      subscriptionPeriod: 'P1M',
    },
    offeringIdentifier: 'default',
  };

  return {
    __esModule: true,
    default: {
      isConfigured: jest.fn(async () => true),
      configure: jest.fn(),
      logIn: jest.fn(async () => ({ customerInfo: {}, created: false })),
      logOut: jest.fn(async () => ({})),
      isAnonymous: jest.fn(async () => false),
      getOfferings: jest.fn(async () => ({
        all: {
          default: {
            identifier: 'default',
            serverDescription: 'Default offering',
            availablePackages: [mockPkg],
            monthly: mockPkg,
            annual: null,
          },
        },
        current: {
          identifier: 'default',
          serverDescription: 'Default offering',
          availablePackages: [mockPkg],
          monthly: mockPkg,
          annual: null,
        },
      })),
      getCustomerInfo: jest.fn(async () => ({
        entitlements: { active: {} },
      })),
      purchasePackage: jest.fn(async (pkg: any) => ({
        productIdentifier: pkg?.product?.identifier ?? 'premium_monthly',
        customerInfo: {
          entitlements: {
            active: {
              premium: {
                identifier: 'premium',
                productIdentifier:
                  pkg?.product?.identifier ?? 'premium_monthly',
                isActive: true,
              },
            },
          },
        },
      })),
      restorePurchases: jest.fn(async () => ({
        entitlements: { active: {} },
      })),
      addCustomerInfoUpdateListener: jest.fn(() => () => {}),
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
