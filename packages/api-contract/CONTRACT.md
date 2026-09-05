# HTTP contract

What `apps/mobile` expects from whatever lives in `apps/backend`. The TypeScript
types in `src/` are the machine-readable half; this file is the half a Django or
Appwrite implementer reads.

All paths are relative to `API_URL`, which ends in `/api/`. Every success
response is JSON with `Content-Type: application/json`; every error is an
RFC 9457 Problem Details object with `Content-Type: application/problem+json`.
Resource names are plural kebab-case nouns; filtering, pagination and sorting go
in query params. Conventions follow https://apiguide.dev.

## Status codes

| Verb | Success |
| --- | --- |
| GET | 200 |
| POST | 201 (202 for async work) |
| PUT / PATCH | 200 |
| DELETE | 204 |

| Failure | Meaning | `type` (all `ProblemDetail`) |
| --- | --- | --- |
| 400 | body could not be parsed | `…/errors/malformed-request-body` |
| 401 | missing / invalid / expired token | `…/errors/unauthorized`, `…/errors/expired-authentication-token` |
| 402 | paywall | `…/status-codes/402/` — `PaymentRequiredProblem` (see below) |
| 403 | authenticated but lacks role/scope | `…/errors/insufficient-scope` |
| 404 | not found — **also another user's object** (never 403) | `…/errors/resource-not-found` |
| 409 | conflict: duplicate, stale version, purchase token on another account | `…/errors/resource-conflict`, `…/errors/idempotency-key-conflict` |
| 422 | parsed fine, failed validation | `…/errors/validation-failed` |
| 429 | rate limited; honour `Retry-After` | `…/errors/rate-limit-exceeded` |
| 5xx | server / upstream; generic body, retry with backoff | `…/errors/internal-server-error`, `service-unavailable`, `gateway-timeout` |

`…` = `https://apiguide.dev`. Every `type` URL opens a human-readable definition.
Never return an error with 200.

```json
{
  "type": "https://apiguide.dev/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more fields failed validation.",
  "instance": "/api/auth/register/",
  "errors": { "email": ["Enter a valid email address."], "profile": { "country": ["Use an ISO 3166-1 alpha-2 code, e.g. 'BD'."] } }
}
```

- `detail` is one sentence, safe to show verbatim. It never echoes submitted
  health values — error messages name the field, not the value.
- `errors` (422 and 409 only): field → list of messages, nested per nested
  object. Use `firstFieldError(errors, 'profile', 'country')` from the package.
- Branch on `status` or `type`; never on `title`/`detail` text.
- Client guards: `isProblemDetail`, `isPaymentRequiredProblem`, `toUpgradeDetail`.

## Auth

Bearer JWT in `Authorization: Bearer <access_token>` on every request after
login. The client stores the token in the device secure store.

| Endpoint | Request | Response |
| --- | --- | --- |
| `POST login` | `LoginRequest` | `LoginResponse` |
| `POST register` | `RegisterRequest` | `RegisterResponse` (201) |
| `POST google` | `GoogleAuthRequest` | `GoogleAuthResponse` |
| `POST forgot-password` | `ForgotPasswordRequest` | `ForgotPasswordResponse` |
| `POST reset-password` | `ResetPasswordRequest` | `{ message }` |
| `POST logout` | — | `LogoutResponse` |
| `GET me` | — | `UserResponse` |
| `DELETE me` | — | 204 (Google Play account-deletion policy) |

## Billing

| Endpoint | Request | Response |
| --- | --- | --- |
| `GET payments/subscription-status/` | — | `SubscriptionStatusResponse` |
| `POST payments/google-play/verify-purchase/` | `VerifyPurchaseRequest` | `VerifyPurchaseResponse`; 404 unknown token; 409 token linked to another account |

`subscription-status` is the source of truth for premium. The client refetches
it on foreground and after a verified purchase.

## 402 — the paywall

Any endpoint may answer `402 Payment Required` when a free-tier quota is
exhausted or a feature is premium-only. The client has one global handler; no
per-endpoint wiring is needed on either side. The body is a Problem Details
object whose extension members carry the paywall context:

```json
{
  "type": "https://apiguide.dev/status-codes/402/",
  "title": "Payment Required",
  "status": 402,
  "detail": "You've used 15 of 15 free exports this month.",
  "instance": "/api/exports/",
  "feature": "premium",
  "current_usage": 15,
  "limit": 15,
  "resets_at": "2026-10-01T00:00:00Z"
}
```

- `detail` is shown verbatim to the user. Write it for humans.
- `feature` must be a value of `PremiumFeature`. Add new keys to
  `src/billing.ts` and to the mobile upgrade sheet together.
- Quota numbers live only here. The client never hardcodes a limit.

## Idempotency

Non-idempotent operations that mutate user state (purchases, paid actions)
accept an `Idempotency-Key` header. The backend must honour it end-to-end:
at the API edge and in any worker that processes the request. A replay with
the same key and a different payload is `409` `idempotency-key-conflict`.
Where a natural key exists (one daily log per date) the endpoint is idempotent
by design and a duplicate is `409` `resource-conflict` — PATCH the existing
resource instead.

## Implementing this in Django

- DRF + `djangorestframework-simplejwt` covers auth. `apps/backend` already
  ships the Problem+JSON exception handler (`apps/core/exceptions.py`, wired as
  `REST_FRAMEWORK["EXCEPTION_HANDLER"]`) — raise DRF exceptions, never build
  error dicts. `ValidationError` → 422, uniqueness → 409, `Conflict(...)` for
  explicit conflicts.
- Raise `apps.core.exceptions.PaymentRequired(message, feature=..., limit=...)`
  for the paywall; it emits the 402 problem above.
- Verify Play purchases server-side with the Google Play Developer API and
  subscribe to RTDN for renewals/cancellations.

## Implementing this in Appwrite

- Appwrite Functions front the same paths, or the mobile `client` base URL
  points at an Appwrite Function router. Keep the response shapes; the mobile
  app does not care what produces them.
- Appwrite auth issues its own sessions; either exchange them for a JWT in
  `POST login`, or replace `src/lib/auth/utils.tsx` in the mobile app with the
  Appwrite SDK session store. The rest of the app only sees `useAuth`.
