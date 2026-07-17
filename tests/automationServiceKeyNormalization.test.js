import test from "node:test";
import assert from "node:assert/strict";

import {
  getStepsForService,
  normalizeAutomationServiceKey,
} from "../src/lib/automationChecklistSteps.js";

const LEGACY_CASES = [
  ["followup_sequences", "nurture_sequence_14d"],
  ["appointment_booking", "ai_booking_agent"],
  ["missed_call_textback", "missed_call_text_back"],
];

test("legacy automation service keys normalize to canonical keys", () => {
  for (const [legacyKey, canonicalKey] of LEGACY_CASES) {
    assert.equal(normalizeAutomationServiceKey(legacyKey), canonicalKey);
  }
});

test("normalization is stable for whitespace, casing, and hyphens", () => {
  assert.equal(normalizeAutomationServiceKey(" Appointment-Booking "), "ai_booking_agent");
  assert.equal(normalizeAutomationServiceKey("MISSED CALL TEXTBACK"), "missed_call_text_back");
});

test("legacy keys resolve the same checklist templates as canonical keys", () => {
  for (const [legacyKey, canonicalKey] of LEGACY_CASES) {
    assert.deepEqual(getStepsForService(legacyKey), getStepsForService(canonicalKey));
    assert.ok(getStepsForService(legacyKey).length > 0);
  }
});

test("unknown and empty service keys fail closed", () => {
  assert.equal(normalizeAutomationServiceKey(""), "");
  assert.deepEqual(getStepsForService("unsupported_service"), []);
  assert.deepEqual(getStepsForService(null), []);
});
