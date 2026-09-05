# apiguide.dev guide index

Fetch a guide with WebFetch **only** when implementing that pattern; the rules in CLAUDE.md
and SKILL.md already cover the decisions. Base: https://apiguide.dev/guides/

## Directly relevant to this API
- error-handling/ — centralized Problem+JSON, field-level errors
- idempotency/ — Idempotency-Key, Redis locking, safe retries (mobile POST retries!)
- retries-backoff/ — client-side exponential backoff + jitter (for the Expo client)
- rate-limiting/ — token bucket / sliding window, RateLimit-* headers (free-tier AI quota)
- pagination/ — offset vs cursor (cursor for daily logs / assistant messages)
- filtering-sorting-searching/ — query-param conventions
- async-operations/ — 202 + job resource + polling (assistant, PDF export, ingestion)
- streaming-apis/ — SSE reconnection, Last-Event-ID (assistant streaming)
- webhooks/ and webhook-signatures/ — HMAC-SHA256, replay protection (RevenueCat/Polar in)
- token-lifecycle/ — short access, rotating refresh, revocation (matches SIMPLE_JWT)
- input-validation/ — allowlisting, injection defence
- api-security/ — checklist incl. OWASP API Top 10 (BOLA = our rule 1/3)
- timestamps-and-formats/ — RFC 3339, UTC, integer money
- resource-naming/ — plural nouns, kebab-case
- patch-strategies/ — JSON Merge Patch vs JSON Patch (we use merge semantics)
- file-uploads-downloads/ — presigned R2 uploads, Range for PDF export
- health-checks/ — liveness vs readiness, health+json (`/health/` today returns `{"status":"ok"}`)
- observability-tracing/ — request ids, W3C traceparent, RED metrics
- deprecation-sunsetting/ and versioning/ — when we first break a shipped endpoint

## Reference later
- caching/, conditional-requests/, cache-invalidation/ — ETag/If-Match for PATCH conflicts
- cdn-edge-caching/ — mostly N/A: health data is `private, no-store`
- cors/ — only for the web/admin surface; the mobile app doesn't need it
- content-negotiation/, media-types/, sparse-fieldsets/, response-envelopes/, hateoas/
- authentication/, oauth-api-keys/, authorization-models/, mutual-tls/, request-signing/
- bulk-operations/ (batch log import from a previous app), multi-tenancy/ (N/A),
  internationalization/ (Bangla/English messages — Accept-Language), compression/, rest-principles/

## Catalogs
- https://apiguide.dev/errors/ — 4xx/5xx Problem+JSON schemas (each page's URL is the `type`)
- https://apiguide.dev/status-codes/ · https://apiguide.dev/headers/ · https://apiguide.dev/methods/
- https://apiguide.dev/llms.txt — machine-readable site index
