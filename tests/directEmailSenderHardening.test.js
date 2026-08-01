import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildResendEmailPayload,
  formatClientSurgeFrom,
  htmlToPlainText,
} from "../base44/functions/_shared/emailPayload.js";

function read(path) {
  return readFileSync(path, "utf8");
}

test("Resend email payload helper brands senders and creates plain-text fallbacks", () => {
  assert.equal(
    formatClientSurgeFrom("system@clientsurgesystems.com"),
    "ClientSurge Systems <system@clientsurgesystems.com>"
  );
  assert.equal(htmlToPlainText("<h1>Hello</h1><p>One &amp; two</p>"), "Hello\n One & two");

  const payload = buildResendEmailPayload({
    from: "system@clientsurgesystems.com",
    to: "client@example.com",
    subject: "Hello",
    html: "<p>Welcome <strong>there</strong>.</p>",
  });

  assert.equal(payload.from, "ClientSurge Systems <system@clientsurgesystems.com>");
  assert.equal(payload.text, "Welcome there .");
});

test("direct sendEmail endpoint is admin-gated and uses shared Resend payload/retry helpers", () => {
  const source = read("base44/functions/sendEmail/main.ts");

  assert.match(source, /requireAdminUser/);
  assert.match(source, /resendFetch\('https:\/\/api\.resend\.com\/emails'/);
  assert.match(source, /buildResendEmailPayload\(/);
  assert.doesNotMatch(source, /\bfetch\('https:\/\/api\.resend\.com\/emails'/);
});

test("sendSmartEmail fixes Resend response parsing and sends a text fallback", () => {
  const source = read("base44/functions/sendSmartEmail/main.ts");

  assert.match(source, /requireAdminUser/);
  assert.match(source, /buildResendEmailPayload\(/);
  assert.match(source, /emailResponse\.json\(\)\.catch/);
  assert.doesNotMatch(source, /emailsecureJson/);
  assert.doesNotMatch(source, /from:\s*from_email/);
});

test("direct email sibling entrypoints are wrappers around main implementations", () => {
  assert.equal(read("base44/functions/sendEmail/entry.ts").trim(), 'import "./main.ts";');
  assert.equal(read("base44/functions/sendSmartEmail/entry.ts").trim(), 'import "./main.ts";');
});
