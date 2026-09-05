#!/usr/bin/env node
// SessionStart hook: print a single-line grounding. No network, no writes.
// Format: `branch: <dev> | last: <sha> <subject> | src/: <count>`

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function projectRoot() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function safeSpawn(cmd, args, cwd) {
  try {
    return spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: false, timeout: 1000 });
  } catch {
    return { status: -1, stdout: '', stderr: '' };
  }
}

function countSrcFiles(root) {
  const src = path.join(root, 'apps', 'mobile', 'src');
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  const stack = [src];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      break;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) n += 1;
    }
  }
  return n;
}

const root = projectRoot();
const branch = safeSpawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], root);
const sha = safeSpawn('git', ['rev-parse', '--short', 'HEAD'], root);
const subject = safeSpawn('git', ['log', '-1', '--pretty=%s'], root);
const srcCount = countSrcFiles(root);

const out = [
  `branch: ${branch.stdout.trim() || '?'}`,
  `last: ${sha.stdout.trim() || '?'} ${(subject.stdout || '').trim().slice(0, 60)}`,
  `apps/mobile/src: ${srcCount}`,
].join(' | ');

process.stdout.write(out + '\n');
process.exit(0);
