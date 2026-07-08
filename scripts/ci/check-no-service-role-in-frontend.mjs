#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FRONTEND_DIRS = ['src'];
const BLOCKED_PATTERNS = [
  /base44\.asServiceRole/g,
  /\.asServiceRole\.entities/g,
];
const ALLOWED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

function extension(path) {
  const match = path.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, out);
    else if (ALLOWED_EXTENSIONS.has(extension(path))) out.push(path);
  }
  return out;
}

const violations = [];
for (const dir of FRONTEND_DIRS) {
  const abs = join(ROOT, dir);
  for (const file of walk(abs)) {
    const source = readFileSync(file, 'utf8');
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(source)) {
        violations.push(file.replace(`${ROOT}/`, ''));
        pattern.lastIndex = 0;
      }
    }
  }
}

if (violations.length) {
  console.error('Frontend service-role usage is forbidden. Move privileged reads/writes behind Base44 functions.');
  for (const file of [...new Set(violations)]) console.error(`- ${file}`);
  process.exit(1);
}

console.log('OK: no frontend service-role usage found.');
