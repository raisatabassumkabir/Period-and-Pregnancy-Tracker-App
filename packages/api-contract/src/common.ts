// ============================================
// Pagination
// ============================================

/** DRF-style `next` / `previous` URL pagination. */
export type PaginateQuery<T> = {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
};

/** Page-number pagination. */
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

// ============================================
// Errors
// ============================================

/**
 * RFC 9457 Problem Details — the body of EVERY non-2xx response, served as
 * `Content-Type: application/problem+json`.
 *
 * - `type` is a dereferenceable URL (`https://apiguide.dev/errors/<slug>`,
 *   `https://apiguide.dev/status-codes/402/` for the paywall). Branch on it or on
 *   `status`, never on `title`/`detail` text.
 * - `detail` is one human sentence, safe to show. It never echoes submitted
 *   health values.
 * - `errors` is present on 422 (validation) and 409 (conflict): field name →
 *   list of messages, nested for nested serializers (`errors.profile.country`).
 * - Specific problem types add extension members (see `PaymentRequiredProblem`).
 */
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: FieldErrors;
}

/** `errors` member of a 422/409 problem. Lists of messages, nested per serializer. */
export type FieldErrors = { [field: string]: string[] | FieldErrors };

/** `type` URLs the client branches on. Everything else: use `status`. */
export const PROBLEM_TYPES = {
  validationFailed: 'https://apiguide.dev/errors/validation-failed',
  resourceConflict: 'https://apiguide.dev/errors/resource-conflict',
  unauthorized: 'https://apiguide.dev/errors/unauthorized',
  expiredToken: 'https://apiguide.dev/errors/expired-authentication-token',
  paymentRequired: 'https://apiguide.dev/status-codes/402/',
} as const;

/** Runtime guard: is this unknown response body a Problem Details object? */
export const isProblemDetail = (data: unknown): data is ProblemDetail =>
  typeof data === 'object' &&
  data !== null &&
  typeof (data as ProblemDetail).type === 'string' &&
  typeof (data as ProblemDetail).status === 'number' &&
  typeof (data as ProblemDetail).detail === 'string';

/**
 * First message for a field of a 422/409 problem, or undefined. Handles the
 * nested shape (`firstFieldError(errors, 'profile', 'country')`).
 */
export const firstFieldError = (
  errors: FieldErrors | undefined,
  ...path: string[]
): string | undefined => {
  let node: FieldErrors | string[] | undefined = errors;
  for (const key of path) {
    if (!node || Array.isArray(node)) return undefined;
    node = node[key];
  }
  return Array.isArray(node) ? node[0] : undefined;
};
