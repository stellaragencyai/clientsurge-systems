import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];

const SOURCE_ROOTS = ['src/components/admin', 'src/internal-pages', 'src/components/portal', 'src/hooks', 'src/lib'];
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'tests', 'scripts']);
const ALLOWLIST_MISSING = new Set([
  // Keep this list small. Each entry should represent a function provided by Base44 runtime
  // or a deliberately external connector that is not stored under base44/functions.
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|ts|tsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function listAvailableFunctions() {
  const functionsRoot = path.join(root, 'base44', 'functions');
  const names = new Set();
  if (!fs.existsSync(functionsRoot)) return names;
  for (const entry of fs.readdirSync(functionsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const dir = path.join(functionsRoot, entry.name);
    const hasEntrypoint = ['main.ts', 'main.js', 'entry.ts', 'entry.js', 'function.jsonc'].some((file) => fs.existsSync(path.join(dir, file)));
    if (hasEntrypoint) names.add(entry.name);
  }
  return names;
}

function extractInvocations(content) {
  const names = new Set();
  const patterns = [
    /base44\.functions\.invoke\(\s*['"]([A-Za-z0-9_\-]+)['"]/g,
    /base44\.asServiceRole\.functions\.invoke\(\s*['"]([A-Za-z0-9_\-]+)['"]/g,
    /functions\.invoke\(\s*['"]([A-Za-z0-9_\-]+)['"]/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) names.add(match[1]);
  }
  return [...names];
}

function checkDynamicInvocations(relative, content) {
  const dynamicPatterns = [
    /base44\.functions\.invoke\(\s*[^'"\s]/,
    /functions\.invoke\(\s*[^'"\s]/,
  ];
  if (dynamicPatterns.some((pattern) => pattern.test(content))) {
    warnings.push(`${relative}: dynamic function invocation cannot be statically verified`);
  }
}

const available = listAvailableFunctions();
const sourceFiles = SOURCE_ROOTS.flatMap((dir) => walk(path.join(root, dir)));
const usage = new Map();

for (const file of sourceFiles) {
  const relative = rel(file);
  const content = fs.readFileSync(file, 'utf8');
  checkDynamicInvocations(relative, content);
  for (const fn of extractInvocations(content)) {
    if (!usage.has(fn)) usage.set(fn, []);
    usage.get(fn).push(relative);
    if (!available.has(fn) && !ALLOWLIST_MISSING.has(fn)) {
      failures.push(`${relative}: invokes missing Base44 function "${fn}"`);
    }
  }
}

const sortedUsage = [...usage.entries()].sort(([a], [b]) => a.localeCompare(b));
console.log(`Checked ${sourceFiles.length} source files.`);
console.log(`Found ${sortedUsage.length} literal Base44 function invocation(s).`);

if (warnings.length) {
  console.warn('\nFunction invocation audit warnings:\n');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length) {
  console.error('\nFunction invocation audit failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nCreate the missing function, correct the function name, or add a narrowly reviewed allowlist entry.\n');
  process.exit(1);
}

console.log('Function invocation audit passed.');
