---
description: Run the security-auditor subagent against the current diff or full tree.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# /security-check [base]

Run a security audit using the `security-auditor` subagent.

## Defaults

- No argument → full audit (no diff).
- Argument → diff is `<base>...HEAD`.

## Process

1. Spawn the `security-auditor` subagent with the diff range (or
   `main` for full audit) and the rules to load.
2. The auditor returns a one-line-per-finding list and a 1-paragraph
   summary (clear-to-ship / ship-with-nits / block).
3. Display the report. Triages:
   - `blocker` — fix before merge.
   - `major` — fix in this PR or open an issue.
   - `minor` / `informational` — log in the PR description.

## Common things it checks

- Token storage hygiene (`src/lib/auth/`)
- 401 handling in the axios interceptor
- Deep-link allowlist (`src/app/_layout.tsx`)
- 402 / billing contract drift (every `PremiumFeature` key has sheet
  copy; no per-screen 402 handlers)
- Play Billing acknowledgement flow
- `.env*` not committed
- No secret literals in `src/`

## Notes

- The auditor is **read-only**. It will not edit files.
- The `pre-tool-use-secret-guard` hook should have already blocked most
  secret-shaped edits; this is the static-analyser backstop.
- Pair with `/release-prep` before tagging a version.
