import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';
import { client } from '../common';
import type { Cycle, PaginateQuery, ProblemDetail } from '../types';

/** Newest first (`-start_date` server ordering); page size 50. */
const _useCycles = createQuery<
  PaginateQuery<Cycle>,
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: ['cycles'],
  fetcher: async () => (await client.get<PaginateQuery<Cycle>>('cycles/')).data,
});

export const useCycles = (
  options?: Parameters<typeof _useCycles>[0]
) => {
  const token = useAuth((state) => state.token);
  return _useCycles({
    ...options,
    enabled: !!token && (options?.enabled ?? true),
  } as any);
};
