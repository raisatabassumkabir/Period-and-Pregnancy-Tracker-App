import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { client } from '../common';
import type { ProblemDetail, SubscriptionStatusResponse } from '../types';

export const usePaymentSubscriptionStatus = createQuery<
  SubscriptionStatusResponse,
  void,
  AxiosError<ProblemDetail>
>({
  queryKey: ['payments', 'subscription-status'],
  fetcher: async () => {
    const response = await client.get('payments/subscription-status/');
    return response.data;
  },
});
