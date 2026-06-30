import test from 'node:test';
import assert from 'node:assert/strict';
import { CRM_GUIDE_PHASES, getCrmGuidePhase, getCrmGuideSummary } from '../src/lib/adminGuideChecklist.js';

test('CRM guide has the expected ordered phases', () => {
  assert.equal(CRM_GUIDE_PHASES.length, 8);
  assert.deepEqual(CRM_GUIDE_PHASES.map((phase) => phase.id), [
    'prove-release',
    'snapshot-first',
    'dry-run',
    'apply-safe-review',
    'review-groups',
    'outreach-readiness',
    'qa-proof',
    'guarded-removal',
  ]);
});

test('CRM guide summary counts phases, checks, and tabs', () => {
  const summary = getCrmGuideSummary();
  assert.equal(summary.phase_count, 8);
  assert.ok(summary.check_count >= 25);
  assert.ok(summary.tabs.includes('System Health → Data Quality'));
  assert.ok(summary.tabs.includes('Tools → QA Tools'));
});

test('CRM guide includes release proof and QA proof phases', () => {
  const releasePhase = getCrmGuidePhase('prove-release');
  const qaPhase = getCrmGuidePhase('qa-proof');
  assert.ok(releasePhase.checks.some((check) => check.includes('Release Gate')));
  assert.ok(qaPhase.checks.some((check) => check.includes('QA Lead Proof Generator')));
});

test('CRM guide puts guarded removal last', () => {
  const lastPhase = CRM_GUIDE_PHASES[CRM_GUIDE_PHASES.length - 1];
  assert.equal(lastPhase.id, 'guarded-removal');
  assert.ok(lastPhase.checks.some((check) => check.includes('Export selected records')));
});
