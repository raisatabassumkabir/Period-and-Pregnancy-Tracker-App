// ============================================
// Authentication
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  message: string;
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
