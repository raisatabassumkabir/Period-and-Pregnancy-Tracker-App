import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';

import { client } from '../common';
import type { ProblemDetail, SharedStatus } from '../types';

export const SHARED_STATUS_KEY = ['shared-statuses'] as const;

/** The partner's view of her status: 0 or 1 rows. */
const _useSharedStatuses = createQuery<
  SharedStatus[],
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: [...SHARED_STATUS_KEY],
  fetcher: async () =>
    (await client.get<SharedStatus[]>('shared-statuses/')).data,
});

/** Only the options callers need; spreading the full generic type erases the data type. */
interface Options {
  enabled?: boolean;
}

export function useSharedStatuses(options: Options = {}) {
  const token = useAuth((state) => state.token);
  return _useSharedStatuses({
    // Her new period should reach the partner as soon as they look.
    refetchOnWindowFocus: true,
    enabled: !!token && (options.enabled ?? true),
  });
}
