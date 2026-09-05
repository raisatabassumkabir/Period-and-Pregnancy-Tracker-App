---
name: add-endpoint
description: End-to-end pipeline for adding a new API hook. api-builder → test-runner → reviewer.
phases:
  - title: Build
    detail: api-builder subagent writes the hook, types, test, and re-export.
  - title: Test
    detail: test-runner subagent extends coverage and validates.
  - title: Review
    detail: reviewer subagent produces a one-line-per-finding diff review.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# Workflow: add-endpoint

End-to-end pipeline for adding or extending a React Query hook under
`src/api/<domain>/`.

## Phase 1 — Build

- **Skill:** `add-endpoint`
- **Subagent:** `api-builder`
- **Inputs:** endpoint path, request/response shape, 402-gated? (and
  `feature` key if so), idempotency requirement, pagination
- **Outputs:** `use-<verb>.ts`, `types.ts` delta, `*.test.ts`,
  `index.ts` re-export
- **Hand-off:** if 402-gated, also run `billing-feature-builder` before
  this phase completes

## Phase 2 — Test

- **Subagent:** `test-runner`
- **Inputs:** the new hook file path
- **Outputs:** colocated test passing locally; coverage on 200, 4xx, and
  (if 402-prone) 402 propagation
- **Gate:** `pnpm mobile test <file>` must be green before phase 3

## Phase 3 — Review

- **Subagent:** `reviewer`
- **Inputs:** `git diff main...HEAD`
- **Outputs:** one-line-per-finding list + ship / ship-with-nits / block
- **Gate:** no `blocker` findings

## Final

- `/commit` with prefix `feat(api):` or `fix(api):`.
- PR description from `.claude/templates/pr-description.md`.

## Don't

- Don't merge past a `blocker` review finding.
- Don't add the hook under `src/hooks/` (cross-cutting UI hooks only).
- Don't add a 402 handler in the hook.
