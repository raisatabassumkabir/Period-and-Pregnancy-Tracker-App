import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';
import { client } from '../common';
import type { PaginateQuery, Pregnancy, ProblemDetail } from '../types';

const _usePregnancies = createQuery<
  PaginateQuery<Pregnancy>,
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: ['pregnancies'],
  fetcher: async () =>
    (await client.get<PaginateQuery<Pregnancy>>('pregnancies/')).data,
});

export const usePregnancies = (
  options?: Parameters<typeof _usePregnancies>[0]
) => {
  const token = useAuth((state) => state.token);
  return _usePregnancies({
    ...options,
    enabled: !!token && (options?.enabled ?? true),
  } as any);
};


/** The server enforces at most one `active` pregnancy per user (409 on a second). */
export const activePregnancy = (
  page: PaginateQuery<Pregnancy> | undefined
): Pregnancy | undefined =>
  page?.results.find((pregnancy) => pregnancy.status === 'active');
