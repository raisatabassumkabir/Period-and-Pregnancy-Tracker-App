---
name: e2e-add-flow
description: Add a Maestro E2E flow for a user journey. Pattern from .maestro/app/upgrade-sheet.yaml.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# e2e-add-flow

## When to use

- "Add a Maestro flow for `<journey>`"
- "Cover `<feature>` with an E2E test"
- "Add a smoke test for the new screen"

## Steps

1. **Read the existing flows.** `.maestro/app/upgrade-sheet.yaml` is
   the canonical reference. Note:

   - Header: `appId: com.example.app.development` (passed via `-e APP_ID=`
     at runtime; can be `com.example.app.staging` or `com.example.app` in CI).
   - Step types: `launchApp`, `tapOn`, `inputText`, `assertVisible`,
     `runFlow`, `swipe`, `scroll`, `waitForAnimationToEnd`.
   - File naming: kebab-case, ends in `.yaml`.

2. **Hand off to `screen-builder`** if the journey depends on a screen
   that doesn't exist yet.

3. **Write the flow.** Conventions:

   - One file per journey. Split long journeys into multiple files
     with `runFlow` linking.
   - Always `launchApp` first (clean state).
   - Use `assertVisible` after each significant action to confirm
     progress.
   - Use `extendedWaitUntil: { visible: ... }` on async content
     (sheet open, network response, etc.).
   - Tag selectors with `id:` or `text:`. Avoid `accessibilityLabel`
     unless it's the only stable selector.
   - End with a final `assertVisible` on the success state.

4. **Local validation.** `pnpm mobile e2e-test .maestro/app/<flow>.yaml -e
   APP_ID=com.example.app.development` against a running simulator. The
   user runs the simulator; Claude writes and edits flows.

5. **Add to CI.** Update `pnpm mobile e2e-test` invocation in
   `package.json` if the new flow should run on every PR. Otherwise
   leave it as a manual run.

6. **Commit.** `/commit`. Prefix: `test(e2e):` or
   `feat(e2e):`.

## Don't

- Don't rely on `testID` that doesn't exist in the component. Add
   `testID` to the component as part of the same PR.
- Don't write a flow that depends on a real backend state (e.g.
  "user has 100 items saved"). Use deterministic seed data or
  onboarding steps.
- Don't capture screenshots in the flow file. Maestro handles
  artifacts separately.
- Don't gate production E2E on flows that need dev-only flags.
