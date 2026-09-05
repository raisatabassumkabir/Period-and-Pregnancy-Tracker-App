#!/usr/bin/env node
/* eslint-env node */
/*
 * One-shot rename for a fresh app cut from this template. Run from the repo root:
 *
 *   pnpm init-app --name "My App" --slug my-app --bundle-id com.acme.myapp \
 *     --scheme myapp --owner acme --eas-project-id <uuid>
 *
 * Rewrites the identity block in apps/mobile/env.js, the slug in
 * apps/mobile/app.config.ts, the e2e APP_ID in apps/mobile/package.json, the
 * root package name, and the storage / secure-store key prefixes.
 * Idempotent: run it again with new values to change them.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MOBILE = 'apps/mobile';

const args = parseArgs(process.argv.slice(2));
const required = ['name', 'slug', 'bundle-id'];
const missing = required.filter((key) => !args[key]);
if (missing.length > 0) {
  console.error(`Missing: ${missing.map((k) => `--${k}`).join(', ')}`);
  console.error(
    'Usage: pnpm init-app --name "My App" --slug my-app --bundle-id com.acme.myapp [--scheme myapp] [--owner acme] [--eas-project-id <uuid>]'
  );
  process.exit(1);
}

const name = args.name;
const slug = args.slug;
const bundleId = args['bundle-id'];
const scheme = args.scheme ?? slug.replace(/[^a-z0-9]/gi, '').toLowerCase();
const owner = args.owner;
const easProjectId = args['eas-project-id'];
const keyPrefix = scheme;

const edits = [
  {
    file: `${MOBILE}/env.js`,
    replace: [
      [/const BUNDLE_ID = '[^']*';/, `const BUNDLE_ID = '${bundleId}';`],
      [/const PACKAGE = '[^']*';/, `const PACKAGE = '${bundleId}';`],
      [/const NAME = '[^']*';/, `const NAME = '${name}';`],
      [/const SCHEME = '[^']*';/, `const SCHEME = '${scheme}';`],
      owner && [
        /const EXPO_ACCOUNT_OWNER = '[^']*';/,
        `const EXPO_ACCOUNT_OWNER = '${owner}';`,
      ],
      easProjectId && [
        /const EAS_PROJECT_ID = '[^']*';/,
        `const EAS_PROJECT_ID = '${easProjectId}';`,
      ],
    ],
  },
  {
    file: `${MOBILE}/app.config.ts`,
    replace: [[/const SLUG = '[^']*';/, `const SLUG = '${slug}';`]],
  },
  {
    file: `${MOBILE}/package.json`,
    replace: [[/APP_ID=[^"\s]+/, `APP_ID=${bundleId}.development`]],
  },
  {
    file: 'package.json',
    replace: [[/"name": "[^"]*"/, `"name": "${slug}"`]],
  },
  {
    file: `${MOBILE}/src/lib/auth/utils.tsx`,
    replace: [
      [
        /const TOKEN_KEY = '[^']*';/,
        `const TOKEN_KEY = '${keyPrefix}.auth.token';`,
      ],
    ],
  },
  {
    file: `${MOBILE}/src/lib/auth/utils.test.ts`,
    replace: [
      [
        /const SECURE_KEY = '[^']*';/,
        `const SECURE_KEY = '${keyPrefix}.auth.token';`,
      ],
    ],
  },
  {
    file: `${MOBILE}/src/lib/storage.tsx`,
    replace: [
      [/'@[^/']*\/selected_palette'/, `'@${keyPrefix}/selected_palette'`],
    ],
  },
  {
    file: `${MOBILE}/src/components/settings/palette-item.test.tsx`,
    replace: [
      [/'@[^/']*\/selected_palette'/, `'@${keyPrefix}/selected_palette'`],
    ],
  },
];

for (const edit of edits) {
  const target = path.join(ROOT, edit.file);
  let source = fs.readFileSync(target, 'utf8');
  for (const pair of edit.replace) {
    if (!pair) continue;
    const [pattern, replacement] = pair;
    if (!pattern.test(source)) {
      console.warn(`[init-app] no match for ${pattern} in ${edit.file}`);
      continue;
    }
    source = source.replace(pattern, replacement);
  }
  fs.writeFileSync(target, source);
  console.log(`[init-app] updated ${edit.file}`);
}

console.log(`
Done. Next:
  1. Replace apps/mobile/assets/{icon,adaptive-icon,splash-icon,favicon}.png.
  2. Copy apps/mobile/.env.example to apps/mobile/.env.development and fill it in.
  3. cd apps/mobile && eas init   (if you did not pass --eas-project-id)
  4. Search the repo for "AppTemplate" to catch any copy you want to change.
`);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}
