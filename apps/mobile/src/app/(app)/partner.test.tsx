import React from 'react';

import { usePendingPartnerCode } from '@/lib/partner';
import { cleanup, screen, setup } from '@/lib/test-utils';

import PartnerScreen from './partner';

let mockAppIntent: 'myself' | 'partner' = 'myself';
let mockProfileLoading = false;

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/components/ui/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('@/api/sharing', () => ({
  useOpenInvite: () => ({ invite: null, refetch: jest.fn() }),
  usePartnerLinks: () => ({ data: [], isLoading: false, refetch: jest.fn() }),
  // Not linked yet: no link, so no shared status to read.
  usePartnerLink: () => null,
  useSharedStatuses: () => ({ data: undefined }),
}));

// The two cards have their own tests; here only which one shows matters.
jest.mock('@/components/partner', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    InviteCard: () => <Text testID="partner-invite-card">invite</Text>,
    JoinCard: () => <Text testID="partner-join-card">join</Text>,
    LinkedCard: () => null,
  };
});

jest.mock('@/lib/health', () => ({
  usePersonalizationProfile: () => ({
    profile: { appIntent: mockAppIntent },
    isLoading: mockProfileLoading,
  }),
}));

beforeEach(() => {
  mockAppIntent = 'myself';
  mockProfileLoading = false;
  usePendingPartnerCode.setState({ code: null, hydrated: true });
});

afterEach(cleanup);

describe('Partner screen (not linked)', () => {
  it('shows her only her own code when she uses the app for herself', () => {
    setup(<PartnerScreen />);
    expect(screen.getByTestId('partner-invite-card')).toBeOnTheScreen();
    expect(screen.queryByTestId('partner-join-card')).toBeNull();
  });

  it('shows a partner only the code entry', () => {
    mockAppIntent = 'partner';
    setup(<PartnerScreen />);
    expect(screen.getByTestId('partner-join-card')).toBeOnTheScreen();
    expect(screen.queryByTestId('partner-invite-card')).toBeNull();
  });

  it('shows the code entry to anyone who opened an invite link', () => {
    usePendingPartnerCode.setState({ code: 'HW-7K3M-Q9XA', hydrated: true });
    setup(<PartnerScreen />);
    expect(screen.getByTestId('partner-join-card')).toBeOnTheScreen();
  });

  it('shows neither card until the saved answer has loaded', () => {
    // Otherwise a partner would briefly see (and auto-create) a code of their own.
    mockAppIntent = 'partner';
    mockProfileLoading = true;
    setup(<PartnerScreen />);
    expect(screen.queryByTestId('partner-invite-card')).toBeNull();
    expect(screen.queryByTestId('partner-join-card')).toBeNull();
  });
});
