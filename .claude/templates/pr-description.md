# PR description

Use this template for every PR. Trim to user-facing summary for the
release notes; keep the full version in the PR body.

## Summary

<!-- 1-2 sentences. What does this PR do? Use the imperative mood: "Add
the X surface" not "Added the X surface". -->

## Why

<!-- Business / user reason for the change. Not "the lint complained".
Cite the issue or ticket. -->

Resolves: <issue-link>

## Changes

<!-- Bullet list of changes, grouped by file or by concern. -->

- `src/api/<domain>/use-<verb>.ts` — added `<feature>` query
- `src/api/<domain>/types.ts` — added `FooRequest`, `FooResponse`
- `src/api/<domain>/use-<verb>.test.ts` — 200 + 4xx coverage
- `src/app/(app)/<screen>.tsx` — new screen under the auth-gated group

## Test plan

<!-- How the reviewer can verify the change. -->

- [ ] `pnpm check-all` green
- [ ] Manual: log in, navigate to `<screen>`, observe `<behaviour>`
- [ ] E2E: `pnpm mobile e2e-test .maestro/app/<flow>.yaml`
- [ ] If 402-gated: verify the upgrade sheet appears on a gated action

## Screenshots / screen recordings

<!-- Attach for UI changes. -->

## Risk

<!-- What could go wrong? Mitigations? -->

- Low / Medium / High
- Rollback plan: revert the merge commit; `eas update --revert` for OTA
  fix; or `eas build` from `main` for a new build.

## Backwards compatibility

<!-- Schema changes, env var changes, deprecations. -->

- [ ] No DB / API changes
- [ ] No new env vars
- [ ] No new dependencies

