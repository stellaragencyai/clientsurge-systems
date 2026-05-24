import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("autoSendWebhookInstructions sends canonical setup instructions only", () => {
  const source = read("base44/functions/autoSendWebhookInstructions/entry.ts");
  assert.match(source, /setup\?order_id=/);
  assert.match(source, /setup_instructions_sent_at/);
  assert.match(source, /webhook_instructions_sent_at/);
  assert.doesNotMatch(source, /createLeadAndDispatch/);
});

test("postPaymentOrchestrator invokes setup instructions after paid order work", () => {
  const source = read("base44/functions/postPaymentOrchestrator/entry.ts");
  assert.match(source, /autoSendWebhookInstructions/);
  assert.match(source, /setup instructions queued/);
});
