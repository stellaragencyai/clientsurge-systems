import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCommunicationLogQuery,
  buildCommunicationLogsCsv,
  getCommunicationLogFilterLabel,
} from "../src/lib/communicationLogExport.js";

test("communication log query supports email sent and failed filters", () => {
  assert.deepEqual(buildCommunicationLogQuery("email_sent"), { event_type: "email_sent" });
  assert.deepEqual(buildCommunicationLogQuery("email_failed"), { event_type: "email_failed" });
  assert.deepEqual(buildCommunicationLogQuery("failed"), { status: "failed" });
  assert.deepEqual(buildCommunicationLogQuery("unmatched"), { context_type: "inbound_sms_unmatched" });
  assert.deepEqual(buildCommunicationLogQuery("all"), {});
});

test("communication log CSV export escapes commas, quotes, and newlines", () => {
  const csv = buildCommunicationLogsCsv([
    {
      created_date: "2026-05-20T18:00:00.000Z",
      status: "failed",
      channel: "email",
      event_type: "email_failed",
      subject: "Hello, Nolan",
      message_body: "Line one\nLine two",
      error_message: 'Provider said "no"',
    },
  ]);

  assert.match(csv, /Created,Status,Channel,Event Type/);
  assert.match(csv, /"Hello, Nolan"/);
  assert.match(csv, /"Provider said ""no"""/);
  assert.match(csv, /Line one Line two/);
});

test("communication log filter labels are human-readable", () => {
  assert.equal(getCommunicationLogFilterLabel("email_sent"), "Email Sent");
  assert.equal(getCommunicationLogFilterLabel("email_failed"), "Email Failed");
});
