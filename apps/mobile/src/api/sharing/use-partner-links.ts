import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';

import { client } from '../common';
import type { PartnerLink, ProblemDetail } from '../types';

export const PARTNER_LINKS_KEY = ['partner-links'] as const;

/** 0 or 1 link, from the requester's side (`role`: owner or partner). */
const _usePartnerLinks = createQuery<
  PartnerLink[],
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: [...PARTNER_LINKS_KEY],
  fetcher: async () => (await client.get<PartnerLink[]>('partner-links/')).data,
});

/** Only the options callers need; spreading the full generic type erases the data type. */
interface Options {
  enabled?: boolean;
  /** Poll while an invite is waiting, so her screen flips to "linked" by itself. */
  refetchInterval?: number | false;
}

export function usePartnerLinks(options: Options = {}) {
  const token = useAuth((state) => state.token);
  return _usePartnerLinks({
    enabled: !!token && (options.enabled ?? true),
    refetchInterval: options.refetchInterval ?? false,
  });
}

/** The current link, if any. */
export function usePartnerLink(): PartnerLink | null {
  return usePartnerLinks().data?.[0] ?? null;
}
