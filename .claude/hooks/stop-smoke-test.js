#!/usr/bin/env node
// Stop hook: when the session ends, if the git diff includes test-relevant
// changes under src/, run `pnpm test --bail=1` with a 60s budget. Non-blocking —
// exit 0 always. The model uses the output as a hint, not a gate.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const TEST_RELEVANT = [
  /\.(test|spec)\.[jt]sx?$/,
  /(^|\/)apps\/mobile\/src\/api\//, // API hooks ship with tests
  /(^|\/)apps\/mobile\/src\/lib\/upgrade\//, // 402 contract — guarded by integration test
  /(^|\/)apps\/mobile\/src\/api\/common\/client\./, // axios interceptor
  /(^|\/)packages\/api-contract\//, // shared contract feeds the mobile types
];

// Paths whose changes should not trigger the smoke run.
const SKIP_ZONES = [];

function projectRoot() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function listChangedFiles(root) {
  // Try unstaged + staged (no commit). Cheap git calls.
  const out = spawnSync('git', ['diff', '--name-only', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  if (out.status === 0) {
    return out.stdout.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

let raw = '';
try {
  raw = fs.readFileSync(0, 'utf8');
} catch {
  process.exit(0);
}

try {
  JSON.parse(raw);
} catch {
  process.exit(0);
}

const root = projectRoot();
const changed = listChangedFiles(root);
if (changed.length === 0) process.exit(0);

const relevant = changed.filter((file) => {
  if (SKIP_ZONES.some((re) => re.test(file))) return false;
  return TEST_RELEVANT.some((re) => re.test(file));
});

if (relevant.length === 0) process.exit(0);

let result;
try {
  result = spawnSync('pnpm', ['--filter', 'mobile', 'test', '--bail=1', '--silent'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 55_000,
    shell: false,
  });
} catch (err) {
  process.stderr.write(`[stop-smoke] could not run pnpm test: ${err.message}\n`);
  process.exit(0);
}

if (result.status !== 0) {
  const out = (result.stdout || '') + (result.stderr || '');
  process.stderr.write(`[stop-smoke] test run failed (non-blocking)\n${out}\n`);
}

process.exit(0);
