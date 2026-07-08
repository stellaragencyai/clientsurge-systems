import test from "node:test";
import assert from "node:assert/strict";
import { collectCommunicationComplianceAudit, summarizeCommunicationCompliance } from "../scripts/audit-area8-communication-compliance.mjs";

const rows = collectCommunicationComplianceAudit();
const report = summarizeCommunicationCompliance(rows);
const byName = new Map(rows.map((row) => [row.name, row]));

test("Area 8 inventories communication-related Base44 functions", () => {
  assert.ok(rows.length >= 10, `expected at least 10 communication functions, saw ${rows.length}`);
  assert.ok(report.summary.sms_functions > 0, "SMS functions should be classified");
  assert.ok(report.summary.email_functions > 0, "email functions should be classified");
  assert.ok(report.summary.webhook_functions > 0, "webhook functions should be classified");
  assert.ok(report.summary.outbound_functions > 0, "outbound functions should be classified");
});

test("Area 8 critical SMS/email functions are present in the inventory", () => {
  for (const name of ["sendSMS", "receiveTwilioInboundSms", "receiveTwilioMissedCallWebhook", "sendInstantLeadResponseSms", "sendWebsiteLeadResponse", "processMissedCallFollowUps", "processNurtureCampaigns", "receiveResendWebhook"]) {
    assert.ok(byName.has(name), `${name} should be inventoried`);
  }
});

test("Area 8 communication functions do not contain obvious live provider secret literals", () => {
  const secretFindings = rows.filter((row) => row.findings.includes("possible_hardcoded_provider_secret"));
  assert.deepEqual(secretFindings.map((row) => row.name), [], `possible provider secrets in: ${secretFindings.map((row) => row.name).join(", ")}`);
});

test("Area 8 sendSMS now exposes compliance and delivery evidence markers", () => {
  const row = byName.get("sendSMS");
  assert.ok(row, "sendSMS should be inventoried");
  assert.equal(row.sms, true);
  assert.equal(row.outbound, true);
  assert.equal(row.findings.includes("sms_outbound_missing_visible_opt_out_guard_marker"), false);
  assert.equal(row.findings.includes("sms_outbound_missing_delivery_evidence_marker"), false);
  assert.equal(row.findings.includes("outbound_missing_trace_evidence_marker"), false);
});
