import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { client } from '../common';
import type { ProblemDetail, UserResponse } from '../types';

export const useMe = createQuery<UserResponse, void, AxiosError<ProblemDetail>>(
  {
    queryKey: ['me'],
    fetcher: async () => {
      const response = await client.get('me');
      return response.data;
    },
  }
);
