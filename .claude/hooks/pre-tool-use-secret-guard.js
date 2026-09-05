#!/usr/bin/env node
// Pre-tool-use hook: blocks edits to .env*, secret-bearing file types, and
// known secret patterns. Reads Claude Code hook stdin protocol:
//   { tool_name: "Edit|Write|MultiEdit", tool_input: { file_path: "..." , ... } }
//
// Exit codes:
//   0 = allow
//   2 = block (stderr message shown to the model)

'use strict';

const fs = require('node:fs');

const SECRET_FILE_PATTERNS = [
  /(^|\/)\.env(\.[\w.-]+)?$/i,
  /\.(pem|key|p8|p12|jks|mobileprovision|keystore)$/i,
  /(service[_-]?account.*\.json|google[_-]?play.*\.json)$/i,
];

// Inline secret patterns. Match the value when written via Write tool.
const SECRET_VALUE_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/, // Anthropic / OpenAI style
  /\bAIza[0-9A-Za-z_-]{20,}\b/, // Google API key
  /\bghp_[A-Za-z0-9]{30,}\b/, // GitHub PAT
  /\bya29\.[0-9A-Za-z_-]{20,}\b/, // Google OAuth refresh
  /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
];

// Allow these even if they look secret-shaped (project metadata).
const ALLOWLIST = [
  /\.claude\/\.mcp\.json$/,
  /\/example\./i,
  /\.example\.[a-z]+$/i,
  /\/__mocks__\//,
  /skills-lock\.json$/,
];

function isAllowlisted(target) {
  return ALLOWLIST.some((re) => re.test(target));
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

function valueFromInput(input, toolName) {
  if (!input) return '';
  if (toolName === 'Write' || toolName === 'MultiEdit') {
    return (
      input.content ||
      (Array.isArray(input.edits) && input.edits.map((e) => e.newText || '').join('\n')) ||
      ''
    );
  }
  if (toolName === 'Edit') {
    return input.new_string || input.newText || input.content || '';
  }
  return '';
}

function block(message) {
  process.stderr.write(`[secret-guard] BLOCKED: ${message}\n`);
  process.exit(2);
}

let raw = '';
try {
  raw = fs.readFileSync(0, 'utf8');
} catch {
  // No stdin. Allow.
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  // Bad payload. Don't block — let the next hook handle it.
  process.exit(0);
}

const toolName = payload.tool_name || '';
const input = payload.tool_input || {};

if (!['Edit', 'Write', 'MultiEdit'].includes(toolName)) {
  process.exit(0);
}

const target = targetFromInput(input);
if (!target) {
  process.exit(0);
}

if (isAllowlisted(target)) {
  process.exit(0);
}

for (const re of SECRET_FILE_PATTERNS) {
  if (re.test(target)) {
    block(`secret-bearing file path: ${target}. Move to .env (gitignored) or use @env / expo-constants.`);
  }
}

const value = valueFromInput(input, toolName);
for (const re of SECRET_VALUE_PATTERNS) {
  if (re.test(value)) {
    block(`secret-shaped value detected in ${toolName} to ${target}. Rotate the credential and use a runtime loader.`);
  }
}

process.exit(0);
