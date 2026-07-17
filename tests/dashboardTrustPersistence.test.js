import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const backend = fs.readFileSync('base44/functions/scoreDashboardTruthChecks/entry.ts', 'utf8');
const panel = fs.readFileSync('src/components/admin/DashboardTrustScorePanel.jsx', 'utf8');
const reconciliation = fs.readFileSync('src/components/admin/AdminReconciliationButton.jsx', 'utf8');

test('trust scoring persists schema-safe evidence in DashboardTruthCheck', () => {
  assert.match(backend, /DashboardTruthCheck\.update/);
  assert.match(backend, /dashboard_trust_score: scoreEvidence/);
  assert.match(backend, /evidence_summary:/);
  assert.match(backend, /truth_status:/);
  assert.match(backend, /safe_to_launch:/);
  assert.match(backend, /formula_version: "dashboard-trust-v1"/);
});

test('blockers prevent trusted launch state', () => {
  assert.match(backend, /blockerCount > 0 \? "blocked"/);
  assert.match(backend, /scoring\.band === "trusted" && scoring\.blockerCount === 0/);
});

test('admin UI explains score components and supports dry-run first', () => {
  assert.match(panel, /Dry Run/);
  assert.match(panel, /Score & Persist/);
  assert.match(panel, /Blockers \{row\.blocker_count\}/);
  assert.match(panel, /Warnings \{row\.warning_count\}/);
  assert.match(panel, /Stale \{row\.stale_source_count\}/);
  assert.match(panel, /Missing \{row\.missing_source_count\}/);
  assert.match(panel, /Penalties:/);
  assert.match(reconciliation, /DashboardTrustScorePanel/);
});
