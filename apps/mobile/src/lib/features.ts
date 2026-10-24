/**
 * Release switches. Build-time only: flipping one means shipping a new build,
 * there is no remote config behind them.
 */
interface FeatureFlags {
  /** The assistant backend is not built yet; keep the tab hidden until it is. */
  readonly assistant: boolean;
  /**
   * v1 ships free. When off, RevenueCat is never configured and every paywall
   * entry point, plan label and premium badge stays out of the UI. The 402
   * interceptor and UpgradeSheet stay wired so turning this on is a flag flip.
   */
  readonly monetization: boolean;
}

export const FEATURES: FeatureFlags = {
  assistant: false,
  monetization: false,
};
