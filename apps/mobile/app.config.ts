/* eslint-disable max-lines-per-function */
import type { ConfigContext, ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import { ClientEnv, Env } from './env';

/** Rewritten by `pnpm init-app`; must match the project slug on expo.dev. */
const SLUG = 'happy-women';

/**
 * Brand charcoal — the same value as `PALETTES.happy.dark['--color-bg']` in
 * `src/lib/theme/palettes.ts`. Sharing it means the splash, the adaptive-icon
 * ground and the first painted screen are one continuous surface, so the
 * handover from native splash to JS has no visible seam.
 */
const BRAND_BACKGROUND = '#FCF8F5';

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: false,
  badges: [
    {
      text: Env.APP_ENV,
      type: 'banner',
      color: 'white',
    },
    {
      text: Env.VERSION.toString(),
      type: 'ribbon',
      color: 'white',
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.NAME,
  description: `${Env.NAME} Mobile App`,
  owner: Env.EXPO_ACCOUNT_OWNER,
  scheme: Env.SCHEME,
  slug: SLUG,
  version: Env.VERSION.toString(),
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: false,
  updates: {
    fallbackToCacheTimeout: 0,
    url: `https://u.expo.dev/${Env.EAS_PROJECT_ID}`,
  },
  // Native and JS must agree on a runtime before an OTA update is applied;
  // bumping package.json "version" opts a build out of older updates.
  runtimeVersion: {
    policy: 'appVersion',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: Env.BUNDLE_ID,
    config: {
      usesNonExemptEncryption: false, // Avoid the export compliance warning on the app store
    },
  },
  experiments: {
    typedRoutes: true,
  },
  android: {
    // adaptiveIcon block removed to avoid prebuild crash
    package: Env.PACKAGE,
    permissions: ['INTERNET'],
    // Expo prebuild adds these by default; the app never reads external storage
    // or draws overlays, and Play flags SYSTEM_ALERT_WINDOW as sensitive.
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
    // Cleartext is only needed to reach a LAN backend during development.
    // Production must talk HTTPS only.
    // @ts-expect-error: 'usesCleartextTraffic' is valid in runtime but missing from the type definition
    usesCleartextTraffic: Env.APP_ENV !== 'production',
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [],
  extra: {
    ...ClientEnv,
    eas: {
      projectId: Env.EAS_PROJECT_ID,
    },
  },
});
