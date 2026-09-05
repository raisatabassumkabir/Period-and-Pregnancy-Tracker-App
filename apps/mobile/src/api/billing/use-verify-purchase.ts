import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { ProblemDetail } from '../types';
import type { VerifyPurchaseRequest, VerifyPurchaseResponse } from './types';

export const useVerifyPurchase = createMutation<
  VerifyPurchaseResponse,
  VerifyPurchaseRequest,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (variables) => {
    const response = await client.post(
      'payments/google-play/verify-purchase/',
      variables
    );
    return response.data;
  },
});
