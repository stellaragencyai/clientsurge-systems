import test from "node:test";
import assert from "node:assert/strict";

import {
  getCurrentPackageKey,
  getSubscriptionChangeOptions,
  getSubscriptionChangeOrderId,
} from "../src/lib/subscriptionChangeOptions.js";

test("subscription change options mark the current package from subscription plan key", () => {
  const options = getSubscriptionChangeOptions({
    subscription: { plan_key: "growth_system" },
  });

  assert.equal(options.length, 3);
  assert.equal(options.find((option) => option.name === "Growth System").is_current, true);
  assert.equal(options.find((option) => option.name === "Starter System").is_current, false);
  assert.ok(options.every((option) => option.monthly_price_id));
});

test("subscription change helpers normalize project plan names and resolve order id", () => {
  assert.equal(getCurrentPackageKey({ project: { plan: "Elite System" } }), "pro_system");
  assert.equal(getCurrentPackageKey({ project: { plan: "Pro System" } }), "pro_system");
  assert.equal(
    getSubscriptionChangeOrderId({
      project: { latest_order_id: "order_from_project" },
      subscription: { order_id: "order_from_subscription" },
      order: { id: "order_from_context" },
    }),
    "order_from_context"
  );
});
