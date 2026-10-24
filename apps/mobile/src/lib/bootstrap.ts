import { Platform } from 'react-native';

import { setBillingClient } from '@/lib/billing';
import { createRevenueCatBillingClient } from '@/lib/billing/revenuecat-client';
import { FEATURES } from '@/lib/features';
import { initCrashReporting } from '@/lib/monitoring';
import { setFileSharer } from '@/lib/sharing';
import { createExpoFileSharer } from '@/lib/sharing/expo-file-sharer';
import { initTelemetry } from '@/lib/telemetry';

/**
 * Wire native-backed implementations into the pluggable facades. Kept out of
 * `@/lib` barrel exports so unit tests never load native modules by accident.
 */
export function registerNativeIntegrations(): void {
  // First, so a failure in anything below is still reported.
  initCrashReporting();
  setFileSharer(createExpoFileSharer());
  // RevenueCat Google Play Billing on Android. Left unconfigured while v1 is
  // free so the SDK never contacts RevenueCat or Play Billing.
  if (FEATURES.monetization && Platform.OS === 'android') {
    setBillingClient(createRevenueCatBillingClient());
  }
  // Amplitude events only; skipped entirely while AMPLITUDE_API_KEY is empty.
  initTelemetry().catch(() => {
    // Handled internally
  });
}
