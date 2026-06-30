import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQaLeadProofFixtures,
  buildQaLeadProofRunId,
  QA_LEAD_PROOF_CONFIRM_PHRASE,
  summarizeQaLeadProofFixtures,
} from '../src/lib/qaLeadProofFixtures.js';

test('builds stable QA lead proof run id', () => {
  const id = buildQaLeadProofRunId(new Date('2026-06-30T07:30:00.000Z'));
  assert.equal(id, 'qa-lead-proof-2026-06-30T07-30-00-000Z');
});

test('uses explicit confirmation phrase', () => {
  assert.equal(QA_LEAD_PROOF_CONFIRM_PHRASE, 'GENERATE QA LEAD PROOF');
});

test('fixtures are all internal/test safe and automation disabled where applicable', () => {
  const fixtures = buildQaLeadProofFixtures({ runId: 'qa-lead-proof-test', now: '2026-06-30T07:30:00.000Z' });
  assert.equal(fixtures.length, 5);
  assert.ok(fixtures.some((fixture) => fixture.entity === 'WebsiteLead'));
  assert.ok(fixtures.some((fixture) => fixture.entity === 'Leads'));

  const websiteFixture = fixtures.find((fixture) => fixture.entity === 'WebsiteLead');
  assert.equal(websiteFixture.data.archived, true);
  assert.equal(websiteFixture.data.automation_enabled, false);
  assert.equal(websiteFixture.data.lead_status, 'ignored');

  for (const fixture of fixtures) {
    assert.equal(fixture.data.source, 'qa_lead_proof_generator');
  }
});

test('fixtures include duplicate proof group and no-contact proof', () => {
  const fixtures = buildQaLeadProofFixtures({ runId: 'qa-lead-proof-test', now: '2026-06-30T07:30:00.000Z' });
  const duplicateFixtures = fixtures.filter((fixture) => fixture.expected_bucket === 'duplicate_candidate');
  assert.equal(duplicateFixtures.length, 2);
  assert.equal(duplicateFixtures[0].data.dedupe_group_key, duplicateFixtures[1].data.dedupe_group_key);
  assert.ok(fixtures.some((fixture) => fixture.expected_bucket === 'blocked_missing_contact'));
});

test('summarizes fixture entities and expected buckets', () => {
  const fixtures = buildQaLeadProofFixtures({ runId: 'qa-lead-proof-test', now: '2026-06-30T07:30:00.000Z' });
  const summary = summarizeQaLeadProofFixtures(fixtures);
  assert.equal(summary.total, 5);
  assert.equal(summary.by_entity.WebsiteLead, 1);
  assert.equal(summary.by_entity.Leads, 4);
  assert.equal(summary.expected_buckets.duplicate_candidate, 2);
});
