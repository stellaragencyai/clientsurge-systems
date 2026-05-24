import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("createCheckoutSession forwards order_id in subscription metadata", () => {
  const source = fs.readFileSync(
    new URL("../base44/functions/createCheckoutSession/entry.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /subscription_data:\s*\{/);
  assert.match(source, /metadata:\s*\{[\s\S]*order_id:\s*order\.id/);
});

test("createCheckoutSession persists explicit checkout SMS consent metadata", () => {
  const source = fs.readFileSync(
    new URL("../base44/functions/createCheckoutSession/entry.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /sms_consent_granted:\s*sms_consent_granted === true/);
  assert.match(source, /sms_consent_source:\s*sms_consent_granted === true/);
  assert.match(source, /sms_consent_granted:\s*sms_consent_granted === true \? "true" : "false"/);
});
