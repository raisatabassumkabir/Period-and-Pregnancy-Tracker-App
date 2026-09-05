/**
 * Billing half of the shared contract (see `packages/api-contract`).
 * To gate a new feature: add the key to `PremiumFeature` in the package and a
 * title to `FEATURE_TITLES` in `src/components/billing/upgrade-sheet.tsx`.
 */
export { isPaymentRequiredProblem, toUpgradeDetail } from '@repo/api-contract';
export type {
  PaymentRequiredProblem,
  PremiumFeature,
  UpgradeRequiredDetail,
  VerifyPurchaseRequest,
  VerifyPurchaseResponse,
} from '@repo/api-contract';
