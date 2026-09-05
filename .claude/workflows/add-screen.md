---
name: add-screen
description: End-to-end pipeline for adding a new Expo Router screen. screen-builder → test-runner → reviewer, with optional E2E.
phases:
  - title: Build
    detail: screen-builder subagent scaffolds the screen, types, and (if needed) a custom hook.
  - title: Test
    detail: test-runner subagent writes the colocated test.
  - title: Review
    detail: reviewer subagent produces a diff review.
  - title: E2E
    detail: If the screen is part of a critical journey, e2e-add-flow skill adds a Maestro flow.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# Workflow: add-screen

End-to-end pipeline for adding a new Expo Router screen.

## Phase 1 — Build

- **Skill:** `add-screen`
- **Subagent:** `screen-builder`
- **Pre-req (if API needed):** `api-builder` must have shipped the hook
  first. Add an explicit dependency: "API hook `useX` already exists in
  `src/api/<domain>/`".
- **Inputs:** route path, auth-gated? (yes → `(app)/`), hook(s)
  consumed, list? (row height), 402-gated?
- **Outputs:** `<screen>.tsx`, colocated `*.test.tsx`, optional
  `use-<screen>-logic.ts` in `src/hooks/`

## Phase 2 — Test

- **Subagent:** `test-runner`
- **Outputs:** render + smoke assertions; happy path; empty state

## Phase 3 — Review

- **Subagent:** `reviewer`
- **Gate:** no `blocker` findings

## Phase 4 — E2E (optional)

- **Skill:** `e2e-add-flow`
- Run only if the screen is part of a critical user journey. The
  upgrade-sheet flow is the canonical example
  (`.maestro/app/upgrade-sheet.yaml`).

## Final

- `/commit` with prefix `feat(screen):` or `feat(app):`.

## Don't

- Don't add a per-screen auth gate.
- Don't `router.replace(...)` from a screen.
- Don't use `StyleSheet.create`.
- Don't ship without a colocated test.
