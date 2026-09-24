import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { useAuth } from '@/lib/auth';

import { client } from '../common';
import type { ProblemDetail, SubscriptionStatusResponse } from '../types';

const _usePaymentSubscriptionStatus = createQuery<
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

export const usePaymentSubscriptionStatus = (
  options?: Parameters<typeof _usePaymentSubscriptionStatus>[0]
) => {
  const token = useAuth((state) => state.token);
  return _usePaymentSubscriptionStatus({
    ...options,
    enabled: !!token && (options?.enabled ?? true),
  } as any);
};
