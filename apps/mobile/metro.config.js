/* eslint-env node */

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

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
