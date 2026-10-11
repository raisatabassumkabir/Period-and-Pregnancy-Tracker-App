/**
 * Billing half of the shared contract (see `packages/api-contract`).
 * To gate a new feature: add the key to `PremiumFeature` in the package and a
 * title to `FEATURE_TITLES` in `src/components/billing/upgrade-sheet.tsx`.
 */
export type {
  CanonicalEntitlementId,
  CanonicalProductId,
  PaymentRequiredProblem,
  PremiumFeature,
  SubscriptionStatus,
  SubscriptionStatusResponse,
  SubscriptionStore,
  UpgradeRequiredDetail,
} from '@repo/api-contract';
export {
  CANONICAL_ENTITLEMENT_ID,
  CANONICAL_PRODUCT_IDS,
  isPaymentRequiredProblem,
  resolveCanonicalProductId,
  TARGET_PRICING_USD,
  toUpgradeDetail,
} from '@repo/api-contract';
