---
name: add-endpoint
description: Wire a new API hook (query or mutation) under src/api/<domain>/. Use when adding or extending a backend integration.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# add-endpoint

## When to use

- "Add a hook for `<verb>-<resource>`"
- "Wire up `/<path>`"
- "Add a mutation for `<feature>`"
- "Add a paginated query for `<resource>`"

## Steps

1. **Read the rules.** Load `.claude/rules/api-response.md` and the
   `.claude/rules/clean-code.md` excerpts on types and naming.

2. **Pick the domain.** If `src/api/<domain>/` doesn't exist, scaffold it
   with `index.ts`, `types.ts`, and the pattern from a sibling domain
   (e.g. `src/api/auth/`).

3. **Hand off to the `api-builder` subagent** with:
   - the exact path (e.g. `payments/google-play/verify-purchase/`)
   - the request/response shape (cite `API_INTEGRATION_GUIDE.md` or
     `MOBILE_API_GUIDE.md`; ask the user if unclear)
   - whether the endpoint is 402-gated (and the `feature` key, if so)
   - whether the response is paginated (use `keepPreviousData` /
     `useInfiniteQuery` accordingly)

4. **If 402-gated**, also hand off to `billing-feature-builder` for the
   `PremiumFeature` union entry, upgrade-sheet copy, and 402 test.

5. **Tests.** Hand off to `test-runner` to write the colocated
   `*.test.ts`. Cover 200, 4xx, and — if 402-prone — 402 propagation.

6. **Verification.** `pnpm mobile test <file>` + `pnpm mobile exec eslint <file>` +
   `pnpm type-check`. Hand off to `reviewer` for the diff.

7. **Commit.** Use the `/commit` slash command. Conventional commit
   prefix `feat(api):` or `fix(api):`.

## Don't

- Don't add the hook under `src/hooks/`. That's for cross-cutting UI hooks.
- Don't add a 402 handler in the hook. The interceptor handles it.
- Don't add a new `axios.create(...)`. Reuse `client`.
- Don't skip the test.
