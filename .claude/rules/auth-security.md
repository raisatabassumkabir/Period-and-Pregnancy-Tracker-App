---
paths:
  - apps/mobile/src/lib/auth/**
  - apps/mobile/src/api/auth/**
  - apps/mobile/src/lib/storage.tsx
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# Auth & security rules

## Token storage

- Tokens live in `expo-secure-store` via `src/lib/auth/utils.tsx` (`getToken`,
  `setToken`, `removeToken`). A one-time migration moves any legacy
  AsyncStorage `token` entry into the secure store.
- `src/lib/storage.tsx` (AsyncStorage) is for non-secret preferences only.
- **Never** log the access or refresh token, even at `debug` level. The axios
  request interceptor in `src/api/common/client.tsx` reads via `getToken()` and
  sets `Authorization`; if reading fails, log a generic warning only.

## 401 handling

- The axios interceptor logs `console.warn('Auth token is invalid or expired')`
  on 401 and re-rejects. Do not throw your own — screens react to `useAuth`.
- For mutation hooks that care about auth failure (e.g. logout), branch on
  `error.response?.status === 401` and call the appropriate store action.

## Token writes

- `signIn` in `src/lib/auth/index.tsx` is the only place that persists tokens.
  Screens call `useAuth.use.signIn()` with the login response.
- Hooks that read tokens: `getToken()` from `src/lib/auth/utils`. Do not import
  `expo-secure-store` directly outside `src/lib/auth/`.

## Deep links

- Deep link scheme is declared in `app.config.ts` via `Env.SCHEME`. Any new
  route that accepts external deep links must be validated at the route; do
  not accept arbitrary URLs.

## Logout

- Single source of truth: `useLogout` in `src/api/auth/use-logout.ts` followed
  by `useAuth.use.signOut()`. Do not manually clear storage keys.

## Don't

- Don't store tokens in React component state.
- Don't put tokens in URL params (deep links, push notifications, etc.).
- Don't add a "remember me" toggle that persists the password — the JWT is the
  only credential.
- Don't write to AsyncStorage from non-preference code paths.
