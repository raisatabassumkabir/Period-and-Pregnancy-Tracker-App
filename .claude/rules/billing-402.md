---
paths:
  - apps/mobile/src/api/billing/**
  - apps/mobile/src/lib/billing/**
  - apps/mobile/src/api/common/client.tsx
  - apps/mobile/src/lib/upgrade/**
  - apps/mobile/src/components/billing/**
  - packages/api-contract/src/billing.ts
---

> Paths written as `src/…` are relative to `apps/mobile/`. The shared HTTP contract is `packages/api-contract/`.

# 402 / billing contract rules

This is the single load-bearing pattern in the template. The top-level
`CLAUDE.md` has the deep-dive; this file is the rules form for editing it.

## The contract

The backend returns 402 to signal a paywall. The body is an RFC 9457 problem
(`PaymentRequiredProblem` in `packages/api-contract/src/billing.ts`) with the
paywall context as extension members:

```json
{
  "type": "https://apiguide.dev/status-codes/402/",
  "title": "Payment Required",
  "status": 402,
  "detail": "...",
  "feature": "<PremiumFeature>",
  "current_usage": 15,
  "limit": 15
}
```

The `feature` field drives the upgrade sheet title. The `detail` sentence drives
the subtitle (`toUpgradeDetail()` flattens the problem into the sheet's
`UpgradeRequiredDetail` state). `current_usage` / `limit` are optional context. **No quota number
is ever written into UI copy** — the 402 body is the only authority.

## Single point of truth

- The 402 → upgrade-sheet wiring lives **only** in
  `src/api/common/client.tsx` (response interceptor →
  `showUpgrade(toUpgradeDetail(problem))`).
- The Zustand store is at `src/lib/upgrade/index.tsx`.
- The sheet is mounted once in `src/app/_layout.tsx`.

Do **not** add a per-screen 402 handler. Do **not** call `showUpgrade(...)`
outside the axios interceptor except for explicit user actions (e.g. a "Go
premium" button that opens the sheet for marketing).

## Adding a new gated feature

1. Add the `feature` key to the `PremiumFeature` union in
   `src/api/billing/types.ts`.
2. Add feature-specific title copy to `FEATURE_TITLES` in
   `src/components/billing/upgrade-sheet.tsx`.
3. The hook that hits the gated endpoint just calls `client.get/post` — the
   interceptor handles 402. If the hook's caller has its own error UI, swallow
   402 there (`if (status === 402) return;`) so the user does not see two
   messages.
4. Test: assert that a 402 from the endpoint leaves the upgrade store
   `visible: true` and `detail.feature` matches the new key. See
   `src/api/common/client.test.ts` for the pattern.

## Subscription status

- Source of truth: `GET /api/payments/subscription-status/`.
- Hook: `usePaymentSubscriptionStatus` in
  `src/api/billing/use-subscription-status.ts`.
- Always wire `refetchOnWindowFocus: true` on the subscription status query so
  a purchase completed elsewhere shows on foreground.

## Purchase flow

Orchestrator: `usePurchasePremium` in `src/lib/billing/use-purchase-premium.ts`.
Sequence: `opening → requestSubscription → verifying → POST
/payments/google-play/verify-purchase/ → acknowledging → success → invalidate
['payments', 'subscription-status'] + ['me']`.

- Errors map to user-facing copy via the message itself.
- 409 ("already on another account") and 404 ("token not found") are surfaced
  to the sheet's error banner, not thrown.
- User cancel (`PurchaseCancelledError`) resets to idle with no banner.

## Billing client facade

`src/lib/billing/index.ts` exports a pluggable `BillingClient` interface and a
no-op stub. `src/lib/bootstrap.ts` registers the `expo-iap` implementation
(`src/lib/billing/expo-iap-client.ts`) at startup on Android. Do not import
`expo-iap` directly from feature code — only the facade is allowed, and keep the
native import out of `@/lib` barrel exports so Jest never loads it.

Product ids live in `PREMIUM_PRODUCT_IDS` / `DEFAULT_PRODUCT_ID` in the facade
and must match the Play Console and the backend allow-list.

## Don't

- Don't add 402 tests per feature; assert the contract once in the
  `client` / integration tests.
- Don't pass `feature` as a free-form string in the API — keep the union.
- Don't acknowledge a purchase client-side only. The backend re-verifies via
  Google Play; the client ack just clears Play's 3-day refund window.
