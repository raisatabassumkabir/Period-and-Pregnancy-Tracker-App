import React from 'react';

import { useCycles } from '@/api/cycles';
import { usePregnancies } from '@/api/pregnancy';
import { useMealDay } from '@/lib/diet';
import { todayDateString } from '@/lib/health/dates';
import { cleanup, screen, setup } from '@/lib/test-utils';
import { useHealthStore } from '@/store/useHealthStore';

import Diet from './diet';

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/api/pregnancy', () => ({
  usePregnancies: jest.fn(),
  activePregnancy: (page: { results: { status: string }[] } | undefined) =>
    page?.results.find((row) => row.status === 'active'),
}));

jest.mock('@/api/cycles', () => ({
  useCycles: jest.fn(),
}));

const mockedUsePregnancies = usePregnancies as jest.MockedFunction<
  typeof usePregnancies
>;
const mockedUseCycles = useCycles as jest.MockedFunction<typeof useCycles>;

const mockPregnancies = (results: unknown[] = []) => {
  mockedUsePregnancies.mockReturnValue({ data: { results } } as never);
};

const mockCycles = (results: unknown[] = []) => {
  mockedUseCycles.mockReturnValue({
    data: { results },
    isError: false,
  } as never);
};

const startedDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

beforeEach(() => {
  mockCycles();
  mockPregnancies();
  useMealDay.setState({
    day: { date: todayDateString(), swaps: {}, eaten: [] },
  });
});

afterEach(() => {
  cleanup();
  mockedUsePregnancies.mockReset();
  mockedUseCycles.mockReset();
  useHealthStore.setState({ mode: 'cycle' });
});

describe('Diet', () => {
  it('renders today\u2019s plan with one card per meal slot', () => {
    setup(<Diet />);
    expect(screen.getByTestId('meal-targets-card')).toBeOnTheScreen();
    SLOTS.forEach((slot) =>
      expect(screen.getByTestId(`daily-meal-${slot}`)).toBeOnTheScreen()
    );
  });

  it('explains the luteal focus on a luteal day', () => {
    // Day 22 of a default 28-day cycle is past ovulation (day 14): luteal.
    mockCycles([{ id: 'c1', start_date: startedDaysAgo(21), end_date: null }]);
    setup(<Diet />);
    expect(screen.getByTestId('meal-plan-focus')).toHaveTextContent(/Luteal/);
  });

  it('uses the pregnancy focus in pregnancy mode', () => {
    useHealthStore.setState({ mode: 'pregnancy' });
    mockPregnancies([
      { id: 'p1', status: 'active', current_week: 30, due_date: '2026-12-01' },
    ]);
    setup(<Diet />);
    expect(screen.getByTestId('meal-plan-focus')).toHaveTextContent(
      /Trimester 3/
    );
  });

  it('swaps a meal and marks one eaten', async () => {
    const { user } = setup(<Diet />);
    await user.press(screen.getByTestId('daily-meal-lunch-swap'));
    expect(useMealDay.getState().day.swaps.lunch).toBe(1);

    await user.press(screen.getByTestId('daily-meal-snack-eaten'));
    expect(useMealDay.getState().day.eaten).toHaveLength(1);
  });

  it('asks for height and weight when they are missing', () => {
    setup(<Diet />);
    expect(screen.getByTestId('meal-add-metrics')).toBeOnTheScreen();
  });
});
