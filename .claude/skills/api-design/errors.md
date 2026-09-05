# Problem+JSON error catalog

`type` = `https://apiguide.dev/errors/<slug>` — each URL is a human-readable definition the
client can open (the 402 paywall uses `https://apiguide.dev/status-codes/402/`, the only
type not under `/errors/`). Column 4 is what raises it in this codebase
(`apps/core/exceptions.py`); the handler maps the exception class to the slug. Slugs marked †
are not applicable yet but reserved.

| Slug | Status | Title | Raised by (DRF / ours) |
|---|---|---|---|
| malformed-request-body | 400 | Malformed Request Body | `ParseError` (bad JSON, wrong root type) |
| invalid-pagination-cursor | 400 | Invalid Pagination Cursor | `CursorPagination` raising `NotFound`→ remap when `cursor` param present |
| unauthorized | 401 | Unauthorized | `NotAuthenticated`, `AuthenticationFailed` (no/invalid token) |
| *(status-codes/402/)* | 402 | Payment Required | ours: `PaymentRequired(message, feature=…)` — paywall; extension members `feature`, `current_usage`, `limit`, `resets_at` (CONTRACT.md §402) |
| expired-authentication-token | 401 | Expired Authentication Token | simplejwt `InvalidToken` whose message is token-expired |
| insufficient-scope | 403 | Insufficient Scope | `PermissionDenied` (role/scope only — never for another user's object) |
| resource-not-found | 404 | Resource Not Found | `Http404`, `NotFound` — including another user's object (rule 3) |
| method-not-allowed | 405 | Method Not Allowed | `MethodNotAllowed` (+ `Allow` header) |
| not-acceptable | 406 | Not Acceptable | `NotAcceptable` |
| request-timeout | 408 | Request Timeout | † (Caddy/gunicorn level) |
| resource-conflict | 409 | Resource Conflict | ours: `Conflict(APIException)` for duplicate log date, overlapping cycle, second active pregnancy |
| idempotency-key-conflict | 409 | Idempotency Key Conflict | ours: same `Idempotency-Key`, different payload |
| stale-resource-version | 409 | Stale Resource Version | ours: version/`updated_at` mismatch on PATCH (when ETags land) |
| precondition-failed | 412 | Precondition Failed | ours: `If-Match` header present and mismatched |
| payload-too-large | 413 | Payload Too Large | `DATA_UPLOAD_MAX_MEMORY_SIZE` / upload limits |
| unsupported-media-type | 415 | Unsupported Media Type | `UnsupportedMediaType` |
| unprocessable-query | 422 | Unprocessable Query | ours: filter/sort params that parse but make no sense (`date_after` > `date_before`) |
| validation-failed | 422 | Validation Failed | `serializers.ValidationError` — **remapped from DRF's 400** |
| rate-limit-exceeded | 429 | Rate Limit Exceeded | `Throttled` (+ `Retry-After`; free-tier 3 AI chats/day lands here) |
| internal-server-error | 500 | Internal Server Error | anything unhandled — generic body, log with request id |
| service-unavailable | 503 | Service Unavailable | ours: DB/Redis/LLM provider down; add `Retry-After` |
| gateway-timeout | 504 | Gateway Timeout | ours: LLM/payment provider timed out |

## Field-level errors

`errors` is a map of field → list of messages, mirroring DRF's serializer error dict. Nested
serializers keep DRF's nesting; `non_field_errors` becomes a top-level `detail` sentence.

## Never in a problem body

Submitted health values, stack traces, SQL, internal hostnames, other users' identifiers.
