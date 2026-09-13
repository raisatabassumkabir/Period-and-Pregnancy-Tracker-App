import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { Cycle, CycleInitWrite, ProblemDetail } from '../types';

export const useInitCycle = createMutation<
  Cycle,
  CycleInitWrite,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (variables) =>
    (await client.post<Cycle>('cycles/init/', variables)).data,
});
