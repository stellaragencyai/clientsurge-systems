import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src', 'base44/functions'];
const ALLOWED = new Set([
  'base44/functions/captureValidatedWebsiteLead/entry.ts',
  'base44/functions/purgeFakeWebsiteLeads/entry.ts',
]);
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);
const patterns = [
  /(?:asServiceRole\.)?entities\.WebsiteLead\.create\s*\(/,
  /\bWebsiteLead\.create\s*\(/,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(name))) out.push(full);
  }
  return out;
}

const violations = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const normalized = file.replaceAll('\\', '/');
    if (ALLOWED.has(normalized)) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (patterns.some((pattern) => pattern.test(source))) violations.push(normalized);
  }
}

if (violations.length) {
  console.error('Direct WebsiteLead creation bypasses captureValidatedWebsiteLead:');
  for (const file of violations) console.error(` - ${file}`);
  process.exit(1);
}

console.log('WebsiteLead ingestion guard passed.');
