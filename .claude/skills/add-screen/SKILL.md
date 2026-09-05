---
name: add-screen
description: Add a new Expo Router screen under src/app/ with auth gate, NativeWind layout, query wiring, and a colocated smoke test. Use when adding a new route, modal, or tab.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# add-screen

## When to use

- "Add a `<name>` screen"
- "Add a settings sub-page for `<feature>`"
- "Add a modal for `<flow>`"
- "Add a tab for `<section>`"

## Steps

1. **Read the rules.** Load `.claude/rules/react-native.md` and
   `.claude/rules/clean-code.md`.

2. **Pick the route.**
   - Public (no auth): `src/app/<screen>.tsx` (e.g. `login.tsx`,
     `register.tsx`).
   - Auth-gated: `src/app/(app)/<screen>.tsx`. The `(app)/_layout.tsx`
     already gates.
   - Modal / modal stack: `src/app/(app)/<screen>.tsx` with `presentation:
     'modal'` in the layout.

3. **If the screen consumes an API**, hand off to `api-builder` for the
   hook first. The hook must exist before the screen imports it.

4. **Hand off to the `screen-builder` subagent** with:
   - the route path
   - the hook(s) it consumes
   - the auth requirement (yes / no)
   - whether it's a list (and row height, for `FlashList`)
   - whether it surfaces a 402-gated premium feature (then also
     `billing-feature-builder`)

5. **Tests.** Hand off to `test-runner` for the colocated `*.test.tsx`.
   Assert title, key UI, empty state.

6. **E2E (optional).** If the screen is part of a critical user flow,
   hand off to `e2e-add-flow` for a Maestro flow.

7. **Verification.** `pnpm mobile test <file>` + `pnpm mobile exec eslint <file>` +
   `pnpm type-check`. Hand off to `reviewer` for the diff.

8. **Commit.** `/commit`. Prefix: `feat(screen):` or `feat(app):`.

## Don't

- Don't add a per-screen auth gate. The root layout and `(app)/_layout.tsx`
  own redirects.
- Don't `router.replace(...)` from a screen.
- Don't use `StyleSheet.create`.
- Don't add a screen with no test.
