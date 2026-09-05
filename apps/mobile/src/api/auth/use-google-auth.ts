import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type {
  GoogleAuthRequest,
  GoogleAuthResponse,
  ProblemDetail,
} from '../types';

export const useGoogleAuth = createMutation<
  GoogleAuthResponse,
  GoogleAuthRequest,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (variables) => {
    const response = await client.post('google', variables);
    return response.data;
  },
});
