/* eslint-env node */
// Runs from the repo root on commit. Each workspace lints with its own config.
const quote = (files) => files.map((file) => `"${file}"`).join(' ');

module.exports = {
  'apps/mobile/**/*.{js,jsx,ts,tsx}': (files) => [
    `pnpm --filter mobile exec eslint --fix ${quote(files)}`,
  ],
  'packages/**/*.{ts,tsx}': (files) => [
    `pnpm exec prettier --write ${quote(files)}`,
  ],
  '**/*.{md,json,yaml,yml}': (files) => [
    `pnpm exec prettier --write ${quote(files)}`,
  ],
  // Django backend: uncomment once apps/backend exists.
  // 'apps/backend/**/*.py': (files) => [`ruff check --fix ${quote(files)}`, `ruff format ${quote(files)}`],
};
