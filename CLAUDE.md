# CLAUDE.md — architecture hand-off

This is the reusable Expo monorepo starter cut from a shipped production app.
It keeps every piece of infrastructure that was app-agnostic and drops the
product screens. This file explains how the pieces fit and the gotchas that
cost real debugging time. `.claude/CLAUDE.md` has the one-page conventions.

## Monorepo

```
apps/mobile/            the Expo client — every `src/…` path below is relative to it
apps/backend/           Django or Appwrite; README only until an app needs it
packages/api-contract/  @repo/api-contract — TS types + CONTRACT.md shared by client and server
patches/                pnpm patch for react-native-css-interop (must stay at the root)
```

pnpm workspace with `node-linker=hoisted` (`.npmrc`), which is what Expo's
metro config expects in a monorepo: one `node_modules` at the root, workspace
packages symlinked into it. `expo/metro-config` detects the workspace root and
adds it to `watchFolders` on its own, so `apps/mobile/metro.config.js` carries
no monorepo code.

`@repo/api-contract` ships TypeScript source (`main: src/index.ts`) with no
runtime — types only. Metro, Jest and tsc all read it straight from
`packages/api-contract/src`. The mobile app reaches it only through
`src/api/types.ts` and `src/api/billing/types.ts`, which re-export by name so
app-only types have a home and the two `export *` in `src/api/index.tsx`
never collide.

Install only at the root. `pnpm.patchedDependencies` lives in the root
`package.json` because pnpm applies patches per workspace root, not per app.
Husky, commitlint, lint-staged and prettier are root devDependencies for the
same reason; `lint-staged.config.js` runs eslint inside `apps/mobile` via
`pnpm --filter mobile exec`.

## What the template ships (apps/mobile unless noted)

| Area | Files |
| --- | --- |
| Env loading + validation (zod, per-`APP_ENV` files) | `env.js`, `src/lib/env.js`, `.env.example` |
| Axios client with auth header + global 402 interceptor | `src/api/common/client.tsx` |
| React Query provider | `src/api/common/api-provider.tsx` |
| Auth API hooks (login, register, me, logout, delete, google, forgot/reset) | `src/api/auth/` |
| Auth store + secure token storage | `src/lib/auth/` |
| Root auth gate (single redirect point) | `src/app/_layout.tsx` |
| Auth screens | `src/app/{onboarding,login,register}.tsx`, `src/components/auth/`, `src/hooks/use-register-logic.ts` |
| Tab shell (Home · Settings) | `src/app/(app)/` |
| Settings (profile, subscription, language, theme, palette, links, delete account, logout) | `src/components/settings/` |
| Six-palette light/dark theming through CSS variables | `src/lib/theme/`, `tailwind.config.js`, `src/lib/use-theme-config.tsx` |
| Design-system atoms | `src/components/ui/` |
| Upgrade store + animated upgrade sheet + premium badge + subscription card | `src/lib/upgrade/`, `src/components/billing/` |
| Play Billing facade + expo-iap implementation + purchase orchestrator | `src/lib/billing/` |
| Billing API hooks (verify-purchase, subscription-status) | `src/api/billing/` |
| Shared HTTP contract (types + prose) | `packages/api-contract/` (root) |
| Backend slot with Django / Appwrite notes | `apps/backend/README.md` (root) |
| File-share facade (expo-sharing impl) | `src/lib/sharing/` |
| Amplitude telemetry facade | `src/lib/telemetry/` |
| i18n (en, ar, RTL) | `src/lib/i18n/`, `src/translations/` |
| Store / legal / support links | `src/lib/external-links.ts` |
| Reanimated wrappers | `src/components/animations/` |
| Jest setup + mocks + colocated tests | `jest.config.js`, `jest-setup.ts`, `__mocks__/`, `**/*.test.ts(x)` |
| Maestro E2E (fresh launch, login validation, tabs, upgrade sheet) | `.maestro/` |
| EAS profiles | `eas.json` |
| Claude Code rules, hooks, agents, skills | `.claude/` (root) |
| Identity rename script | `scripts/init-app.js` (root) |

## Architecture

### The 402 contract — single point of truth

