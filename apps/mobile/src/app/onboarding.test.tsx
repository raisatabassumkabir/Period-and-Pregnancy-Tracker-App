import React from 'react';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import Onboarding from './onboarding';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// SystemBars schedules native status-bar work that outlives the jest environment.
jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

afterEach(() => {
  cleanup();
  mockReplace.mockReset();
});

describe('Onboarding', () => {
  it('walks welcome → mode selection → login', async () => {
    const { user } = setup(<Onboarding />);

    expect(screen.getByTestId('onboarding-continue')).toBeOnTheScreen();
    await user.press(screen.getByTestId('onboarding-continue'));

    expect(screen.getByTestId('mode-cycle_tracking')).toBeOnTheScreen();
    await user.press(screen.getByTestId('mode-pregnancy'));

    await user.press(screen.getByTestId('onboarding-login'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
  });

  it('skip clears the first-time flag and heads into the app shell', async () => {
    const { user } = setup(<Onboarding />);

    await user.press(screen.getByTestId('onboarding-continue'));
    await user.press(screen.getByTestId('onboarding-skip'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  });
});
