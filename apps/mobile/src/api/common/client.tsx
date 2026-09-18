import { Env } from '@env';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { Platform } from 'react-native';

import { isPaymentRequiredProblem, toUpgradeDetail } from '@/api/billing/types';
import { signIn, signOut, useAuth } from '@/lib/auth';
import type { TokenType } from '@/lib/auth/utils';
import { showUpgrade } from '@/lib/upgrade';

import { queryClient } from './api-provider';

// ---------------------------------------------------------------------------
// Auth-exempt paths: 401 interceptor must never trigger logout for these
// because the user is not yet authenticated (onboarding / login flow).
// ---------------------------------------------------------------------------
const AUTH_EXEMPT_PATHS = [
  'auth/token/',
  'auth/token/refresh/',
  'auth/register/',
  'auth/login/',
  'auth/forgot-password/',
] as const;

const isAuthExempt = (url: string | undefined): boolean => {
  if (!url) return false;
  return AUTH_EXEMPT_PATHS.some((path) => url.includes(path));
};

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
export const client = axios.create({
  baseURL:
    Platform.OS === 'android' && __DEV__
      ? 'http://10.0.2.2:8000/api/v1'
      : (Env.API_URL ?? process.env.EXPO_PUBLIC_API_URL),
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Refresh-token mutex: prevents multiple concurrent refresh attempts when
// several requests 401 at the same time.
// ---------------------------------------------------------------------------
let refreshPromise: Promise<TokenType | null> | null = null;

async function refreshAccessToken(
  refreshToken: string
): Promise<TokenType | null> {
  try {
    // Use a raw axios call to bypass our own interceptors entirely.
    const response = await axios.post<TokenType>(
      `${client.defaults.baseURL}/auth/token/refresh/`,
      { refresh: refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    );
    return response.data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Request interceptor — synchronously reads the Zustand auth store
// ---------------------------------------------------------------------------
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuth.getState().token;
    if (token?.access) {
      config.headers.Authorization = `Bearer ${token.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — silent refresh on 401, paywall on 402
// ---------------------------------------------------------------------------
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    
    // ── Structured logging ────────────────────────────────────────────
    if (error.response) {
      // 401/403 are expected during auth expiry/refresh; don't trigger Red Screen
      const logFn = status === 401 || status === 403 ? console.info : console.error;
      logFn(
        `API Error [${status}]:`,
        JSON.stringify(error.response.data)
      );
    } else if (error.request) {
      console.warn('API Network Error (No Response):', error.message);
    } else {
      console.error('API Request Setup Error:', error.message);
    }


    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // ── 401: silent token refresh ─────────────────────────────────────
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Never intercept auth-exempt endpoints (login, register, etc.)
      if (isAuthExempt(originalRequest.url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const currentToken = useAuth.getState().token;
      if (!currentToken?.refresh) {
        // No refresh token available — sign out cleanly.
        handleForceSignOut();
        return Promise.reject(error);
      }

      // Coalesce concurrent refresh attempts behind a single promise.
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken(currentToken.refresh).finally(
          () => {
            refreshPromise = null;
          }
        );
      }

      const newToken = await refreshPromise;

      if (newToken?.access) {
        // Persist the new token pair in the auth store + SecureStore.
        signIn(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken.access}`;
        return client(originalRequest);
      }

      // Refresh failed — force sign out.
      handleForceSignOut();
      return Promise.reject(error);
    }

    // ── 402: paywall ──────────────────────────────────────────────────
    if (status === 402) {
      const body = error.response?.data;
      if (isPaymentRequiredProblem(body)) {
        showUpgrade(toUpgradeDetail(body));
      } else {
        showUpgrade({
          message: 'Upgrade to Premium to unlock this feature.',
          feature: 'premium',
        });
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Centralised sign-out: clears the React Query cache so stale queries
// don't immediately re-trigger 401 loops after the user is signed out.
// ---------------------------------------------------------------------------
function handleForceSignOut(): void {
  console.warn('Auth session expired. Signing out and clearing cache.');
  signOut();
  queryClient.clear();
}
