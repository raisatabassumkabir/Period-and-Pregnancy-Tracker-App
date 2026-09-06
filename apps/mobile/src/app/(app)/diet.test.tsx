import React from 'react';

import { usePregnancies } from '@/api/pregnancy';
import { cleanup, screen, setup } from '@/lib/test-utils';

import Diet from './diet';

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/api/pregnancy', () => ({
  usePregnancies: jest.fn(),
  activePregnancy: (page: { results: { status: string }[] } | undefined) =>
    page?.results.find((row) => row.status === 'active'),
}));

const mockedUsePregnancies = usePregnancies as jest.MockedFunction<
  typeof usePregnancies
>;

const mockPregnancies = (results: unknown[] = []) => {
  mockedUsePregnancies.mockReturnValue({ data: { results } } as never);
};

afterEach(() => {
  cleanup();
  mockedUsePregnancies.mockReset();
});

describe('Diet', () => {
  it('renders one card per meal slot', () => {
    mockPregnancies();
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
    mockPregnancies();
    const { user } = setup(<Diet />);

    await user.press(screen.getByTestId('trimester-selector-2'));

    expect(screen.getByText(/Chickpea and quinoa/)).toBeOnTheScreen();
  });
});
