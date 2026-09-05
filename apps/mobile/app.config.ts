/* eslint-disable max-lines-per-function */
import type { ConfigContext, ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import { ClientEnv, Env } from './env';

/** Rewritten by `pnpm init-app`; must match the project slug on expo.dev. */
const SLUG = 'app-template';

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.APP_ENV !== 'production',
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
  userInterfaceStyle: 'automatic',
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
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#2E3C4B',
    },
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
  plugins: [
    [
      'expo-splash-screen',
      {
        backgroundColor: '#2E3C4B',
        image: './assets/splash-icon.png',
        imageWidth: 150,
      },
    ],
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Inter.ttf',
          './assets/fonts/Caprasimo-Regular.ttf',
          './assets/fonts/Figtree-Regular.ttf',
          './assets/fonts/Figtree-SemiBold.ttf',
          './assets/fonts/Figtree-Bold.ttf',
        ],
      },
    ],
    'expo-localization',
    'expo-router',
    // Adds com.android.vending.BILLING and the Play Billing Gradle dependency.
    // Remove this line (and src/lib/billing/expo-iap-client.ts) if the app has
    // no in-app purchases.
    'expo-iap',
    ['app-icon-badge', appIconBadgeConfig],
    ['react-native-edge-to-edge'],
  ],
  extra: {
    ...ClientEnv,
    eas: {
      projectId: Env.EAS_PROJECT_ID,
    },
  },
});
