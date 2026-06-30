import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAutomationProof } from '../src/lib/automationProof.js';

test('classifies instant website response as proven when sent event exists', () => {
  const proof = buildAutomationProof([
    {
      id: 'event_1',
      event_type: 'sms_sent',
      status: 'sent',
      subject: 'Website lead immediate SMS',
      metadata_json: JSON.stringify({ website_lead_response: true }),
      created_date: '2026-06-30T00:00:00Z',
    },
  ]);
  const card = proof.find((item) => item.key === 'website_lead_response');
  assert.equal(card.status, 'proven');
  assert.equal(card.sent_count, 1);
});

test('classifies guarded automation when suppression event exists', () => {
  const proof = buildAutomationProof([
    {
      id: 'event_2',
      event_type: 'outbound_suppressed',
      status: 'skipped',
      subject: 'Outbound suppressed by processWebsiteLeadFollowUps',
      metadata_json: JSON.stringify({ source: 'website_lead_followup' }),
      created_date: '2026-06-30T00:00:00Z',
    },
  ]);
  const card = proof.find((item) => item.key === 'website_lead_followup');
  assert.equal(card.status, 'guarded');
  assert.equal(card.skipped_count, 1);
});

test('classifies failing automation when only failure event exists', () => {
  const proof = buildAutomationProof([
    {
      id: 'event_3',
      event_type: 'email_failed',
      status: 'failed',
      subject: 'Website follow-up step 2 failed',
      metadata_json: JSON.stringify({ source: 'website_lead_followup' }),
      created_date: '2026-06-30T00:00:00Z',
    },
  ]);
  const card = proof.find((item) => item.key === 'website_lead_followup');
  assert.equal(card.status, 'failing');
  assert.equal(card.failed_count, 1);
});

test('returns no signal when no matching events exist', () => {
  const proof = buildAutomationProof([]);
  assert.ok(proof.length > 0);
  assert.ok(proof.every((item) => item.status === 'no_signal'));
});
