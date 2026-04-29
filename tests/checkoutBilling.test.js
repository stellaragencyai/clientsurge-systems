import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCheckoutOrderPayload,
  buildStripeCheckoutSessionPayload,
  normalizeCheckoutLegalAcceptance,
  resolveCheckoutProducts,
} from "../base44/functions/_shared/checkoutBilling.js";
import { CHECKOUT_LEGAL_VERSION } from "../src/lib/legalDocuments.js";
import { buildPricingSummaryForProducts } from "../src/lib/salesCatalog.js";

test("checkout selection allows only public purchaseable pilot services", () => {
  const selection = resolveCheckoutProducts({
    product_ids: [
      "prod_UNi5RHiKNSTfQl",
      "prod_UNi5N0l5MtaV0R",
    ],
  });

  assert.deepEqual(
    selection.purchaseableProducts.map((product) => product.service_key),
    ["instant_lead_response"]
  );
  assert.deepEqual(
    selection.unavailableProducts.map((product) => product.service_key),
    ["nurture_sequence_14d"]
  );
});

test("legal acceptance is normalized with canonical document metadata", () => {
  const acceptance = normalizeCheckoutLegalAcceptance({
    legalAcceptance: {
      accepted: true,
      version: CHECKOUT_LEGAL_VERSION,
    },
    customerName: "Jamie Owner",
    customerEmail: "owner@example.com",
    requestHeaders: new Headers({
      "user-agent": "node-test",
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    }),
    now: "2026-04-29T01:02:03.000Z",
  });

  assert.equal(acceptance.accepted_at, "2026-04-29T01:02:03.000Z");
  assert.equal(acceptance.version, CHECKOUT_LEGAL_VERSION);
  assert.equal(acceptance.accepted_by_email, "owner@example.com");
  assert.equal(acceptance.ip_address, "203.0.113.10");
  assert.equal(acceptance.documents.length, 3);
});

test("checkout order payload persists pricing summary and legal acceptance", () => {
  const pricingSummary = buildPricingSummaryForProducts([
    "prod_UNi5RHiKNSTfQl",
    "prod_UNi5QL0bQl98If",
  ]);
  const legalAcceptance = normalizeCheckoutLegalAcceptance({
    legalAcceptance: { accepted: true, version: CHECKOUT_LEGAL_VERSION },
    customerName: "Jamie Owner",
    customerEmail: "owner@example.com",
    requestHeaders: new Headers(),
    now: "2026-04-29T01:02:03.000Z",
  });

  const payload = buildCheckoutOrderPayload({
    customerName: "Jamie Owner",
    customerEmail: "owner@example.com",
    customerPhone: "+16025550123",
    businessName: "Signal Med Spa",
    pricedItems: pricingSummary.priced_items,
    legalAcceptance,
  });

  assert.equal(payload.total_setup, pricingSummary.total_setup);
  assert.equal(payload.total_monthly, pricingSummary.total_monthly);
  assert.equal(payload.legal_acceptance.accepted_by_email, "owner@example.com");
  assert.deepEqual(
    payload.pricing_summary.selected_service_keys.sort(),
    ["instant_lead_response", "missed_call_text_back"]
  );
  assert.equal(payload.items.length, 2);
});

test("stripe checkout payload uses subscription mode with setup and recurring price IDs", () => {
  const pricingSummary = buildPricingSummaryForProducts([
    "prod_UNi5RHiKNSTfQl",
  ]);
  const order = {
    id: "order_1",
    pricing_summary: {
      package_key: null,
      package_name: null,
      selected_service_keys: ["instant_lead_response"],
      selected_product_ids: ["prod_UNi5RHiKNSTfQl"],
    },
  };

  const sessionPayload = buildStripeCheckoutSessionPayload({
    order,
    pricedItems: pricingSummary.priced_items,
    customerName: "Jamie Owner",
    customerEmail: "owner@example.com",
    customerPhone: "+16025550123",
    businessName: "Signal Med Spa",
    successUrl: "https://example.com/order-success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://example.com/store",
    origin: "https://example.com",
  });

  assert.equal(sessionPayload.mode, "subscription");
  assert.equal(sessionPayload.line_items.length, 2);
  assert.deepEqual(
    sessionPayload.line_items.map((entry) => entry.price),
    [
      "price_1TOwfiB9GU5ysJqE20FYUfVc",
      "price_1TOwfiB9GU5ysJqEcmQHl3gE",
    ]
  );
  assert.equal(sessionPayload.metadata.order_id, "order_1");
  assert.equal(sessionPayload.subscription_data.metadata.order_id, "order_1");
});
