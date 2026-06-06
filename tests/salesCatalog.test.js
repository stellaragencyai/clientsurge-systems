import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_PRODUCTS,
  PACKAGE_OFFERS,
  CANONICAL_SERVICE_PRODUCTS,
  buildPricingSummaryForProducts,
  buildStoredPricingSummary,
  buildStripeLineItemsForPricingSummary,
  getPackageOffer,
  getPackageServices,
  resolvePackageStripeIds,
} from "../src/lib/salesCatalog.js";

const PACKAGE_STRIPE_OVERRIDE_ENV = "STRIPE_PACKAGE_PRICE_OVERRIDES_JSON";

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
  const starter = getPackageOffer("starter_system");
  const growth = getPackageOffer("growth_system");

  assert.ok(starter);
  assert.deepEqual(starter.included_service_keys, [
    "instant_lead_response",
    "missed_call_text_back",
  ]);
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
  assert.equal(growth.setup_total, 1297);
  assert.equal(growth.monthly_total, 997);
  assert.equal(growth.stripe_product_id, "prod_UReWhZsWks1HuA");
});

test("pricing summary matches best package when selected services align", () => {
  const summary = buildPricingSummaryForProducts(
    getPackageServices("growth_system").map((service) => service.product_id)
  );

  assert.equal(summary.package_offer?.package_key, "growth_system");
  assert.equal(summary.priced_items.length, 4);
  assert.equal(summary.total_setup, 1297);
  assert.equal(summary.total_monthly, 997);
  assert.equal(summary.setup_discount_total, 91);
  assert.equal(summary.monthly_discount_total, 0);
});

test("pricing summary preserves add-ons outside matched package", () => {
  const summary = buildPricingSummaryForProducts([
    ...getPackageServices("starter_system").map((service) => service.product_id),
    "prod_UNi5dvOUm6Fi9i",
  ]);

  assert.equal(summary.package_offer?.package_key, "starter_system");
  assert.deepEqual(summary.add_on_service_keys, ["review_request"]);
  assert.equal(summary.total_setup, 994);
  assert.equal(summary.total_monthly, 564);
});

test("stored pricing summary keeps package and discount visibility for admin", () => {
  const summary = buildPricingSummaryForProducts(
    getPackageServices("pro_system").map((service) => service.product_id)
  );
  const stored = buildStoredPricingSummary(summary.priced_items);

  assert.equal(stored.package_key, "pro_system");
  assert.equal(stored.package_name, "Pro System");
  assert.equal(stored.package_stripe_product_id, "prod_UReW1LmsVbn4BZ");
  assert.equal(stored.package_setup_price_id, "price_1TSlDYBVGjsISdG0l2rHzet1");
  assert.equal(stored.package_monthly_price_id, "price_1TSlDXBVGjsISdG0Abdx85z3");
  assert.equal(stored.total_setup, 2497);
  assert.equal(stored.total_monthly, 1997);
  assert.equal(stored.setup_discount_total, 0);
  assert.equal(stored.monthly_discount_total, 0);
});

test("legacy elite_system package key remains backward compatible with Pro", () => {
  assert.equal(getPackageOffer("elite_system")?.package_key, "pro_system");
  assert.equal(getPackageOffer("Elite System")?.name, "Pro System");
  assert.deepEqual(
    getPackageServices("elite_system").map((service) => service.product_id),
    getPackageServices("pro_system").map((service) => service.product_id)
  );
});

test("legacy elite_system Stripe override key still works for Pro", () => {
  process.env[PACKAGE_STRIPE_OVERRIDE_ENV] = JSON.stringify({
    elite_system: {
      stripe_product_id: "prod_test_pro_legacy",
      setup_price_id: "price_test_pro_setup_legacy",
      monthly_price_id: "price_test_pro_monthly_legacy",
    },
  });

  try {
    const summary = buildPricingSummaryForProducts(
      getPackageServices("pro_system").map((service) => service.product_id)
    );

    assert.deepEqual(resolvePackageStripeIds(summary.package_offer), {
      stripe_product_id: "prod_test_pro_legacy",
      setup_price_id: "price_test_pro_setup_legacy",
      monthly_price_id: "price_test_pro_monthly_legacy",
    });
  } finally {
    delete process.env[PACKAGE_STRIPE_OVERRIDE_ENV];
  }
});

