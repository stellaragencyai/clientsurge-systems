import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guardedFunctions = [
  "sendSMS",
  "sendInstantLeadResponseSms",
  "triggerVoiceCallToLead",
];

function sourceFor(functionName) {
  return readFileSync(
    new URL(`../base44/functions/${functionName}/entry.ts`, import.meta.url),
    "utf8"
  );
}

test("external send functions require admin or signed internal invocation before provider calls", () => {
  for (const functionName of guardedFunctions) {
    const source = sourceFor(functionName);
    assert.match(source, /requireAdminOrSignedInternalInvocation/, `${functionName} imports shared guard`);
    assert.match(source, /AuthGuardError/, `${functionName} returns explicit auth failures`);
    assert.ok(
      source.indexOf("requireAdminOrSignedInternalInvocation") < source.search(/TWILIO_|ELEVENLABS_|fetchTwilio|initiateElevenLabsCall/),
      `${functionName} should authorize before provider credential or send path`
    );
  }
});

test("subscription cancellation requires owner or admin access", () => {
  const source = readFileSync(
    new URL("../base44/functions/cancelSubscription/entry.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /requireOwnerOrAdmin/);
  assert.match(source, /userOwnsOrder/);
  assert.match(source, /order_access_required/);
});
