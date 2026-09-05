---
description: Run Jest tests. Defaults to the full suite; pass a pattern to scope.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# /test [pattern]

Run the Jest test suite.

## Defaults

- No argument → `pnpm test` from the root (every workspace with a test script).
- Argument → `pnpm mobile test <pattern>` (Jest substring match on file path, relative to `apps/mobile`).

## Examples

- `/test` — all tests
- `/test use-verify-purchase` — only the `use-verify-purchase` tests
- `/test src/api/billing` — all tests under that directory

## Notes

- `patches/react-native-css-interop@0.2.1.patch` (root) is required for
  Jest to load. Do not remove it.
- `--coverage` is available via `pnpm mobile test:ci`.
- `--watch` is available via `pnpm mobile test:watch`.
