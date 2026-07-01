#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const allowedDirectTwilioFiles = new Set([
  'base44/functions/sendSMS/entry.ts',
  'base44/functions/sendSMS/main.ts',
  'base44/functions/sendCompliantSms/entry.ts',
  'base44/functions/sendCompliantSms/main.ts',
  'base44/functions/testMessagingProviders/entry.ts',
  'base44/functions/verifySmsNormalization/entry.ts',
]);

const requiredSmsFooterPattern = /STOP\s+to\s+opt\s*out|Reply\s+STOP/i;
const directTwilioPatterns = [
  /TWILIO_ACCOUNT_SID/,
  /TWILIO_AUTH_TOKEN/,
  /TWILIO_PHONE_NUMBER/,
  /api\.twilio\.com\/2010-04-01\/Accounts/,
  /Messages\.json/,
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (['.git', 'node_modules', 'dist', 'build', '.next'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const findings = [];
const files = walk(path.join(root, 'base44/functions'));

for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const content = fs.readFileSync(file, 'utf8');
  const usesDirectTwilio = directTwilioPatterns.some((pattern) => pattern.test(content));
  if (!usesDirectTwilio) continue;

  if (!allowedDirectTwilioFiles.has(relative)) {
    findings.push({
      severity: 'critical',
      file: relative,
      issue: 'Direct Twilio/SMS send surface outside approved SMS gateway.',
      fix: 'Route this function through sendSMS/sendCompliantSms instead of direct Twilio credentials or Messages.json.',
    });
  }

  if (!requiredSmsFooterPattern.test(content) && !/inbound|receiveTwilio|statusCallback/i.test(relative)) {
    findings.push({
      severity: 'high',
      file: relative,
      issue: 'SMS send logic does not visibly include STOP/opt-out language.',
      fix: 'Append Reply STOP to opt out, or call the shared compliant SMS sender that appends it.',
    });
  }
}

const output = {
  checked_at: new Date().toISOString(),
  direct_sms_files_checked: files.length,
  findings_count: findings.length,
  passed: findings.length === 0,
  findings,
};

console.log(JSON.stringify(output, null, 2));

if (findings.length > 0) {
  process.exit(1);
}
