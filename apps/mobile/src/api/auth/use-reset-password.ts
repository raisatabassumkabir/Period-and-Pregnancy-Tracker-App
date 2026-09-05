import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { ProblemDetail, ResetPasswordRequest } from '../types';

interface ResetPasswordResponse {
  message: string;
}

export const useResetPassword = createMutation<
  ResetPasswordResponse,
  ResetPasswordRequest,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (variables) => {
    const response = await client.post('reset-password', variables);
    return response.data;
  },
});
