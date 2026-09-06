import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { Cycle, CycleWrite, ProblemDetail } from '../types';

/** 409 `resource-conflict` when a cycle with the same `start_date` exists. */
export const useCreateCycle = createMutation<
  Cycle,
  CycleWrite,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (variables) =>
    (await client.post<Cycle>('cycles/', variables)).data,
});
