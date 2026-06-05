import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

test("checkout carries CRM lead attribution into order, client, and onboarding records", () => {
  const cartSidebar = read("src/components/store/CartSidebar.jsx");
  const checkoutSession = read("base44/functions/createCheckoutSession/entry.ts");
  const installPipelineEntry = read("base44/functions/installPipeline/entry.ts");
  const installPipelineShared = read("base44/functions/createCheckoutSession/installPipeline.shared.js");
  const sharedWebhook = read("base44/functions/_shared/stripeOrderWebhook.js");
  const legacyWebhook = read("base44/functions/stripePaymentWebhook/entry.ts");
  const clientEntity = read("base44/entities/Client.jsonc");
  const onboardingEntity = read("base44/entities/OnboardingClient.jsonc");

  assert.match(cartSidebar, /CHECKOUT_ATTRIBUTION_KEY/);
  assert.match(cartSidebar, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(cartSidebar, /crm_lead_id: leadAttribution\.crm_lead_id \|\| leadAttribution\.lead_id/);

  assert.match(checkoutSession, /lead_id: lead_id \|\| crm_lead_id \|\| ""/);
  assert.match(checkoutSession, /crm_lead_id: crm_lead_id \|\| lead_id \|\| ""/);
  assert.match(checkoutSession, /metadata: sessionMetadata/);

  for (const pipeline of [installPipelineEntry, installPipelineShared]) {
    assert.match(pipeline, /lead_id: order\.lead_id \|\| order\.crm_lead_id \|\| ""/);
    assert.match(pipeline, /crm_lead_id: order\.crm_lead_id \|\| order\.lead_id \|\| ""/);
    assert.match(pipeline, /website_lead_id: order\.website_lead_id \|\| ""/);
  }

  assert.match(sharedWebhook, /order\?\.lead_id \|\| order\?\.crm_lead_id/);
  assert.match(legacyWebhook, /order\?\.lead_id \|\| order\?\.crm_lead_id/);
  assert.match(clientEntity, /"crm_lead_id"/);
  assert.match(onboardingEntity, /"crm_lead_id"/);
});

test("audit and proposal stages are accepted by CRM status update path", () => {
  const leadPipeline = read("base44/functions/_shared/leadPipeline.js");
  const updateLeadStatus = read("base44/functions/updateLeadStatus/entry.ts");

  assert.match(leadPipeline, /"Audit Completed"/);
  assert.match(leadPipeline, /"Proposal Sent"/);
  assert.match(leadPipeline, /"Won Pending Payment"/);
  assert.match(updateLeadStatus, /requestedStage = payload\?\.crm_stage \|\| payload\?\.stage/);
  assert.match(updateLeadStatus, /payload\?\.status \? normalizeCrmStage\(payload\.status, payload\.status\) : ""/);
  assert.match(updateLeadStatus, /buildWonPendingPaymentPatch/);
  assert.match(updateLeadStatus, /won_pending_payment_order_required/);
  assert.match(updateLeadStatus, /buildLeadStatusEvent/);
  assert.match(updateLeadStatus, /CommunicationEvent\.create/);
});

test("CRM launch repair script is dry-run only and writes backup/redacted outputs", () => {
  const script = read("scripts/crm/crm-launch-repair-dry-run.mjs");

  assert.match(script, /leads-backup\.json/);
  assert.match(script, /backfill-dry-run\.json/);
  assert.match(script, /dedupe-dry-run-redacted\.json/);
  assert.doesNotMatch(script, /\.update\(/);
  assert.doesNotMatch(script, /\.delete\(/);
});
