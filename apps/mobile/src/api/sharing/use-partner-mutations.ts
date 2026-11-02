import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client, queryClient } from '../common';
import type {
  PartnerInviteCreate,
  PartnerInviteCreated,
  PartnerLink,
  PartnerLinkRedeem,
  PartnerLinkUpdate,
  ProblemDetail,
} from '../types';
import { PARTNER_LINKS_KEY } from './use-partner-links';
import { SHARED_STATUS_KEY } from './use-shared-status';

function refreshPartnerQueries() {
  void queryClient.invalidateQueries({ queryKey: [...PARTNER_LINKS_KEY] });
  void queryClient.invalidateQueries({ queryKey: [...SHARED_STATUS_KEY] });
}

/** She creates an invite; the plain code comes back only in this response. */
export const useCreatePartnerInvite = createMutation<
  PartnerInviteCreated,
  PartnerInviteCreate,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (body) =>
    (await client.post<PartnerInviteCreated>('partner-invites/', body)).data,
});

/** The partner redeems a code. 404 bad/expired, 409 already linked, 422 own code. */
export const useRedeemPartnerCode = createMutation<
  PartnerLink,
  PartnerLinkRedeem,
  AxiosError<ProblemDetail>
>({
  mutationFn: async (body) =>
    (await client.post<PartnerLink>('partner-links/', body)).data,
  onSuccess: refreshPartnerQueries,
});

export interface UpdatePartnerLinkVariables extends PartnerLinkUpdate {
  id: string;
}

export const useUpdatePartnerLink = createMutation<
  PartnerLink,
  UpdatePartnerLinkVariables,
  AxiosError<ProblemDetail>
>({
  mutationFn: async ({ id, ...body }) =>
    (await client.patch<PartnerLink>(`partner-links/${id}/`, body)).data,
  onSuccess: refreshPartnerQueries,
});

export const useUnlinkPartner = createMutation<
  void,
  { id: string },
  AxiosError<ProblemDetail>
>({
  mutationFn: async ({ id }) => {
    await client.delete(`partner-links/${id}/`);
  },
  onSuccess: refreshPartnerQueries,
});
