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

export interface GoogleAuthRequest {
  id_token: string;
}

export interface GoogleAuthResponse {
  access_token: string;
  token_type: 'bearer';
  is_new_user: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
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
