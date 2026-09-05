# Expo Monorepo Template

pnpm workspace for shipping a mobile app with its own backend: an Expo client
with auth, theming, i18n, a paywall, telemetry, tests and Claude Code tooling
already wired; a shared HTTP contract; and a slot for the server (Django or
Appwrite). Cut from a shipped app — the product screens were removed, the
infrastructure stayed.

```
.
├── apps/
│   ├── mobile/          Expo SDK 54 · RN 0.81 · Expo Router 6 · NativeWind 4 · React Query 5
│   └── backend/         placeholder — Django or Appwrite (see its README)
├── packages/
│   └── api-contract/    TS types + CONTRACT.md the client and server both follow
├── patches/             pnpm patch for react-native-css-interop (required by apps/mobile)
├── scripts/init-app.js  rename identity for a new app
├── .claude/             rules, hooks, agents, skills for Claude Code
└── .husky/ commitlint lint-staged prettier   repo-wide commit hygiene
```

Read [CLAUDE.md](CLAUDE.md) for the mobile architecture and the gotchas.
Read [packages/api-contract/CONTRACT.md](packages/api-contract/CONTRACT.md)
before writing a backend.

## Start a new app

```sh
# 1. copy the template
cp -r "D:/React Native/expo-template" ../my-app && cd ../my-app
git init

# 2. install (root — installs every workspace, applies the css-interop patch)
pnpm install

# 3. rename identity (env.js, app.config.ts, package names, storage keys)
pnpm init-app --name "My App" --slug my-app --bundle-id com.acme.myapp \
  --scheme myapp --owner acme --eas-project-id <uuid-from-eas-init>

# 4. mobile env
cp apps/mobile/.env.example apps/mobile/.env.development   # edit API_URL etc.

# 5. verify everything
pnpm check-all

# 6. run the client (dev client, not Expo Go — expo-iap needs native code)
pnpm mobile prebuild && pnpm mobile android
```

Then replace `apps/mobile/assets/*.png`, pick a default palette in
`apps/mobile/src/lib/theme/palettes.ts`, and start the backend per
`apps/backend/README.md`.

## Commands

Run from the repo root.

| Command | What |
| --- | --- |
| `pnpm mobile <script>` | Any script in `apps/mobile` (`start`, `android`, `ios`, `test`, `e2e-test`, `build:staging:android`, …) |
| `pnpm contract type-check` | Type-check the shared contract |
| `pnpm lint` / `type-check` / `test` / `check-all` | Every workspace that defines the script |
| `pnpm init-app …` | Rename identity for a new app |
| `pnpm -r --if-present <script>` | Fan a script out across workspaces |

EAS commands run inside `apps/mobile` (`cd apps/mobile && eas build …` or the
`pnpm mobile build:*` scripts). EAS uploads the git root and installs from it,
so the workspace and the patch come along.

## How the pieces talk

- `apps/mobile/src/api/types.ts` and `src/api/billing/types.ts` re-export
  `@repo/api-contract`. App code imports from those two modules, never from the
  package directly, so app-only types have a home.
- The backend implements `CONTRACT.md`. Its language does not matter to the
  client; only the paths, JSON shapes, status codes and the 402 body do.
- Adding a gated feature touches both sides through one key: add it to
  `PremiumFeature` in `packages/api-contract/src/billing.ts`, give it a title
  in the mobile upgrade sheet, and have the backend send it in 402 bodies.

## Removing pieces you don't need

- **No in-app purchases:** delete `apps/mobile/src/lib/billing/expo-iap-client.ts`
  + test, the `expo-iap` plugin in `app.config.ts`, the `setBillingClient` call
  in `src/lib/bootstrap.ts`, and `expo-iap` from `apps/mobile/package.json`. The
  upgrade sheet still compiles against the stub; delete
  `src/components/billing/` too if the app has no paywall at all.
- **No telemetry:** leave `AMPLITUDE_API_KEY` empty, or delete
  `src/lib/telemetry/` and the two `@amplitude/*` packages (and their mocks in
  `jest-setup.ts`).
- **No file sharing:** delete `src/lib/sharing/` and `expo-sharing` /
  `expo-file-system`.
- **No Arabic / RTL:** drop `src/translations/ar.json`, the `ar` entry in
  `src/lib/i18n/resources.ts`, and the option in
  `src/components/settings/language-item.tsx`. Adding a locale is the reverse:
  drop a JSON in `src/translations/`, register it in `resources.ts`, add the
  picker option; `translate()` keys are typed from `en.json`.
- **No backend in-repo:** delete `apps/backend/`; nothing depends on it.
