import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { ProblemDetail } from '../types';
import type { SubscriptionStatusResponse } from './types';

export const useSubscriptionSync = createMutation<
  SubscriptionStatusResponse,
  void,
  AxiosError<ProblemDetail>
>({
  mutationFn: async () => {
    const response = await client.post('payments/subscription-sync/');
    return response.data;
  },
});
