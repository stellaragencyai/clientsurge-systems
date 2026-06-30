import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const HIGH_RISK_PROVIDER_FILES = [
  'base44/functions/sendWebsiteLeadResponse/main.ts',
  'base44/functions/processWebsiteLeadFollowUps/main.ts',
  'base44/functions/sendInstantLeadResponseSms/main.ts',
  'base44/functions/processMissedCallFollowUps/main.ts',
  'base44/functions/processQualifiedFollowUps/main.ts',
];

test('high risk provider sender files exist', () => {
  for (const file of HIGH_RISK_PROVIDER_FILES) {
    assert.equal(existsSync(new URL(`../${file}`, import.meta.url)), true, `${file} should exist`);
  }
});

test('WebsiteLead provider senders use outboundLeadGuards', () => {
  for (const file of [
    'base44/functions/sendWebsiteLeadResponse/main.ts',
    'base44/functions/processWebsiteLeadFollowUps/main.ts',
    'base44/functions/sendInstantLeadResponseSms/main.ts',
  ]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /getWebsiteLeadOutboundSuppression/);
    assert.match(source, /logSuppressedWebsiteLeadOutbound/);
  }
});

test('remaining Lead provider senders are inventoried for guardrail migration', () => {
  const expectedLegacyFiles = [
    'base44/functions/processMissedCallFollowUps/main.ts',
    'base44/functions/processQualifiedFollowUps/main.ts',
  ];
  for (const file of expectedLegacyFiles) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /api\.twilio\.com|resend\.com\/emails|twilioFetch|resendFetch/);
  }
});
