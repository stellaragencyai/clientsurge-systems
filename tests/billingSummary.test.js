import test from "node:test";
import assert from "node:assert/strict";

import { buildBillingSummary } from "../src/lib/billingSummary.js";

test("billing summary warns when a subscription record is missing", () => {
  const summary = buildBillingSummary({
    order: {
      plan_type: "Starter System",
      payment_status: "paid",
      subscription_status: "",
      billing_status: "",
      stripe_subscription_id: "",
    },
  });

  assert.equal(summary.currentPlan, "Starter System");
  assert.equal(summary.subscriptionStatus, "missing");
  assert.ok(summary.warnings.includes("Subscription record missing"));
});

test("billing summary surfaces payment follow-up and cancellation truth", () => {
  const pastDue = buildBillingSummary({
    order: {
      payment_status: "failed",
      billing_status: "past_due",
      subscription_status: "past_due",
      stripe_subscription_id: "sub_123",
    },
  });
  const canceled = buildBillingSummary({
    order: {
      payment_status: "paid",
      billing_status: "canceled",
      subscription_status: "canceled",
      stripe_subscription_id: "sub_123",
    },
  });

  assert.ok(pastDue.warnings.includes("Payment follow-up required"));
  assert.ok(canceled.warnings.some((warning) => warning.includes("Subscription canceled")));
});
