import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildLegacyEndpointResponse,
  getLegacyEndpointQuarantine,
} from "../base44/functions/_shared/legacyQuarantine.js";

test("legacy endpoint quarantine payload advertises canonical replacements", () => {
  const payload = getLegacyEndpointQuarantine("receiveTwilioSMS");

  assert.equal(payload.code, "legacy_endpoint_quarantined");
  assert.equal(payload.status, 410);
  assert.equal(payload.endpoint, "receiveTwilioSMS");
  assert.ok(payload.reason.includes("legacy Twilio path"));
  assert.ok(payload.replacement.includes("receiveTwilioStatusWebhook"));
});

test("legacy endpoint response returns HTTP 410 with structured body", async () => {
  const response = buildLegacyEndpointResponse("createLeadAndDispatch");
  const body = await response.json();

  assert.equal(response.status, 410);
  assert.equal(body.endpoint, "createLeadAndDispatch");
  assert.ok(body.replacement.includes("submitLeadCapture"));
});

test("new false-live quarantine targets advertise the canonical replacements", () => {
  const autoAdvance = getLegacyEndpointQuarantine("autoAdvanceInstallPipeline");
  const twilioInbound = getLegacyEndpointQuarantine("twilioinbound");
  const missedCall = getLegacyEndpointQuarantine("receiveTwilioMissedCallWebhook");
  const nurture = getLegacyEndpointQuarantine("processNurtureCampaigns");
  const reactivation = getLegacyEndpointQuarantine("reactivateLeadOutreach");
  const booking = getLegacyEndpointQuarantine("handleBookingTrigger");
  const stripeInvoice = getLegacyEndpointQuarantine("stripeInvoiceWebhook");

  assert.equal(autoAdvance.status, 410);
  assert.ok(autoAdvance.replacement.includes("updateInstallStatus"));
  assert.equal(twilioInbound.status, 410);
  assert.ok(twilioInbound.replacement.includes("receiveTwilioStatusWebhook"));
  assert.equal(missedCall.status, 410);
  assert.ok(missedCall.replacement.includes("receiveTwilioStatusWebhook"));
  assert.equal(nurture.status, 410);
  assert.ok(nurture.replacement.includes("processNurtureSequenceRuntime"));
  assert.equal(reactivation.status, 410);
  assert.ok(reactivation.replacement.includes("runLeadReactivationBatch"));
  assert.equal(booking.status, 410);
  assert.ok(booking.replacement.includes("runBookingAgentTest"));
  assert.equal(stripeInvoice.status, 410);
  assert.ok(stripeInvoice.replacement.includes("stripeWebhookOrders"));
});

test("quarantined false-live entrypoints delegate directly to structured 410 responses", () => {
  const autoAdvanceSource = readFileSync(
    new URL("../base44/functions/autoAdvanceInstallPipeline/entry.ts", import.meta.url),
    "utf8"
  );
  const twilioInboundSource = readFileSync(
    new URL("../base44/functions/twilioinbound/entry.ts", import.meta.url),
    "utf8"
  );
  const missedCallSource = readFileSync(
    new URL("../base44/functions/receiveTwilioMissedCallWebhook/entry.ts", import.meta.url),
    "utf8"
  );
  const nurtureSource = readFileSync(
    new URL("../base44/functions/processNurtureCampaigns/entry.ts", import.meta.url),
    "utf8"
  );
  const reactivationSource = readFileSync(
    new URL("../base44/functions/reactivateLeadOutreach/entry.ts", import.meta.url),
    "utf8"
  );
  const bookingSource = readFileSync(
    new URL("../base44/functions/handleBookingTrigger/entry.ts", import.meta.url),
    "utf8"
  );
  const stripeInvoiceSource = readFileSync(
    new URL("../base44/functions/stripeInvoiceWebhook/entry.ts", import.meta.url),
    "utf8"
  );

  assert.match(autoAdvanceSource, /buildLegacyEndpointResponse\("autoAdvanceInstallPipeline"\)/);
  assert.doesNotMatch(autoAdvanceSource, /entities\.Order\.update|SendEmail|pipeline_status/);
  assert.match(twilioInboundSource, /buildLegacyEndpointResponse\("twilioinbound"\)/);
  assert.doesNotMatch(twilioInboundSource, /AutomationJob|entities\.Leads\.update|findOrCreateLeadByPhone/);
  assert.match(missedCallSource, /buildLegacyEndpointResponse\("receiveTwilioMissedCallWebhook"\)/);
  assert.doesNotMatch(missedCallSource, /WebsiteLead|sendTwilioSms|AdminSettings/);
  assert.match(nurtureSource, /buildLegacyEndpointResponse\("processNurtureCampaigns"\)/);
  assert.doesNotMatch(nurtureSource, /entities\.NurtureCampaign|CommunicationEvent\.create|SendEmail/);
  assert.match(reactivationSource, /buildLegacyEndpointResponse\("reactivateLeadOutreach"\)/);
  assert.doesNotMatch(reactivationSource, /LeadReactivation|AutomationJob|entities\.Leads\.update/);
  assert.match(bookingSource, /buildLegacyEndpointResponse\("handleBookingTrigger"\)/);
  assert.doesNotMatch(bookingSource, /sendTwilioSms|SendEmail|booking_link/);
  assert.match(stripeInvoiceSource, /buildLegacyEndpointResponse\("stripeInvoiceWebhook"\)/);
  assert.doesNotMatch(stripeInvoiceSource, /entities\.Invoice\.update|SendEmail|stripe\.invoices/);
});
