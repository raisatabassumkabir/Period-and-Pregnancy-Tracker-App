import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { client } from '../common';
import type { PaginateQuery, Pregnancy, ProblemDetail } from '../types';

export const usePregnancies = createQuery<
  PaginateQuery<Pregnancy>,
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: ['pregnancies'],
  fetcher: async () =>
    (await client.get<PaginateQuery<Pregnancy>>('pregnancies/')).data,
});

/** The server enforces at most one `active` pregnancy per user (409 on a second). */
export const activePregnancy = (
  page: PaginateQuery<Pregnancy> | undefined
): Pregnancy | undefined =>
  page?.results.find((pregnancy) => pregnancy.status === 'active');
