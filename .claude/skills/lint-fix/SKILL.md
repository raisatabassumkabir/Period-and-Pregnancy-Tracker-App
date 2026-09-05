---
name: lint-fix
description: Localised lint repair. Resolves a specific ESLint / Prettier / type error without touching out-of-scope files.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# lint-fix

## When to use

- "`pnpm lint` is failing on `<file>`"
- "`pnpm type-check` is failing on `<file>`"
- "Pre-commit hook is rejecting my staged files"
- "I have a specific error code and want the minimal fix"

## Steps

1. **Read the error.** `pnpm mobile exec eslint <file>` and
   `pnpm type-check` (full project — type errors are global). Capture
   the exact codes and lines.

2. **Check the file is ours.** Vendored or generated code (`node_modules/`,
   `apps/mobile/android`, `apps/mobile/ios`) is never lint-fixed; surface
   the conflict in the PR description instead.

3. **Fix the smallest possible change.** Rules reminders:

   - **`@typescript-eslint/consistent-type-imports`** — use
     `import type { Foo } from '...'` for type-only imports.
   - **`unused-imports/no-unused-imports`** — delete the import.
   - **`simple-import-sort/imports`** — run
     `pnpm mobile exec eslint <file> --fix` for this category. Safe.
   - **`prettier/prettier`** — `pnpm exec prettier --write <file>`.
     Safe.
   - **`tailwindcss/classnames-order`** — `pnpm mobile exec eslint <file>
     --fix`. Safe.
   - **`unicorn/filename-case`** — rename to kebab-case (skip for
     `/android` and `/ios` per config).
   - **`max-lines-per-function`** — extract a hook or sub-component.
   - **`@typescript-eslint/no-explicit-any`** — replace with `unknown`
     and narrow.
   - **`react-compiler/react-compiler`** — follow the compiler's
     hint. Common: lift computation out of JSX, stabilise references
     with `useMemo` / `useCallback`.

4. **Re-run** `pnpm mobile exec eslint <file>` and `pnpm type-check` until
   clean.

5. **Run** `pnpm mobile test <related test file>` to ensure the fix didn't
   break behaviour.

6. **Commit.** `/commit`. Prefix: `style:` or `fix(lint):`.

## Don't

- Don't run `pnpm mobile exec eslint . --fix` on the whole project. Scope to
  the failing file(s).
- Don't disable a rule with `// eslint-disable-next-line` without a
  comment explaining why.
- Don't fix the pre-existing TS error zones.
- Don't bump ESLint / Prettier versions. Out of scope.
- Don't mass-rename to satisfy `unicorn/filename-case` — propose
  renames in the PR description if the change is non-trivial.
