import React from 'react';

import {
  useCreatePartnerInvite,
  usePartnerLink,
  usePartnerLinks,
  useRedeemPartnerCode,
  useSharedStatuses,
} from '@/api/sharing';
import type { PartnerLink, SharedStatus } from '@/api/types';
import { toDateString } from '@/lib/health/dates';
import { usePendingPartnerCode } from '@/lib/partner';
import { cleanup, screen, setup } from '@/lib/test-utils';

import { InviteCard } from './invite-card';
import { JoinCard } from './join-card';
import { PartnerHome } from './partner-home';

jest.mock('@/api/sharing', () => ({
  useCreatePartnerInvite: jest.fn(),
  useRedeemPartnerCode: jest.fn(),
  usePartnerLinks: jest.fn(),
  usePartnerLink: jest.fn(),
  useSharedStatuses: jest.fn(),
  useUpdatePartnerLink: jest.fn(() => ({ mutate: jest.fn() })),
  useUnlinkPartner: jest.fn(() => ({ mutate: jest.fn() })),
}));

const mocked = <T,>(fn: T) => fn as unknown as jest.Mock;

const PARTNER_LINK: PartnerLink = {
  id: 'l1',
  role: 'partner',
  other_name: 'Raisa',
  share_fertile_window: true,
  share_pregnancy: true,
  created_at: '2026-11-01T00:00:00Z',
};

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateString(date);
}

function status(overrides: Partial<SharedStatus> = {}): SharedStatus {
  return {
    owner_name: 'Raisa',
    mode: 'trying_to_conceive',
    cycle_length: 28,
    period_length: 5,
    last_period_start: daysAgo(1),
    next_period_date: null,
    ovulation_date: '2026-11-03',
    pregnancy_due_date: null,
    updated_at: '2026-11-01T00:00:00Z',
    ...overrides,
  };
}

function givenPartnerOf(shared: SharedStatus) {
  mocked(usePartnerLinks).mockReturnValue({ data: [PARTNER_LINK] });
  mocked(usePartnerLink).mockReturnValue(PARTNER_LINK);
  mocked(useSharedStatuses).mockReturnValue({ data: [shared] });
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  usePendingPartnerCode.setState({ code: null, hydrated: true });
});

describe('InviteCard', () => {
  it('shows the code and share buttons once the invite exists', () => {
    mocked(useCreatePartnerInvite).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      data: {
        id: 'i1',
        code: 'HW-7K3M-Q9XA',
        url: 'https://api.example/p/HW-7K3M-Q9XA',
        display_name: 'Raisa',
        expires_at: '2026-11-09T00:00:00Z',
        redeemed_at: null,
      },
    });
    setup(<InviteCard />);
    expect(screen.getByTestId('partner-invite-code')).toHaveTextContent(
      'HW-7K3M-Q9XA'
    );
    expect(screen.getByTestId('partner-invite-whatsapp')).toBeOnTheScreen();
    expect(screen.getByTestId('partner-invite-share')).toBeOnTheScreen();
  });
});

describe('JoinCard', () => {
  it('pre-fills a code from an invite link', () => {
    usePendingPartnerCode.setState({ code: 'HW-7K3M-Q9XA', hydrated: true });
    mocked(useRedeemPartnerCode).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      error: null,
    });
    setup(<JoinCard />);
    expect(screen.getByTestId('partner-join-code')).toHaveProp(
      'value',
      'HW-7K3M-Q9XA'
    );
  });

  it.each([
    [404, /invalid or has expired/],
    [409, /already linked/],
    [422, /your own code/],
    [429, /Too many tries/],
  ])('explains a %s by status, not by server wording', (status, copy) => {
    mocked(useRedeemPartnerCode).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      error: { response: { status, data: { detail: 'server words' } } },
    });
    setup(<JoinCard />);
    expect(screen.getByText(copy)).toBeOnTheScreen();
  });
});

describe('PartnerHome', () => {
  it('shows her name, period day, a support idea and the partner guide', () => {
    givenPartnerOf(status());
    setup(<PartnerHome />);
    expect(screen.getByText('Raisa')).toBeOnTheScreen();
    expect(screen.getByTestId('partner-status-headline')).toHaveTextContent(
      /On her period · day 2/
    );
    expect(screen.getByTestId('partner-support-idea')).toBeOnTheScreen();
    expect(screen.getByText('How she may feel')).toBeOnTheScreen();
  });

  it('shows the conceive card only when she shares her fertile window', () => {
    givenPartnerOf(status());
    setup(<PartnerHome />);
    expect(screen.getByTestId('partner-conceive-card')).toBeOnTheScreen();
    cleanup();

    givenPartnerOf(status({ ovulation_date: null }));
    setup(<PartnerHome />);
    expect(screen.queryByTestId('partner-conceive-card')).toBeNull();
  });

  it('respects a private status', () => {
    givenPartnerOf(status({ mode: 'private' }));
    setup(<PartnerHome />);
    expect(screen.getByTestId('partner-status-headline')).toHaveTextContent(
      /keeping her current status private/
    );
    expect(screen.queryByTestId('partner-support-card')).toBeNull();
  });
});
