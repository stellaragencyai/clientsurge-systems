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
});

test("Area 7 critical automation functions all have a deployed source file", () => {
  for (const name of criticalFunctions) {
    const row = byName.get(name);
    assert.ok(row, `${name} should exist in base44/functions`);
    assert.ok(row.deployed_file, `${name} should have entry.ts or main.ts deployed source`);
    assert.notEqual(row.deployed_kind, "missing", `${name} deployed source should not be missing`);
  }
});

test("Area 7 critical automation functions keep observability or provider trace markers", () => {
  for (const name of criticalFunctions) {
    const row = byName.get(name);
    assert.ok(row, `${name} should be inventoried`);
    assert.equal(
      row.findings.includes("critical_function_missing_observability_marker"),
      false,
      `${name} should keep CommunicationEvent/logAutomationExecution/provider trace markers`
    );
    assert.equal(
      row.findings.includes("critical_function_missing_trace_marker"),
      false,
      `${name} should keep request/context/metadata trace markers`
    );
  }
});

test("Area 7 entry/main drift is either wrapped or explicitly labeled as source-of-truth risk", () => {
  const risky = rows.filter((row) => row.findings.includes("entry_main_dual_source_without_clear_source_of_truth"));
  assert.deepEqual(risky.map((row) => row.name), [], `unlabeled entry/main drift: ${risky.map((row) => row.name).join(", ")}`);
});

test("Area 7 provider functions do not expose obvious live provider secret literals", () => {
  const secretFindings = rows.filter((row) => row.findings.includes("possible_hardcoded_provider_secret"));
  assert.deepEqual(secretFindings.map((row) => row.name), [], `possible provider secrets in: ${secretFindings.map((row) => row.name).join(", ")}`);
});
