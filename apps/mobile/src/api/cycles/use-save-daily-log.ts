import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { DailyLog, DailyLogWrite, ProblemDetail } from '../types';

export interface SaveDailyLogVariables extends DailyLogWrite {
  /** Present = PATCH the existing log; absent = POST a new one. The server
   * enforces one log per day with a 409, so callers pass the id when today's
   * log already exists. */
  id?: string;
}

export const useSaveDailyLog = createMutation<
  DailyLog,
  SaveDailyLogVariables,
  AxiosError<ProblemDetail>
>({
  mutationFn: async ({ id, ...write }) =>
    id === undefined
      ? (await client.post<DailyLog>('daily-logs/', write)).data
      : (await client.patch<DailyLog>(`daily-logs/${id}/`, write)).data,
});
