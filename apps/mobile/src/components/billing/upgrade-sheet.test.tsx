import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import * as syncHook from '@/api/billing/use-subscription-sync';
import { PurchaseCancelledError, setBillingClient } from '@/lib/billing';
import * as externalLinks from '@/lib/external-links';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@/lib/test-utils';
import { getUpgradeState, hideUpgrade, showUpgrade } from '@/lib/upgrade';

import { calculateAnnualSavingsBadge, UpgradeSheet } from './upgrade-sheet';

const MONTHLY_PRODUCT_ID = 'premium_monthly';
const ANNUAL_PRODUCT_ID = 'premium_annual';

const mockMonthlyPackage = {
  identifier: '$rc_monthly',
  packageType: 'MONTHLY',
  product: {
    identifier: MONTHLY_PRODUCT_ID,
    priceString: '$4.99',
    title: 'Monthly Premium',
    description: 'Monthly Premium subscription',
    currencyCode: 'USD',
  },
} as any;

const mockAnnualPackage = {
  identifier: '$rc_annual',
  packageType: 'ANNUAL',
  product: {
    identifier: ANNUAL_PRODUCT_ID,
    priceString: '$29.99',
    title: 'Annual Premium',
    description: 'Annual Premium subscription',
    currencyCode: 'USD',
  },
} as any;

afterEach(() => {
  cleanup();
  hideUpgrade();
  setBillingClient({
    isAvailable: () => false,
    initialize: async () => {},
    identifyUser: async () => {},
    resetUser: async () => {},
    getProducts: async () => [],
    getOfferings: async () => null,
    requestSubscription: async () => {
      throw new Error('not configured');
    },
    purchasePackage: async () => {
      throw new Error('not configured');
    },
    restorePurchases: async () => [],
    getCustomerInfo: async () => null,
    addCustomerInfoUpdateListener: () => () => {},
    acknowledgePurchase: async () => {},
    getAvailablePurchases: async () => [],
    endConnection: async () => {},
  });
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('UpgradeSheet - Plans and Purchasing', () => {
  it('renders title, marketing bullets, close button, and legal links', async () => {
    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({
        message: 'Unlock full features.',
        feature: 'premium',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-sheet-title')).toBeOnTheScreen();
    });
    expect(screen.getByTestId('upgrade-sheet-title')).toHaveTextContent(
      /Upgrade to Premium/i
    );
    expect(screen.getByTestId('upgrade-sheet-message')).toHaveTextContent(
      'Unlock full features.'
    );
    expect(screen.getByTestId('upgrade-sheet-close')).toBeOnTheScreen();
    expect(screen.getByTestId('upgrade-sheet-terms')).toBeOnTheScreen();
    expect(screen.getByTestId('upgrade-sheet-privacy')).toBeOnTheScreen();
    expect(screen.getByTestId('upgrade-sheet-dismiss')).toBeOnTheScreen();
  });

  it('renders localized monthly and annual options and switches selection', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () =>
        ({
          current: {
            availablePackages: [mockAnnualPackage, mockMonthlyPackage],
            monthly: mockMonthlyPackage,
            annual: mockAnnualPackage,
          },
        }) as any,
      requestSubscription: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      purchasePackage: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({ message: 'Go premium', feature: 'premium' });
    });

    expect(
      await screen.findByTestId('upgrade-sheet-option-annual')
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId('upgrade-sheet-option-monthly')
    ).toBeOnTheScreen();

    // Defaults to annual
    expect(screen.getByTestId('upgrade-sheet-cta')).toHaveTextContent(
      'Subscribe ($29.99/yr)'
    );

    // Switch to monthly
    fireEvent.press(screen.getByTestId('upgrade-sheet-option-monthly'));
    expect(screen.getByTestId('upgrade-sheet-cta')).toHaveTextContent(
      'Subscribe ($4.99/mo)'
    );
  });

  it('runs the buy flow: purchase -> backend sync -> success state', async () => {
    const purchasePackage = jest.fn().mockResolvedValue({
      productId: ANNUAL_PRODUCT_ID,
      transactionDate: Date.now(),
      isAcknowledged: true,
    });

    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () =>
        ({
          current: {
            availablePackages: [mockAnnualPackage, mockMonthlyPackage],
            monthly: mockMonthlyPackage,
            annual: mockAnnualPackage,
          },
        }) as any,
      requestSubscription: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      purchasePackage,
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const syncMutate = jest.fn().mockResolvedValue({
      is_premium: true,
      subscription_status: 'active',
      subscription_ends_at: '2027-04-29T00:00:00Z',
      entitlement_id: 'premium',
      product_id: ANNUAL_PRODUCT_ID,
    });

    jest.spyOn(syncHook, 'useSubscriptionSync').mockReturnValue({
      mutateAsync: syncMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      reset: jest.fn(),
    } as never);

    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({ message: 'Go premium', feature: 'premium' });
    });

    expect(
      await screen.findByTestId('upgrade-sheet-option-annual')
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-cta'));

    await waitFor(() => {
      expect(purchasePackage).toHaveBeenCalledWith(mockAnnualPackage);
    });

    await waitFor(() => {
      expect(syncMutate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-sheet-success')).toBeOnTheScreen();
    });
  });

  it('handles recoverable retry verification when backend sync fails initially', async () => {
    const purchasePackage = jest.fn().mockResolvedValue({
      productId: ANNUAL_PRODUCT_ID,
      isAcknowledged: true,
    });

    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () =>
        ({
          current: {
            availablePackages: [mockAnnualPackage],
            annual: mockAnnualPackage,
          },
        }) as any,
      requestSubscription: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      purchasePackage,
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const syncMutate = jest
      .fn()
      .mockRejectedValueOnce(new Error('Backend timeout'))
      .mockResolvedValueOnce({
        is_premium: true,
        subscription_status: 'active',
        subscription_ends_at: '2027-04-29T00:00:00Z',
        entitlement_id: 'premium',
        product_id: ANNUAL_PRODUCT_ID,
      });

    jest.spyOn(syncHook, 'useSubscriptionSync').mockReturnValue({
      mutateAsync: syncMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      reset: jest.fn(),
    } as never);

    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({ message: 'Go premium', feature: 'premium' });
    });

    expect(
      await screen.findByTestId('upgrade-sheet-option-annual')
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-cta'));

    expect(
      await screen.findByTestId('upgrade-sheet-retry-cta')
    ).toBeOnTheScreen();
    expect(screen.getByTestId('upgrade-sheet-error')).toBeOnTheScreen();

    // Press retry verification
    fireEvent.press(screen.getByTestId('upgrade-sheet-retry-cta'));

    await waitFor(() => {
      expect(syncMutate).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-sheet-success')).toBeOnTheScreen();
    });
  });
});

