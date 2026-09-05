import React from 'react';

import { useMe } from '@/api/auth';
import { usePaymentSubscriptionStatus } from '@/api/billing/use-subscription-status';
import { cleanup, screen, setup } from '@/lib/test-utils';

import Home from './index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// SystemBars schedules native status-bar work that outlives the jest environment.
jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/api/auth', () => ({
  useMe: jest.fn(),
}));

jest.mock('@/api/billing/use-subscription-status', () => ({
  usePaymentSubscriptionStatus: jest.fn(),
}));

const mockedUseMe = useMe as jest.MockedFunction<typeof useMe>;
const mockedUseSubscription =
  usePaymentSubscriptionStatus as jest.MockedFunction<
    typeof usePaymentSubscriptionStatus
  >;

const mockUser = (
  fullName: string | null = 'Ada Lovelace',
  isPremium = false
) => {
  mockedUseMe.mockReturnValue({ data: { full_name: fullName } } as never);
  mockedUseSubscription.mockReturnValue({
    data: { is_premium: isPremium },
  } as never);
};

afterEach(() => {
  cleanup();
  mockPush.mockReset();
  mockedUseMe.mockReset();
  mockedUseSubscription.mockReset();
});

describe('Home', () => {
  it('renders the greeting and first name', () => {
    mockUser();
    setup(<Home />);
    expect(
      screen.getByText(/^Good (morning|afternoon|evening)$/)
    ).toBeOnTheScreen();
    expect(screen.getByText('Ada')).toBeOnTheScreen();
  });

  it('opens settings from the avatar showing the user initial', async () => {
    mockUser();
    const { user } = setup(<Home />);
    expect(screen.getByText('A')).toBeOnTheScreen();
    await user.press(screen.getByTestId('settings-avatar'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/settings');
  });

  it('falls back to a generic greeting without a profile name', () => {
    mockUser(null);
    setup(<Home />);
    expect(screen.getByText('there')).toBeOnTheScreen();
  });

  it('shows the premium badge for subscribers', () => {
    mockUser('Ada Lovelace', true);
    setup(<Home />);
    expect(screen.getByTestId('premium-badge')).toBeOnTheScreen();
  });
});
