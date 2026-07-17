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
  if (/WebsiteLead\.create\s*\(/.test(text)) {
    failures.push(`${path.relative(root, file)} directly creates WebsiteLead; use captureValidatedWebsiteLead`);
  }
  if (/asServiceRole/.test(text)) {
    failures.push(`${path.relative(root, file)} references asServiceRole in frontend code`);
  }
}

const requiredSchemaFields = {
  'base44/entities/WebsiteLead.jsonc': [
    'environment','dashboard_excluded','dashboard_truth_status','lead_quality','follow_up_priority',
    'submission_count','first_submission_at','last_submission_at','duplicate_of_lead_id','capture_version'
  ],
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

const functionMarkers = {
  'base44/functions/captureConversionEvent/entry.ts': ['event_id', 'duplicate: true', 'dashboard_excluded', 'tracking_version'],
  'base44/functions/captureValidatedWebsiteLead/entry.ts': ['dedup_key', 'submission_count', 'environment', 'dashboard_truth_status'],
  'base44/functions/backfillWebsiteLeadTruth/entry.ts': ['dry_run', 'submission_count', 'dashboard_excluded'],
};

for (const [relative, markers] of Object.entries(functionMarkers)) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {
    failures.push(`${relative} is missing`);
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${relative} missing ${marker}`);
  }
}

if (failures.length) {
  console.error('\nProduction data truth guard failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Production data truth guards passed.');
