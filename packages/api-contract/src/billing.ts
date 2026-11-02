import { isProblemDetail, type ProblemDetail } from './common';

// ============================================
// Canonical product and entitlement identifiers
// ============================================

export const CANONICAL_PRODUCT_IDS = {
  MONTHLY: 'premium_monthly',
  ANNUAL: 'premium_annual',
} as const;

export type CanonicalProductId =
  (typeof CANONICAL_PRODUCT_IDS)[keyof typeof CANONICAL_PRODUCT_IDS];

export const CANONICAL_ENTITLEMENT_ID = 'premium' as const;
export type CanonicalEntitlementId = typeof CANONICAL_ENTITLEMENT_ID;

/**
 * Target commercial planning prices in USD.
 * Note: Actual store prices remain localized and authoritative in Google Play Console.
 */
export const TARGET_PRICING_USD = {
  MONTHLY: 4.99,
  ANNUAL: 29.99,
} as const;

/**
 * Compatibility mapping for legacy or historical client references.
 */
export const LEGACY_PRODUCT_ID_MAP: Record<string, CanonicalProductId> = {
  premium_yearly: CANONICAL_PRODUCT_IDS.ANNUAL,
};

export const resolveCanonicalProductId = (productId: string): string =>
  LEGACY_PRODUCT_ID_MAP[productId] ?? productId;

// ============================================
// Subscription status
// ============================================

export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'trialing'
  | 'cancelled'
  | 'past_due'
  | 'expired'
  | 'billing_issue';

export type SubscriptionStore =
  | 'play_store'
  | 'app_store'
  | 'stripe'
  | 'promotional'
  | 'unknown';

export interface SubscriptionStatusResponse {
  /** Authoritative boolean indicating whether the user currently has access to the premium entitlement. */
  is_premium: boolean;
  /**
   * Granular subscription lifecycle status.
   * Note: 'cancelled' retains is_premium=true if current time is before subscription_ends_at.
   */
  subscription_status: SubscriptionStatus;
  /** UTC ISO-8601 timestamp when subscription period/access ends, or null for free tiers. */
  subscription_ends_at: string | null;
  /** Canonical entitlement identifier (e.g. 'premium'), or null if unentitled. */
  entitlement_id?: string | null;
  /** Canonical product identifier (e.g. 'premium_monthly', 'premium_annual'), or null if free. */
  product_id?: string | null;
  /** Originating store provider. */
  store?: SubscriptionStore | null;
  /** True if the active entitlement was created in a test / sandbox environment. */
  is_sandbox?: boolean;
  /** UTC ISO-8601 timestamp of last successful synchronization with RevenueCat. */
  last_synced_at?: string | null;
  /** Non-null indicates a transient or recoverable status resolution notice; clients may retry. */
  warning?: string | null;
}

// ============================================
// 402 Payment Required — the paywall contract
// ============================================

/**
 * Feature keys the backend may send in a 402 body. Add one entry per gated
 * feature; the mobile app maps each to an upgrade-sheet title.
 * `premium` is the generic fallback and must stay. `partner_sync` is reserved:
 * partner sharing ships free, so nothing sends it yet.
 */
export type PremiumFeature = 'premium' | 'partner_sync';

/**
 * Body of every `402 Payment Required` response: a Problem Details object
 * (`type` = `https://apiguide.dev/status-codes/402/`) whose `detail` is the
 * sentence shown verbatim to the user, plus these RFC 9457 extension members.
 */
export interface PaymentRequiredProblem extends ProblemDetail {
  status: 402;
  feature: PremiumFeature | string;
  current_usage?: number;
  limit?: number;
  code?: string;
  upgrade_url?: string;
  /** UTC ISO-8601 timestamp of the next quota reset, when the backend sends one. */
  resets_at?: string;
}

/** What the mobile upgrade sheet renders — the 402 problem flattened for UI state. */
export interface UpgradeRequiredDetail {
  message: string;
  feature: PremiumFeature | string;
  current_usage?: number;
  limit?: number;
  code?: string;
  upgrade_url?: string;
  resets_at?: string;
}

export const isPaymentRequiredProblem = (
  data: unknown
): data is PaymentRequiredProblem =>
  isProblemDetail(data) &&
  data.status === 402 &&
  typeof (data as PaymentRequiredProblem).feature === 'string';

export const toUpgradeDetail = (
  problem: PaymentRequiredProblem
): UpgradeRequiredDetail => ({
  message: problem.detail,
  feature: problem.feature,
  current_usage: problem.current_usage,
  limit: problem.limit,
  code: problem.code,
  upgrade_url: problem.upgrade_url,
  resets_at: problem.resets_at,
});

// ============================================
// Google Play purchase verification (legacy / bridge)
// ============================================

export interface VerifyPurchaseRequest {
  subscription_id: string;
  purchase_token: string;
}

export interface VerifyPurchaseResponse {
  is_premium: boolean;
  subscription_status: SubscriptionStatus;
  subscription_ends_at: string | null;
  google_play_subscription_id: string;
}
