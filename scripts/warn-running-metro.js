#!/usr/bin/env node
/**
 * Runs after `pnpm install`. If a Metro dev server is still running, warns
 * loudly that it must be restarted with a cleared cache.
 *
 * Why: Metro snapshots node_modules when it starts. An install underneath a
 * running Metro leaves that snapshot stale, and the app then fails with
 * "While trying to resolve module X ... InternalError" even though X is
 * installed correctly. Never fails the install.
 */
const http = require('http');

const METRO_STATUS_URL = 'http://127.0.0.1:8081/status';
const PROBE_TIMEOUT_MS = 1_000;
const METRO_RUNNING = 'packager-status:running';

function warn() {
  console.warn(
    '\n⚠ Metro is still running from before this install.' +
      '\n  Its module map is now stale and the app will show' +
      '\n  "Unable to resolve module" errors.' +
      '\n  Fix: press Ctrl+C in the Metro terminal, then run' +
      '\n  `pnpm start -- --clear` (or `pnpm android` after a native change).\n'
  );
}

const request = http.get(METRO_STATUS_URL, { timeout: PROBE_TIMEOUT_MS }, (response) => {
  let body = '';
  response.on('data', (chunk) => (body += chunk));
  response.on('end', () => {
    if (body.includes(METRO_RUNNING)) warn();
  });
});
request.on('timeout', () => request.destroy());
// No server on 8081 is the normal case: nothing to warn about.
request.on('error', () => {});
