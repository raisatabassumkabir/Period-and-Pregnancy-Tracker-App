import { Platform } from 'react-native';

import { setBillingClient } from '@/lib/billing';
import { createExpoIapBillingClient } from '@/lib/billing/expo-iap-client';
import { setFileSharer } from '@/lib/sharing';
import { createExpoFileSharer } from '@/lib/sharing/expo-file-sharer';
import { initTelemetry } from '@/lib/telemetry';

/**
 * Wire native-backed implementations into the pluggable facades. Kept out of
 * `@/lib` barrel exports so unit tests never load native modules by accident.
 */
export function registerNativeIntegrations(): void {
  setFileSharer(createExpoFileSharer());
  // Google Play Billing is the only purchase channel; iOS billing is not shipped.
  if (Platform.OS === 'android') {
    setBillingClient(createExpoIapBillingClient());
  }
  // Initialize Amplitude telemetry & session replay
  initTelemetry().catch(() => {
    // Handled internally
  });
}
