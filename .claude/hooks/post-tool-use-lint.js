#!/usr/bin/env node
// Post-tool-use hook: after Edit/Write/MultiEdit to
//   - a .ts(x) file under src/: run pnpm exec eslint on the file (non-blocking —
//     exit 0, lint output on stderr for the model to address);
//   - a .py file under apps/backend/apps/api: run `uv run ruff check --fix` on the
//     file and, for views.py, the RULE 1 owned-queryset lint. These exit 2 on
//     failure so the model sees the violations and fixes them before moving on.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Paths that should never be linted on save (add third-party vendored code here).
const PRE_EXISTING_ERROR_ZONES = [];

function projectRoot() {
  // CLAUDE_PROJECT_DIR is set by Claude Code when running hooks.
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  // Fall back: walk up to find package.json.
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function workspaceRootFor(file) {
  let dir = path.dirname(path.resolve(file));
  for (let i = 0; i < 8; i += 1) {
    const hasPkg = fs.existsSync(path.join(dir, 'package.json'));
    const hasEslint = ['eslint.config.mjs', 'eslint.config.js', 'eslint.config.ts']
      .some((name) => fs.existsSync(path.join(dir, name)));
    if (hasPkg && hasEslint) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function targetFromInput(input) {
  if (!input) return null;
  return (
    input.file_path ||
    input.path ||
    (Array.isArray(input.files) && input.files[0]?.file_path) ||
    (Array.isArray(input.edits) && input.edits[0]?.file_path) ||
    null
  );
}

function inPreExistingZone(target) {
  return PRE_EXISTING_ERROR_ZONES.some((re) => re.test(target));
}

let raw = '';
try {
  raw = fs.readFileSync(0, 'utf8');
} catch {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const toolName = payload.tool_name || '';
const input = payload.tool_input || {};

if (!['Edit', 'Write', 'MultiEdit'].includes(toolName)) {
  process.exit(0);
}

const target = targetFromInput(input);
if (!target) process.exit(0);

const normalized = target.replace(/\\/g, '/');

// --- Python (Django API) -------------------------------------------------------
if (/\.py$/.test(normalized)) {
  const marker = '/apps/backend/apps/api/';
  const idx = normalized.indexOf(marker);
  if (idx === -1 || normalized.includes('/migrations/')) process.exit(0);
  const apiRoot = path.join(projectRoot(), 'apps', 'backend', 'apps', 'api');
  const relPy = normalized.slice(idx + marker.length);
  const problems = [];
  const run = (args) =>
    spawnSync('uv', ['run', '--no-sync', ...args], {
      cwd: apiRoot,
      encoding: 'utf8',
      timeout: 25_000,
      shell: process.platform === 'win32',
    });
  let ruff;
  try {
    ruff = run(['ruff', 'check', '--fix', relPy]);
  } catch (err) {
    process.stderr.write(`[post-lint] could not run ruff: ${err.message}\n`);
    process.exit(0);
  }
  if (ruff.error) process.exit(0); // uv missing on this machine — don't block
  if (ruff.status !== 0) problems.push((ruff.stdout || '') + (ruff.stderr || ''));
  if (/(^|\/)views\.py$/.test(relPy)) {
    const owned = run(['python', 'scripts/lint_owned_queries.py']);
    if (owned.status !== 0) {
      problems.push(
        `RULE 1 owned-queryset lint failed:\n${(owned.stdout || '') + (owned.stderr || '')}`
      );
    }
  }
  if (problems.length) {
    process.stderr.write(`[post-lint] apps/backend/apps/api/${relPy}\n${problems.join('\n')}\n`);
    process.exit(2);
  }
  process.exit(0);
}

// --- TypeScript (mobile / contract) --------------------------------------------
if (!/\.(ts|tsx)$/.test(normalized)) process.exit(0);
if (!normalized.includes('/src/') && !normalized.startsWith('src/')) process.exit(0);
if (inPreExistingZone(normalized)) process.exit(0);

// Monorepo: lint from the workspace that owns the file (nearest package.json
// with an eslint config), so its flat config and plugins resolve.
const root = workspaceRootFor(target) ?? projectRoot();
const rel = path.relative(root, target);

let result;
try {
  result = spawnSync('pnpm', ['exec', 'eslint', rel, '--no-warn-ignored'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 25_000,
    shell: false,
  });
} catch (err) {
  // eslint missing or pnpm missing — don't block the model.
  process.stderr.write(`[post-lint] could not run eslint: ${err.message}\n`);
  process.exit(0);
}

if (result.status !== 0) {
  const out = (result.stdout || '') + (result.stderr || '');
  if (out.trim().length > 0) {
    process.stderr.write(`[post-lint] ${rel}\n${out}\n`);
  }
}
// Non-blocking: always exit 0.
process.exit(0);
