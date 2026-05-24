import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("basic package readiness check expects current canonical Twilio routing", () => {
  const script = read("scripts/openclaw/basic-package-activation-check.mjs");

  assert.match(script, /CLIENTSURGE_BASE44_HOST \|\| "clientsurgesystems\.com"/);
  assert.match(script, /CLIENTSURGE_TWILIO_SMS_WEBHOOK_FUNCTION \|\| "receiveTwilioInboundSms"/);
  assert.match(script, /CLIENTSURGE_TWILIO_VOICE_WEBHOOK_FUNCTION \|\| "receiveTwilioMissedCallWebhook"/);
  assert.match(script, /CLIENTSURGE_REQUIRE_TWILIO_WEBHOOK_KEY === "true"/);
  assert.match(script, /sms_auth_shape_ok/);
  assert.match(script, /voice_auth_shape_ok/);
});
