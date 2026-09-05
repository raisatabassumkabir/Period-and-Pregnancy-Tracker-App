import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { setBillingClient } from '@/lib/billing';
import { createExpoIapBillingClient } from '@/lib/billing/expo-iap-client';
import { setFileSharer } from '@/lib/sharing';
import { createExpoFileSharer } from '@/lib/sharing/expo-file-sharer';
import { initTelemetry } from '@/lib/telemetry';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

/**
 * Wire native-backed implementations into the pluggable facades. Kept out of
 * `@/lib` barrel exports so unit tests never load native modules by accident.
 */
export function registerNativeIntegrations(): void {
  setFileSharer(createExpoFileSharer());

  // Google Play Billing native client requires dev client; skip in Expo Go to prevent C++ TurboModule crashes.
  if (Platform.OS === 'android' && !isExpoGo) {
    try {
      setBillingClient(createExpoIapBillingClient());
    } catch {
      // Stub client fallback used
    }
  }

  // Initialize Amplitude telemetry & session replay
  initTelemetry().catch(() => {
    // Handled internally
  });
}