The axios interceptor in `src/api/common/client.tsx` inspects every response.
On 402 it parses the body and dispatches `showUpgrade(detail)` on the Zustand
store in `src/lib/upgrade/index.tsx`. `UpgradeSheet` is mounted once in
`src/app/_layout.tsx` and observes that store, so any 402 from any endpoint
lights up the same sheet with no per-screen wiring.

```json
{ "type": "https://apiguide.dev/status-codes/402/", "title": "Payment Required", "status": 402, "detail": "…", "feature": "premium", "current_usage": 15, "limit": 15 }
```

Every error body is an RFC 9457 Problem Details object (`ProblemDetail` in
`packages/api-contract`); the 402 one adds the paywall fields as extension
members. The interceptor narrows with `isPaymentRequiredProblem` and dispatches
`showUpgrade(toUpgradeDetail(problem))`. The sheet picks a title from `feature`
(fallback "Upgrade to Premium") and shows `detail` as the subtitle. **Never write a quota number into UI
copy**; the 402 body is the only authority.

To gate a new feature: add the key to `PremiumFeature`
(`packages/api-contract/src/billing.ts`), add a title to `FEATURE_TITLES`
(`src/components/billing/upgrade-sheet.tsx`), have the backend send it. Done.

### Google Play Billing — pluggable facade

`src/lib/billing/index.ts` exposes a minimal `BillingClient` interface
(`getProducts`, `requestSubscription`, `acknowledgePurchase`,
`getAvailablePurchases`). The production implementation is
`expo-iap-client.ts` (expo-iap 5, needs a dev client / EAS build, not Expo
Go). `src/lib/bootstrap.ts` registers it on Android at startup. The no-op stub
is the default so unit tests never touch the native module.

Error mapping: `user-cancelled` → `PurchaseCancelledError` (hook resets to
idle, no banner); `pending` → `PurchasePendingError` (entitlement arrives via
RTDN); everything else → `BillingError` with the Play code.

`usePurchasePremium` orchestrates:

```
opening → requestSubscription
verifying → POST /payments/google-play/verify-purchase/
acknowledging → acknowledgePurchase (Play SDK)
success → invalidate ['payments', 'subscription-status'] + ['me']
```

Set `PREMIUM_PRODUCT_IDS` / `DEFAULT_PRODUCT_ID` to the app's Play Console
subscription ids. If the app has no IAP, delete `src/lib/billing/expo-iap-client.ts`,
its test, the `expo-iap` plugin line in `app.config.ts`, and the registration
in `bootstrap.ts`; the facade stub keeps the upgrade sheet compiling.

### Subscription status

Source of truth is `GET /api/payments/subscription-status/` via
`usePaymentSubscriptionStatus`. Callers pass `refetchOnWindowFocus: true` so a
purchase completed elsewhere shows on foreground. A successful purchase
invalidates the same query so the UI flips to Premium immediately.

### Auth

- Tokens: `expo-secure-store` via `src/lib/auth/utils.tsx` (key
  `app.auth.token`, renamed by `pnpm init-app`). One-time migration from a
  legacy AsyncStorage `token` entry.
- Store: `useAuth` (Zustand + `createSelectors`) with `idle | signIn | signOut`.
- Redirects: **only** the root layout redirects on auth state. Screens never do.
- Signed-out users land on `/login`. `/onboarding` exists but nothing routes to
  it; wire `useIsFirstTime` if the app wants a welcome step.

### Theming

`src/lib/theme/palettes.ts` holds six palettes as CSS custom properties
(space-separated sRGB channels). `tailwind.config.js` maps them to
`bg-canvas`, `bg-surface`, `text-ink`, `border-divider`, `accent-{100..900}`,
`accent2-{100..900}`, `tone-{100..900}`. Step numbers keep their **role**
across light/dark (light ramps descend, dark ramps ascend), so a screen written
once reads correctly in both modes without `dark:` variants. Use
`usePaletteColors()` only where a literal is required (icon `color`,
`ActivityIndicator`, bottom-sheet `backgroundStyle`).

The palette test (`palettes.test.ts`) enforces the structure, ramp ordering,
and WCAG contrast; keep it green when adding a palette.

