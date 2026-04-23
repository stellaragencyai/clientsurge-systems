import test from "node:test";
import assert from "node:assert/strict";

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
