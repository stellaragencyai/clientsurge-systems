import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stripeEntrypoints = [
  "base44/functions/createCheckoutSession/main.ts",
  "base44/functions/getStripeCustomerPortalUrl/main.ts",
  "base44/functions/getStripeBillingData/entry.ts",
  "base44/functions/createInvoicePaymentLink/entry.ts",
  "base44/functions/getStripePaymentUpdateUrl/main.ts",
  "base44/functions/cancelSubscription/main.ts",
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
  const source = read("base44/functions/createCheckoutSession/main.ts");
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

test("Stripe webhook events are claimed through the IdempotencyKey entity before side effects", () => {
  const source = read("base44/functions/_shared/stripeOrderWebhook.js");

  assert.match(source, /claimStripeEvent\(base44, event, source\)/);
  assert.match(source, /entities\.IdempotencyKey\.filter/);
  assert.match(source, /entities\.IdempotencyKey\.create/);
  assert.match(source, /const idempotencyKey = `stripe_event:\$\{event\.id\}`/);
  assert.match(source, /idempotency_key: idempotencyKey/);
  assert.match(source, /duplicate: true/);
  assert.match(source, /completeStripeEventClaim\(base44, eventClaim, "completed"/);
  assert.match(source, /completeStripeEventClaim\(base44, eventClaim, "failed"/);
});

test("Stripe webhook processing failures return retryable non-2xx responses", () => {
  const source = read("base44/functions/_shared/stripeOrderWebhook.js");

  assert.match(source, /retryable:\s*true/);
  assert.match(source, /\{\s*status:\s*500\s*\}/);
  assert.match(source, /Stripe webhook processing failed/);
});

test("Stripe subscription webhook events use the canonical subscription synchronizer", () => {
  const source = read("base44/functions/_shared/stripeOrderWebhook.js");

  assert.match(source, /import \{ syncSubscriptionFromStripe \} from "\.\/subscriptionSync\.js"/);
  assert.match(source, /syncSubscriptionFromStripe\(\{/);
  assert.match(source, /stripeSubscription: subscription/);
  assert.match(source, /eventType: event\.type/);
});

test("billing and provisioning state changes write immutable AuditLog records", () => {
  const auditHelper = read("base44/functions/_shared/billingAudit.js");
  const webhookSource = read("base44/functions/_shared/stripeOrderWebhook.js");
  const subscriptionSource = read("base44/functions/_shared/subscriptionSync.js");
  const cancellationSource = read("base44/functions/cancelSubscription/main.ts");

  assert.match(auditHelper, /entities\?\.AuditLog/);
  assert.match(auditHelper, /admin_email:\s*"system@clientsurgesystems\.com"/);
  assert.match(auditHelper, /before:\s*safeJson\(before\)/);
  assert.match(auditHelper, /after:\s*safeJson\(after\)/);
  assert.match(auditHelper, /provider_event_id:\s*providerEventId/);
  assert.match(auditHelper, /provider_event_type:\s*providerEventType/);

  assert.match(webhookSource, /action:\s*"stripe_checkout_paid_order_update"/);
  assert.match(webhookSource, /action:\s*"stripe_invoice_order_update"/);
  assert.match(webhookSource, /action:\s*"stripe_payment_intent_order_update"/);
  assert.match(subscriptionSource, /action:\s*"stripe_subscription_record_create"/);
  assert.match(subscriptionSource, /action:\s*"stripe_subscription_record_update"/);
  assert.match(subscriptionSource, /action:\s*"stripe_subscription_order_sync"/);
  assert.match(subscriptionSource, /action:\s*"subscription_change_request"/);
  assert.match(cancellationSource, /action:\s*"subscription_cancellation_requested"/);
});

test("cancelSubscription deployed entrypoint requires owner or admin access", () => {
  const source = read("base44/functions/cancelSubscription/main.ts");

  assert.match(source, /requireOwnerOrAdmin/);
  assert.match(source, /userOwnsOrder/);
  assert.match(source, /order_access_required/);
  assert.match(source, /cancel_at_period_end=true/);
});
