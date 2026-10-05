import test from "node:test";
import assert from "node:assert/strict";
import { collectFunctionAudit, summarizeAudit } from "../scripts/audit-area7-functions.mjs";

const rows = collectFunctionAudit();
const byName = new Map(rows.map((row) => [row.name, row]));
const report = summarizeAudit(rows);

const criticalFunctions = [
  "automationOrchestrator",
  "receiveTwilioMissedCallWebhook",
  "receiveResendWebhook",
  "sendInstantLeadResponseSms",
  "sendWebsiteLeadResponse",
  "processWebsiteLeadFollowUps",
  "processMissedCallFollowUps",
  "processNurtureCampaigns",
  "sendDailyDigest",
  "dailyDigestGate",
  "handleBookingTrigger",
  "triggerAutoReviewRequest",
  "sendReviewRequest",
  "scheduleFollowUpSMS",
];

test("Area 7 audits the full Base44 functions directory, not just hand-picked automations", () => {
  assert.ok(rows.length >= 50, `expected broad function inventory, saw ${rows.length}`);
  assert.equal(report.summary.total_functions, rows.length);
  assert.ok(report.summary.provider_touching_functions > 0, "provider-touching functions should be detected");
  assert.ok(report.summary.webhooks > 0, "webhooks should be detected");
  assert.ok(Array.isArray(report.findings), "audit findings should be returned as a list");
});

test("Area 7 critical automation functions are explicitly inventoried", () => {
  for (const name of criticalFunctions) {
    const row = byName.get(name);
    assert.ok(row, `${name} should exist in base44/functions`);
    assert.ok(row.deployed_file || row.deployed_kind === "missing", `${name} should have an explicit deployed-source audit result`);
    assert.equal(row.critical, true, `${name} should be marked critical`);
  }
});

test("Area 7 provider and webhook classifiers expose audit dimensions", () => {
  const twilioRows = rows.filter((row) => row.touchesTwilio);
  const resendRows = rows.filter((row) => row.touchesResend);
  const webhookRows = rows.filter((row) => row.publicWebhook);
  assert.ok(twilioRows.length > 0, "Twilio-related functions should be classified");
  assert.ok(resendRows.length > 0, "Resend/email-related functions should be classified");
  assert.ok(webhookRows.length > 0, "Webhook functions should be classified");
});

test("Area 7 function audit includes an authorization matrix", () => {
  assert.ok(report.summary.by_authorization, "authorization buckets should be summarized");
  assert.ok(Object.keys(report.summary.by_authorization).length > 0, "authorization buckets should not be empty");

  for (const name of ["sendSMS", "sendInstantLeadResponseSms", "triggerVoiceCallToLead"]) {
    const row = byName.get(name);
    assert.equal(row.authorization, "admin_or_signed_internal", `${name} should require admin or signed internal invocation`);
  }

  assert.equal(byName.get("cancelSubscription")?.authorization, "owner_or_admin");
});

test("Area 7 audit detects deployed source-of-truth shape for entry/main functions", () => {
  const withEntry = rows.filter((row) => row.has_entry);
  const withMain = rows.filter((row) => row.has_main);
  const both = rows.filter((row) => row.has_entry && row.has_main);
  assert.ok(withEntry.length > 0, "some functions should have entry.ts");
  assert.ok(withMain.length > 0, "some functions should have main.ts");
  assert.ok(both.length > 0, "entry/main split functions should be visible to the audit");
});

test("Area 7 provider functions do not expose obvious live provider secret literals", () => {
  const secretFindings = rows.filter((row) => row.findings.includes("possible_hardcoded_provider_secret"));
  assert.deepEqual(secretFindings.map((row) => row.name), [], `possible provider secrets in: ${secretFindings.map((row) => row.name).join(", ")}`);
});
