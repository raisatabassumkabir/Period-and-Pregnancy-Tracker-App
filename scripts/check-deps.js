#!/usr/bin/env node
/**
 * Fails fast, with a plain fix, when a dependency declared in a workspace
 * package.json is not actually installed in node_modules.
 *
 * Why: when `pnpm install` is interrupted (on Windows, usually because the
 * Metro dev server holds files open), package.json lists a package that never
 * landed. The app then dies at bundle time with "Unable to resolve module".
 * Running this before `start` / `android` / `ios` turns that into one clear
 * message instead.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKSPACES = ['.', 'apps/mobile'];
/** Workspace packages are symlinked, not downloaded; skip them. */
const WORKSPACE_PROTOCOL = /^workspace:/;

function declaredDependencies(workspace) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, workspace, 'package.json'), 'utf8')
  );
  return Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })
    .filter(([, spec]) => !WORKSPACE_PROTOCOL.test(String(spec)))
    .map(([name]) => name);
}

function isInstalled(workspace, name) {
  // node-linker=hoisted: most packages sit at the root, some per workspace.
  return [path.join(ROOT, workspace), ROOT].some((base) =>
    fs.existsSync(path.join(base, 'node_modules', name, 'package.json'))
  );
}

const missing = WORKSPACES.flatMap((workspace) =>
  declaredDependencies(workspace)
    .filter((name) => !isInstalled(workspace, name))
    .map((name) => `${workspace === '.' ? 'root' : workspace}: ${name}`)
);

if (missing.length > 0) {
  console.error('\n✖ Some dependencies are declared but not installed:\n');
  for (const entry of missing) console.error(`    ${entry}`);
  console.error(
    '\n  Fix: stop any running dev server (Ctrl+C), then run `pnpm install`' +
      '\n  from the repo root. A native module also needs `pnpm android`' +
      '\n  (a new dev build) before the app can use it.\n'
  );
  process.exit(1);
}
