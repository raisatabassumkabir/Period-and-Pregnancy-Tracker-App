---
description: Conventional-commit-style commit message for staged changes. Wraps the global `commit` skill with project-specific guardrails.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# /commit

Create a commit for the current staged (or unstaged) changes.

## Project guardrails

- **Never** include `.env*`, `*.key`, `*.pem`, `*.p8`, `*.p12`, `*.jks`,
  `*.mobileprovision` in a commit. If any are staged, unstage them first.
- Use the **conventional commit** format enforced by `commitlint.config.js`.
  Allowed types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`,
  `style`, `perf`, `build`, `ci`, `revert`.
- One concern per commit. Don't mix refactor + behaviour change.
- Subject line ≤ 72 chars, no trailing period. Body wrapped at 72.
- Footer: `Refs: <issue>` and `BREAKING CHANGE: <note>` if applicable.

## Process

1. `git status` and `git diff --staged` (or all changes if nothing staged).
2. If `.env*` or other secret files are staged → unstage them, abort, and
   tell the user.
3. Use the global `commit` skill (`~/.claude/skills/commit`) for the
   message format.
4. `pnpm check-all` before committing? Only if the user asked for it. By
   default, run `pnpm mobile exec eslint <changed files>` and
   `pnpm mobile test <related tests>`.
5. `git commit -m "<subject>" -m "<body>"`.
6. Show the resulting `git log -1` to confirm.

## Don't

- Don't `git commit --amend` a commit that's already on `main`.
- Don't `git push` from this command. That's a separate step the user
  confirms.
- Don't skip the lint / test step unless the user says so.
- Don't add a `Co-Authored-By: Claude` line unless the project already
  does. Check the most recent commits for the convention.
