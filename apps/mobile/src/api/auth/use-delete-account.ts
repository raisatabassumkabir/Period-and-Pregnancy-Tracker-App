import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { ProblemDetail } from '../types';

const DELETE_ACCOUNT_PATH = 'me';

/** Permanently deletes the signed-in account (Google Play account-deletion policy). */
export const useDeleteAccount = createMutation<
  void,
  void,
  AxiosError<ProblemDetail>
>({
  mutationFn: async () => {
    await client.delete(DELETE_ACCOUNT_PATH);
  },
});
