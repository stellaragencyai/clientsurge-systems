import test from "node:test";
import assert from "node:assert/strict";

import {
  PACKAGE_OFFERS,
  getPackageOffer,
  getPackageServices,
  normalizePackageKey,
} from "../src/lib/salesCatalog.js";

const EXPECTED_PACKAGES = [
  {
    package_key: "starter_system",
    customer_facing_name: "Starter",
    setup_total: 797,
    monthly_total: 497,
    service_keys: ["instant_lead_response", "missed_call_text_back"],
  },
  {
    package_key: "growth_system",
    customer_facing_name: "Growth",
    setup_total: 1297,
    monthly_total: 997,
    service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ],
  },
  {
    package_key: "pro_system",
    customer_facing_name: "Pro",
    setup_total: 2497,
    monthly_total: 1997,
    service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request",
    ],
  },
];

test("controlled-launch packages expose the required business strategy contract", () => {
  assert.deepEqual(
    PACKAGE_OFFERS.map((offer) => offer.package_key),
    EXPECTED_PACKAGES.map((offer) => offer.package_key)
  );

  for (const expected of EXPECTED_PACKAGES) {
    const offer = getPackageOffer(expected.package_key);
    assert.ok(offer, `missing package ${expected.package_key}`);
    assert.equal(offer.customer_facing_name, expected.customer_facing_name);
    assert.equal(offer.setup_total, expected.setup_total);
    assert.equal(offer.monthly_total, expected.monthly_total);
    assert.equal(offer.checkout_enabled, true);
    assert.equal(offer.checkout_eligibility, "checkout_enabled");
    assert.equal(offer.ai_voice_agent_status, "optional_add_on_owner_confirmation_required");
    assert.ok(offer.description);
    assert.ok(offer.metadata?.current_public_package);
    assert.ok(offer.owner_confirmation_flags.some((flag) => flag.includes("OWNER_CONFIRMATION_REQUIRED")));
    assert.deepEqual(offer.included_service_keys, expected.service_keys);
    assert.deepEqual(
      getPackageServices(expected.package_key).map((service) => service.service_key),
      expected.service_keys
    );
  }
});

test("Elite remains a legacy alias for Pro and is not a current public package", () => {
  assert.equal(normalizePackageKey("elite_system"), "pro_system");
  assert.equal(normalizePackageKey("Elite System"), "pro_system");
  assert.equal(getPackageOffer("elite_system")?.package_key, "pro_system");
  assert.equal(getPackageOffer("elite")?.customer_facing_name, "Pro");
  assert.equal(PACKAGE_OFFERS.some((offer) => offer.package_key === "elite_system"), false);
});
