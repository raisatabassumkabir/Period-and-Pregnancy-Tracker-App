// ============================================
// Authentication
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

/** `POST /api/auth/token/` and `POST /api/auth/token/refresh/` response (simplejwt pair). */
export interface TokenPairResponse {
  access: string;
  refresh: string;
}

/** Refresh rotation is on: the old refresh token is blacklisted, keep both from the response. */
export interface RefreshTokenRequest {
  refresh: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface RegisterRequest {
  email: string;
  password: string;
  /** Optional nested profile; validation errors come back under `errors.profile.<field>`. */
  profile?: import('./health').ProfileWrite;
}

/** 201 body. `profile` is echoed only when it was part of the request. */
export interface RegisterResponse {
  id: string;
  email: string;
  profile?: import('./health').Profile;
}

/**
 * `POST auth/password-resets/`. Send an `Idempotency-Key` header per user tap;
 * a replay with the same key and email is a no-op, a different email is 409.
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * 202 body. Identical whether or not the email has an account. The emailed
 * link opens a page on the API domain where the new password is set; there is
 * no in-app reset endpoint.
 */
export interface PasswordResetResponse {
  detail: string;
}

export interface LogoutResponse {
  message: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string | null;
  is_premium: boolean;
  created_at: string;
}
