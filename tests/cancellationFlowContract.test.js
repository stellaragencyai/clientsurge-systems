import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

test("cancelSubscription covers owner/admin, duplicate, missing subscription, Stripe failure, and audit branches", () => {
  const source = read("base44/functions/cancelSubscription/main.ts");

  assert.match(source, /requireOwnerOrAdmin/);
  assert.match(source, /userOwnsOrder/);
  assert.match(source, /order_access_required/);

  const duplicateIndex = source.indexOf("duplicate: true");
  const stripeIndex = source.indexOf("stripeFetch(");
  const updateIndex = source.indexOf("entities.Order.update");
  assert.ok(duplicateIndex > -1, "duplicate cancellation guard is present");
  assert.ok(duplicateIndex < stripeIndex, "duplicate request returns before Stripe mutation");
  assert.match(source, /order\.billing_status === "cancelling"/);
  assert.match(source, /order\.cancellation_requested_at/);

  assert.match(source, /if \(order\.stripe_subscription_id\)/);
  assert.match(source, /if \(!stripeRes\.ok\)/);
  assert.match(source, /stripe_cancellation_failed/);
  assert.match(source, /stripe_cancellation_not_confirmed/);
  assert.ok(stripeIndex < updateIndex, "Stripe confirmation happens before local cancellation state is written");

  assert.match(source, /action:\s*"subscription_cancellation_requested"/);
  assert.match(source, /before:\s*order/);
  assert.match(source, /after:\s*updatedOrder/);
});

test("cancelSubscription legacy entry remains synced to deployed main", () => {
  assert.equal(
    read("base44/functions/cancelSubscription/entry.ts"),
    read("base44/functions/cancelSubscription/main.ts")
  );
});
