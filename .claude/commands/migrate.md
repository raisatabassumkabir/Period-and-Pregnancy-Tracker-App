---
description: Stub. There are no client-side DB migrations. Use this command for env-rotation and prebuild steps only.
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# /migrate

There is no client-side database. Migrations live in the backend repo.

## What this command is for

- **Env rotation.** When a new env var is added to `.env.production`,
  remind the user to update `app.config.ts` (if the var ships in the
  build) or `expo-constants` (if the var is read at runtime).
- **Native rebuild.** After adding or upgrading a native module
  (`expo-secure-store`, `react-native-iap`, etc.), the user must run
  `pnpm mobile prebuild:production` and rebuild via EAS. This command does
  **not** run those steps — it reminds the user to do so.
- **Prebuild + clean.** If the user has iOS / Android local issues,
  suggest `pnpm mobile prebuild --clean` followed by a fresh `pnpm install`.

## Out of scope for this command

- Backend migrations. Those live in the backend repo.
- DB schema in this client (the app does not own data storage).

## Don't

- Don't run `pnpm mobile prebuild --clean` autonomously. It removes
  `android/` and `ios/` and is destructive.
- Don't edit `android/` or `ios/` directly. The prebuild regenerates
  them.
- Don't bump native module versions without a ticket — see top
  `CLAUDE.md` "What's intentionally not done in this branch".
