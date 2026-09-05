---
name: add-billing-feature
description: End-to-end pipeline for adding a 402-gated premium feature. billing-feature-builder → security-auditor → test-runner → reviewer.
phases:
  - title: Build
    detail: billing-feature-builder subagent extends PremiumFeature, wires the hook, and adds sheet copy.
  - title: Audit
    detail: security-auditor checks 402 contract drift and Play Billing acknowledgement flow.
  - title: Test
    detail: test-runner writes the 402 propagation test.
  - title: Review
    detail: reviewer subagent produces a diff review.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# Workflow: add-billing-feature

End-to-end pipeline for adding a paywalled feature. 402 contract changes
are contract-breaking; all four phases must complete before merge.

## Phase 1 — Build

- **Skill:** `add-billing-feature`
- **Subagent:** `billing-feature-builder`
- **Inputs:** `feature` key (must match the backend), sheet title,
  consuming surface (screen or component)
- **Outputs:**
  - new `PremiumFeature` entry in `src/api/billing/types.ts`
  - title in `src/components/billing/upgrade-sheet.tsx`
  - hook (delegated to `api-builder`)
  - consuming surface (delegated to `screen-builder`)
  - 402 propagation test

## Phase 2 — Audit

- **Subagent:** `security-auditor`
- **Gate:** no `blocker` findings on 402 contract drift, no new
  per-screen 402 handlers, every gated `feature` key has sheet copy
- **Notes:** if the auditor finds a missing `feature` key, that's a
  `blocker`. Fix in the same PR.

## Phase 3 — Test

- **Subagent:** `test-runner`
- **Gate:** `pnpm test` (full suite) must be green. 402 contract
  changes can break adjacent tests.

## Phase 4 — Review

- **Subagent:** `reviewer`
- **Gate:** no `blocker` findings

## Final

- `/commit` with prefix `feat(billing):` or `fix(billing):`.
- Update `FEATURES_CHECKLIST.md` if it tracks premium features.
- Update the top-level `CLAUDE.md` "What was built" table if a new
  feature surface lands.

## Don't

- Don't reuse the catch-all `'premium'` key.
- Don't acknowledge the purchase twice.
- Don't ship without a 402 test.
- Don't ship with the existing 104-test suite regressing.
