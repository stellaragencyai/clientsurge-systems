import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

for (const file of walk(path.join(root, 'src'))) {
  if (!/\.(js|jsx|ts|tsx)$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (/ConversionTrackingEvent\.create\s*\(/.test(text)) {
    failures.push(`${path.relative(root, file)} directly creates ConversionTrackingEvent; use captureConversionEvent`);
  }
  if (/asServiceRole/.test(text)) {
    failures.push(`${path.relative(root, file)} references asServiceRole in frontend code`);
  }
}

const requiredSchemaFields = {
  'base44/entities/ConversionTrackingEvent.jsonc': [
    'environment','dashboard_excluded','dashboard_truth_status','release_version','tracking_version'
  ],
  'base44/entities/LandingPageAnalytics.jsonc': [
    'environment','dashboard_excluded','dashboard_truth_status','source_event_count','calculation_version'
  ],
  'base44/entities/OnboardingOrchestration.jsonc': [
    'environment','dashboard_excluded','dashboard_truth_status','canonical_stage_version','go_live_evidence_status'
  ],
};

for (const [relative, fields] of Object.entries(requiredSchemaFields)) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {
    failures.push(`${relative} is missing`);
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  for (const field of fields) {
    if (!new RegExp(`"${field}"\\s*:`).test(text)) failures.push(`${relative} missing ${field}`);
  }
}

const capturePath = path.join(root, 'base44/functions/captureConversionEvent/entry.ts');
if (!fs.existsSync(capturePath)) {
  failures.push('captureConversionEvent function is missing');
} else {
  const capture = fs.readFileSync(capturePath, 'utf8');
  for (const marker of ['event_id', 'duplicate: true', 'dashboard_excluded', 'tracking_version']) {
    if (!capture.includes(marker)) failures.push(`captureConversionEvent missing ${marker}`);
  }
}

if (failures.length) {
  console.error('\nProduction data truth guard failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Production data truth guards passed.');
