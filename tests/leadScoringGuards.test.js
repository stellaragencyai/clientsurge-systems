import test from "node:test";
import assert from "node:assert/strict";

import {
  MIN_LEAD_SCORE_CONFIDENCE,
  normalizeLeadScoreConfidence,
  shouldApplyLeadScoreResult,
} from "../base44/functions/_shared/leadScoringGuards.js";

test("lead scoring guard skips low-confidence AI scores", () => {
  assert.equal(MIN_LEAD_SCORE_CONFIDENCE, 0.6);
  assert.deepEqual(shouldApplyLeadScoreResult({ confidence: 0.59 }), {
    confidence: 0.59,
    shouldApply: false,
  });
  assert.deepEqual(shouldApplyLeadScoreResult({ confidence: 0.6 }), {
    confidence: 0.6,
    shouldApply: true,
  });
});

test("lead scoring confidence normalization clamps invalid values", () => {
  assert.equal(normalizeLeadScoreConfidence(2), 1);
  assert.equal(normalizeLeadScoreConfidence(-1), 0);
  assert.equal(normalizeLeadScoreConfidence("not-a-number", 0.75), 0.75);
});
