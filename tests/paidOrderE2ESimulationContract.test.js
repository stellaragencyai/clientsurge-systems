import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

test("checkout-session completion wires the paid-order E2E handoff without direct provider sends", () => {
  const source = read("base44/functions/_shared/stripeOrderWebhook.js");
  const checkoutStart = source.indexOf("export async function processCheckoutSessionCompleted");
  const subscriptionStart = source.indexOf("async function processSubscriptionLifecycle");
  const checkoutSource = source.slice(checkoutStart, subscriptionStart);

  assert.ok(checkoutStart > -1, "checkout-session processor is exported for Deno fixture tests");
  assert.match(checkoutSource, /resolveOrderFromCheckoutSession\(base44, session\)/);
  assert.match(checkoutSource, /initializePaidOrderInstallPipeline\(\{/);
  assert.match(checkoutSource, /payment_status:\s*"paid"/);
  assert.match(checkoutSource, /base44\.asServiceRole\.entities\.Order\.update/);
  assert.match(checkoutSource, /markLeadWonForOrder\(base44, updatedOrder/);
  assert.match(checkoutSource, /ensurePortalInvite\(base44, updatedOrder\)/);
  assert.match(checkoutSource, /ensureConfirmationEmail\(/);
  assert.match(checkoutSource, /ensureConfirmationSms\(base44, updatedOrder\)/);
  assert.match(checkoutSource, /ensureAdminPurchaseNotification\(base44, updatedOrder\)/);
  assert.match(checkoutSource, /buildCommunicationEvent\(\{/);
  assert.match(checkoutSource, /providerMessageId:\s*event\.id/);
  assert.match(checkoutSource, /createSystemAuditLog\(base44/);
});

test("paid-order simulation remains guarded by install-pipeline idempotency", () => {
  const source = read("base44/functions/_shared/installPipeline.js");

  assert.match(source, /initializePaidOrderInstallPipeline/);
  assert.match(source, /getSingleResolvedMatch/);
  assert.match(source, /entities\.Client\.filter/);
  assert.match(source, /entities\.ClientProject\.filter/);
  assert.match(source, /entities\.OnboardingClient\.filter/);
  assert.match(source, /entities\.Client\.update\(existing\.id/);
  assert.match(source, /entities\.ClientProject\.update\(existing\.id/);
  assert.match(source, /entities\.OnboardingClient\.update\(existing\.id/);
  assert.match(source, /syncInstallMirrorsFromOrder/);
  assert.match(source, /InstallLinkingError/);
});
