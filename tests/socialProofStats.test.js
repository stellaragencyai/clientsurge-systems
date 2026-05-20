import test from "node:test";
import assert from "node:assert/strict";

import {
  countAutomatedBusinesses,
  formatAutomatedBusinessesStat,
} from "../src/lib/socialProofStats.js";

test("social proof counts paid or live orders as automated businesses", () => {
  assert.equal(countAutomatedBusinesses([
    { payment_status: "paid" },
    { order_status: "fully_live" },
    { pipeline_status: "live_ready" },
    { payment_status: "pending", order_status: "draft" },
  ]), 3);
});

test("social proof formats real order counts without inventing fake numbers", () => {
  assert.equal(formatAutomatedBusinessesStat(12), "12 businesses automated");
  assert.equal(formatAutomatedBusinessesStat(0), "Businesses automated with ClientSurge");
});
