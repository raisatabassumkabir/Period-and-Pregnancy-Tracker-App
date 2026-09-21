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
      backgroundColor: BRAND_BACKGROUND,
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
        backgroundColor: BRAND_BACKGROUND,
        image: './assets/splash-icon.png',
        imageWidth: 180,
        // `contain` keeps the mark's aspect ratio on every screen density;
        // the artwork is transparent so `backgroundColor` shows through.
        resizeMode: 'contain',
        // The app is dark-first, so the dark variant is the same artwork
        // rather than an inverted one.
        dark: {
          backgroundColor: BRAND_BACKGROUND,
          image: './assets/splash-icon.png',
          imageWidth: 180,
          resizeMode: 'contain',
        },
      },
    ],
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Inter.ttf',
          // Happy Women type: one rounded family at four weights. Files are
          // named by PostScript name so `tailwind.config.js` can reference
          // them by basename on both platforms.
          './assets/fonts/Nunito-Regular.ttf',
          './assets/fonts/Nunito-SemiBold.ttf',
          './assets/fonts/Nunito-Bold.ttf',
          './assets/fonts/Nunito-ExtraBold.ttf',
          // Hand-written script font for the brand wordmark
          './assets/fonts/AngelFace.otf',
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
