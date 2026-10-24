/* eslint-env node */

const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Expo's default config plus Debug IDs, so Sentry can match release bundles
// to their uploaded source maps.
const config = getSentryExpoConfig(projectRoot);

// Monorepo support
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@repo/api-contract': path.resolve(workspaceRoot, 'packages/api-contract'),
};

// Colocated screen tests live inside src/app (project convention), but
// expo-router routes EVERY file in that directory — bundling a *.test.tsx
// imports `jest` at runtime and crashes the app at boot. Block them from the
// bundle graph; Jest runs through babel-jest and never sees this list.
const screenTestFiles = /[\\/]src[\\/]app[\\/].*\.test\.(js|jsx|ts|tsx)$/;
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  screenTestFiles,
];

module.exports = withNativeWind(config, { input: './global.css' });
