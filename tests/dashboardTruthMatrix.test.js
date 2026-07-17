import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DASHBOARD_TRUTH_CLASSIFICATIONS,
  classifyDashboardTruth,
  detectLegacyDependencies,
} from '../src/lib/dashboardTruthMatrix.js';

test('trusted requires explicit trusted band and persisted evidence', () => {
  const result = classifyDashboardTruth({ trust_band: 'trusted', evidence_count: 3 });
  assert.equal(result.classification, DASHBOARD_TRUTH_CLASSIFICATIONS.TRUSTED);
  assert.equal(result.safe_to_trust, true);
});

test('blockers always classify a status as broken', () => {
  const result = classifyDashboardTruth({ trust_band: 'trusted', evidence_count: 4, blocker_count: 1 });
  assert.equal(result.classification, DASHBOARD_TRUTH_CLASSIFICATIONS.BROKEN);
  assert.equal(result.safe_to_trust, false);
});

test('missing evidence classifies as needs instrumentation', () => {
  const noEvidence = classifyDashboardTruth({ trust_band: 'no_evidence', evidence_count: 0 });
  assert.equal(noEvidence.classification, DASHBOARD_TRUTH_CLASSIFICATIONS.NEEDS_INSTRUMENTATION);

  const missingSource = classifyDashboardTruth({ trust_band: 'warning', evidence_count: 2, missing_source_count: 1 });
  assert.equal(missingSource.classification, DASHBOARD_TRUTH_CLASSIFICATIONS.NEEDS_INSTRUMENTATION);
});

test('warnings and stale evidence classify as unverified', () => {
  const warning = classifyDashboardTruth({ trust_band: 'warning', evidence_count: 2, warning_count: 1 });
  assert.equal(warning.classification, DASHBOARD_TRUTH_CLASSIFICATIONS.UNVERIFIED);

  const stale = classifyDashboardTruth({ trust_band: 'trusted', evidence_count: 2, stale_source_count: 1 });
  assert.equal(stale.classification, DASHBOARD_TRUTH_CLASSIFICATIONS.UNVERIFIED);
});

test('legacy dependencies prevent trusted classification', () => {
  const result = classifyDashboardTruth({
    trust_band: 'trusted',
    evidence_count: 2,
    source_records: { legacy_metrics_snapshot: 'abc', order: '123' },
  });
  assert.equal(result.classification, DASHBOARD_TRUTH_CLASSIFICATIONS.UNVERIFIED);
  assert.deepEqual(result.legacy_dependencies, ['legacy_metrics_snapshot']);
});

test('unsupported optimistic status remains unverified', () => {
  const result = classifyDashboardTruth({ truth_status: 'healthy', evidence_count: 5 });
  assert.equal(result.classification, DASHBOARD_TRUTH_CLASSIFICATIONS.UNVERIFIED);
  assert.equal(result.safe_to_trust, false);
});

test('legacy dependency detector identifies deprecated keys', () => {
  assert.deepEqual(
    detectLegacyDependencies({ current: 1, deprecated_revenue: 2, old_install_status: 3 }),
    ['deprecated_revenue', 'old_install_status'],
  );
});
