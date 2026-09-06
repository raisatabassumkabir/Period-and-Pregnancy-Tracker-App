import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type {
  ProblemDetail,
  RegisterRequest,
  RegisterResponse,
} from '../types';

export const useRegister = createMutation<
  RegisterResponse,
  RegisterRequest,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (variables) => {
    const response = await client.post<RegisterResponse>(
      'auth/register/',
      variables
    );
    return response.data;
  },
});
