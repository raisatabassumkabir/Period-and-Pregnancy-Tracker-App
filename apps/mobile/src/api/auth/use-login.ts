import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { LoginRequest, ProblemDetail, TokenPairResponse } from '../types';

export const useLogin = createMutation<
  TokenPairResponse,
  LoginRequest,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (variables) => {
    const response = await client.post<TokenPairResponse>(
      'auth/token/',
      variables
    );
    return response.data;
  },
});
