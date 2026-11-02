/* eslint-disable max-lines-per-function */
import type { ConfigContext, ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import { ClientEnv, Env } from './env';

/** Rewritten by `pnpm init-app`; must match the project slug on expo.dev. */
const SLUG = 'happy-women';

/**
 * Splash grounds: the default Blossom palette's `--color-bg` in light and dark
 * (`src/lib/theme/palettes.ts`). Matching them makes the native splash and the
 * first painted screen one continuous surface, with no flash at handover.
 */
const SPLASH_BACKGROUND_LIGHT = '#FFF8F9';
const SPLASH_BACKGROUND_DARK = '#1A1117';
/** Rosewood end of the icon gradient; shown if the background image fails. */
const BRAND_ROSEWOOD = '#C85A86';
/** dp width of the splash mark; Android 12+ masks it to a circle anyway. */
const SPLASH_IMAGE_WIDTH = 200;

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

/** Path prefix of partner invite links; matches the API's `/p/<code>` page. */
const INVITE_LINK_PATH_PREFIX = '/p/';

type AndroidIntentFilters = NonNullable<
  NonNullable<ExpoConfig['android']>['intentFilters']
>;

/**
 * App Link for invite URLs on the API's own host. Only over https: Android
 * cannot verify an http host, and a dev LAN address never needs it (the
 * `scheme` deep link covers development).
 */
function inviteLinkFilters(): AndroidIntentFilters {
  const api = new URL(Env.API_URL);
  if (api.protocol !== 'https:') return [];
  return [
    {
      action: 'VIEW',
      autoVerify: true,
      data: [
        {
          scheme: 'https',
          host: api.host,
          pathPrefix: INVITE_LINK_PATH_PREFIX,
        },
      ],
      category: ['BROWSABLE', 'DEFAULT'],
    },
  ];
}

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
  // `automatic` lets Settings → Theme → System follow the OS. Pinning `light`
  // made the OS always report light, so dark mode could never switch on.
  // Native setting: takes effect on the next dev-client / EAS build.
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
      backgroundImage: './assets/adaptive-icon-background.png',
      backgroundColor: BRAND_ROSEWOOD,
    },
    package: Env.PACKAGE,
    versionCode: 1,
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
    // Partner invite links (https://<api host>/p/<code>) open the app directly.
    // Verified through /.well-known/assetlinks.json served by the API, which
    // must list the Play App Signing SHA-256. Custom schemes aren't tappable
    // in WhatsApp, so https is the link people actually share.
    intentFilters: inviteLinkFilters(),
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: SPLASH_IMAGE_WIDTH,
        resizeMode: 'contain',
        backgroundColor: SPLASH_BACKGROUND_LIGHT,
        dark: {
          image: './assets/splash-icon.png',
          backgroundColor: SPLASH_BACKGROUND_DARK,
        },
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        organization: Env.SENTRY_ORG,
        project: Env.SENTRY_PROJECT,
        // SENTRY_AUTH_TOKEN is an EAS secret; without it, skip the upload
        // instead of failing the build.
        disableAutoUpload: !process.env.SENTRY_AUTH_TOKEN,
      },
    ],
  ],
  extra: {
    ...ClientEnv,
    eas: {
      projectId: Env.EAS_PROJECT_ID,
    },
  },
});
