import { isProblemDetail, type ProblemDetail } from './common';

// ============================================
// Subscription status
// ============================================

export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'expired';

export interface SubscriptionStatusResponse {
  is_premium: boolean;
  subscription_status: SubscriptionStatus;
  subscription_ends_at: string | null;
}

// ============================================
// 402 Payment Required — the paywall contract
// ============================================

/**
 * Feature keys the backend may send in a 402 body. Add one entry per gated
 * feature; the mobile app maps each to an upgrade-sheet title.
 * `premium` is the generic fallback and must stay.
 */
export type PremiumFeature = 'premium';

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
// Google Play purchase verification
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
