# Project rules (Claude)

> Single-page conventions. Defers to:
> - Global `~/.claude/CLAUDE.md` — REST contract (nouns, JSON, structured errors, no `any`, idempotency keys)
> - Top-level `CLAUDE.md` — architecture hand-off (402 contract, billing facade, theming, gotchas). **Read first when touching billing, auth-gating, theming or the upgrade sheet.**
> - `apps/backend/CLAUDE.md` — the Django API's rules (health-data rules 1–8, Problem+JSON, status codes). **Read first when touching `apps/backend`.**
> - `.claude/rules/*.md` — path-scoped rules (clean code, RN, API, auth, billing)
> - `.claude/skills/api-design/` — HTTP conventions distilled from apiguide.dev; load before adding or changing any endpoint, error, pagination or webhook
> - `packages/api-contract/CONTRACT.md` — the HTTP contract both sides implement

## Monorepo shape

```
apps/mobile/            Expo app (everything below marked `src/` lives here)
apps/backend/           Django 6 + DRF + Postgres/pgvector (apps/backend/apps/api; own git repo)
packages/api-contract/  shared TS types + CONTRACT.md
patches/                pnpm patch for react-native-css-interop (root-level; required)
scripts/init-app.js     rename identity for a new app
```

Run scripts from the root: `pnpm mobile <script>`, `pnpm contract type-check`,
`pnpm lint|type-check|test|check-all` (fans out). `pnpm install` only at the root.
Backend: `cd apps/backend/apps/api && uv run pytest` / `uv run ruff check .`
(see `apps/backend/CLAUDE.md`). Endpoint or schema changed → regenerate the client.

Paths written as `src/…` in the rules, agents and skills are relative to
`apps/mobile/`.

## Stack at a glance (apps/mobile)

| Layer | Choice |
|---|---|
| Language | TypeScript 5.9 (strict). No `any` — use `unknown` and narrow. |
| Framework | React Native 0.81 + Expo SDK 54 |
| Routing | Expo Router 6 (file-based, `src/app/`) |
| Server state | React Query 5 via `react-query-kit` |
| Client state | Zustand (use `createSelectors` helper, see `src/lib/utils.ts`) |
| HTTP | Axios — **always** via the shared `client` in `src/api/common/client.tsx` (402-aware) |
| API types | `@repo/api-contract`, re-exported through `src/api/types.ts` and `src/api/billing/types.ts` |
| Styling | **NativeWind v4** — `className` only. Never `StyleSheet.create`. |
| Theming | Six palettes via CSS variables (`src/lib/theme/`); `bg-canvas`, `bg-surface`, `text-ink`, `accent-*`, `accent2-*`, `tone-*` |
| Animations | Reanimated 3.19 (worklets on UI thread) + Moti |
| Forms | React Hook Form + Zod |
| Auth | JWT in `expo-secure-store` via `src/lib/auth/` |
| Billing | Pluggable Play Billing facade at `src/lib/billing/`. Real client registered in `src/lib/bootstrap.ts`. |
| Telemetry | Amplitude via `src/lib/telemetry/` (off when `AMPLITUDE_API_KEY` is empty) |
| i18n | i18next, `translate()` with keys typed from `en.json`; RTL flips via `I18nManager` |
| Tests | Jest 29 + `jest-expo`. Maestro for E2E (`apps/mobile/.maestro/`). |
| Build | EAS (development / staging / production profiles), run from `apps/mobile`. |

## Directory shape (apps/mobile/src)

```
api/<domain>/      # use-<verb>.ts (react-query-kit) + types.ts + *.test.ts + index.ts
api/common/        # client.tsx (axios + 402 interceptor) + api-provider.tsx
lib/<domain>/      # domain logic (auth, billing, sharing, upgrade, theme, i18n, hooks, telemetry)
components/ui/     # design-system atoms (Text, Button, Input, Modal, Kicker, Pill, ScreenHeader, …)
components/<domain>/   # feature UI (billing, auth, settings, animations)
app/               # Expo Router screens. (app)/ = auth-gated tabs.
hooks/             # cross-cutting custom hooks
translations/      # i18next JSON
```

Tabs are **Home · Settings** (`src/app/(app)/`). Add a tab by adding a file
there plus a `Tabs.Screen` in `(app)/_layout.tsx`.

`src/components/ui/` holds the shared atoms every screen reuses. Use them; do
not re-create them per screen.

## Naming

- Files: **kebab-case** (`use-register-logic.ts`, `subscription-card.tsx`)
- Variables/functions: **camelCase**
- Types/interfaces: **PascalCase**, prefer `interface` for props
- Component functions: take `props: Props` — not `React.FC<Props>`
- Function cap: **90 lines** (project rule). 290 in ESLint (safety net).

## The 402 contract — single point of truth

Any feature that needs a paywall **must** rely on the global interceptor in `src/api/common/client.tsx`. Every error body is an RFC 9457 problem; the 402 one that lights up the upgrade sheet:

```json
{ "type": "https://apiguide.dev/status-codes/402/", "title": "Payment Required", "status": 402, "detail": "...", "feature": "premium", "current_usage": 15, "limit": 15 }
```

Never wire a 402 handler per-screen. The `UpgradeSheet` is mounted once in `src/app/_layout.tsx` and observes `useUpgrade` (Zustand). The `feature` enum is `PremiumFeature` in `packages/api-contract/src/billing.ts`. Full deep-dive in the top-level `CLAUDE.md`.

## Tests

- Place tests **next to source**: `foo.ts` → `foo.test.ts`.
- Run: `pnpm mobile test` (all) or `pnpm mobile test <pattern>`.
- E2E: `pnpm mobile e2e-test` (Maestro). Add new flow under `apps/mobile/.maestro/app/`.
- `react-native-css-interop` is patched via `patches/react-native-css-interop@0.2.1.patch` (root `package.json` → `pnpm.patchedDependencies`) so babel resolves without `react-native-worklets` (Reanimated 4 only). Do not delete `patches/` — Jest *and* the Metro bundle break without it.

## Before you commit

- `pnpm check-all` (lint + type-check + test across workspaces) — must pass for files you touched.
- Conventional commits (enforced by `commitlint.config.js` at the root).
- Never commit `.env*`, `*.key`, `*.pem`, `*.p8`, `*.p12`, `*.jks`, `*.mobileprovision`. The `pre-tool-use-secret-guard` hook blocks most attempts; this is a backup.
