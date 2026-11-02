# HTTP contract

What `apps/mobile` expects from the Django API in `apps/api`. The TypeScript
types in `src/` are the machine-readable half; this file is the half a Django or
Appwrite implementer reads.

All paths are relative to `API_URL`, which ends in `/api/`. Every success
response is JSON with `Content-Type: application/json`; every error is an
RFC 9457 Problem Details object with `Content-Type: application/problem+json`.
Resource names are plural kebab-case nouns; filtering, pagination and sorting go
in query params. Conventions follow https://apiguide.dev.

## Status codes

| Verb        | Success                  |
| ----------- | ------------------------ |
| GET         | 200                      |
| POST        | 201 (202 for async work) |
| PUT / PATCH | 200                      |
| DELETE      | 204                      |

| Failure | Meaning                                                               | `type` (all `ProblemDetail`)                                               |
| ------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 400     | body could not be parsed                                              | `…/errors/malformed-request-body`                                          |
| 401     | missing / invalid / expired token                                     | `…/errors/unauthorized`, `…/errors/expired-authentication-token`           |
| 402     | paywall                                                               | `…/status-codes/402/` — `PaymentRequiredProblem` (see below)               |
| 403     | authenticated but lacks role/scope                                    | `…/errors/insufficient-scope`                                              |
| 404     | not found — **also another user's object** (never 403)                | `…/errors/resource-not-found`                                              |
| 409     | conflict: duplicate, stale version, purchase token on another account | `…/errors/resource-conflict`, `…/errors/idempotency-key-conflict`          |
| 422     | parsed fine, failed validation                                        | `…/errors/validation-failed`                                               |
| 429     | rate limited; honour `Retry-After`                                    | `…/errors/rate-limit-exceeded`                                             |
| 5xx     | server / upstream; generic body, retry with backoff                   | `…/errors/internal-server-error`, `service-unavailable`, `gateway-timeout` |

`…` = `https://apiguide.dev`. Every `type` URL opens a human-readable definition.
Never return an error with 200.

```json
{
  "type": "https://apiguide.dev/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more fields failed validation.",
  "instance": "/api/auth/register/",
  "errors": {
    "email": ["Enter a valid email address."],
    "profile": { "country": ["Use an ISO 3166-1 alpha-2 code, e.g. 'BD'."] }
  }
}
```

- `detail` is one sentence, safe to show verbatim. It never echoes submitted
  health values — error messages name the field, not the value.
- `errors` (422 and 409 only): field → list of messages, nested per nested
  object. Use `firstFieldError(errors, 'profile', 'country')` from the package.
- Branch on `status` or `type`; never on `title`/`detail` text.
- Client guards: `isProblemDetail`, `isPaymentRequiredProblem`, `toUpgradeDetail`.

## What the Django API implements today

`apps/api` currently serves the endpoints marked **live** below. The rest of
this document is the target contract: the types exist and the client compiles
against them, but calling those paths returns 404 until the backend catches up.

| Live endpoint                               | Notes                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `POST auth/register/`                       | 201 `RegisterResponse`; optional nested `profile`                                      |
| `POST auth/token/`                          | `LoginRequest` → `TokenPairResponse`                                                   |
| `POST auth/token/refresh/`                  | `RefreshTokenRequest` → `TokenPairResponse` (rotating; the old refresh is blacklisted) |
| `GET/PUT/PATCH profiles/`, `profiles/{id}/` | `Profile` — list holds only the caller's own row                                       |
| `cycles/`, `cycles/{id}/`                   | full CRUD, `Cycle`; 409 on a duplicate `start_date`                                    |
| `daily-logs/`, `daily-logs/{id}/`           | full CRUD, `DailyLog`; one per calendar day, 409 on a duplicate `date`                 |
| `pregnancies/`, `pregnancies/{id}/`         | full CRUD, `Pregnancy`; 409 on a second `active` row                                   |
| `POST auth/password-resets/`                | `PasswordResetRequest` → 202 `PasswordResetResponse`; `Idempotency-Key` honoured       |
| `GET me`, `DELETE me`                       | `UserResponse`; DELETE → 204                                                           |

Trailing slashes are required. Every list endpoint returns `PaginateQuery<T>`
(`{ count, next, previous, results }`, page size 50, `?page=<n>`); there is no
client-controlled page size. `temperature_celsius` is a DRF decimal and so
crosses the wire as a **string** (`"36.60"`), in both directions.

Not yet implemented: `logout` and Google sign-in. No endpoint returns 402 yet,
though the server-side `PaymentRequired` exception is ready to raise. Every
error body is Problem+JSON; requests are rate limited (429 with `Retry-After`).

## Auth

Bearer JWT in `Authorization: Bearer <access_token>` on every request after
login. The client stores the token in the device secure store. Access tokens
last 15 minutes; refresh tokens 30 days.

