import test from "node:test";
import assert from "node:assert/strict";

import { computeDashboardTrustScore, dashboardTrustBand } from "../src/lib/dashboardTrustScore.js";

test("returns no evidence when no persisted evidence exists", () => {
  const result = computeDashboardTrustScore({});
  assert.equal(result.score, 0);
  assert.equal(result.band, "no_evidence");
  assert.equal(result.safe_to_launch, false);
});

test("returns trusted only with evidence and no blockers", () => {
  const result = computeDashboardTrustScore({ evidence_count: 12 });
  assert.equal(result.score, 100);
  assert.equal(result.band, "trusted");
  assert.equal(result.safe_to_launch, true);
});

test("a blocker prevents trusted status regardless of numeric score", () => {
  assert.equal(dashboardTrustBand(95, 1), "blocked");
  const result = computeDashboardTrustScore({ blockers: [{}], evidence_count: 20 });
  assert.equal(result.score, 75);
  assert.equal(result.band, "blocked");
  assert.equal(result.safe_to_launch, false);
});

test("penalties are capped and score is clamped", () => {
  const result = computeDashboardTrustScore({
    blocker_count: 100,
    warning_count: 100,
    stale_source_count: 100,
    missing_source_count: 100,
    evidence_count: 1,
  });
  assert.deepEqual(result.penalties, {
    blockers: 75,
    warnings: 24,
    stale_sources: 36,
    missing_sources: 45,
  });
  assert.equal(result.score, 0);
  assert.equal(result.band, "no_evidence");
});

test("warning and blocked score bands follow published thresholds", () => {
  const warning = computeDashboardTrustScore({ warning_count: 1, evidence_count: 5 });
  assert.equal(warning.score, 92);
  assert.equal(warning.band, "trusted");

  const warningBand = computeDashboardTrustScore({ warning_count: 2, evidence_count: 5 });
  assert.equal(warningBand.score, 84);
  assert.equal(warningBand.band, "warning");

  const blockedBand = computeDashboardTrustScore({ warning_count: 3, stale_source_count: 1, evidence_count: 5 });
  assert.equal(blockedBand.score, 64);
  assert.equal(blockedBand.band, "blocked");
});

test("accepts arrays and reports component counts", () => {
  const result = computeDashboardTrustScore({
    blockers: [],
    warnings: [{}, {}],
    stale_sources: ["metrics"],
    missing_sources: ["provider_callbacks"],
    evidence_records: [{ id: "evt_1" }],
  });

  assert.equal(result.warning_count, 2);
  assert.equal(result.stale_source_count, 1);
  assert.equal(result.missing_source_count, 1);
  assert.equal(result.evidence_count, 1);
  assert.equal(result.formula_version, "dashboard-trust-v1");
});
