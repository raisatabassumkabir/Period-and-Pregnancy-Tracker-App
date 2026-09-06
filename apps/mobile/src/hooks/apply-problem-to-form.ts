import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { firstFieldError, isProblemDetail } from '@/api/types';

interface ApplyProblemOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  /** The rejected value from a mutation — an AxiosError in practice. */
  error: unknown;
  /** Form fields the API is allowed to name in `errors`; others go to the banner. */
  fields: readonly Path<T>[];
  /** Shown when the response carries no usable problem body (offline, 5xx, HTML). */
  fallback: string;
}

/** Reads `error.response.data` without asserting `any` on the way through. */
function problemBodyFrom(error: unknown): unknown {
  if (typeof error !== 'object' || error === null) return undefined;
  const { response } = error as { response?: unknown };
  if (typeof response !== 'object' || response === null) return undefined;
  return (response as { data?: unknown }).data;
}

/**
 * Maps an RFC 9457 problem onto a react-hook-form: `errors` entries land on
 * their fields, anything else becomes a form-level `root` error for the banner.
 *
 * 402 is deliberately not special-cased — the axios interceptor in
 * `src/api/common/client.tsx` already raises the upgrade sheet for those.
 */
export function applyProblemToForm<T extends FieldValues>({
  form,
  error,
  fields,
  fallback,
}: ApplyProblemOptions<T>): void {
  const body = problemBodyFrom(error);

  if (!isProblemDetail(body)) {
    form.setError('root', { type: 'server', message: fallback });
    return;
  }

  const fieldErrors = body.errors ?? {};
  const knownFields = new Set<string>(fields);
  let mappedAField = false;
  let mappedRoot = false;

  for (const key of Object.keys(fieldErrors)) {
    const message = firstFieldError(fieldErrors, key);
    if (!message) continue;

    if (knownFields.has(key)) {
      form.setError(key as Path<T>, { type: 'server', message });
      mappedAField = true;
    } else {
      // e.g. DRF's `non_field_errors`, or a field this form doesn't render.
      form.setError('root', { type: 'server', message });
      mappedRoot = true;
    }
  }

  // 401s and most 409s carry only `detail`; surface it rather than a generic line.
  if (!mappedAField && !mappedRoot) {
    form.setError('root', { type: 'server', message: body.detail || fallback });
  }
}
