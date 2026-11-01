import React from 'react';

import { useCycles } from '@/api/cycles';
import { usePregnancies } from '@/api/pregnancy';
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

beforeEach(() => {
  mockCycles();
  mockPregnancies();
});

afterEach(() => {
  cleanup();
  mockedUsePregnancies.mockReset();
  mockedUseCycles.mockReset();
  useHealthStore.setState({ mode: 'cycle' });
});

describe('Diet — pregnancy mode', () => {
  beforeEach(() => useHealthStore.setState({ mode: 'pregnancy' }));

  it('renders one card per meal slot', () => {
    setup(<Diet />);
    expect(screen.getByTestId('meal-card-breakfast')).toBeOnTheScreen();
    expect(screen.getByTestId('meal-card-lunch')).toBeOnTheScreen();
    expect(screen.getByTestId('meal-card-dinner')).toBeOnTheScreen();
    expect(screen.getByTestId('meal-card-snack')).toBeOnTheScreen();
  });

  it('defaults to the trimester of the active pregnancy', () => {
    mockPregnancies([
      { id: 'p1', status: 'active', current_week: 30, due_date: '2026-12-01' },
    ]);
    setup(<Diet />);
    // Third-trimester breakfast copy, chosen without the user touching the tabs.
    expect(screen.getByText(/Oats with chia/)).toBeOnTheScreen();
  });

  it('lets the user switch trimester by hand', async () => {
    const { user } = setup(<Diet />);

    await user.press(screen.getByTestId('trimester-selector-2'));

    expect(screen.getByText(/Chickpea and quinoa/)).toBeOnTheScreen();
  });
});

describe('Diet — cycle mode', () => {
  it('shows cycle phases instead of trimesters', () => {
    setup(<Diet />);
    expect(screen.getByTestId('phase-selector')).toBeOnTheScreen();
    expect(screen.queryByTestId('trimester-selector')).toBeNull();
  });

  it('opens on the phase of the current cycle day', () => {
    // Day 22 of a default 28-day cycle is past ovulation (day 14): luteal.
    mockCycles([{ id: 'c1', start_date: startedDaysAgo(21), end_date: null }]);
    setup(<Diet />);
    expect(screen.getByTestId('diet-current-phase')).toHaveTextContent(
      /Luteal/
    );
    expect(screen.getByText(/Porridge with banana/)).toBeOnTheScreen();
  });

  it('lets the user browse another phase', async () => {
    const { user } = setup(<Diet />);
    await user.press(screen.getByTestId('phase-selector-ovulation'));
    expect(screen.getByText(/Pumpkin seeds/)).toBeOnTheScreen();
  });
});
