import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import type { LogoutResponse, ProblemDetail } from '../types';

export const useLogout = createMutation<
  LogoutResponse,
  void,
  AxiosError<ProblemDetail>
>({
  mutationFn: async () => {
    // Django backend uses stateless JWTs without a blacklist endpoint currently.
    // So we just resolve immediately and let the local signOut() handle the rest.
    return { success: true } as unknown as LogoutResponse;
  },
});
