import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPauseCollectionParams,
  buildResumeCollectionParams,
  canManageBillingOrder,
} from "../base44/functions/_shared/subscriptionPauseResume.js";

test("pause subscription params use Stripe pause_collection behavior and optional resume timestamp", () => {
  const params = buildPauseCollectionParams({
    behavior: "keep_as_draft",
    resumes_at: "2026-06-20T12:00:00.000Z",
  });

  assert.equal(params.get("pause_collection[behavior]"), "keep_as_draft");
  assert.equal(params.get("pause_collection[resumes_at]"), "1781956800");
});

test("pause subscription params fall back to void for unknown behavior", () => {
  const params = buildPauseCollectionParams({ behavior: "bad_value" });

  assert.equal(params.get("pause_collection[behavior]"), "void");
  assert.equal(params.has("pause_collection[resumes_at]"), false);
});

test("resume subscription params unset pause_collection", () => {
  const params = buildResumeCollectionParams();

  assert.equal(params.get("pause_collection"), "");
});

test("billing order access allows admins and matching customer emails only", () => {
  assert.equal(
    canManageBillingOrder({
      user: { role: "admin", email: "ops@example.com" },
      order: { customer_email: "client@example.com" },
    }),
    true
  );
  assert.equal(
    canManageBillingOrder({
      user: { role: "user", email: "client@example.com" },
      order: { customer_email: "client@example.com" },
    }),
    true
  );
  assert.equal(
    canManageBillingOrder({
      user: { role: "user", email: "other@example.com" },
      order: { customer_email: "client@example.com" },
    }),
    false
  );
});
