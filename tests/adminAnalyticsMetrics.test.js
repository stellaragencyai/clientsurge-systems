import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRevenueMetrics,
  isPaidRevenueOrder,
} from "../base44/functions/_shared/adminAnalyticsMetrics.js";

test("admin revenue metrics sum total_monthly from paid orders", () => {
  const metrics = buildRevenueMetrics([
    { payment_status: "paid", total_monthly: 497, total_setup: 997 },
    { payment_status: "succeeded", total_monthly: "299", total_setup: "499" },
    { billing_status: "active", payment_status: "pending", total_monthly: 97, total_setup: 0 },
    { payment_status: "pending", total_monthly: 999, total_setup: 999 },
    { payment_status: "failed", billing_status: "past_due", total_monthly: 199, total_setup: 199 },
  ]);

  assert.equal(metrics.mrr, 893);
  assert.equal(metrics.arr, 10716);
  assert.equal(metrics.setup_revenue, 1496);
  assert.equal(metrics.paid_orders, 3);
});

test("paid revenue order accepts active subscription states without counting failed orders", () => {
  assert.equal(isPaidRevenueOrder({ billing_status: "active" }), true);
  assert.equal(isPaidRevenueOrder({ subscription_status: "trialing" }), true);
  assert.equal(isPaidRevenueOrder({ payment_status: "paid" }), true);
  assert.equal(isPaidRevenueOrder({ payment_status: "failed", billing_status: "past_due" }), false);
});
