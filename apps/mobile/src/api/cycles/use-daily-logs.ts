import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';

import { client } from '../common';
import type { DailyLog, PaginateQuery, ProblemDetail } from '../types';

/** Newest first (`-date` server ordering); one log per calendar day. */
const _useDailyLogs = createQuery<
  PaginateQuery<DailyLog>,
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: ['daily-logs'],
  fetcher: async () =>
    (await client.get<PaginateQuery<DailyLog>>('daily-logs/')).data,
});

export const useDailyLogs = (options?: Parameters<typeof _useDailyLogs>[0]) => {
  const token = useAuth((state) => state.token);
  return _useDailyLogs({
    ...options,
    enabled: !!token && (options?.enabled ?? true),
  } as any);
};