describe('UpgradeSheet - Cancellation, Restore and Navigation', () => {
  it('returns to idle without an error banner when the user cancels the store dialog', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () =>
        ({
          current: {
            availablePackages: [mockMonthlyPackage],
            monthly: mockMonthlyPackage,
          },
        }) as any,
      requestSubscription: async () => {
        throw new PurchaseCancelledError();
      },
      purchasePackage: async () => {
        throw new PurchaseCancelledError();
      },
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({ message: 'Go premium', feature: 'premium' });
    });

    expect(await screen.findByTestId('upgrade-sheet-cta')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-cta'));

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-sheet-cta')).not.toBeDisabled();
    });
    expect(screen.queryByTestId('upgrade-sheet-error')).toBeNull();
    expect(screen.queryByTestId('upgrade-sheet-success')).toBeNull();
  });

  it('shows an error banner when billing is not configured', async () => {
    setBillingClient({
      isAvailable: () => false,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      purchasePackage: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({ message: 'Go premium', feature: 'premium' });
    });

    expect(
      await screen.findByTestId('upgrade-sheet-restore')
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-restore'));

    expect(await screen.findByTestId('upgrade-sheet-error')).toBeOnTheScreen();
    expect(screen.getByTestId('upgrade-sheet-error')).toHaveTextContent(
      /In-app purchases are not configured/i
    );
  });

  it('shows graceful unavailable state and disables CTA when offering is missing', async () => {
    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      purchasePackage: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      restorePurchases: async () => [],
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({ message: 'Go premium', feature: 'premium' });
    });

    expect(
      await screen.findByTestId('upgrade-sheet-unavailable')
    ).toBeOnTheScreen();
    expect(screen.getByTestId('upgrade-sheet-cta')).toBeDisabled();
    expect(screen.getByTestId('upgrade-sheet-cta')).toHaveTextContent(
      'Subscription Unavailable'
    );
  });

  it('restores purchases when restore button is pressed', async () => {
    const restorePurchases = jest.fn().mockResolvedValue([
      {
        productId: ANNUAL_PRODUCT_ID,
        transactionDate: Date.now(),
        isAcknowledged: true,
      },
    ]);

    setBillingClient({
      isAvailable: () => true,
      initialize: async () => {},
      identifyUser: async () => {},
      resetUser: async () => {},
      getProducts: async () => [],
      getOfferings: async () => null,
      requestSubscription: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      purchasePackage: async () => ({ productId: ANNUAL_PRODUCT_ID }),
      restorePurchases,
      getCustomerInfo: async () => null,
      addCustomerInfoUpdateListener: () => () => {},
      acknowledgePurchase: async () => {},
      getAvailablePurchases: async () => [],
      endConnection: async () => {},
    });

    const syncMutate = jest.fn().mockResolvedValue({
      is_premium: true,
      subscription_status: 'active',
      subscription_ends_at: '2027-04-29T00:00:00Z',
      entitlement_id: 'premium',
      product_id: ANNUAL_PRODUCT_ID,
    });

    jest.spyOn(syncHook, 'useSubscriptionSync').mockReturnValue({
      mutateAsync: syncMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      reset: jest.fn(),
    } as never);

    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({ message: 'Go premium', feature: 'premium' });
    });

    expect(
      await screen.findByTestId('upgrade-sheet-restore')
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-restore'));

    await waitFor(() => {
      expect(restorePurchases).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(syncMutate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-sheet-success')).toBeOnTheScreen();
    });
  });

  it('dismisses the sheet when close or continue with free is pressed', async () => {
    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({ message: 'Go premium', feature: 'premium' });
    });

    expect(await screen.findByTestId('upgrade-sheet-close')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-close'));

    expect(getUpgradeState().visible).toBe(false);

    // Reopen and test dismiss button
    act(() => {
      showUpgrade({ message: 'Go premium again', feature: 'premium' });
    });
    expect(
      await screen.findByTestId('upgrade-sheet-dismiss')
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-dismiss'));
    expect(getUpgradeState().visible).toBe(false);
  });

  it('opens terms and privacy policy links when pressed', async () => {
    const termsSpy = jest
      .spyOn(externalLinks, 'openTerms')
      .mockResolvedValue(undefined as never);
    const privacySpy = jest
      .spyOn(externalLinks, 'openPrivacyPolicy')
      .mockResolvedValue(undefined as never);

    renderWithProviders(<UpgradeSheet />);
    act(() => {
      showUpgrade({ message: 'Go premium', feature: 'premium' });
    });

    expect(await screen.findByTestId('upgrade-sheet-terms')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('upgrade-sheet-terms'));
    expect(termsSpy).toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('upgrade-sheet-privacy'));
    expect(privacySpy).toHaveBeenCalled();
  });
});

