import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';
import { isDemoToken } from '@/lib/auth/demo-users';

import { client } from '../common';
import type { PartnerInvite, ProblemDetail } from '../types';

export const OPEN_INVITE_KEY = ['partner-invites'] as const;

const OFFLINE_INVITE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const OFFLINE_HOST = 'http://10.0.2.2:8000';

/**
 * An offline (server unreachable) session can't ask the API for a code, so it
 * makes a look-alike one on the phone. Only for previewing the screen: no one
 * can redeem it.
 */
export function generateUserInvite(name?: string): PartnerInvite {
  const firstName = (name?.trim() || 'User').split(' ')[0];
  const prefix = firstName.toUpperCase().slice(0, 4).padEnd(4, 'X');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const code = `HW-${prefix}-${suffix}`;
  return {
    id: `offline-invite-${code}`,
    code,
    url: `${OFFLINE_HOST}/p/${code}`,
    display_name: firstName,
    expires_at: new Date(
      Date.now() + OFFLINE_INVITE_DAYS * DAY_MS
    ).toISOString(),
    redeemed_at: null,
  };
}

/**
 * Her open pairing code (0 or 1 rows), so the code, its expiry and the share
 * buttons stay on screen until it is used, cancelled or expires.
 */
const _useOpenInvites = createQuery<
  PartnerInvite[],
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: OPEN_INVITE_KEY,
  fetcher: () =>
    client.get<PartnerInvite[]>('partner-invites/').then((r) => r.data),
});

export function useOpenInvite() {
  const token = useAuth((state) => state.token);
  const offline = isDemoToken(token?.access);
  const query = _useOpenInvites({ enabled: !!token && !offline });
  const invite = query.data?.[0] ?? null;
  return {
    ...query,
    // A redeemed invite has no code left; treat it as "no open invite".
    invite: invite?.code ? invite : null,
    // We know whether a code exists: the server answered, or (offline) there is
    // no server to ask and only what the create mutation cached counts.
    settled: offline || query.isSuccess,
  };
}
