import test from "node:test";
import assert from "node:assert/strict";

import {
  DEMO_VIDEO_LIBRARY,
  getDemoCoverageSummary,
  getInternalDemoEntries,
  getPublicDemoEntries,
  getServiceDemoEntries,
} from "../src/lib/demoVideoCatalog.js";

test("demo video catalog covers current canonical tracked services", () => {
  const serviceKeys = getServiceDemoEntries().map((entry) => entry.service_key).sort();

  assert.deepEqual(serviceKeys, [
    "ai_booking_agent",
    "instant_lead_response",
    "lead_reactivation",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "review_request",
  ]);
});

test("public and internal demo inventories are separated cleanly", () => {
  const publicEntries = getPublicDemoEntries();
  const internalEntries = getInternalDemoEntries();

  assert.ok(publicEntries.length > 0);
  assert.ok(internalEntries.length > 0);
  assert.ok(publicEntries.every((entry) => entry.audience === "public"));
  assert.ok(internalEntries.every((entry) => entry.audience === "internal"));
});

test("demo coverage summary reflects the inventory honestly", () => {
  const summary = getDemoCoverageSummary();

  assert.equal(summary.public_total, getPublicDemoEntries().length);
  assert.equal(summary.internal_total, getInternalDemoEntries().length);
  assert.equal(summary.public_published, 0);
  assert.deepEqual(summary.service_coverage_keys.sort(), DEMO_VIDEO_LIBRARY.service_clips.map((entry) => entry.service_key).sort());
});
