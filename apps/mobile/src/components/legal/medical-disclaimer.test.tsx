import React from 'react';

import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import { MedicalDisclaimerGate } from './medical-disclaimer';

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/lib/storage', () => ({
  ...jest.requireActual('@/lib/storage'),
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockedGetItem = getItem as jest.MockedFunction<typeof getItem>;
const mockedSetItem = setItem as jest.MockedFunction<typeof setItem>;

const AppContent = () => <></>;

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('MedicalDisclaimerGate', () => {
  it('blocks the app until the disclaimer is accepted, then remembers it', async () => {
    mockedGetItem.mockResolvedValue(null);
    mockedSetItem.mockResolvedValue();

    const { user } = setup(
      <MedicalDisclaimerGate>
        <AppContent />
      </MedicalDisclaimerGate>
    );

    expect(
      await screen.findByTestId('medical-disclaimer-gate')
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/Never use them as contraception/i)
    ).toBeOnTheScreen();
    expect(screen.getByText(/after an ultrasound/i)).toBeOnTheScreen();

    await user.press(screen.getByTestId('medical-disclaimer-accept'));

    await waitFor(() =>
      expect(screen.queryByTestId('medical-disclaimer-gate')).toBeNull()
    );
    expect(mockedSetItem).toHaveBeenCalledWith(
      STORAGE_KEYS.MEDICAL_DISCLAIMER_ACK,
      true
    );
  });

  it('renders the app directly once the disclaimer was accepted before', async () => {
    mockedGetItem.mockResolvedValue(true);

    setup(
      <MedicalDisclaimerGate>
        <AppContent />
      </MedicalDisclaimerGate>
    );

    await waitFor(() => expect(mockedGetItem).toHaveBeenCalled());
    expect(screen.queryByTestId('medical-disclaimer-gate')).toBeNull();
  });
});
