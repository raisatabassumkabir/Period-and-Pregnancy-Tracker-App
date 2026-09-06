import React from 'react';

import { cleanup, screen, setup } from '@/lib/test-utils';
import { useTodayLog } from '@/lib/tracking';

import Tracking from './tracking';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => false }),
}));

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

jest.mock('@/lib/tracking', () => ({
  // Keep the real constants (e.g. DISCHARGE_OPTIONS) — only the hooks are faked.
  ...jest.requireActual('@/lib/tracking'),
  useTodayLog: jest.fn(),
  useKickCounter: () => ({
    count: 3,
    increment: jest.fn(),
    reset: jest.fn(),
    isReady: true,
  }),
}));

const mockedUseTodayLog = useTodayLog as jest.MockedFunction<
  typeof useTodayLog
>;

const save = jest.fn();
const toggleSymptom = jest.fn();
const setFlow = jest.fn();
const setDischarge = jest.fn();

const mockLog = (overrides: Partial<ReturnType<typeof useTodayLog>> = {}) => {
  mockedUseTodayLog.mockReturnValue({
    draft: {
      flow: 'none',
      mood: 'unspecified',
      symptoms: [],
      notes: '',
      discharge: 'unspecified',
    },
    setFlow,
    setMood: jest.fn(),
    setDischarge,
    toggleSymptom,
    save,
    isSaving: false,
    isLoading: false,
    hasExistingLog: false,
    saveError: undefined,
    ...overrides,
  } as never);
};

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('Tracking', () => {
  it('renders the symptom, mood, flow and discharge sections', () => {
    mockLog();
    setup(<Tracking />);
    expect(screen.getByTestId('symptom-picker')).toBeOnTheScreen();
    expect(screen.getByTestId('mood-selector')).toBeOnTheScreen();
    expect(screen.getByTestId('flow-selector')).toBeOnTheScreen();
    expect(screen.getByTestId('discharge-selector')).toBeOnTheScreen();
  });

  it('selects a flow pill and a discharge pill', async () => {
    mockLog();
    const { user } = setup(<Tracking />);

    await user.press(screen.getByTestId('flow-selector-heavy'));
    expect(setFlow).toHaveBeenCalledWith('heavy');

    await user.press(screen.getByTestId('discharge-selector-creamy'));
    expect(setDischarge).toHaveBeenCalledWith('creamy');
  });

  it('saves the log when the button is pressed', async () => {
    mockLog();
    save.mockResolvedValue({ id: 'log-1' });
    const { user } = setup(<Tracking />);

    await user.press(screen.getByTestId('save-daily-log'));

    expect(save).toHaveBeenCalled();
  });

  it('toggles a symptom chip', async () => {
    mockLog();
    const { user } = setup(<Tracking />);

    await user.press(screen.getByTestId('symptom-cramps'));

    expect(toggleSymptom).toHaveBeenCalledWith('cramps');
  });

  it('surfaces the problem detail when saving fails', () => {
    mockLog({ saveError: 'A log for this date already exists.' });
    setup(<Tracking />);
    expect(
      screen.getByText('A log for this date already exists.')
    ).toBeOnTheScreen();
  });

  it('shows the on-device kick count', () => {
    mockLog();
    setup(<Tracking />);
    expect(screen.getByTestId('kick-count')).toHaveTextContent('3');
  });
});
