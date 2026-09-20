import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { client } from '../common';
import type { ProblemDetail, Profile } from '../types';

export const useProfile = createQuery<
  Profile | null,
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: ['profile'],
  fetcher: async () => {
    const { data } = await client.get('profiles/');
    if (data && data.results && Array.isArray(data.results)) {
      return data.results[0] ?? null;
    }
    if (Array.isArray(data)) {
      return data[0] ?? null;
    }
    return data ?? null;
  },
});
