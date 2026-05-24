import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const MIGRATED_PRODUCTION_SENDERS = [
  "base44/functions/sendSMS/entry.ts",
  "base44/functions/sendEmail/entry.ts",
  "base44/functions/sendWebsiteLeadResponse/entry.ts",
  "base44/functions/processAutomationJobs/entry.ts",
  "base44/functions/processWebsiteLeadFollowUps/entry.ts",
  "base44/functions/processDynamicFollowUps/entry.ts",
  "base44/functions/processDripCampaigns/entry.ts",
  "base44/functions/bulkLeadAction/entry.ts",
  "base44/functions/sendEmailCampaign/entry.ts",
  "base44/functions/sendReviewRequest/entry.ts",
  "base44/functions/sendInstantLeadResponseSms/entry.ts",
  "base44/functions/processQualifiedFollowUps/entry.ts",
  "base44/functions/processMissedCallFollowUps/entry.ts",
  "base44/functions/processNurtureCampaigns/entry.ts",
  "base44/functions/runWinBackSequence/entry.ts",
  "base44/functions/processVoiceCallFollowUps/entry.ts",
  "base44/functions/handleNewLead/entry.ts",
  "base44/functions/sendDemoConfirmationSMS/entry.ts",
  "base44/functions/routeLead/entry.ts",
  "base44/functions/scheduleFollowUpSMS/entry.ts",
  "base44/functions/triggerFollowUpSequence/entry.ts",
  "base44/functions/retryFailedEvent/entry.ts",
  "base44/functions/sendContactEmail/entry.ts",
  "base44/functions/sendAdminLeadNotification/entry.ts",
  "base44/functions/sendAdminDemoNotification/entry.ts",
  "base44/functions/submitContactInquiry/entry.ts",
  "base44/functions/receiveTwilioMissedCallWebhook/entry.ts",
  "base44/functions/sendOrderConfirmationEmail/entry.ts",
  "base44/functions/sendAdminPurchaseNotification/entry.ts",
  "base44/functions/_shared/stripeOrderWebhook.js",
  "base44/functions/_shared/installRuntime.js",
];

const DIRECT_PROVIDER_PATTERNS = [
  /api\.resend\.com\/emails/,
  /Messages\.json/,
  /twilio\.com\/2010-04-01\/Accounts\/.*\/Messages/,
  /Authorization:\s*`Bearer\s+\$\{/,
  /Authorization:\s*`Basic\s+\$\{/,
];

test("migration inventory confirms migrated production senders have no direct Twilio or Resend sends", () => {
  const offenders = [];

  for (const file of MIGRATED_PRODUCTION_SENDERS) {
    const source = fs.readFileSync(file, "utf8");
    for (const pattern of DIRECT_PROVIDER_PATTERNS) {
      if (pattern.test(source)) {
        offenders.push(`${file} matched ${pattern}`);
      }
    }
  }

  assert.deepEqual(offenders, []);
});

test("campaign and follow-up senders import the canonical outbox helper", () => {
  for (const file of [
    "base44/functions/sendEmailCampaign/entry.ts",
    "base44/functions/processWebsiteLeadFollowUps/entry.ts",
    "base44/functions/processDynamicFollowUps/entry.ts",
    "base44/functions/processDripCampaigns/entry.ts",
    "base44/functions/processMissedCallFollowUps/entry.ts",
    "base44/functions/processNurtureCampaigns/entry.ts",
    "base44/functions/processQualifiedFollowUps/entry.ts",
    "base44/functions/processVoiceCallFollowUps/entry.ts",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /sendCommunicationViaOutbox/);
  }
});

test("admin bulk notification sender uses canonical outbox helper", () => {
  const source = fs.readFileSync("base44/functions/bulkLeadAction/entry.ts", "utf8");
  assert.match(source, /sendCommunicationViaOutbox/);
});
