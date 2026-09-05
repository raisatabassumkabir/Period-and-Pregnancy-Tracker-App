---
description: Review API changes against CLAUDE.md conventions and the api-design skill checklist
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git -C apps/backend:*), Read, Grep, Glob
---

Review the API changes for this branch against the conventions in `apps/backend/CLAUDE.md`,
`packages/api-contract/CONTRACT.md`, and the checklist in `.claude/skills/api-design/SKILL.md`
§7 (load the `api-design` skill first).

Scope: `$ARGUMENTS` if given (a path, a PR number, or a description); otherwise
`git -C apps/backend diff main...HEAD -- apps/api` plus uncommitted changes
(`git -C apps/backend diff`, `git -C apps/backend status`). The backend is its own git repo.

For every finding report:
- `file:line`
- the rule broken (quote the apps/backend/CLAUDE.md line, CONTRACT.md line, or checklist item)
- a concrete fix (code, not advice)
- the apiguide.dev URL that explains the rule, from `.claude/skills/api-design/guides.md` or
  `errors.md`

Order findings: (1) health-data / authorization rules 1–8 (apps/backend/CLAUDE.md), (2) error contract (Problem+JSON,
400 vs 422 vs 409, leaked values), (3) status codes and headers, (4) idempotency and retries,
(5) naming, pagination, data formats, (6) missing tests, contract drift (`packages/api-contract` vs the DRF serializers), or an
un-regenerated client.

End with a one-line verdict: **ready** / **fix before merge** / **needs an authorization
callout in the PR description**. Do not restate the diff and do not praise what is fine.
