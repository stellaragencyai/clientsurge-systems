import test from "node:test";
import assert from "node:assert/strict";

import {
  CANONICAL_CHECKOUT_ORIGIN,
  buildCheckoutRedirectUrls,
  resolveTrustedCheckoutOrigin,
  safeCheckoutUrl,
} from "../base44/functions/createCheckoutSession/checkoutUrls.shared.js";

test("Area 3 checkout origin falls back to canonical production origin when Origin is missing", () => {
  assert.equal(
    resolveTrustedCheckoutOrigin({ requestUrl: "https://clientsurgesystems.com/api/apps/app/functions/createCheckoutSession" }),
    CANONICAL_CHECKOUT_ORIGIN
  );

  assert.equal(
    resolveTrustedCheckoutOrigin({ originHeader: "https://evil.example", requestUrl: "https://evil.example/api" }),
    CANONICAL_CHECKOUT_ORIGIN
  );
});

test("Area 3 checkout URLs keep Stripe redirects on trusted ClientSurge paths", () => {
  const urls = buildCheckoutRedirectUrls({
    originHeader: "https://clientsurgesystems.com",
    packageKey: "growth_system",
    successUrl: "https://clientsurgesystems.com/order-success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://clientsurgesystems.com/product-signup?package=growth_system",
  });

  assert.equal(urls.origin, "https://clientsurgesystems.com");
  assert.equal(urls.success_url, "https://clientsurgesystems.com/order-success?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(urls.cancel_url, "https://clientsurgesystems.com/product-signup?package=growth_system");
});

test("Area 3 checkout URLs block external redirect injection", () => {
  const urls = buildCheckoutRedirectUrls({
    originHeader: "https://clientsurgesystems.com",
    packageKey: "pro_system",
    successUrl: "https://evil.example/order-success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://evil.example/product-signup?package=pro_system",
  });

  assert.equal(urls.success_url, "https://clientsurgesystems.com/order-success?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(urls.cancel_url, "https://clientsurgesystems.com/product-signup?package=pro_system");
});

test("Area 3 checkout success URL must preserve CHECKOUT_SESSION_ID placeholder", () => {
  const url = safeCheckoutUrl({
    candidate: "https://clientsurgesystems.com/order-success",
    trustedOrigin: "https://clientsurgesystems.com",
    fallbackPath: "/order-success?session_id={CHECKOUT_SESSION_ID}",
    allowedPathPrefixes: ["/order-success"],
    requireSessionPlaceholder: true,
  });

  assert.equal(url, "https://clientsurgesystems.com/order-success?session_id={CHECKOUT_SESSION_ID}");
});

test("Area 3 checkout cancel URL defaults back to selected package", () => {
  const urls = buildCheckoutRedirectUrls({
    originHeader: "https://clientsurgesystems.com",
    packageKey: "starter_system",
    cancelUrl: "https://clientsurgesystems.com/store",
  });

  assert.equal(urls.cancel_url, "https://clientsurgesystems.com/product-signup?package=starter_system");
});
