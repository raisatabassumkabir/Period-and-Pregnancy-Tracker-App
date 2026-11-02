import type { AxiosError } from 'axios';

import type { ProblemDetail } from '@/api/types';
import { isProblemDetail } from '@/api/types';
import { translate } from '@/lib/i18n';

/**
 * What to show when a partner request fails. No response at all means the
 * server can't be reached (offline, or the API is down), which used to make
 * the screen silently do nothing. A Problem+JSON `detail` is a safe sentence.
 */
export function partnerErrorMessage(
  error: AxiosError<ProblemDetail> | null | undefined
): string | undefined {
  if (!error) return undefined;
  if (!error.response) return translate('partner.network_error');
  const body: unknown = error.response.data;
  if (isProblemDetail(body) && body.detail) return body.detail;
  return translate('partner.generic_error');
}