test("package checkout uses the live Stripe package price ids", () => {
  delete process.env[PACKAGE_STRIPE_OVERRIDE_ENV];
  const summary = buildPricingSummaryForProducts(
    getPackageServices("starter_system").map((service) => service.product_id)
  );

  assert.deepEqual(buildStripeLineItemsForPricingSummary(summary), [
    { price: "price_1TSlDWBVGjsISdG0SyoWzAm3", quantity: 1 },
    { price: "price_1TSlDWBVGjsISdG0Ej1O16ov", quantity: 1 },
  ]);
});

test("package checkout can use staging/test Stripe package price overrides", () => {
  process.env[PACKAGE_STRIPE_OVERRIDE_ENV] = JSON.stringify({
    starter_system: {
      stripe_product_id: "prod_test_starter",
      setup_price_id: "price_test_starter_setup",
      monthly_price_id: "price_test_starter_monthly",
    },
  });

  try {
    const summary = buildPricingSummaryForProducts(
      getPackageServices("starter_system").map((service) => service.product_id)
    );
    const stored = buildStoredPricingSummary(summary.priced_items);

    assert.deepEqual(resolvePackageStripeIds(summary.package_offer), {
      stripe_product_id: "prod_test_starter",
      setup_price_id: "price_test_starter_setup",
      monthly_price_id: "price_test_starter_monthly",
    });
    assert.equal(stored.package_stripe_product_id, "prod_test_starter");
    assert.equal(stored.package_setup_price_id, "price_test_starter_setup");
    assert.equal(stored.package_monthly_price_id, "price_test_starter_monthly");
    assert.deepEqual(buildStripeLineItemsForPricingSummary(summary), [
      { price: "price_test_starter_setup", quantity: 1 },
      { price: "price_test_starter_monthly", quantity: 1 },
    ]);
  } finally {
    delete process.env[PACKAGE_STRIPE_OVERRIDE_ENV];
  }
});

test("package checkout rejects incomplete staging/test Stripe package price overrides", () => {
  process.env[PACKAGE_STRIPE_OVERRIDE_ENV] = JSON.stringify({
    starter_system: {
      setup_price_id: "price_test_starter_setup",
    },
  });

  try {
    const summary = buildPricingSummaryForProducts(
      getPackageServices("starter_system").map((service) => service.product_id)
    );

    assert.throws(
      () => buildStripeLineItemsForPricingSummary(summary),
      /must include stripe_product_id, setup_price_id, and monthly_price_id/
    );
  } finally {
    delete process.env[PACKAGE_STRIPE_OVERRIDE_ENV];
  }
});

test("package checkout rejects malformed staging/test Stripe package override JSON", () => {
  process.env[PACKAGE_STRIPE_OVERRIDE_ENV] = "{not-json";

  try {
    const summary = buildPricingSummaryForProducts(
      getPackageServices("starter_system").map((service) => service.product_id)
    );

    assert.throws(
      () => buildStripeLineItemsForPricingSummary(summary),
      /Invalid STRIPE_PACKAGE_PRICE_OVERRIDES_JSON/
    );
  } finally {
    delete process.env[PACKAGE_STRIPE_OVERRIDE_ENV];
  }
});

test("add-on checkout is blocked until live Stripe add-on prices exist", () => {
  const summary = buildPricingSummaryForProducts([
    ...getPackageServices("starter_system").map((service) => service.product_id),
    "prod_UNi5dvOUm6Fi9i",
  ]);

  assert.throws(
    () => buildStripeLineItemsForPricingSummary(summary),
    /add-on checkout is not enabled/
  );
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
    assert.ok(summary.total_setup_before_discount >= summary.total_setup);
    assert.ok(summary.total_monthly_before_discount >= summary.total_monthly);
    assert.ok(summary.setup_discount_total >= 0);
    assert.ok(summary.monthly_discount_total >= 0);
  }
});
