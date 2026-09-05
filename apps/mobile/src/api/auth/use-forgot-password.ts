import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ProblemDetail,
} from '../types';

export const useForgotPassword = createMutation<
  ForgotPasswordResponse,
  ForgotPasswordRequest,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (variables) => {
    const response = await client.post('forgot-password', variables);
    return response.data;
  },
});
