import React from 'react';

import {
  useCancelPartnerInvite,
  useCreatePartnerInvite,
  useOpenInvite,
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
  useCancelPartnerInvite: jest.fn(),
  useOpenInvite: jest.fn(),
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

const OPEN_INVITE = {
  id: 'i1',
  code: 'HW-7K3M-Q9XA',
  url: 'http://10.0.2.2:8000/p/HW-7K3M-Q9XA',
  display_name: 'Raisa',
  expires_at: '2026-11-09T00:00:00Z',
  redeemed_at: null,
};

function givenInvite(invite: typeof OPEN_INVITE | null) {
  const idle = { mutate: jest.fn(), isPending: false, error: null };
  mocked(useCreatePartnerInvite).mockReturnValue(idle);
  mocked(useCancelPartnerInvite).mockReturnValue(idle);
  mocked(useOpenInvite).mockReturnValue({ invite });
  return idle;
}

describe('InviteCard', () => {
  it('asks for her name and creates a code when she has none', async () => {
    const { mutate } = givenInvite(null);
    const { user } = setup(<InviteCard />);
    await user.type(screen.getByTestId('partner-invite-name'), 'Raisa');
    await user.press(screen.getByTestId('partner-invite-create'));
    expect(mutate).toHaveBeenCalledWith({ display_name: 'Raisa' });
  });

  it('keeps showing her open code and link with copy and share buttons', () => {
    givenInvite(OPEN_INVITE);
    setup(<InviteCard />);
    expect(screen.getByTestId('partner-invite-code')).toHaveTextContent(
      'HW-7K3M-Q9XA'
    );
    expect(screen.getByTestId('partner-invite-url')).toHaveTextContent(
      OPEN_INVITE.url
    );
    ['whatsapp', 'copy', 'share', 'new-code', 'cancel'].forEach((id) =>
      expect(screen.getByTestId(`partner-invite-${id}`)).toBeOnTheScreen()
    );
  });

  it('says when the server cannot be reached', () => {
    const idle = givenInvite(null);
    mocked(useCreatePartnerInvite).mockReturnValue({
      ...idle,
      error: { message: 'Network Error' },
    });
    setup(<InviteCard />);
    expect(screen.getByText(/Can't reach Happy Women/)).toBeOnTheScreen();
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

  it('takes the code out of a pasted link and redeems only the code', async () => {
    const mutate = jest.fn();
    mocked(useRedeemPartnerCode).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    });
    const { user } = setup(<JoinCard />);
    await user.type(
      screen.getByTestId('partner-join-code'),
      'http://10.0.2.2:8000/p/HW-7K3M-Q9XA'
    );
    expect(screen.getByTestId('partner-join-found')).toHaveTextContent(
      /HW-7K3M-Q9XA/
    );
    await user.press(screen.getByTestId('partner-join-submit'));
    expect(mutate).toHaveBeenCalledWith({
      code: 'HW-7K3M-Q9XA',
      display_name: '',
    });
  });

  it('explains when the pasted text has no code', async () => {
    mocked(useRedeemPartnerCode).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      error: null,
    });
    const { user } = setup(<JoinCard />);
    await user.type(screen.getByTestId('partner-join-code'), 'hello');
    expect(screen.getByText(/no partner code in that text/)).toBeOnTheScreen();
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
  it('asks a partner account that is not linked yet to link, not for a period', () => {
    mocked(usePartnerLinks).mockReturnValue({ data: [] });
    mocked(usePartnerLink).mockReturnValue(null);
    mocked(useSharedStatuses).mockReturnValue({ data: [] });
    setup(<PartnerHome />);
    expect(screen.getByTestId('partner-not-linked')).toBeOnTheScreen();
    expect(screen.queryByTestId('partner-status-card')).toBeNull();
  });

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
