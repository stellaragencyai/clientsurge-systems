import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const statusCodeGuards = [
  ["base44/functions/automationOrchestrator/entry.ts", /Lead failed quality validation/, /status:\s*422/],
  ["base44/functions/enrichLead/entry.ts", /success:\s*false,\s*error:\s*message/, /status:\s*502/],
  ["base44/functions/enrollEmailDripCampaign/entry.ts", /Lead already in active campaign/, /status:\s*409/],
  ["base44/functions/enrollEmailDripCampaign/entry.ts", /No matching email template found/, /status:\s*404/],
  ["base44/functions/processNurtureCampaigns/entry.ts", /Resend not configured/, /status:\s*503/],
  ["base44/functions/reactivateLeadOutreach/entry.ts", /Record not reactivatable/, /status:\s*409/],
  ["base44/functions/sendAdminPurchaseNotification/entry.ts", /No bot token/, /status:\s*503/],
  ["base44/functions/sendEmailDripStep/entry.ts", /Campaign not active/, /status:\s*409/],
  ["base44/functions/sendInstantLeadResponseSms/entry.ts", /Already sent/, /status:\s*409/],
  ["base44/functions/sendInstantLeadResponseSms/entry.ts", /Phone number missing/, /status:\s*400/],
  ["base44/functions/sendReviewRequest/entry.ts", /Review request already sent in the last 7 days/, /status:\s*409/],
  ["base44/functions/testProviderConnections/entry.ts", /Twilio credentials not configured/, /status:\s*503/],
  ["base44/functions/testProviderConnections/entry.ts", /Resend key not configured/, /status:\s*503/],
  ["base44/functions/triggerAutoReviewRequest/entry.ts", /Failed to send review request/, /status:\s*502/],
];

test("known backend failure payloads carry explicit non-200 HTTP status codes", () => {
  for (const [file, bodyPattern, statusPattern] of statusCodeGuards) {
    const source = read(file);
    assert.match(source, bodyPattern, `${file} contains guarded failure body`);
    assert.match(source, statusPattern, `${file} contains expected failure status`);
  }
});
