import React from 'react';

import { useMe } from '@/api/auth';
import { usePaymentSubscriptionStatus } from '@/api/billing/use-subscription-status';
import { useCycles } from '@/api/cycles';
import { usePregnancies } from '@/api/pregnancy';
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

jest.mock('@/api/cycles', () => ({
  useCycles: jest.fn(),
}));

jest.mock('@/api/pregnancy', () => ({
  usePregnancies: jest.fn(),
  activePregnancy: (page: { results: { status: string }[] } | undefined) =>
    page?.results.find((row) => row.status === 'active'),
}));

const mockedUseMe = useMe as jest.MockedFunction<typeof useMe>;
const mockedUseSubscription =
  usePaymentSubscriptionStatus as jest.MockedFunction<
    typeof usePaymentSubscriptionStatus
  >;
const mockedUseCycles = useCycles as jest.MockedFunction<typeof useCycles>;
const mockedUsePregnancies = usePregnancies as jest.MockedFunction<
  typeof usePregnancies
>;

const page = (results: unknown[]) => ({ data: { results } });

const mockUser = (
  fullName: string | null = 'Ada Lovelace',
  isPremium = false
) => {
  mockedUseMe.mockReturnValue({ data: { full_name: fullName } } as never);
  mockedUseSubscription.mockReturnValue({
    data: { is_premium: isPremium },
  } as never);
};

const mockHealthData = ({
  cycles = [],
  pregnancies = [],
}: { cycles?: unknown[]; pregnancies?: unknown[] } = {}) => {
  mockedUseCycles.mockReturnValue(page(cycles) as never);
  mockedUsePregnancies.mockReturnValue(page(pregnancies) as never);
};

const startedDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

afterEach(() => {
  cleanup();
  mockPush.mockReset();
  mockedUseMe.mockReset();
  mockedUseSubscription.mockReset();
  mockedUseCycles.mockReset();
  mockedUsePregnancies.mockReset();
});

describe('Home', () => {
  it('renders the greeting and first name', () => {
    mockUser();
    mockHealthData();
    setup(<Home />);
    expect(screen.getByText('Welcome back!')).toBeOnTheScreen();
    expect(screen.getByText('Ada')).toBeOnTheScreen();
  });

  it('shows the week strip with today selected and a log action', () => {
    mockUser();
    mockHealthData({
      cycles: [{ id: 'c1', start_date: startedDaysAgo(9), end_date: null }],
    });
    setup(<Home />);
    expect(screen.getByTestId('week-strip')).toBeOnTheScreen();
    expect(screen.getByTestId('dashboard-log-action')).toHaveTextContent(
      'Log Period'
    );
  });

  it('opens the symptom logger from the action button', async () => {
    mockUser();
    mockHealthData({
      cycles: [{ id: 'c1', start_date: startedDaysAgo(9), end_date: null }],
    });
    const { user } = setup(<Home />);
    await user.press(screen.getByTestId('dashboard-log-action'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/tracking');
  });

  it('opens settings from the avatar showing the user initial', async () => {
    mockUser();
    mockHealthData();
    const { user } = setup(<Home />);
    expect(screen.getByText('A')).toBeOnTheScreen();
    await user.press(screen.getByTestId('settings-avatar'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/settings');
  });

  it('falls back to a generic greeting without a profile name', () => {
    mockUser(null);
    mockHealthData();
    setup(<Home />);
    expect(screen.getByText('there')).toBeOnTheScreen();
  });

  it('shows the premium badge for subscribers', () => {
    mockUser('Ada Lovelace', true);
    mockHealthData();
    setup(<Home />);
    expect(screen.getByTestId('premium-badge')).toBeOnTheScreen();
  });

  it('invites the user to log a first period when there is no history', () => {
    mockUser();
    mockHealthData();
    setup(<Home />);
    expect(screen.getByText(/Log your first period/)).toBeOnTheScreen();
    expect(screen.queryByTestId('cycle-status-cards')).toBeNull();
  });

  it('shows the cycle day ring once a cycle is logged', () => {
    mockUser();
    mockHealthData({
      cycles: [{ id: 'c1', start_date: startedDaysAgo(9), end_date: null }],
    });
    setup(<Home />);
    expect(screen.getByTestId('cycle-status-cards')).toBeOnTheScreen();
    expect(screen.getByTestId('cycle-ring-day')).toHaveTextContent('10');
    // Day 10 of 28 sits inside the estimated fertile window (days 9–15).
    expect(screen.getByTestId('pregnancy-chance-card')).toHaveTextContent(
      /High/
    );
  });

  it('shows the gestation ring for an active pregnancy', () => {
    mockUser();
    mockHealthData({
      pregnancies: [
        {
          id: 'p1',
          status: 'active',
          current_week: 22,
          due_date: '2026-12-01',
          lmp_date: null,
        },
      ],
    });
    setup(<Home />);
    expect(screen.getByTestId('pregnancy-ring')).toBeOnTheScreen();
    expect(screen.getByTestId('pregnancy-ring-week')).toHaveTextContent('22');
    expect(screen.getByText('Second')).toBeOnTheScreen();
  });

  it('prompts to start a pregnancy when none is active', () => {
    mockUser();
    mockHealthData({ pregnancies: [{ id: 'p1', status: 'completed' }] });
    setup(<Home />);
    expect(screen.getByText(/No active pregnancy/)).toBeOnTheScreen();
  });

  it('falls back to labelled demo data when the backend is unreachable', () => {
    mockUser();
    const failed = { data: undefined, isError: true };
    mockedUseCycles.mockReturnValue(failed as never);
    mockedUsePregnancies.mockReturnValue(failed as never);
    setup(<Home />);
    expect(screen.getByTestId('cycle-demo-pill')).toBeOnTheScreen();
    expect(screen.getByTestId('pregnancy-demo-pill')).toBeOnTheScreen();
    expect(screen.getByTestId('pregnancy-ring')).toBeOnTheScreen();
    expect(screen.getByTestId('pregnancy-ring-week')).toHaveTextContent('18');
  });

  it('never fakes data over a real empty response', () => {
    mockUser();
    mockHealthData();
    setup(<Home />);
    expect(screen.queryByTestId('cycle-demo-pill')).toBeNull();
    expect(screen.queryByTestId('pregnancy-demo-pill')).toBeNull();
    expect(screen.queryByTestId('pregnancy-ring')).toBeNull();
  });
});