describe('calculateAnnualSavingsBadge', () => {
  it('computes percentage savings accurately from store numerical prices', () => {
    const annual = {
      product: { price: 29.99, priceString: '$29.99' },
    } as any;
    const monthly = {
      product: { price: 4.99, priceString: '$4.99' },
    } as any;
    expect(calculateAnnualSavingsBadge(annual, monthly)).toBe('Save ~50%');
  });

  it('omits badge when annual is not discounted or more expensive', () => {
    const annual = {
      product: { price: 60.0, priceString: '$60.00' },
    } as any;
    const monthly = {
      product: { price: 5.0, priceString: '$5.00' },
    } as any;
    expect(calculateAnnualSavingsBadge(annual, monthly)).toBeUndefined();
  });

  it('omits badge when package or prices are missing, zero, or invalid', () => {
    expect(calculateAnnualSavingsBadge(undefined, undefined)).toBeUndefined();
    expect(
      calculateAnnualSavingsBadge(
        { product: { priceString: '$29.99' } } as any,
        { product: { price: 4.99 } } as any
      )
    ).toBeUndefined();
    expect(
      calculateAnnualSavingsBadge(
        { product: { price: 0 } } as any,
        { product: { price: 4.99 } } as any
      )
    ).toBeUndefined();
  });
});
