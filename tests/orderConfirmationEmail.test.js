import test from "node:test";
import assert from "node:assert/strict";

import { getPackageOffer } from "../src/lib/salesCatalog.js";
import { formatMoney, resolveServiceRows } from "../base44/functions/sendOrderConfirmationEmail/serviceRows.shared.js";

test("order confirmation rows use human-readable canonical service labels", () => {
  const rows = resolveServiceRows({
    items: [
      { service_key: "instant_lead_response", setup_fee: 297, monthly_fee: 97 },
      { service_key: "missed_call_text_back", setup_fee: 197, monthly_fee: 67 },
      { service_key: "nurture_sequence_14d", setup_fee: 397, monthly_fee: 127 },
      { service_key: "ai_booking_agent", setup_fee: 497, monthly_fee: 147 },
      { service_key: "lead_reactivation", setup_fee: 297, monthly_fee: 97 },
      { service_key: "review_request", setup_fee: 197, monthly_fee: 67 },
    ],
  });

  assert.deepEqual(rows.map((row) => row.name), [
    "Instant Lead Response",
    "Missed Call Text-Back",
    "14-Day Nurture Sequence",
    "AI Booking Agent",
    "Old Lead Reactivation",
    "Review Request Automation",
  ]);
});

test("order confirmation rows prefer explicit product names and fallback prices safely", () => {
  const rows = resolveServiceRows({
    items: [
      { service_key: "instant_lead_response", product_name: "Custom Fast Lead Response" },
      { service_key: "unknown_custom_service" },
    ],
  });

  assert.equal(rows[0].name, "Custom Fast Lead Response");
  assert.equal(rows[0].setup_fee, 297);
  assert.equal(rows[0].monthly_fee, 97);
  assert.equal(rows[1].name, "unknown_custom_service");
  assert.equal(rows[1].setup_fee, 0);
  assert.equal(rows[1].monthly_fee, 0);
});

test("order confirmation rows fallback to package included service labels", () => {
  const rows = resolveServiceRows({ items: [] }, getPackageOffer("elite_system"));

  assert.equal(rows.length, 6);
  assert.ok(rows.every((row) => !row.name.includes("_")));
  assert.ok(rows.some((row) => row.name === "Review Request Automation"));
});

test("order confirmation money formatting is human-readable", () => {
  assert.equal(formatMoney(1297), "1,297");
  assert.equal(formatMoney(null), "0");
});
