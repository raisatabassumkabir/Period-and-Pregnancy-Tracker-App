import React from 'react';

import { useCycles, useDailyLogs } from '@/api/cycles';
import { usePregnancies } from '@/api/pregnancy';
import { cleanup, screen, setup } from '@/lib/test-utils';
import { useKickCounter } from '@/lib/tracking';

import Assistant from './assistant';

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/api/cycles', () => ({
  useCycles: jest.fn(),
  useDailyLogs: jest.fn(),
}));

jest.mock('@/api/pregnancy', () => ({
  usePregnancies: jest.fn(),
  activePregnancy: jest.fn(),
}));

jest.mock('@/lib/tracking', () => ({
  useKickCounter: jest.fn(),
}));

const mockedUseCycles = useCycles as jest.MockedFunction<typeof useCycles>;
const mockedUseDailyLogs = useDailyLogs as jest.MockedFunction<
  typeof useDailyLogs
>;
const mockedUsePregnancies = usePregnancies as jest.MockedFunction<
  typeof usePregnancies
>;
const mockedUseKickCounter = useKickCounter as jest.MockedFunction<
  typeof useKickCounter
>;

const emptyPage = { results: [], count: 0, next: null, previous: null };

beforeEach(() => {
  mockedUseCycles.mockReturnValue({ data: emptyPage, isError: false } as never);
  mockedUseDailyLogs.mockReturnValue({
    data: emptyPage,
    isError: false,
  } as never);
  mockedUsePregnancies.mockReturnValue({
    data: emptyPage,
    isError: false,
  } as never);
  mockedUseKickCounter.mockReturnValue({
    count: 3,
    increment: jest.fn(),
    reset: jest.fn(),
    isReady: true,
  });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('Assistant', () => {
  it('renders the screen with a welcome message', () => {
    setup(<Assistant />);
    expect(screen.getByTestId('assistant-screen')).toBeOnTheScreen();
    expect(screen.getByText(/Ask about your next period/i)).toBeOnTheScreen();
  });

  it('sends a typed question and appends the reply', async () => {
    const { user } = setup(<Assistant />);

    await user.type(
      screen.getByTestId('assistant-input'),
      'How many kicks today?'
    );
    await user.press(screen.getByTestId('assistant-send'));

    expect(await screen.findByText(/logged 3 kick/i)).toBeOnTheScreen();
  });
});
