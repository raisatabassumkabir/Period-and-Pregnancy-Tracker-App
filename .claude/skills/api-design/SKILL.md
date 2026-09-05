---
name: api-design
description: HTTP/REST conventions for the femtech DRF API, distilled from apiguide.dev (RFC 9457 Problem+JSON errors, status codes, idempotency, pagination, caching, webhooks). Use when adding or changing an endpoint, viewset, serializer, exception handling, pagination, rate limiting, versioning, or an inbound/outbound webhook.
---

# API design (Django REST Framework)

Rules live in `apps/backend/CLAUDE.md`; the client-side mirror is
`packages/api-contract/CONTRACT.md`. This skill is the *how* and the *why*. Reference files:
- `errors.md` — the Problem+JSON error catalog: slug → status → which DRF exception raises it
- `guides.md` — index of apiguide.dev guides; fetch one with WebFetch only when implementing that pattern

## 1. Before writing code: classify the endpoint

| Question | Answer decides |
|---|---|
| Is the resource user-owned? | `OwnedModelViewSet` + `for_user()` + cross-user 404 test (`tests/test_cross_user_access.py` walks the router and fails if missing) |
| Does it mutate? | Method: POST create, PUT full replace/upsert, PATCH partial (JSON Merge Patch semantics), DELETE → 204 |
| Can a mobile client retry it? | Make it idempotent: prefer a natural key (e.g. one log per user per date → `PUT /daily-logs/{date}/` semantics or `update_or_create`); otherwise `Idempotency-Key` header stored in Redis with the response, 409 `idempotency-key-conflict` on different payload |
| Does it take > ~2 s or call an LLM/PDF/ingest? | `202 Accepted` + `{"id","status","..."}` job resource, `Location` header to `GET /jobs/{id}/`, `Retry-After` on the 202; result via polling or SSE (ARCHITECTURE §8) |
| Is it a list? | Filters as query params; page-number for small static sets, `CursorPagination` (`ordering = "-date"`) for time-ordered feeds; never both on one endpoint |
| Public (no JWT)? | Explicit `permission_classes` on the view, throttle it, and say so in the PR |

## 2. Errors — the one thing to get right

All errors go through `apps.core.exceptions.problem_exception_handler` (wired in
`REST_FRAMEWORK["EXCEPTION_HANDLER"]`; see §6 for how to extend it). Views **raise** DRF
exceptions or the ones in `apps/core/exceptions.py` (`Conflict`, `PaymentRequired`, …); they
never return error dicts.

Shape (RFC 9457):
```json
{
  "type": "https://apiguide.dev/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "end_date must be after start_date.",
  "instance": "/api/cycles/",
  "errors": {"end_date": ["end_date must be after start_date."]}
}
```
- `Content-Type: application/problem+json`. `type` is a dereferenceable apiguide.dev URL — the
  client can open it. Keep `title` fixed per type; put specifics in `detail`.
- 400 vs 422: 400 = the body could not be parsed / wrong JSON types (`ParseError`); 422 =
  parsed fine, failed rules (`serializers.ValidationError`). DRF defaults ValidationError to
  400 — the handler remaps it to 422.
- 409 for "already exists" (duplicate log date) and stale-version conflicts, not 400.
- 403 is for role/scope only. For someone else's object it is **404** (rule 3), and the
  handler must not distinguish "no such row" from "not yours".
- `detail`/`errors` may name a field, never echo a submitted health value (rule 5): write
  `"symptoms": ["Unknown symptom code."]`, not `"Unknown symptom 'heavy bleeding'"`.
