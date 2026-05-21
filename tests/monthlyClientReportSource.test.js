import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../base44/functions/monthlyClientReport/entry.ts", import.meta.url),
  "utf8"
);

test("monthlyClientReport is preview-first and requires explicit send_email for Resend delivery", () => {
  assert.match(source, /send_email\s*=\s*false/);
  assert.match(source, /preview:\s*!send_email/);
  assert.match(source, /if \(send_email && !resendKey\)/);
  assert.match(source, /sendReportEmail/);
});

test("monthlyClientReport sends branded HTML and plain-text email payloads", () => {
  assert.match(source, /from:\s*`ClientSurge Systems <\$\{fromEmail\}>`/);
  assert.match(source, /reply_to:\s*"nolan@clientsurgesystems\.com"/);
  assert.match(source, /html:\s*report\.html/);
  assert.match(source, /text:\s*report\.text/);
});

test("monthlyClientReport personalizes live-client report content and logs delivery", () => {
  assert.match(source, /REPORT_STATUSES/);
  assert.match(source, /getActiveSystems/);
  assert.match(source, /CommunicationEvent\.create/);
  assert.match(source, /context_type:\s*"monthly_client_report"/);
  assert.match(source, /active_systems/);
});
