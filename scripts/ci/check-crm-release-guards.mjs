import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const ALLOWED_DELETE_PATHS = new Set([
  'src/lib/leadCleanupGuards.js',
  'src/components/admin/LeadQualityControl.jsx',
  'src/components/admin/LeadsTable.jsx',
  'src/components/admin/WebsiteLeadsDashboard.jsx',
  'base44/functions/backfillLeadQualityGuards/main.ts',
  'base44/functions/bulkLeadAction/main.ts',
]);

const APPROVED_OUTBOUND_GUARD_FILES = new Set([
  'base44/functions/_shared/outboundLeadGuards.js',
  'base44/functions/sendWebsiteLeadResponse/main.ts',
  'base44/functions/processWebsiteLeadFollowUps/main.ts',
  'base44/functions/sendSMS/main.ts',
  'base44/functions/sendDemoConfirmationSMS/main.ts',
  'base44/functions/sendReviewRequest/entry.ts',
  'base44/functions/scheduleFollowUpSMS/main.ts',
  'base44/functions/sendTestCommunication/entry.ts',
  'base44/functions/deliveryProofTest/entry.ts',
]);

const OPTIONAL_MANUAL_SENDER_FILES = new Set([
  'base44/functions/sendSMS/main.ts',
  'base44/functions/sendDemoConfirmationSMS/main.ts',
  'base44/functions/sendReviewRequest/entry.ts',
  'base44/functions/scheduleFollowUpSMS/main.ts',
  'base44/functions/sendTestCommunication/entry.ts',
  'base44/functions/deliveryProofTest/entry.ts',
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', 'build', '.next'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function hasGuardrail(content) {
  return /getWebsiteLeadOutboundSuppression|isWebsiteLeadSafeForOutbound|outbound_suppressed|automation_enabled|archived|lead_status\s*[:=]+\s*['"]ignored['"]|cadence_paused/.test(content);
}

function checkDeletes(file, content) {
  const relative = rel(file);
  const deletePatterns = [
    /entities\.(Leads|Lead|WebsiteLead)\.delete\s*\(/g,
    /asServiceRole\.entities\.(Leads|Lead|WebsiteLead)\.delete\s*\(/g,
  ];
  for (const pattern of deletePatterns) {
    if (pattern.test(content) && !ALLOWED_DELETE_PATHS.has(relative)) {
      failures.push(`${relative}: direct CRM delete outside approved guarded cleanup files`);
    }
  }
}

function checkOutbound(file, content) {
  const relative = rel(file);
  if (!relative.startsWith('base44/functions/')) return;
  const sendsOutbound = /twilioFetch\s*\(|resendFetch\s*\(|api\.twilio\.com|api\.resend\.com|Messages\.json/.test(content);
  if (!sendsOutbound) return;

  if (!hasGuardrail(content) && !APPROVED_OUTBOUND_GUARD_FILES.has(relative)) {
    failures.push(`${relative}: outbound provider call without visible lead suppression guard`);
  }

  if (OPTIONAL_MANUAL_SENDER_FILES.has(relative)) {
    return;
  }

  if (!/CommunicationEvent\.create/.test(content)) {
    failures.push(`${relative}: outbound provider call without CommunicationEvent logging`);
  }
}

function checkDashboardRawCounts(file, content) {
  const relative = rel(file);
  if (!relative.startsWith('src/components/admin/') && !relative.startsWith('src/internal-pages/')) return;
  if (/Lead|CRM|WebsiteLead/.test(content) && /filter\(\{\}\s*,\s*['"]-created_date['"]/.test(content)) {
    if (!/trusted|isLeadVisibleInSalesViews|isWebsiteLeadVisibleInSalesViews|hidden/i.test(content)) {
      failures.push(`${relative}: admin lead query appears to load raw records without trusted/hidden labeling`);
    }
  }
}

for (const file of walk(root)) {
  const content = fs.readFileSync(file, 'utf8');
  checkDeletes(file, content);
  checkOutbound(file, content);
  checkDashboardRawCounts(file, content);
}

if (failures.length) {
  console.error('\nCRM release guard failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nFix the unsafe pattern or explicitly add a reviewed exception in scripts/ci/check-crm-release-guards.mjs.\n');
  process.exit(1);
}

console.log('CRM release guard passed.');
