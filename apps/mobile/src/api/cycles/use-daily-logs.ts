import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { client } from '../common';
import type { DailyLog, PaginateQuery, ProblemDetail } from '../types';

/** Newest first (`-date` server ordering); one log per calendar day. */
export const useDailyLogs = createQuery<
  PaginateQuery<DailyLog>,
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: ['daily-logs'],
  fetcher: async () =>
    (await client.get<PaginateQuery<DailyLog>>('daily-logs/')).data,
});
