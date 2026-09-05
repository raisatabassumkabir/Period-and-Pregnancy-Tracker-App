---
description: Run the reviewer subagent against the current diff (or the specified base..head).
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# /review [base]

Review the diff using the `reviewer` subagent.

## Defaults

- No argument → diff is `main...HEAD` (or the merge-base of HEAD if no
  `main` ref).
- Argument → diff is `<base>...HEAD`.

## Process

1. Spawn the `reviewer` subagent with the diff range and the list of
   project rules to load.
2. The reviewer returns a one-line-per-finding list and a 1-paragraph
   summary (ship / ship-with-nits / block).
3. Display the report. No auto-fix. The user decides.

## Severity

- `blocker` — must fix in this PR.
- `major` — fix in this PR or open an issue.
- `minor` / `nit` — log in the PR description.

## Notes

- Read `.claude/CLAUDE.md` first for stack conventions.
- The reviewer is **read-only**. It will not edit files.
