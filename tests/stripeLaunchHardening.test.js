import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stripeEntrypoints = [
  "base44/functions/createCheckoutSession/entry.ts",
  "base44/functions/getStripeCustomerPortalUrl/entry.ts",
  "base44/functions/getStripeBillingData/entry.ts",
  "base44/functions/createInvoicePaymentLink/entry.ts",
  "base44/functions/getStripePaymentUpdateUrl/entry.ts",
  "base44/functions/cancelSubscription/entry.ts",
  "base44/functions/retryFailedEvent/entry.ts",
  "base44/functions/getIntegrationHealth/entry.ts",
  "base44/functions/runIntegrationHealthCheck/entry.ts",
  "base44/functions/getStripeMode/entry.ts",
  "base44/functions/stripePaymentWebhook/entry.ts",
];

function read(path) {
  return readFileSync(path, "utf8");
}

test("Stripe-facing functions use the shared Stripe helper", () => {
  for (const file of stripeEntrypoints) {
    const source = read(file);
    assert.match(source, /_shared\/stripeInit\.js/, `${file} imports the Stripe helper`);
    assert.doesNotMatch(source, /new\s+Stripe\s*\(/, `${file} does not instantiate Stripe directly`);
    assert.doesNotMatch(
      source,
      /Deno\.env\.get\(\s*["']STRIPE_(?:SECRET|LIVE_SECRET)_KEY["']\s*\)/,
      `${file} does not read Stripe secret keys directly`
    );
  }
});

test("Stripe helper enforces explicit mode/key separation", () => {
  const source = read("base44/functions/_shared/stripeInit.js");

  assert.match(source, /STRIPE_MODE/);
  assert.match(source, /STRIPE_LIVE_SECRET_KEY/);
  assert.match(source, /STRIPE_TEST_SECRET_KEY/);
  assert.match(source, /STRIPE_SECRET_KEY/);
  assert.match(source, /sk_live_/);
  assert.doesNotMatch(source, /console\.(?:log|warn|error)/);
});

test("checkout logs avoid customer PII, redirect URLs, and key fingerprints", () => {
  const source = read("base44/functions/createCheckoutSession/entry.ts");
  const consoleLines = source
    .split(/\r?\n/)
    .filter((line) => /console\.(?:log|warn|error)/.test(line))
    .join("\n");

  assert.doesNotMatch(consoleLines, /customer_email/);
  assert.doesNotMatch(consoleLines, /customer_phone/);
  assert.doesNotMatch(consoleLines, /success_url/);
  assert.doesNotMatch(consoleLines, /cancel_url/);
  assert.doesNotMatch(consoleLines, /session\.url|sessionUrl/);
  assert.doesNotMatch(source, /maskSecret|secret_fingerprint|fingerprint/);
});
