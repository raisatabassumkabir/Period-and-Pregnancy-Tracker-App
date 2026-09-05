import * as amplitude from '@amplitude/analytics-react-native';
import { SessionReplayPlugin } from '@amplitude/plugin-session-replay-react-native';
import { Env } from '@env';

let isInitialized = false;

/**
 * Initializes Amplitude Analytics and attaches the Session Replay plugin.
 * Safe to call multiple times (subsequent calls are no-ops). Skipped when
 * no API key is configured, so a fresh app can ship without telemetry.
 */
export async function initTelemetry(customApiKey?: string): Promise<boolean> {
  if (isInitialized) {
    return true;
  }

  const apiKey = customApiKey || Env.AMPLITUDE_API_KEY;

  if (!apiKey) {
    if (__DEV__) {
      console.info('[Telemetry] AMPLITUDE_API_KEY is empty; telemetry off.');
    }
    return false;
  }

  try {
    await amplitude.init(apiKey).promise;
    await amplitude.add(new SessionReplayPlugin()).promise;
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[Telemetry] Failed to initialize Amplitude SDK:', error);
    return false;
  }
}

/**
 * Track an analytics event with optional properties.
 */
export function trackEvent(
  eventName: string,
  eventProperties?: Record<string, unknown>
): void {
  try {
    amplitude.track(eventName, eventProperties);
  } catch (error) {
    console.error(`[Telemetry] Failed to track event "${eventName}":`, error);
  }
}

function buildIdentify(
  properties: Record<string, unknown>
): amplitude.Identify {
  const identify = new amplitude.Identify();
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== null) {
      identify.set(key, value as string | number | boolean);
    }
  }
  return identify;
}

/**
 * Set the current user ID and optional initial user properties.
 */
export function identifyUser(
  userId: string,
  userProperties?: Record<string, unknown>
): void {
  try {
    amplitude.setUserId(userId);
    if (userProperties && Object.keys(userProperties).length > 0) {
      amplitude.identify(buildIdentify(userProperties));
    }
  } catch (error) {
    console.error('[Telemetry] Failed to identify user:', error);
  }
}

/**
 * Set or update user-level properties without changing user ID.
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  try {
    if (!properties || Object.keys(properties).length === 0) return;
    amplitude.identify(buildIdentify(properties));
  } catch (error) {
    console.error('[Telemetry] Failed to set user properties:', error);
  }
}

/**
 * Reset user identity and clear session data on logout.
 */
export function resetTelemetryUser(): void {
  try {
    amplitude.reset();
  } catch (error) {
    console.error('[Telemetry] Failed to reset user:', error);
  }
}

/**
 * Check if Amplitude telemetry has been initialized.
 */
export function isTelemetryInitialized(): boolean {
  return isInitialized;
}
