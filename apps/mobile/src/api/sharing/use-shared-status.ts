import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';
import { isDemoToken } from '@/lib/auth/demo-users';

import { client } from '../common';
import type { ProblemDetail, SharedStatus } from '../types';

export const SHARED_STATUS_KEY = ['shared-statuses'] as const;

export const DEMO_SHARED_STATUS: SharedStatus = {
  owner_name: 'Claire',
  mode: 'cycle_tracking',
  cycle_length: 28,
  period_length: 5,
  last_period_start: '2026-10-25',
  next_period_date: '2026-11-22',
  ovulation_date: '2026-11-08',
  pregnancy_due_date: null,
  updated_at: '2026-11-01T12:00:00Z',
};

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
  const isDemo = isDemoToken(token?.access);
  const query = _useSharedStatuses({
    // Her new period should reach the partner as soon as they look.
    refetchOnWindowFocus: true,
    enabled: !!token && !isDemo && (options.enabled ?? true),
  });
  return {
    ...query,
    data: query.data ?? (isDemo ? [DEMO_SHARED_STATUS] : undefined),
  };
}
