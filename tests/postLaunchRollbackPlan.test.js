import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rollbackPlan = readFileSync(
  new URL("../docs/POST_LAUNCH_ROLLBACK_PLAN.md", import.meta.url),
  "utf8"
);
const launchPreflight = readFileSync(
  new URL("../docs/production-launch-preflight-2026-05-19.md", import.meta.url),
  "utf8"
);

test("post-launch rollback plan covers go-live proof, rollback, and monitoring", () => {
  for (const phrase of [
    "Go-Live Proof Order",
    "Rollback Triggers",
    "Rollback Steps",
    "Stripe-Specific Recovery",
    "Email And SMS Recovery",
    "24-Hour Monitoring Checklist",
    "previous known-good commit",
    "Do not delete orders, leads, or provider events",
    "consent",
    "STOP opt-out",
  ]) {
    assert.match(rollbackPlan, new RegExp(phrase), `rollback plan includes ${phrase}`);
  }
});

test("production preflight links to the post-launch rollback plan", () => {
  assert.match(launchPreflight, /docs\/POST_LAUNCH_ROLLBACK_PLAN\.md/);
  assert.match(launchPreflight, /15-minute\/1-hour\/4-hour\/12-hour\/24-hour monitoring checks/);
});
