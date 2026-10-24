import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type {
  PasswordResetRequest,
  PasswordResetResponse,
  ProblemDetail,
} from '../types';

export const PASSWORD_RESETS_PATH = 'auth/password-resets/';

interface Variables extends PasswordResetRequest {
  /** One per user tap, so a retried request never sends a second email. */
  idempotencyKey: string;
}

export const useForgotPassword = createMutation<
  PasswordResetResponse,
  Variables,
  AxiosError<ProblemDetail>
>({
  mutationFn: async ({ email, idempotencyKey }) => {
    const response = await client.post<PasswordResetResponse>(
      PASSWORD_RESETS_PATH,
      { email },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return response.data;
  },
});
