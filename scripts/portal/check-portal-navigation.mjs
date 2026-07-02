#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PORTAL_FILE = path.join(ROOT, 'src/internal-pages/ClientPortal.jsx');
const CONFIG_FILE = path.join(ROOT, 'src/lib/portalNavigationConfig.js');

const blockedEmojiPattern = /🚀|📍|⚡|🎯|🎉|📊|💬|🛠️/;
const legacyTabPattern = /label:\s*["'`](?:🚀|📍|⚡|🎯)/;

const failures = [];

try {
  const portal = await readFile(PORTAL_FILE, 'utf8');
  if (legacyTabPattern.test(portal)) {
    failures.push('ClientPortal.jsx still contains emoji-led tab labels. Use src/lib/portalNavigationConfig.js and PortalNavigationTabs instead.');
  }
} catch (error) {
  failures.push(`Unable to read ClientPortal.jsx: ${error.message}`);
}

try {
  const config = await readFile(CONFIG_FILE, 'utf8');
  if (blockedEmojiPattern.test(config)) {
    failures.push('portalNavigationConfig.js contains emoji-led labels. Portal IA labels must stay clean and professional.');
  }
} catch (error) {
  failures.push(`Unable to read portalNavigationConfig.js: ${error.message}`);
}

if (failures.length) {
  console.error('\nPortal navigation regression guard failed.\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Portal navigation regression guard passed.');