| Endpoint                              | Request                | Response                                  |
| ------------------------------------- | ---------------------- | ----------------------------------------- |
| `POST auth/token/` **live**           | `LoginRequest`         | `TokenPairResponse`                       |
| `POST auth/token/refresh/` **live**   | `RefreshTokenRequest`  | `TokenPairResponse`                       |
| `POST auth/register/` **live**        | `RegisterRequest`      | `RegisterResponse` (201)                  |
| `POST auth/password-resets/` **live** | `PasswordResetRequest` | `PasswordResetResponse` (202)             |
| `POST logout`                         | —                      | `LogoutResponse`                          |
| `GET me` **live**                     | —                      | `UserResponse`                            |
| `DELETE me` **live**                  | —                      | 204 (Google Play account-deletion policy) |

Password reset finishes in the browser: the emailed link opens
`/accounts/password-reset/<uid>/<token>/` on the API domain, which sets the new
password and revokes every refresh token for the account. The app only sends
the request and shows "check your inbox".

## Health data

Profiles, cycles, daily logs and pregnancies are typed in `src/health.ts`. Enum
members (`Flow`, `Mood`, `Symptom`, `MedicalCondition`, `ProfileMode`, `Diet`,
`BudgetTier`, `PregnancyStatus`) mirror the Django choice codes exactly — an
unknown code is a 422 whose `errors` names the field and a count, never the
submitted value.

## Partner sharing

She invites one partner; the partner reads a narrow status. Types in
`src/sharing.ts`. A partner has no access to any health table (database RLS
enforces it); the only thing they can read is `SharedStatus`: date anchors
(cycle and period length, last period start, next period, ovulation, due date).
Never symptoms, mood, notes, intercourse logs or screening results.

| Method + path                                 | Who     | Success                                                      | Errors                                                                        |
| --------------------------------------------- | ------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `POST /api/partner-invites/`                  | her     | 201 `PartnerInvite` (code + link)                            | 409 already linked, 422                                                       |
| `GET /api/partner-invites/`                   | her     | 200 `PartnerInvite[]`: her open invite (0 or 1, unpaginated) |                                                                               |
| `GET/PATCH/DELETE /api/partner-invites/{id}/` | her     | 200 / 200 / 204                                              | 404                                                                           |
| `POST /api/partner-links/` with `{code}`      | partner | 201 `PartnerLink`                                            | 404 unknown **or** expired (same body), 409 already linked, 422 own code, 429 |
| `GET /api/partner-links/`                     | either  | 200 `PartnerLink[]` (0 or 1, unpaginated)                    |                                                                               |
| `PATCH /api/partner-links/{id}/`              | her     | 200                                                          | 403 for the partner, 404                                                      |
| `DELETE /api/partner-links/{id}/`             | either  | 204, access ends immediately                                 | 404                                                                           |
| `GET /api/shared-statuses/`                   | partner | 200 `SharedStatus[]` (0 or 1, unpaginated)                   |                                                                               |

- A new invite replaces her unredeemed one. Invites expire after 7 days and are single use;
  redeeming clears the stored code. Only she can read her code (database RLS).
- Share switches apply on every read: `share_fertile_window: false` nulls
  `ovulation_date`; `share_pregnancy: false` nulls `pregnancy_due_date` and
  reports a pregnancy or postpartum `mode` as `private`.
- Responses carry `Cache-Control: private, no-store`.
- Deleting either account deletes the link.

## Billing

### Canonical Identifiers & Target Pricing Hypotheses

| Identifier      | Type        | Target Planning USD | Notes                                       |
| :-------------- | :---------- | :-----------------: | :------------------------------------------ |
| premium_monthly | Product     |      .99 / mo       | Canonical Google Play subscription product  |
| premium_annual  | Product     |      .99 / yr       | Canonical Google Play subscription product  |
| premium         | Entitlement |          —          | Canonical RevenueCat entitlement identifier |

Legacy compatibility: premium_yearly resolves to premium_annual. Note that store-configured prices in Google Play Console remain authoritative and localized.

### Endpoints

| Endpoint                                   | Request               | Response                                                                       |
| :----------------------------------------- | :-------------------- | :----------------------------------------------------------------------------- |
| GET payments/subscription-status/          | —                     | SubscriptionStatusResponse                                                     |
| POST payments/google-play/verify-purchase/ | VerifyPurchaseRequest | VerifyPurchaseResponse; 404 unknown token; 409 token linked to another account |

subscription-status is the source of truth for premium access decisions. The client refetches
it on foreground and after purchase/restore operations.

Status semantics:

- is_premium: Authoritative flag for client access decisions.
- subscription_status: Granular lifecycle state (ree, ctive, rialing, cancelled, past_due, xpired, illing_issue).
- A cancelled subscription retains is_premium: true until subscription_ends_at. Once subscription_ends_at has elapsed, status transitions to xpired and is_premium: false.
- Never exposes internal webhook secrets, raw receipt tokens, or database internals.

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

- DRF + `djangorestframework-simplejwt` covers auth. `apps/api` already
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
