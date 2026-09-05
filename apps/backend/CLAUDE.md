# Femtech monorepo — Claude notes

Reproductive-health tracker (cycles, pregnancy, postpartum). This directory
(`apps/backend`, its own git repo inside the Expo monorepo) holds the Django 6 + DRF +
drf-spectacular API at `apps/api`, on Postgres 16/pgvector + Redis/Celery; the client is
`apps/mobile`. Read `ARCHITECTURE.md` for the why, `ONBOARDING.md` for setup. This file is
the rules.

## Commands (run from `apps/api`)
- `uv sync` · `uv run manage.py migrate` · `uv run manage.py runserver`
- `uv run pytest` (all) · `uv run pytest tests/test_cross_user_access.py -v` (the one that matters)
- `uv run ruff check . && uv run mypy .` · `uv run python scripts/lint_owned_queries.py`
- Endpoint/schema changed → update `packages/api-contract` (types + CONTRACT.md) in the same PR.

## Non-negotiable rules (ONBOARDING §6 — health data)
1. Views query via `.objects.for_user(user)` only — never `.all()` / bare `.filter()`. CI lints it.
2. RLS policy ships in the SAME migration that creates a user-owned table.
3. Another user's object → **404, never 403**. Existence is never confirmed.
4. Serializers use explicit `fields` allowlists — never `"__all__"` on health data.
5. Never log/analytics health values (symptoms, scores, cycle data). Event names + counts only.
6. Assistant answers only from retrieval; empty retrieval → refuse. No fallback to model knowledge.
7. Migrations on real data are one-way; never `--fake`. Ask first.
8. `screening/` EPDS scoring and escalation: don't touch without flagging for review.

## API conventions (source: https://apiguide.dev — details in the monorepo's `.claude/skills/api-design`)
Load the `api-design` skill before adding or changing any endpoint, serializer, error
response, pagination, or webhook. The client-side mirror of these rules is
`packages/api-contract/CONTRACT.md`; a change to an error shape or status code updates both.

- **Errors are RFC 9457 Problem+JSON**, `Content-Type: application/problem+json`, via the
  central handler `apps.core.exceptions.problem_exception_handler` (REST_FRAMEWORK
  `EXCEPTION_HANDLER`). Never hand-build error dicts in a view; raise the DRF exception or
  one from `apps/core/exceptions.py` (`Conflict`, `PaymentRequired`, `ServiceUnavailable`…).
  - `type` = `https://apiguide.dev/errors/<slug>` (catalog in the skill); `title`, `status`,
    `detail`, `instance` (= request path). Field errors → `"errors": {"field": ["msg"]}`.
  - 400 malformed syntax · **422 valid syntax, failed validation** · 409 conflict (duplicate,
    stale version — uniqueness failures are remapped automatically) · 402 paywall
    (`PaymentRequired`, extension members per CONTRACT.md) · 401 missing/expired token ·
    403 role/scope only (rule 3 wins for objects) · 429 + `Retry-After` · 5xx never leak internals.
  - `detail`/`errors` name the field, never echo the submitted health value (rule 5).
- **Status codes**: 201 + body on create, 204 on delete, 202 + job resource for anything
  that runs in Celery (assistant, PDF export, ingestion). No 200-with-error-body, ever.
- **URIs**: plural kebab-case nouns, registered in `config/api_router.py` only
  (`/api/daily-logs/`). No verbs; actions are sub-resources or `@action` on a noun.
- **Mutations**: POST that a flaky mobile client may retry needs either natural idempotency
  (PUT/upsert keyed by the user's date) or an `Idempotency-Key` header → 409
  `idempotency-key-conflict` on payload mismatch. Prefer the natural key.
- **Dates & times**: calendar dates (period start, log date) are `YYYY-MM-DD` `DateField`s
  in the user's local day — never datetimes. Instants are RFC 3339 UTC (`USE_TZ`). Money is
  integer minor units. IDs are opaque strings to the client.
- **Lists**: `PAGE_SIZE` 50 page-number today; new time-ordered feeds (logs, messages) use
  DRF `CursorPagination`. One pagination style per endpoint, filters as query params
  (`?date_after=`), never in the body.
- **Versioning**: none yet and don't add `/v1/` ad hoc — it's an ADR (`docs/adr/`). Breaking
  changes to a shipped endpoint get `Deprecation` + `Sunset` headers, not silent edits.
- **Auth**: JWT bearer, 15-min access + rotating refresh (SIMPLE_JWT). Public endpoints opt in
  with an explicit permission class; default is `IsAuthenticated`.
- **Webhooks in** (RevenueCat/Polar): verify HMAC signature with constant-time compare,
  reject replays, ack fast (202) and process in Celery.
- Every new/changed endpoint ships with tests for the success path and each error path
  asserting the Problem+JSON shape, plus the cross-user 404 test where it's user-owned.

## Working agreements
Branches `feat/` `fix/` `chore/`; small PRs to `main`; anything touching authorization gets an
explicit callout in the PR description; architectural changes get a two-paragraph ADR.
