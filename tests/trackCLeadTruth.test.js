import test from "node:test";
import assert from "node:assert/strict";

import {
  TRACK_C_HARD_QUARANTINE_LEAD_IDS,
  isLeadProductionTrusted,
  buildTrackCLeadQuarantinePatch,
} from "../base44/functions/_shared/trackCLeadTruth.js";

test("Track C hard IDs are excluded from production trusted leads", () => {
  assert.equal(TRACK_C_HARD_QUARANTINE_LEAD_IDS.length, 6);
  assert.equal(isLeadProductionTrusted({ id: TRACK_C_HARD_QUARANTINE_LEAD_IDS[0], quality_review_status: "active" }), false);
});

test("untrusted lead states are excluded from production trusted leads", () => {
  assert.equal(isLeadProductionTrusted({ id: "safe", quality_review_status: "quarantined" }), false);
  assert.equal(isLeadProductionTrusted({ id: "safe", quality_review_status: "quarantine_candidate" }), false);
  assert.equal(isLeadProductionTrusted({ id: "safe", quality_review_status: "duplicate_candidate" }), false);
  assert.equal(isLeadProductionTrusted({ id: "safe", dedupe_status: "duplicate_candidate" }), false);
  assert.equal(isLeadProductionTrusted({ id: "safe", dedup_review_needed: true }), false);
  assert.equal(isLeadProductionTrusted({ id: "safe", quality_review_status: "active" }), true);
});

test("Track C patch only updates quality and audit fields", () => {
  const patch = buildTrackCLeadQuarantinePatch({ id: TRACK_C_HARD_QUARANTINE_LEAD_IDS[0] }, "2026-06-30T00:00:00.000Z");
  assert.equal(patch.quality_review_status, "quarantined");
  assert.equal(patch.quality_confidence, 98);
  assert.equal(patch.audited_at, "2026-06-30T00:00:00.000Z");
  assert.equal(Object.hasOwn(patch, "status"), false);
  assert.equal(Object.hasOwn(patch, "crm_stage"), false);
  assert.equal(Object.hasOwn(patch, "lead_state"), false);
  assert.equal(Object.hasOwn(patch, "outreach_status"), false);
});
