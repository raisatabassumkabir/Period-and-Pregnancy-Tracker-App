import React from 'react';

import {
  act,
  cleanup,
  render,
  screen,
  userEvent,
  waitFor,
} from '@/lib/test-utils';

import PartnerWelcome from './partner-welcome';

const mockReplace = jest.fn();
const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/lib/partner', () => ({
  usePartnerSide: () => ({
    link: { role: 'partner', other_name: 'Claire' },
    isPartner: true,
  }),
}));

jest.mock('@/lib/health', () => ({
  usePersonalizationProfile: () => ({
    profile: { fullName: 'Daniel Bennett' },
    updateProfile: mockUpdateProfile,
  }),
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.clearAllMocks();
});

/** The setup step ticks on timers, so user events must advance fake time. */
function renderWelcome() {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(<PartnerWelcome />);
  return { user };
}

const SETUP_LINES = 4; // three lines, then the "ready" pass
const SETUP_LINE_MS = 700;

describe('PartnerWelcome', () => {
  it('walks all six steps with her real name and saves his answers', async () => {
    const { user } = renderWelcome();
    const next = () => user.press(screen.getByTestId('partner-welcome-next'));

    expect(screen.getByText('You and Claire are paired!')).toBeOnTheScreen();
    expect(screen.queryByText(/Flo/)).toBeNull();
    await next();

    expect(screen.getByTestId('partner-welcome-next')).toBeDisabled();
    await user.press(screen.getByTestId('partner-goal-support_partner'));
    await next();

    expect(
      screen.getByText('Does Claire usually get any of these?')
    ).toBeOnTheScreen();
    await user.press(screen.getByTestId('partner-symptom-cramps'));
    await user.press(screen.getByTestId('partner-symptom-none'));
    await next();

    await user.press(screen.getByTestId('partner-fertile-no'));
    expect(screen.getByTestId('partner-fertile-explainer')).toBeOnTheScreen();
    await next();

    await user.press(screen.getByTestId('partner-intimacy-talk'));
    await next();

    expect(screen.getByTestId('step-partner-setup')).toBeOnTheScreen();
    expect(screen.getByTestId('partner-welcome-next')).toBeDisabled();
    // Each line ticks after the previous one renders, so step once per line.
    for (let line = 0; line < SETUP_LINES; line++) {
      act(() => {
        jest.advanceTimersByTime(SETUP_LINE_MS);
      });
    }
    expect(screen.getByTestId('partner-welcome-next')).not.toBeDisabled();
    await next();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(app)'));
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        appIntent: 'partner',
        partnerGoals: ['support_partner'],
        // "None of these" clears the other picks.
        partnerSymptoms: ['none'],
        partnerKnewFertileDays: false,
        partnerIntimacyGoals: ['talk'],
      }),
      { silent: true }
    );
  });

  it('lets the partner skip straight to their home', async () => {
    const { user } = renderWelcome();
    for (let step = 0; step < 6; step++) {
      await user.press(screen.getByTestId('onboarding-skip'));
    }
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(app)'));
  });
});
