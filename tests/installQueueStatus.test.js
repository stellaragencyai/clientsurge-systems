import test from "node:test";
import assert from "node:assert/strict";

import {
  getStalledInstallWarning,
  hasInstallStarted,
  isPaidInstallOrder,
  STALLED_INSTALL_THRESHOLD_HOURS,
} from "../src/lib/installQueueStatus.js";

const NOW = new Date("2026-05-20T12:00:00.000Z").getTime();

function hoursAgo(hours) {
  return new Date(NOW - hours * 3600000).toISOString();
}

test("stalled install warning appears for paid orders older than two days with no install started", () => {
  const warning = getStalledInstallWarning(
    {
      payment_status: "paid",
      paid_at: hoursAgo(STALLED_INSTALL_THRESHOLD_HOURS + 5),
      pipeline_status: "Ready for Install",
      items: [{ service_key: "instant_lead_response", install_status: "Paid" }],
    },
    NOW
  );

  assert.equal(warning.label, "Install stalled");
  assert.equal(warning.hoursSincePaid, 53);
  assert.match(warning.title, /Paid 53h ago/);
});

test("stalled install warning stays hidden for fresh paid orders and active installs", () => {
  assert.equal(
    getStalledInstallWarning(
      {
        payment_status: "paid",
        paid_at: hoursAgo(24),
        pipeline_status: "Ready for Install",
      },
      NOW
    ),
    null
  );

  assert.equal(
    getStalledInstallWarning(
      {
        payment_status: "paid",
        paid_at: hoursAgo(72),
        pipeline_status: "Testing",
      },
      NOW
    ),
    null
  );

  assert.equal(
    getStalledInstallWarning(
      {
        payment_status: "paid",
        paid_at: hoursAgo(72),
        pipeline_status: "Ready for Install",
        items: [{ service_key: "missed_call_recovery", install_status: "Testing" }],
      },
      NOW
    ),
    null
  );
});

test("paid and started helpers normalize common order states", () => {
  assert.equal(isPaidInstallOrder({ order_status: "completed" }), true);
  assert.equal(isPaidInstallOrder({ subscription_status: "active" }), true);
  assert.equal(isPaidInstallOrder({ payment_status: "pending" }), false);

  assert.equal(hasInstallStarted({ workflow_stage: "Website Building" }), true);
  assert.equal(hasInstallStarted({ install_initialized_at: hoursAgo(1) }), true);
  assert.equal(hasInstallStarted({ pipeline_status: "Pending" }), false);
});