- 5xx: generic `title`, no stack, no exception text; log it server-side with a request id.
- 401 needs `WWW-Authenticate: Bearer`. 429 needs `Retry-After` (DRF's `Throttled` sets it).

## 3. Status-code cheatsheet

| Situation | Code |
|---|---|
| Created | 201 + body + `Location` |
| Deleted / no body | 204 |
| Async job accepted | 202 + job body + `Location` |
| Conditional GET matched `If-None-Match` | 304 |
| Auth missing/invalid/expired | 401 |
| Authenticated, lacks role/scope | 403 |
| Not found / not yours | 404 |
| Wrong verb on a real path | 405 + `Allow` |
| Client can't accept our media type | 406 |
| Duplicate / stale version / idempotency mismatch | 409 |
| `If-Match` failed | 412 |
| Body too big | 413 |
| Wrong `Content-Type` | 415 |
| Parsed but invalid | 422 |
| Throttled | 429 + `Retry-After` |
| Bug | 500 (never expose why) |
| Upstream (LLM provider, payment) down | 502/503/504 + `Retry-After` when known |

## 4. Headers we use

- Request: `Authorization: Bearer`, `Accept: application/json`, `Idempotency-Key` (where the
  endpoint documents it), `If-Match` on PATCH of profile/pregnancy when we add ETags.
- Response: `Content-Type`, `Location` (201/202), `Retry-After` (429/503/202),
  `ETag` on single-resource GETs once implemented, `Cache-Control: private, no-store` on
  anything containing health data (default for this API — never let a CDN cache it),
  `Deprecation` + `Sunset` + `Link rel="successor-version"` when retiring an endpoint.

## 5. Data formats

- Calendar dates: `DateField`, `YYYY-MM-DD`, the user's local day. A period start is a date,
  not an instant — never convert it through UTC.
- Instants: RFC 3339 with `Z` (`USE_TZ = True`, DRF default renders this).
- Durations: integer seconds or ISO 8601 (`PT6H`) — pick one per field, document it.
- Money: integer minor units + currency code (`{"amount": 49900, "currency": "BDT"}`).
- Enums: lowercase snake_case strings, documented in the serializer's `ChoiceField`.
- Booleans are booleans, not `"yes"`/1. Nullable fields are explicit in the schema.

## 6. The handler, and how to extend it (`apps/core/exceptions.py`)

What it does: calls DRF's handler, then rewrites `response.data` into the §2 shape and sets
`application/problem+json`. `ValidationError` → 422; a ValidationError whose codes are all
`unique` → 409; unhandled exceptions → generic 500 problem outside DEBUG (traceback logged).
`apps/core/schema.py` publishes `ProblemDetail` in the OpenAPI doc and attaches the error
responses to every operation. `tests/test_problem_details.py` covers every type in
`errors.md` the API can produce.

Adding a new problem type:
1. Subclass `ProblemException` with `status_code`, `default_detail`, `problem_type`,
   `problem_title`; pass `extensions={...}` for RFC 9457 extension members (see
   `PaymentRequired`).
2. Add the row to `errors.md` and, if the client must branch on it, the URL to
   `PROBLEM_TYPES` in `packages/api-contract/src/common.ts` + a line in `CONTRACT.md`.
3. Add a test in `tests/test_problem_details.py` asserting type, status, content type, and
   that no submitted value is echoed.
4. `OwnedModelViewSet` already turns `IntegrityError` on save into a 409; add an explicit
   pre-check raising `Conflict({"field": ["..."]})` where a field-level message helps.

Paywall: `raise PaymentRequired("You've used 3 of 3 free chats today.", feature="ai_chat",
current_usage=3, limit=3, resets_at=...)`. `feature` must be a `PremiumFeature` key in
`packages/api-contract/src/billing.ts`.

## 7. Review checklist (what `/api-review` runs)

- [ ] URI: plural, kebab-case, noun, registered in `config/api_router.py`
- [ ] Owned resource → `for_user()`, cross-user test exists, 404 not 403
- [ ] Serializer has explicit `fields`; no health value in any error message
- [ ] Every error path raises a DRF exception → Problem+JSON via the central handler
- [ ] 400/422/409 chosen per §2; 201/204/202 per §3
- [ ] Retry-safe: natural idempotency or `Idempotency-Key`; `Retry-After` on 429/503/202
- [ ] Dates are `DateField`s where they are calendar dates; instants are RFC 3339 UTC
- [ ] List endpoints: one pagination style, filters as query params, bounded page size
- [ ] `Cache-Control: private, no-store` on health data responses
- [ ] Long work → Celery + 202 job, not a 30 s request
- [ ] Inbound webhook: signature verified (constant-time), replay window, 202 then queue
- [ ] Tests: success + each error path + Problem+JSON shape; OpenAPI regenerated

## Sources
apiguide.dev — https://apiguide.dev/guides/ (index in `guides.md`) · RFC 9457
(Problem Details) · RFC 9110 (HTTP semantics) · RFC 8594/9745 (Sunset/Deprecation).
