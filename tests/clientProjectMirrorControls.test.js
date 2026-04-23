import test from "node:test";
import assert from "node:assert/strict";

import {
  CLIENT_PROJECT_PROGRESS_STEPS,
  getClientProjectCompletedProgressCount,
  isClientProjectProgressFieldDerived,
} from "../src/lib/clientProjectMirrorControls.js";

test("all client project progress fields are treated as derived mirrors", () => {
  const keys = CLIENT_PROJECT_PROGRESS_STEPS.map((step) => step.key);

  assert.deepEqual(keys, [
    "step_onboarding",
    "step_payment",
    "step_system_setup",
    "step_sms",
    "step_email",
    "step_booking",
    "step_followup",
    "step_live",
  ]);

  for (const key of keys) {
    assert.equal(isClientProjectProgressFieldDerived(key), true);
  }

  assert.equal(isClientProjectProgressFieldDerived("plan_change_request"), false);
});

test("completed client project mirror progress is counted from derived statuses only", () => {
  const project = {
    step_onboarding: "complete",
    step_payment: "complete",
    step_system_setup: "in_progress",
    step_sms: "pending",
    step_email: "complete",
    step_booking: "pending",
    step_followup: "complete",
    step_live: "pending",
  };

  assert.equal(getClientProjectCompletedProgressCount(project), 4);
});
