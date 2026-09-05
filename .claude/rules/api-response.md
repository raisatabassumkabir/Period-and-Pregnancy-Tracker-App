---
paths:
  - apps/mobile/src/api/**
  - packages/api-contract/**
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# API response rules

These rules apply to anything under `src/api/`. They are the client-side mirror of
the REST contract in global `~/.claude/CLAUDE.md`.

## Always type your responses

Every hook must declare a response type. Never infer from `axios` alone.

```ts
// BAD
const res = await client.get('/words/search');
return res.data;

// GOOD
return (await client.get<SearchWordsResponse>('/words/search')).data;
```

## Error shape — RFC 9457 Problem Details

Every non-2xx body is a `ProblemDetail` (`src/api/types.ts`, from
`@repo/api-contract`): `{ type, title, status, detail, instance?, errors? }`
served as `application/problem+json`. The 402 body is a `PaymentRequiredProblem`
(`src/api/billing/types.ts`) — the same shape plus `feature` / `current_usage` /
`limit` / `resets_at` extension members.

- Never destructure `error.response.data` blindly — narrow with
  `isProblemDetail` / `isPaymentRequiredProblem`.
- `detail` is a safe, human sentence: show it. Branch on `status` or
  `type` (`PROBLEM_TYPES.*`), never on `title`/`detail` text.
- 422 and 409 carry `errors` (field → messages, nested). Map them to form
  fields with `firstFieldError(errors, 'field')` — see
  `src/hooks/use-register-logic.ts` for the canonical example.
- 404 covers "not yours" too; never treat 403 as "exists but forbidden".
- The prose contract is `packages/api-contract/CONTRACT.md`.

## 402 — never handle per-screen

The axios interceptor in `src/api/common/client.tsx` already calls
`showUpgrade(detail)` on 402. Per-feature code that calls a 402-prone endpoint:

1. Does **not** need to inspect status 402.
2. May need to map 409/404 to user-facing copy (see
   `src/lib/billing/use-purchase-premium.ts` for the canonical example).

If a new endpoint is 402-gated, add its `feature` key to the `PremiumFeature`
union in `src/api/billing/types.ts` and wire copy into `src/components/billing/upgrade-sheet.tsx`.

## Idempotency keys

Per global CLAUDE.md: non-idempotent operations (POST, mutation) require an
`Idempotency-Key` header. If you add a new mutation that mutates user state
(purchase, pack subscribe, custom pack add), surface an `idempotencyKey` option
in the hook and pass it to axios as a header.

## Re-exports

Every `src/api/<domain>/index.ts` re-exports its public surface. Add new hooks
there so `import { useFoo } from '@/api'` keeps working.

## File shape

```ts
// src/api/<domain>/use-<verb>.ts
import { createQuery, createMutation } from 'react-query-kit';
import { client } from '../common';
import type { FooRequest, FooResponse, ProblemDetail } from './types';

export const useFoo = createQuery<FooResponse, void, AxiosError<ProblemDetail>>({
  queryKey: ['foo'],
  fetcher: async () => (await client.get<FooResponse>('foo/')).data,
});
```

Tests colocate: `use-<verb>.test.ts`. Cover at minimum: 200 happy path, 4xx
negative path, and (if 402-prone) 402 propagation.
