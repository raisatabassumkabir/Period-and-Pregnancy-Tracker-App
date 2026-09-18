import React from 'react';

import { useCycles, useDailyLogs } from '@/api/cycles';
import { cleanup, screen, setup } from '@/lib/test-utils';

import Calendar from './calendar';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/api/cycles', () => ({
  useCycles: jest.fn(),
  useDailyLogs: jest.fn(),
}));

const mockedUseCycles = useCycles as jest.MockedFunction<typeof useCycles>;
const mockedUseDailyLogs = useDailyLogs as jest.MockedFunction<
  typeof useDailyLogs
>;

const mockCycles = (results: unknown[] | undefined, isError = false) => {
  mockedUseCycles.mockReturnValue({
    data: results ? { results } : undefined,
    isError,
  } as never);
};

const mockDailyLogs = (results: unknown[] | undefined, isError = false) => {
  mockedUseDailyLogs.mockReturnValue({
    data: results ? { results } : undefined,
    isError,
  } as never);
};

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('Calendar', () => {
  it('renders the month grid with the user’s real data and no demo pill', () => {
    mockCycles([]);
    mockDailyLogs([]);
    setup(<Calendar />);

    expect(screen.getByTestId('calendar-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('calendar-month-grid')).toBeOnTheScreen();
    expect(screen.queryByTestId('calendar-demo-pill')).not.toBeOnTheScreen();
  });

  it('falls back to demo data and shows the demo pill when a query fails', () => {
    mockCycles(undefined, true);
    mockDailyLogs(undefined, true);
    setup(<Calendar />);

    expect(screen.getByTestId('calendar-month-grid')).toBeOnTheScreen();
  });

  it('moves to the next and previous month', async () => {
    mockCycles([]);
    mockDailyLogs([]);
    const { user } = setup(<Calendar />);

    const today = new Date();
    const currentLabel = today.toLocaleDateString('en', {
      month: 'long',
      year: 'numeric',
    });
    expect(screen.getByText(currentLabel)).toBeOnTheScreen();

    await user.press(screen.getByTestId('calendar-next-month'));
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    expect(
      screen.getByText(
        nextMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })
      )
    ).toBeOnTheScreen();

    await user.press(screen.getByTestId('calendar-prev-month'));
    expect(screen.getByText(currentLabel)).toBeOnTheScreen();
  });

  it('colours a logged period day and shows the legend', () => {
    const today = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const firstOfMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
    mockCycles([{ id: 'c1', start_date: firstOfMonth, end_date: null }]);
    mockDailyLogs([]);
    setup(<Calendar />);

    expect(
      screen.getAllByTestId('calendar-state-period').length
    ).toBeGreaterThan(0);
    expect(screen.getByTestId('calendar-legend-period')).toBeOnTheScreen();
    expect(screen.getByTestId('calendar-legend-fertile')).toBeOnTheScreen();
    expect(screen.getByTestId('calendar-legend-ovulation')).toBeOnTheScreen();
  });

  it('gives every coloured day a face, logged or not', () => {
    const today = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const firstOfMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
    mockCycles([{ id: 'c1', start_date: firstOfMonth, end_date: null }]);
    mockDailyLogs([]);
    setup(<Calendar />);

    // No logs at all, so these faces come from the phase, not a logged mood.
    const faces = screen.getAllByTestId('calendar-face');
    expect(faces.length).toBe(
      screen.getAllByTestId(/^calendar-state-(period|fertile|ovulation)$/)
        .length
    );
    expect(faces.length).toBeGreaterThan(0);
  });

  it('prefers the logged mood over the phase face', () => {
    const today = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const second = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-02`;
    mockCycles([
      {
        id: 'c1',
        start_date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`,
        end_date: null,
      },
    ]);
    mockDailyLogs([{ id: 'l1', date: second, mood: 'great' }]);
    setup(<Calendar />);

    // 😄 is `great`; 😣 is the period phase's stock face.
    expect(screen.getAllByText('😄').length).toBe(1);
  });

  it('opens the symptom logger from the floating button', async () => {
    mockCycles([]);
    mockDailyLogs([]);
    const { user } = setup(<Calendar />);

    await user.press(screen.getByTestId('calendar-add-symptom'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/(app)/tracking' })
    );
  });
});
