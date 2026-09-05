# API endpoint — doc

Document every new endpoint in this format. Place the file under
`docs/api/<resource>-<verb>.md` and link it from the PR description.

## Endpoint

- **Method + path:** `POST /api/<resource>/<action>/`
- **Auth:** required / optional / none
- **Idempotency key:** required (per global `~/.claude/CLAUDE.md`)
- **Rate limit:** n/min (cite backend docs)
- **402-gated:** yes (feature: `<key>`) / no

## Query parameters

| Name  | Type   | Required | Notes                |
|-------|--------|----------|----------------------|
| `foo` | string | yes      | Description          |
| `bar` | int    | no       | Default `0`          |

## Request body

```ts
interface FooRequest {
  /** A clear, domain-driven description */
  fieldA: string;
  /** Optional context */
  fieldB?: number;
}
```

## Response

### 200 / 201

```ts
interface FooResponse {
  id: string;
  createdAt: string; // ISO 8601
}
```

### 4xx — error contract (RFC 9457, `application/problem+json`)

```json
{
  "type": "https://apiguide.dev/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more fields failed validation.",
  "instance": "/api/<resource>/",
  "errors": { "fieldA": ["This field is required."] }
}
```

List every status this endpoint can return with its `type` slug (see
`.claude/skills/api-design/errors.md`): 401, 404, 405 always; 400/409/415/422 on
writes; 429 when throttled.

### 402 — paywall (if gated)

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

## Notes

- **Idempotency:** the client passes an `Idempotency-Key: <uuid>` header.
  The server stores the result for 24h and replays the same response on
  retries.
- **Refetch trigger:** on success the client invalidates
  `['<resource>']` and `['me']` query keys. Note the keys in this doc
  so the React Query cache stays consistent.
- **Animations:** if the response drives a list, note whether the
  client uses `FlashList` with `estimatedItemSize` or `FlatList` with
  `getItemLayout`. Affects the test plan.

## Don't

- Don't put secrets in the response. The server must strip them.
- Don't return 200 with `{ ok: false }` in the body. Use the proper
  status code (per global `~/.claude/CLAUDE.md`).
- Don't change the response shape without a version bump.
