/* eslint-env node */
// Runs from the repo root on commit. Each workspace lints with its own config.
const quote = (files) => files.map((file) => `"${file}"`).join(' ');

module.exports = {
  'apps/mobile/**/*.{js,jsx,ts,tsx}': (files) => [
    `npx prettier --write ${quote(files)}`,
  ],
  'packages/**/*.{ts,tsx}': (files) => [
    `npx prettier --write ${quote(files)}`,
  ],
  '**/*.{md,json,yaml,yml}': (files) => [
    `npx prettier --write ${quote(files)}`,
  ],
};
