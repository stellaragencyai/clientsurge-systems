import test from "node:test";
import assert from "node:assert/strict";

import {
  assertCheckoutCapacityAvailable,
  __testing,
} from "../base44/functions/createCheckoutSession/checkoutCapacity.shared.js";

class InMemoryOrderCollection {
  constructor(records = []) {
    this.records = records;
  }

  async list() {
    return [...this.records];
  }
}

function createBase44WithOrders(records) {
  return {
    asServiceRole: {
      entities: {
        Order: new InMemoryOrderCollection(records),
      },
    },
  };
}

test("checkout capacity gate is disabled when no limit is configured", async () => {
  const result = await assertCheckoutCapacityAvailable({
    base44: createBase44WithOrders([{ id: "order_1", order_status: "pending_payment" }]),
    limitValue: "",
  });

  assert.equal(result.ok, true);
  assert.equal(result.enforced, false);
  assert.equal(result.capacity_limit, null);
});

test("checkout capacity gate blocks when active orders meet configured limit", async () => {
  const result = await assertCheckoutCapacityAvailable({
    base44: createBase44WithOrders([
      { id: "order_1", order_status: "pending_payment", payment_status: "pending" },
      { id: "order_2", order_status: "active", payment_status: "paid" },
      { id: "order_3", order_status: "cancelled", payment_status: "refunded" },
    ]),
    limitValue: "2",
  });

  assert.equal(result.ok, false);
  assert.equal(result.enforced, true);
  assert.equal(result.active_orders, 2);
  assert.equal(result.capacity_limit, 2);
  assert.equal(result.reason, "ClientSurge onboarding capacity is currently full.");
});

test("checkout capacity gate ignores closed orders", () => {
  assert.equal(__testing.isActiveCheckoutOrder({ order_status: "cancelled" }), false);
  assert.equal(__testing.isActiveCheckoutOrder({ payment_status: "refunded" }), false);
  assert.equal(
    __testing.isActiveCheckoutOrder({ order_status: "pending_payment", payment_status: "pending" }),
    true
  );
});

test("checkout capacity gate ignores stale pending orders without a Stripe session", () => {
  const staleCreatedDate = new Date(
    Date.now() - __testing.STALE_PENDING_WITHOUT_SESSION_MS - 60_000
  ).toISOString();

  assert.equal(
    __testing.isActiveCheckoutOrder({
      order_status: "pending_payment",
      payment_status: "pending",
      created_date: staleCreatedDate,
    }),
    false
  );
});

test("checkout capacity gate ignores stale pending orders after hosted checkout expiry", () => {
  const staleCreatedDate = new Date(
    Date.now() - __testing.STALE_PENDING_WITH_SESSION_MS - 60_000
  ).toISOString();

  assert.equal(
    __testing.isActiveCheckoutOrder({
      order_status: "pending_payment",
      payment_status: "pending",
      created_date: staleCreatedDate,
      stripe_session_id: "cs_live_example",
    }),
    false
  );
});
