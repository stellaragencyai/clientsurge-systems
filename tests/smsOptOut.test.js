import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { appendSmsOptOut, SMS_OPT_OUT_FOOTER } from "../base44/functions/_shared/smsOptOut.js";

const smsSources = {
  bulkLeadAction: readFileSync(new URL("../base44/functions/bulkLeadAction/entry.ts", import.meta.url), "utf8"),
  handleNewLead: readFileSync(new URL("../base44/functions/handleNewLead/entry.ts", import.meta.url), "utf8"),
  processAutomationJobs: readFileSync(new URL("../base44/functions/processAutomationJobs/entry.ts", import.meta.url), "utf8"),
  processDripCampaigns: readFileSync(new URL("../base44/functions/processDripCampaigns/entry.ts", import.meta.url), "utf8"),
  processDynamicFollowUps: readFileSync(new URL("../base44/functions/processDynamicFollowUps/entry.ts", import.meta.url), "utf8"),
  processQualifiedFollowUps: readFileSync(new URL("../base44/functions/processQualifiedFollowUps/entry.ts", import.meta.url), "utf8"),
  receiveTwilioMissedCallWebhook: readFileSync(new URL("../base44/functions/receiveTwilioMissedCallWebhook/entry.ts", import.meta.url), "utf8"),
  retryFailedEvent: readFileSync(new URL("../base44/functions/retryFailedEvent/entry.ts", import.meta.url), "utf8"),
  routeLead: readFileSync(new URL("../base44/functions/routeLead/entry.ts", import.meta.url), "utf8"),
  sendSMS: readFileSync(new URL("../base44/functions/sendSMS/entry.ts", import.meta.url), "utf8"),
  sendInstantLeadResponseSms: readFileSync(new URL("../base44/functions/sendInstantLeadResponseSms/entry.ts", import.meta.url), "utf8"),
  sendReviewRequest: readFileSync(new URL("../base44/functions/sendReviewRequest/entry.ts", import.meta.url), "utf8"),
  sendWebsiteLeadResponse: readFileSync(new URL("../base44/functions/sendWebsiteLeadResponse/entry.ts", import.meta.url), "utf8"),
  triggerFollowUpSequence: readFileSync(new URL("../base44/functions/triggerFollowUpSequence/entry.ts", import.meta.url), "utf8"),
};

test("appendSmsOptOut appends the TCPA unsubscribe footer once", () => {
  assert.equal(appendSmsOptOut("Hello there"), `Hello there\n\n${SMS_OPT_OUT_FOOTER}`);
  assert.equal(appendSmsOptOut("Hello there\n\nReply STOP to unsubscribe."), "Hello there\n\nReply STOP to unsubscribe.");
  assert.equal(appendSmsOptOut("Hello there. Reply STOP to opt out."), "Hello there. Reply STOP to opt out.");
});

test("core customer SMS send paths use the shared opt-out helper", () => {
  for (const [name, source] of Object.entries(smsSources)) {
    assert.match(source, /appendSmsOptOut/, `${name} imports or calls appendSmsOptOut`);
  }
});
