import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { ProblemDetail, Profile, ProfileWrite } from '../types';

export interface SaveProfileVariables extends ProfileWrite {
  id?: string;
}

export const useSaveProfile = createMutation<
  Profile,
  SaveProfileVariables,
  AxiosError<ProblemDetail>
>({
  mutationFn: async ({ id, ...write }) =>
    id === undefined
      ? (await client.post<Profile>('profiles/', write)).data
      : (await client.patch<Profile>(`profiles/${id}/`, write)).data,
});
