import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';

import { client } from '../common';
import type { PartnerInvite, ProblemDetail } from '../types';

export const OPEN_INVITE_KEY = ['partner-invites'] as const;

/**
 * Her open pairing code (0 or 1 rows), so the code, its expiry and the share
 * buttons stay on screen until it is used, cancelled or expires.
 */
const _useOpenInvites = createQuery<
  PartnerInvite[],
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: [...OPEN_INVITE_KEY],
  fetcher: async () =>
    (await client.get<PartnerInvite[]>('partner-invites/')).data,
});

export function useOpenInvite() {
  const token = useAuth((state) => state.token);
  const query = _useOpenInvites({ enabled: !!token });
  const invite = query.data?.[0] ?? null;
  // A redeemed invite has no code left; treat it as "no open invite".
  return { ...query, invite: invite?.code ? invite : null };
}
