---
name: release-prep
description: Pre-release pipeline. test-runner → security-auditor → reviewer, then version bump and release notes.
phases:
  - title: Validate
    detail: test-runner runs pnpm check-all and pnpm mobile e2e-test.
  - title: Audit
    detail: security-auditor runs the full security checklist.
  - title: Review
    detail: reviewer subagent reviews the full diff.
  - title: Cut
    detail: Version bump, release notes, tag, push. User confirms external steps.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# Workflow: release-prep

Pre-release pipeline. Use before tagging a new version or pushing to EAS
production.

## Phase 1 — Validate

- **Skill:** `release-prep` (phase 1)
- **Subagent:** `test-runner`
- **Commands:**
  - `pnpm check-all` (lint + type-check + test)
  - `pnpm mobile e2e-test` (Maestro flows)
- **Gate:** every check green. The template starts with zero TS and lint
  errors; keep that baseline.

## Phase 2 — Audit

- **Subagent:** `security-auditor` (full audit, no diff scope)
- **Gate:** no `blocker` findings. Open follow-up issues for `major`
  findings that the team has decided to defer.

## Phase 3 — Review

- **Subagent:** `reviewer` (full `main...HEAD` diff)
- **Gate:** no `blocker` findings.

## Phase 4 — Cut

The user (not Claude) must perform the destructive steps. Claude drafts,
the user confirms.

- **Version bump:** `pnpm run version` (per `package.json` — runs
  `prebuild` and `git add .`). Or `pnpm run app-release` for a
  full `np` release.
- **Release notes:** use `.claude/templates/pr-description.md` as the
  scaffold; trim to user-facing summary.
- **Tag + push:** `git tag vX.Y.Z && git push --tags`. User confirms.
- **Build:** `eas build --profile production --platform all`. **User
  only.** Don't run autonomously.
- **Submit:** `eas submit --platform all`. **User only.**
- **Post-release:** watch Sentry / logs for the first hour. Rollback
  via `eas update --branch production --revert` if a regression
  appears.

## Don't

- Don't run `eas build` or `eas submit` autonomously. These are
  external and irreversible.
- Don't ship with a `blocker` from any phase.
- Don't include the `react-native-iap` install or
  `expo-secure-store` migration in a release. Those are tracked
  separately.
