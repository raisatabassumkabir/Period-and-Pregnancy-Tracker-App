import React from 'react';

import { useCycles } from '@/api/cycles';
import { useAuth } from '@/lib';
import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import Onboarding from './onboarding';

const mockReplace = jest.fn();
const mockMutateAsync = jest.fn().mockResolvedValue({});
const mockInitMutateAsync = jest.fn().mockResolvedValue({ id: 'new-c1' });

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/api/users', () => ({
  useSaveProfile: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

jest.mock('@/api/cycles', () => ({
  useCycles: jest.fn(),
  useInitCycle: () => ({
    mutateAsync: mockInitMutateAsync,
    isPending: false,
  }),
}));

// SystemBars schedules native status-bar work that outlives the jest environment.
jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

const mockedUseCycles = useCycles as jest.MockedFunction<typeof useCycles>;

beforeEach(() => {
  useAuth.setState({
    status: 'signIn',
    token: { access: 'tok', refresh: 'ref' },
  });
  mockedUseCycles.mockReturnValue({
    data: { results: [{ id: 'c1', start_date: '2026-09-01' }], count: 1 },
    isError: false,
    isLoading: false,
  } as never);
});

afterEach(() => {
  cleanup();
  mockReplace.mockReset();
  mockMutateAsync.mockClear();
  mockInitMutateAsync.mockClear();
});

describe('Onboarding (6-Step Flow)', () => {
  it('walks step-by-step through the full 6-step onboarding sequence and posts profile', async () => {
    const { user } = setup(<Onboarding />);

    // Step 1: App Intent
    expect(
      screen.getByText('Are you using Happy Women for yourself?')
    ).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-next')).toBeDisabled();

    // Select "Yes, for myself"
    await user.press(screen.getByTestId('intent-myself'));
    expect(screen.getByTestId('onboarding-next')).not.toBeDisabled();
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 2: Goal Selection Grid
    await waitFor(() => {
      expect(
        screen.getByText('What brings you to Happy Women?')
      ).toBeOnTheScreen();
    });
    expect(screen.getByTestId('goal-get_pregnant')).toBeOnTheScreen();
    expect(screen.getByTestId('goal-track_pregnancy')).toBeOnTheScreen();
    expect(screen.getByTestId('goal-track_period')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-next')).toBeDisabled();

    // Select a goal
    await user.press(screen.getByTestId('goal-track_period'));
    expect(screen.getByTestId('onboarding-next')).not.toBeDisabled();
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 3: Medical Profile Checklist
    await waitFor(() => {
      expect(
        screen.getByText('Do you have any of these health conditions?')
      ).toBeOnTheScreen();
    });
    expect(screen.getByTestId('condition-pcos')).toBeOnTheScreen();
    expect(screen.getByTestId('condition-none')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-next')).toBeDisabled();

    // Select "None"
    await user.press(screen.getByTestId('condition-none'));
    expect(screen.getByTestId('onboarding-next')).not.toBeDisabled();
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 4: Acquisition
    await waitFor(() => {
      expect(
        screen.getByText('How did you find out about us?')
      ).toBeOnTheScreen();
    });
    expect(screen.getByTestId('onboarding-next')).toBeDisabled();

    // Select an acquisition channel
    await user.press(screen.getByTestId('acquisition-friends-or-family'));
    expect(screen.getByTestId('onboarding-next')).not.toBeDisabled();
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 5: Cycle Baseline
    await waitFor(() => {
      expect(screen.getByText('Tell us about your cycle')).toBeOnTheScreen();
    });
    expect(screen.getByTestId('cycle-length-inc')).toBeOnTheScreen();
    expect(screen.getByTestId('period-duration-inc')).toBeOnTheScreen();
    // Default baseline values are valid (28 and 5)
    expect(screen.getByTestId('onboarding-next')).not.toBeDisabled();

    // Increment cycle length
    await user.press(screen.getByTestId('cycle-length-inc'));
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 6: Body Metrics
    await waitFor(() => {
      expect(
        screen.getByText('Help us personalize your nutrition')
      ).toBeOnTheScreen();
    });
    expect(screen.getByTestId('unit-metric')).toBeOnTheScreen();
    expect(screen.getByTestId('unit-imperial')).toBeOnTheScreen();
    expect(screen.getByTestId('height-input-metric')).toBeOnTheScreen();
    expect(screen.getByTestId('weight-input-metric')).toBeOnTheScreen();

    // Complete setup
    expect(screen.getByTestId('onboarding-next')).toHaveTextContent(
      'Complete & Start'
    );
    await user.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(app)'));
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        average_cycle_length: 29,
        average_period_duration: 5,
        height: 165,
        weight: 60,
      })
    );
  });

  it('redirects to InitializeCycle modal when no cycle exists on step 6 completion, then routes to Home on confirmation', async () => {
    mockedUseCycles.mockReturnValue({
      data: { results: [], count: 0 },
      isError: false,
      isLoading: false,
    } as never);

    const { user } = setup(<Onboarding />);

    // Step 1: App Intent
    await user.press(screen.getByTestId('intent-myself'));
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 2: Goal
    expect(await screen.findByTestId('goal-track_period')).toBeOnTheScreen();
    await user.press(screen.getByTestId('goal-track_period'));
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 3: Conditions
    expect(await screen.findByTestId('condition-none')).toBeOnTheScreen();
    await user.press(screen.getByTestId('condition-none'));
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 4: Acquisition
    expect(
      await screen.findByTestId('acquisition-friends-or-family')
    ).toBeOnTheScreen();
    await user.press(screen.getByTestId('acquisition-friends-or-family'));
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 5: Cycle baseline
    expect(await screen.findByTestId('cycle-length-inc')).toBeOnTheScreen();
    await user.press(screen.getByTestId('onboarding-next'));

    // Step 6: Body metrics
    expect(await screen.findByTestId('height-input-metric')).toBeOnTheScreen();
    await user.press(screen.getByTestId('onboarding-next'));

    // Verify InitializeCycleModal is shown
    await waitFor(() => {
      expect(screen.getByTestId('initialize-cycle-modal')).toBeOnTheScreen();
    });

    // Confirm in modal
    await user.press(screen.getByTestId('init-cycle-confirm-button'));

    // Only after confirmation routes to Home
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(app)'));
    expect(mockInitMutateAsync).toHaveBeenCalled();
  });

  it('allows skipping directly into the app shell at any step', async () => {
    const { user } = setup(<Onboarding />);

    expect(screen.getByTestId('onboarding-skip')).toBeOnTheScreen();
    await user.press(screen.getByTestId('onboarding-skip'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(app)'));
  });

  it('supports partner code entry on step 1', async () => {
    const { user } = setup(<Onboarding />);

    await user.press(screen.getByTestId('intent-partner'));
    expect(screen.getByTestId('partner-code-input')).toBeOnTheScreen();
    await user.type(screen.getByTestId('partner-code-input'), 'HW-9988');

    expect(screen.getByTestId('onboarding-next')).not.toBeDisabled();
  });
});
