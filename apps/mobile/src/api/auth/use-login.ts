import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { LoginRequest, LoginResponse, ProblemDetail } from '../types';

export const useLogin = createMutation<
  LoginResponse,
  LoginRequest,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (variables) => {
    const response = await client.post('login', variables);
    return response.data;
  },
});