### State & data

- Server cache: `@tanstack/react-query` via `APIProvider`.
- Client state: Zustand stores with `createSelectors` (`useAuth`, `useUpgrade`,
  `usePaletteStore`).
- Preferences: AsyncStorage via `src/lib/storage.tsx` with `STORAGE_KEYS`.

## Gotchas (each cost a real debugging session)

### Never put a shadow utility in a className that toggles

`react-native-css-interop` walks a component's props when its class list
changes. If a **shadow utility appears or disappears at runtime**, that walk
recurses into React Navigation's context getter, which throws:

```
Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?
```

`${selected ? 'bg-accent shadow-sm' : ''}` crashes on tap; drop `shadow-sm`
and it never does. A *constant* shadow is fine. **Toggle colour, keep shadows
constant.** `grep -rn "? '[^']*shadow" src` should stay empty.

### Never put `vars()`, a `className`, or the `dark` class on a third-party root

css-interop only processes components it wraps. `GestureHandlerRootView`,
`KeyboardProvider` and friends silently drop `style={vars(...)}` and
`className`, so every palette colour renders flat grey and **every test still
passes**. The root layout puts them on a plain RN `View` just inside
`GestureHandlerRootView`. Keep it that way.

### `Item` rows must not carry `flex-1`

In a content-height column a row with `flex-1` has no definite height to
divide and collapses to zero; the whole settings card renders as a hairline.

### Patched `react-native-css-interop`

`react-native-css-interop@0.2.1` unconditionally adds
`react-native-worklets/plugin` to its babel pipeline. That plugin ships only
with Reanimated 4; this project is on 3.19, so babel cannot resolve it and both
Jest and Metro fail. `patches/react-native-css-interop@0.2.1.patch` (root)
comments that one line out and is applied on every `pnpm install` through the
root `package.json`. If `nativewind` bumps the css-interop version, re-cut with
`pnpm patch react-native-css-interop@<v>` from the root, or drop the patch when
moving to Reanimated 4.

### Screen tests inside `src/app`

expo-router routes every file in `src/app`, so a colocated `*.test.tsx` would
be bundled and crash at boot. `metro.config.js` blocks them from the bundle
graph; Jest never sees that list.

### Hardware back over a bottom sheet

`src/components/ui/modal.tsx` registers a `BackHandler` while open. Without it
the press pops the route *behind* the sheet.

### Bundling `@env`

`src/lib/env.js` reads `Constants.expoConfig.extra`. Only values placed in
`ClientEnv` (see `env.js`) reach the app. Never import the root `env.js` from
`src/`.

## Testing

```
pnpm test            # Jest in every workspace that has it (root)
pnpm type-check      # tsc in apps/mobile and packages/api-contract (root)
pnpm lint            # eslint (root)
pnpm check-all       # all three (root)
pnpm mobile e2e-test # Maestro (needs a dev build on an emulator)
```

Key suites: `client.test.ts` (402 interceptor), `upgrade-flow.integration.test.tsx`
(402 → sheet → buy → success), `expo-iap-client.test.ts` (Play mapping),
`palettes.test.ts` (theme invariants), `auth/utils.test.ts` (secure storage +
migration).

### i18n

`src/lib/i18n/` — i18next with `react-i18next`. `translate(key)` is memoised and
its `key` is typed from `en.json` (`TxKeyPath`), so a missing key is a compile
error. Locales are JSON in `src/translations/`, registered in `resources.ts`;
`changeLanguage` flips `I18nManager` for RTL and restarts. `Text` and `Input`
already set `writingDirection`. Pluralisation uses i18next's `_plural` suffix
(`compatibilityJSON: 'v3'`). Ships `en` + `ar`; add a locale by dropping a JSON
file, registering it, and adding the picker option in `language-item.tsx`.

## Deliberately not included

- Push notifications, offline write queue, "restore purchases" button.
- iOS in-app purchases (StoreKit). The facade is platform-agnostic; add an
  implementation and register it in `bootstrap.ts`.
- A style-guide screen. Compose one from `src/components/ui/` if useful.
