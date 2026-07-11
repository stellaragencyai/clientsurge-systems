import test from "node:test";
import assert from "node:assert/strict";

import { PACKAGE_OFFERS as FRONTEND_OFFERS } from "../src/lib/salesCatalog.js";
import { PACKAGE_OFFERS as BACKEND_OFFERS } from "../base44/functions/createCheckoutSession/salesCatalog.shared.js";
import {
  STRIPE_PRODUCTS as PRICING_PRODUCTS,
  getMonthlyPrice,
  getStripePriceId,
} from "../src/lib/pricingRegistry.js";
import {
  PLAN_FEATURE_MAPPING,
  PLAN_REGISTRY,
  STRIPE_MAPPING_REFERENCE,
} from "../src/lib/saasProductizationConfig.js";
import { STRIPE_PRODUCTS as SITE_PRODUCTS } from "../src/lib/siteConfig.js";
import { PACKAGE_CAPABILITY_MATRIX } from "../src/lib/packageCapabilities.js";

function project(offer) {
  return {
    package_key: offer.package_key,
    name: offer.name,
    stripe_product_id: offer.stripe_product_id,
    setup_price_id: offer.setup_price_id,
    monthly_price_id: offer.monthly_price_id,
    setup_total: offer.setup_total,
    monthly_total: offer.monthly_total,
    included_service_keys: offer.included_service_keys,
  };
}

test("frontend and checkout package catalogs stay identical", () => {
  assert.deepEqual(FRONTEND_OFFERS.map(project), BACKEND_OFFERS.map(project));
});

test("compatibility registries derive exact Stripe and package values", () => {
  for (const offer of FRONTEND_OFFERS) {
    const shortKey = offer.package_key.replace(/_system$/, "");
    const pricing = PRICING_PRODUCTS[shortKey];
    const site = SITE_PRODUCTS[shortKey];
    const plan = PLAN_REGISTRY[offer.package_key];

    assert.equal(pricing.product_id, offer.stripe_product_id);
    assert.equal(pricing.setup_price_id, offer.setup_price_id);
    assert.equal(pricing.monthly_price_id, offer.monthly_price_id);
    assert.equal(pricing.setup_price, offer.setup_total);
    assert.equal(pricing.monthly_price, offer.monthly_total);
    assert.equal(pricing.annual_monthly_price, null);
    assert.equal(pricing.ai_voice_minutes, null);

    assert.deepEqual(site, {
      name: offer.name,
      id: offer.stripe_product_id,
      setup: offer.setup_total,
      monthly: offer.monthly_total,
      checkout_url: `/product-signup?package=${encodeURIComponent(offer.package_key)}`,
    });

    assert.equal(plan.stripe_product_id, offer.stripe_product_id);
    assert.equal(plan.setup_price_id, offer.setup_price_id);
    assert.equal(plan.monthly_price_id, offer.monthly_price_id);
    assert.deepEqual(
      PLAN_FEATURE_MAPPING[offer.package_key].feature_keys,
      offer.included_service_keys,
    );

    assert.equal(getStripePriceId(shortKey, "setup"), offer.setup_price_id);
    assert.equal(getStripePriceId(shortKey, "monthly"), offer.monthly_price_id);
  }

  assert.equal(getMonthlyPrice("starter", "annual"), null);
});

test("runtime capability bundles match the canonical offer bundles", () => {
  const tierMap = {
    basic: "starter_system",
    growth: "growth_system",
    pro: "pro_system",
  };

  for (const [runtimeTier, packageKey] of Object.entries(tierMap)) {
    const offer = FRONTEND_OFFERS.find((item) => item.package_key === packageKey);
    assert.ok(offer);
    assert.equal(PACKAGE_CAPABILITY_MATRIX[runtimeTier].package_key, packageKey);
    assert.deepEqual(
      PACKAGE_CAPABILITY_MATRIX[runtimeTier].service_keys,
      offer.included_service_keys,
    );
  }
});

test("Stripe mapping reference contains both verified prices for every package", () => {
  for (const offer of FRONTEND_OFFERS) {
    const mappings = STRIPE_MAPPING_REFERENCE.filter(
      (item) => item.mapped_plan === offer.package_key,
    );
    assert.equal(mappings.length, 2);
    assert.deepEqual(
      mappings.map((item) => item.stripe_price_id).sort(),
      [offer.setup_price_id, offer.monthly_price_id].sort(),
    );
  }
});
