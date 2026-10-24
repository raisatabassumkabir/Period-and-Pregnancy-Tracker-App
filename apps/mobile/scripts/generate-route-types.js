/* eslint-env node */
/*
 * Regenerates expo-router's typed-routes declarations (.expo/types/router.d.ts)
 * without starting Metro. The file is gitignored and normally written by the
 * dev server, so a fresh clone or CI has none and a stale local copy rejects
 * hrefs to routes added since it was written. `type-check` runs this first.
 */
const path = require('path');
const requireContextModule = require('expo-router/build/testing-library/require-context-ponyfill');
const { regenerateDeclarations } = require('expo-router/build/typed-routes');

const requireContext = requireContextModule.default ?? requireContextModule;
const APP_DIR = path.resolve(__dirname, '../src/app');
const OUTPUT_DIR = path.resolve(__dirname, '../.expo/types');
// Same exclusion metro.config.js applies: colocated tests are not routes.
const ROUTE_FILES = /^(?!.*\.test\.)(?!.*[\/]\+).*\.[tj]sx?$/;
// regenerateDeclarations is debounced; give it time to write before exiting.
const DEBOUNCE_WAIT_MS = 1500;

regenerateDeclarations(
  OUTPUT_DIR,
  {},
  requireContext(APP_DIR, true, ROUTE_FILES)
);
setTimeout(() => {}, DEBOUNCE_WAIT_MS);
