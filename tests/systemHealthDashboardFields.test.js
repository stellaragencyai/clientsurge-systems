import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  "C:/Base44Projects/clientsurge-systems-audit-20260509/base44/functions/getSystemHealthDashboard/entry.ts",
  "utf8",
);

test("getSystemHealthDashboard returns Twilio and Resend activity fields", () => {
  assert.match(source, /twilio:\s*\{/);
  assert.match(source, /last_sms_sent:/);
  assert.match(source, /resend:\s*\{/);
  assert.match(source, /last_email_sent:/);
});

test("getSystemHealthDashboard returns active automation and order progress counts", () => {
  assert.match(source, /automations:\s*\{/);
  assert.match(source, /active_count:/);
  assert.match(source, /orders_in_progress:/);
});
