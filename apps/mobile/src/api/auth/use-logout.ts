import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { LogoutResponse, ProblemDetail } from '../types';

export const useLogout = createMutation<
  LogoutResponse,
  void,
  AxiosError<ProblemDetail>
>({
  mutationFn: async () => {
    const response = await client.post('logout');
    return response.data;
  },
});
