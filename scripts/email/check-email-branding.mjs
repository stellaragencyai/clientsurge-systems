#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SEARCH_ROOTS = ['base44/functions'];
const EMAIL_HINTS = [/resend/i, /email/i, /subject/i, /html/i, /ClientSurge/i];

const BLOCKED_PATTERNS = [
  { pattern: /#9a5c2e/i, reason: 'legacy brown brand color #9a5c2e' },
  { pattern: /#6b3f1f/i, reason: 'legacy brown brand color #6b3f1f' },
  { pattern: /#92400E/i, reason: 'legacy brown/orange CTA color #92400E' },
  { pattern: /brown/i, reason: 'legacy brown theme wording' },
  { pattern: /🎉|🚀|👋|📈|💬|🛠️|🎯|📊/, reason: 'emoji-led email presentation' },
];

const ALLOWED_FALSE_POSITIVES = [
  'docs/EMAIL_TEMPLATE_INVENTORY_AND_UPGRADE_PLAN.md',
  'scripts/email/check-email-branding.mjs',
];

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
      yield* walk(full);
    } else if (/\.(ts|js|tsx|jsx|mjs|md)$/.test(entry.name)) {
      yield full;
    }
  }
}

function isEmailRelated(content, file) {
  return /base44\/functions/.test(file) && EMAIL_HINTS.some((hint) => hint.test(content));
}

const failures = [];
for (const root of SEARCH_ROOTS) {
  const absRoot = path.join(ROOT, root);
  for await (const file of walk(absRoot)) {
    const relative = path.relative(ROOT, file).replace(/\\/g, '/');
    if (ALLOWED_FALSE_POSITIVES.includes(relative)) continue;
    const content = await readFile(file, 'utf8');
    if (!isEmailRelated(content, relative)) continue;
    for (const blocked of BLOCKED_PATTERNS) {
      if (blocked.pattern.test(content)) failures.push({ file: relative, reason: blocked.reason });
    }
  }
}

if (failures.length) {
  console.error('\nEmail branding regression guard failed.');
  console.error('Remove legacy brown/emoji-led styling from email-related files:\n');
  for (const failure of failures) console.error(`- ${failure.file}: ${failure.reason}`);
  process.exit(1);
}

console.log('Email branding regression guard passed.');
