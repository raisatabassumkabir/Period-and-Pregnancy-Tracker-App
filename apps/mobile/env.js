/* eslint-env node */
/*
 * Loads and validates environment variables.
 *
 * Two groups:
 *   1. client    - passed to the app through `extra` in app.config.ts and read via `import { Env } from '@env'`
 *   2. buildTime - only used while building (app.config.ts, EAS)
 *
 * `.env.${APP_ENV}` is loaded with dotenv; APP_ENV defaults to `development`.
 * Never import this file from `src/` — use `@env` (src/lib/env.js) there.
 */
const z = require('zod');

const packageJSON = require('./package.json');
const path = require('path');
const APP_ENV = process.env.APP_ENV ?? 'development';
const envPath = path.resolve(__dirname, `.env.${APP_ENV}`);

require('dotenv').config({
  path: envPath,
});

/**
 * Static app identity. `pnpm init-app` rewrites this block; you can also edit it by hand.
 */
const BUNDLE_ID = 'com.happywomen.app'; // ios bundle id
const PACKAGE = 'com.happywomen.app'; // android package name
const NAME = 'Happy Women'; // app name
const EXPO_ACCOUNT_OWNER = 'your-expo-account'; // expo account owner
const EAS_PROJECT_ID = '00000000-0000-0000-0000-000000000000'; // eas project id
const SCHEME = 'happywomen'; // deep-link scheme

/**
 * Non-production builds get a suffixed identifier so they can be installed
 * alongside the store build: `com.example.app.staging`.
 * @param {string} name
 * @returns {string}
 */
const withEnvSuffix = (name) => {
  return APP_ENV === 'production' ? name : `${name}.${APP_ENV}`;
};

const client = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']),
  NAME: z.string(),
  SCHEME: z.string(),
  BUNDLE_ID: z.string(),
  PACKAGE: z.string(),
  VERSION: z.string(),

  // ADD YOUR CLIENT ENV VARS HERE
  API_URL: z.string().url(),
  // Optional: telemetry is skipped when empty.
  AMPLITUDE_API_KEY: z.string().default(''),
  // Store listing + in-app legal links (Play requires a reachable privacy policy).
  PRIVACY_POLICY_URL: z.string().url(),
  TERMS_URL: z.string().url(),
  SUPPORT_EMAIL: z.string().email(),
});

const buildTime = z.object({
  EXPO_ACCOUNT_OWNER: z.string(),
  EAS_PROJECT_ID: z.string(),
  // ADD YOUR BUILD TIME ENV VARS HERE
});

/**
 * @type {Record<keyof z.infer<typeof client> , unknown>}
 */
const _clientEnv = {
  APP_ENV,
  NAME: NAME,
  SCHEME: SCHEME,
  BUNDLE_ID: withEnvSuffix(BUNDLE_ID),
  PACKAGE: withEnvSuffix(PACKAGE),
  VERSION: packageJSON.version,

  // ADD YOUR ENV VARS HERE TOO
  API_URL: process.env.API_URL,
  AMPLITUDE_API_KEY: process.env.AMPLITUDE_API_KEY ?? '',
  PRIVACY_POLICY_URL: process.env.PRIVACY_POLICY_URL,
  TERMS_URL: process.env.TERMS_URL,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
};

/**
 * @type {Record<keyof z.infer<typeof buildTime> , unknown>}
 */
const _buildTimeEnv = {
  EXPO_ACCOUNT_OWNER,
  EAS_PROJECT_ID,
  // ADD YOUR ENV VARS HERE TOO
};

const _env = {
  ..._clientEnv,
  ..._buildTimeEnv,
};

const merged = buildTime.merge(client).refine(
  (env) => env.APP_ENV !== 'production' || env.API_URL.startsWith('https://'),
  {
    path: ['API_URL'],
    message:
      'Production builds block cleartext traffic; API_URL must use https://',
  }
);
const parsed = merged.safeParse(_env);

if (parsed.success === false) {
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors,

    `\n❌ Missing variables in .env.${APP_ENV} file, Make sure all required variables are defined in the .env.${APP_ENV} file.`,
    `\n💡 Tip: If you recently updated the .env.${APP_ENV} file and the error still persists, try restarting the server with the -c flag to clear the cache.`
  );
  throw new Error(
    'Invalid environment variables, Check terminal for more details '
  );
}

const Env = parsed.data;
const ClientEnv = client.parse(_clientEnv);

module.exports = {
  Env,
  ClientEnv,
  withEnvSuffix,
};
