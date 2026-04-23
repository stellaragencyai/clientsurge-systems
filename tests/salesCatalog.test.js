import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_PRODUCTS,
  PACKAGE_OFFERS,
  CANONICAL_SERVICE_PRODUCTS,
  buildPricingSummaryForProducts,
  buildStoredPricingSummary,
  getPackageOffer,
  getPackageServices,
} from "../src/lib/salesCatalog.js";

test("public store catalog exposes all 12 offers while checkout stays canonical", () => {
  assert.equal(AI_PRODUCTS.length, 12);
  assert.equal(CANONICAL_SERVICE_PRODUCTS.length, 6);
  assert.deepEqual(
    CANONICAL_SERVICE_PRODUCTS.map((product) => product.service_key).sort(),
    [
      "ai_booking_agent",
      "instant_lead_response",
      "lead_reactivation",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "review_request",
    ]
  );
  assert.equal(
    AI_PRODUCTS.filter((product) => product.checkout_enabled === false).length,
    6
  );
});

test("package offers map directly to canonical service bundles", () => {
  const growth = getPackageOffer("growth_system");

  assert.ok(growth);
  assert.deepEqual(
    growth.included_service_keys,
    [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
    ]
  );
  assert.equal(growth.setup_total, 1195);
  assert.equal(growth.monthly_total, 349);
});

test("pricing summary matches best package when selected services align", () => {
  const summary = buildPricingSummaryForProducts(
    getPackageServices("growth_system").map((service) => service.product_id)
  );

  assert.equal(summary.package_offer?.package_key, "growth_system");
  assert.equal(summary.priced_items.length, 4);
  assert.equal(summary.total_setup, 1195);
  assert.equal(summary.total_monthly, 349);
  assert.equal(summary.setup_discount_total, 193);
  assert.equal(summary.monthly_discount_total, 89);
});

test("pricing summary preserves add-ons outside matched package", () => {
  const summary = buildPricingSummaryForProducts([
    ...getPackageServices("starter_system").map((service) => service.product_id),
    "prod_UNi5dvOUm6Fi9i",
  ]);

  assert.equal(summary.package_offer?.package_key, "starter_system");
  assert.deepEqual(summary.add_on_service_keys, ["review_request"]);
  assert.equal(summary.total_setup, 892);
  assert.equal(summary.total_monthly, 264);
});

test("stored pricing summary keeps package and discount visibility for admin", () => {
  const summary = buildPricingSummaryForProducts(
    getPackageServices("pro_system").map((service) => service.product_id)
  );
  const stored = buildStoredPricingSummary(summary.priced_items);

  assert.equal(stored.package_key, "pro_system");
  assert.equal(stored.package_name, "Pro System");
  assert.equal(stored.total_setup, 1495);
  assert.equal(stored.total_monthly, 469);
  assert.equal(stored.setup_discount_total, 387);
  assert.equal(stored.monthly_discount_total, 133);
});

test("non-self-serve public offers do not leak into checkout pricing", () => {
  const summary = buildPricingSummaryForProducts([
    "prod_UNi5aQjPk58U4o",
    "prod_UNi5RHiKNSTfQl",
  ]);

  assert.equal(summary.priced_items.length, 1);
  assert.equal(summary.priced_items[0].product_id, "prod_UNi5RHiKNSTfQl");
  assert.equal(summary.total_setup, 297);
  assert.equal(summary.total_monthly, 97);
});

test("package pricing math stays internally consistent", () => {
  for (const offer of PACKAGE_OFFERS) {
    const summary = buildPricingSummaryForProducts(
      offer.included_services.map((service) => service.product_id)
    );

    assert.equal(summary.total_setup, offer.setup_total);
    assert.equal(summary.total_monthly, offer.monthly_total);
    assert.equal(
      Number(summary.priced_items.reduce((sum, item) => sum + item.setup_fee, 0).toFixed(2)),
      offer.setup_total
    );
    assert.equal(
      Number(summary.priced_items.reduce((sum, item) => sum + item.monthly_fee, 0).toFixed(2)),
      offer.monthly_total
    );
  }
});
