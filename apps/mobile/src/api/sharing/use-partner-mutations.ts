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
import { OPEN_INVITE_KEY } from './use-open-invite';
import { PARTNER_LINKS_KEY } from './use-partner-links';
import { SHARED_STATUS_KEY } from './use-shared-status';

/**
 * Two rules for every partner mutation, both learned the hard way:
 *
 * 1. The refresh runs INSIDE `mutationFn`, not in a default `onSuccess`.
 *    react-query-kit merges options with a shallow spread, so a caller that
 *    passes its own `onSuccess` (JoinCard does) silently drops the default
 *    one: the link was made on the server but the screen never updated.
 * 2. No automatic retry. The global default retries mutations 3 times; a
 *    retried redeem resends an already-used code and gets a misleading 404.
 */
const NO_RETRY = false;

async function refreshPartnerQueries(): Promise<void> {
  await Promise.all(
    [OPEN_INVITE_KEY, PARTNER_LINKS_KEY, SHARED_STATUS_KEY].map((key) =>
      queryClient.invalidateQueries({ queryKey: [...key] })
    )
  );
}

/** Runs the request, then refreshes everything partner-related. */
async function thenRefresh<T>(request: Promise<T>): Promise<T> {
  const result = await request;
  await refreshPartnerQueries();
  return result;
}

/** She creates a pairing code; it replaces any open one ("create a new code"). */
export const useCreatePartnerInvite = createMutation<
  PartnerInviteCreated,
  PartnerInviteCreate,
  AxiosError<ProblemDetail>
>({
  mutationFn: (body) =>
    thenRefresh(
      client
        .post<PartnerInviteCreated>('partner-invites/', body)
        .then((response) => response.data)
    ),
  retry: NO_RETRY,
});

/** The partner redeems a code. 404 bad/expired, 409 already linked, 422 own code. */
export const useRedeemPartnerCode = createMutation<
  PartnerLink,
  PartnerLinkRedeem,
  AxiosError<ProblemDetail>
>({
  mutationFn: (body) =>
    thenRefresh(
      client
        .post<PartnerLink>('partner-links/', body)
        .then((response) => response.data)
    ),
  retry: NO_RETRY,
});

export interface UpdatePartnerLinkVariables extends PartnerLinkUpdate {
  id: string;
}

export const useUpdatePartnerLink = createMutation<
  PartnerLink,
  UpdatePartnerLinkVariables,
  AxiosError<ProblemDetail>
>({
  mutationFn: ({ id, ...body }) =>
    thenRefresh(
      client
        .patch<PartnerLink>(`partner-links/${id}/`, body)
        .then((response) => response.data)
    ),
  retry: NO_RETRY,
});

export const useUnlinkPartner = createMutation<
  void,
  { id: string },
  AxiosError<ProblemDetail>
>({
  mutationFn: ({ id }) =>
    thenRefresh(client.delete(`partner-links/${id}/`).then(() => undefined)),
  retry: NO_RETRY,
});

/** "Cancel invite": the code stops working at once. */
export const useCancelPartnerInvite = createMutation<
  void,
  { id: string },
  AxiosError<ProblemDetail>
>({
  mutationFn: ({ id }) =>
    thenRefresh(client.delete(`partner-invites/${id}/`).then(() => undefined)),
  retry: NO_RETRY,
});
