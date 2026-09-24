import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';

import { client } from '../common';
import type { ProblemDetail, UserResponse } from '../types';

const _useMe = createQuery<UserResponse, void, AxiosError<ProblemDetail>>({
  queryKey: ['me'],
  fetcher: async () => {
    const response = await client.get('me');
    return response.data;
  },
});

export const useMe = (options?: Parameters<typeof _useMe>[0]) => {
  const token = useAuth((state) => state.token);
  return _useMe({
    ...options,
    enabled: !!token && (options?.enabled ?? true),
  } as any);
};
