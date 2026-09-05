/**
 * The HTTP contract lives in `packages/api-contract` so the backend and any
 * other client share one definition. This module re-exports the non-billing
 * half; `./billing/types.ts` re-exports the billing half. Import from these
 * paths inside the app, not from the package directly, so the app keeps one
 * place to add app-only types.
 */
export {
  firstFieldError,
  isProblemDetail,
  PROBLEM_TYPES,
} from '@repo/api-contract';
export type {
  FieldErrors,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GoogleAuthRequest,
  GoogleAuthResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  PaginatedResponse,
  PaginateQuery,
  ProblemDetail,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  SubscriptionStatus,
  SubscriptionStatusResponse,
  UserResponse,
} from '@repo/api-contract';
