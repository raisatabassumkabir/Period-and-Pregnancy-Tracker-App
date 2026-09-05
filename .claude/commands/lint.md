---
description: Run ESLint. Defaults to a focused file; pass nothing for the full project.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# /lint [file]

Run ESLint.

## Defaults

- With argument → `pnpm mobile exec eslint <file>` (path relative to `apps/mobile`).
- Without argument → `pnpm lint` (every workspace, from the root).

## Examples

- `/lint src/api/billing/use-verify-purchase.ts`
- `/lint`

## Safe `--fix` categories

These auto-fix without review:

- `simple-import-sort/imports` and `simple-import-sort/exports`
- `prettier/prettier`
- `tailwindcss/classnames-order`
- `unused-imports/no-unused-imports` (only when import is truly dead)

Apply them with `pnpm mobile exec eslint <file> --fix`.

## Don't auto-fix

- `react-compiler/react-compiler` — follow the compiler's hint manually.
- `max-lines-per-function` — extract a hook / sub-component.
- `@typescript-eslint/no-explicit-any` — replace with `unknown` and narrow.
