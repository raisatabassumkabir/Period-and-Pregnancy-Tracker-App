---
name: security-review
description: Periodic security pass. Audits token storage, deep links, env hygiene, 402 contract drift, and Play Billing acknowledgement flow.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# security-review

## When to use

- Before a release (paired with `release-prep`).
- After a major change to `src/lib/auth/`, `src/api/auth/`, or
  `src/lib/billing/`.
- When a contributor adds a new deep-link handler.
- Quarterly.

## Steps

1. **Hand off to the `security-auditor` subagent** with `main...HEAD` as
   the diff (or `main` only for a full audit).

2. **Review the report.** The auditor returns a one-line-per-finding
   list plus a 1-paragraph summary (clear / ship-with-nits / block).

3. **Triage findings** by severity:
   - `blocker` — fix before merge.
   - `major` — fix in the same PR or a follow-up with an issue.
   - `minor` / `informational` — log in the PR description.

4. **Address blockers** in this branch. For majors without time, open
   an issue and link it in the PR description.

5. **Re-run** the auditor after fixes until no blockers remain.

6. **Commit the audit summary** (no diff, just a checklist in the PR
   description) so it's part of the release record.

## Common findings to expect

- `getToken()` reader pattern — the only AsyncStorage access for tokens.
  Flag any other import.
- 402 contract drift — a new gated endpoint without a `PremiumFeature`
  union entry. Block.
- `console.log(token)` in a hook. Block.
- `Linking.openURL` with user input. Block.
- `expo-secure-store` migration noted as deferred in the top CLAUDE.md
  but silently dropped. Informational.

## Don't

- Don't run the auditor against `node_modules/` or generated files.
- Don't block on `minor` findings.
