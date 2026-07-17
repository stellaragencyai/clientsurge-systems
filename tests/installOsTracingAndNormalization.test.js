import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const installSource = fs.readFileSync("base44/functions/initializeInstallOS/main.ts", "utf8");
const webhookSource = fs.readFileSync("base44/functions/stripeWebhookOrders/main.ts", "utf8");

const aliases = {
  followup_sequences: "nurture_sequence_14d",
  appointment_booking: "ai_booking_agent",
  missed_call_textback: "missed_call_text_back",
};

test("initializeInstallOS contains all required legacy aliases", () => {
  for (const [legacy, canonical] of Object.entries(aliases)) {
    assert.match(installSource, new RegExp(`${legacy}: \\"${canonical}\\"`));
  }
});

test("initializeInstallOS returns and logs request correlation", () => {
  assert.match(installSource, /request_id: requestId/);
  assert.match(installSource, /X-Request-ID/);
  assert.match(installSource, /CommunicationEvent\.create/);
  assert.match(installSource, /upstream_request_id/);
});

test("initializeInstallOS normalizes before validation and persistence", () => {
  assert.match(installSource, /const serviceKey = normalizeServiceKey\(rawServiceKey\)/);
  assert.match(installSource, /VALID_SERVICE_KEYS\.has\(serviceKey\)/);
  assert.match(installSource, /service_key: serviceKey/);
});

test("Stripe webhook carries one request ID into canonical source", () => {
  assert.match(webhookSource, /source: `stripeWebhookOrders:\$\{requestId\}`/);
  assert.match(webhookSource, /X-Request-ID/);
  assert.match(webhookSource, /request_id: requestId/);
});
