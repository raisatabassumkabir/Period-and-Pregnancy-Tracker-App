import React from 'react';

import { useCycles } from '@/api/cycles';
import { useReminderSettings } from '@/lib/reminders';
import { DEFAULT_REMINDER_SETTINGS } from '@/lib/reminders/reminder-schedule';
import { cleanup, fireEvent, screen, setup } from '@/lib/test-utils';

import { RemindersSheet } from './reminders-sheet';

jest.mock('@/api/cycles', () => ({
  useCycles: jest.fn(),
}));

jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

const mockedUseCycles = useCycles as jest.MockedFunction<typeof useCycles>;

const startedDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

beforeEach(() => {
  useReminderSettings.setState({
    settings: DEFAULT_REMINDER_SETTINGS,
    hydrated: true,
  });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('RemindersSheet', () => {
  it('shows the predicted next period', () => {
    mockedUseCycles.mockReturnValue({
      data: { results: [{ id: 'c1', start_date: startedDaysAgo(2) }] },
      isError: false,
    } as never);
    setup(<RemindersSheet visible onClose={jest.fn()} />);

    expect(screen.getByTestId('reminders-next-period')).not.toHaveTextContent(
      'Not predicted yet'
    );
  });

  it('asks for a first period when nothing is predicted yet', () => {
    mockedUseCycles.mockReturnValue({
      data: { results: [] },
      isError: false,
    } as never);
    setup(<RemindersSheet visible onClose={jest.fn()} />);

    expect(screen.getByTestId('reminders-next-period')).toHaveTextContent(
      'Not predicted yet'
    );
  });

  it('turns reminders on and reveals the timing options', async () => {
    mockedUseCycles.mockReturnValue({
      data: { results: [{ id: 'c1', start_date: startedDaysAgo(2) }] },
      isError: false,
    } as never);
    setup(<RemindersSheet visible onClose={jest.fn()} />);
    expect(screen.queryByTestId('reminders-days')).toBeNull();

    // A Switch reports `valueChange`, not a press.
    fireEvent(screen.getByTestId('reminders-toggle'), 'valueChange', true);

    expect(await screen.findByTestId('reminders-days')).toBeOnTheScreen();
    expect(useReminderSettings.getState().settings.enabled).toBe(true);
    expect(screen.getByTestId('reminders-summary')).toHaveTextContent(
      /You'll be reminded on/
    );
  });
});
