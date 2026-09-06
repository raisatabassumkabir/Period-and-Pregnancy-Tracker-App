import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { client } from '../common';
import type { Cycle, PaginateQuery, ProblemDetail } from '../types';

/** Newest first (`-start_date` server ordering); page size 50. */
export const useCycles = createQuery<
  PaginateQuery<Cycle>,
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: ['cycles'],
  fetcher: async () => (await client.get<PaginateQuery<Cycle>>('cycles/')).data,
});
