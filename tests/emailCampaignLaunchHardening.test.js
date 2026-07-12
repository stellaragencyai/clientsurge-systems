import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const sender = read("base44/functions/sendEmailCampaign/main.ts");
const webhook = read("base44/functions/trackEmailEvent/main.ts");
const unsubscribe = read("base44/functions/unsubscribeEmail/main.ts");
const tokenHelper = read("base44/functions/_shared/emailUnsubscribe.ts");
const legacyNurture = read("base44/functions/processNurtureCampaigns/main.ts");
const composer = read("src/components/admin/email-campaigns/CreateCampaignModal.jsx");
const panel = read("src/components/admin/EmailCampaignPanel.jsx");
const seeder = read("base44/functions/seedLaunchEmailCampaigns/main.ts");


test("campaign sending fails closed until every launch readiness gate is verified", () => {
  for (const required of [
    "EMAIL_CAMPAIGN_ENABLED",
    "EMAIL_DELIVERABILITY_PROOF_STATUS",
    "OUTREACH_POSTAL_ADDRESS",
    "OUTREACH_REPLY_TO_EMAIL",
    "EMAIL_UNSUBSCRIBE_SECRET",
    "RESEND_API_KEY",
  ]) {
    assert.match(sender, new RegExp(required));
  }
  assert.match(sender, /preview_only !== false/);
  assert.match(sender, /Campaign sending is not ready/);
  assert.match(sender, /verified_outbound_ready/);
  assert.match(sender, /MAX_CAMPAIGN_RECIPIENTS = 50/);
  assert.match(sender, /DEFAULT_TEST_BATCH_SIZE = 25/);
});

test("recipient selection suppresses unsafe and already-contacted records", () => {
  for (const reason of [
    "missing_or_invalid_email",
    "internal_or_test_record",
    "do_not_contact",
    "email_unsubscribed",
    "email_bounced",
    "industry_manual_review",
    "not_verified_outbound_ready",
    "recently_contacted",
    "duplicate_email",
  ]) {
    assert.match(sender, new RegExp(reason));
  }
  assert.match(sender, /quarantine_candidate/);
  assert.match(sender, /duplicate_candidate/);
  assert.match(sender, /website_mode/);
});

test("outbound messages include reply-to, postal address, and signed unsubscribe controls", () => {
  assert.match(sender, /reply_to:\s*readiness\.reply_to/);
  assert.match(sender, /List-Unsubscribe/);
  assert.match(sender, /List-Unsubscribe-Post/);
  assert.match(sender, /One-Click/);
  assert.match(sender, /createEmailUnsubscribeToken/);
  assert.match(sender, /postalAddress/);
  assert.doesNotMatch(sender, /clientsurge\.base44\.app/);
  assert.doesNotMatch(sender, /tracking_pixel/);
});

test("signed unsubscribe uses HMAC, expiry, and entity matching", () => {
  assert.match(tokenHelper, /HMAC/);
  assert.match(tokenHelper, /SHA-256/);
  assert.match(tokenHelper, /constantTimeEqual/);
  assert.match(tokenHelper, /Unsubscribe token has expired/);
  assert.match(unsubscribe, /verifyEmailUnsubscribeToken/);
  assert.match(unsubscribe, /recipient\.campaign_id !== payload\.campaign_id/);
  assert.match(unsubscribe, /recipient\.lead_id !== payload\.lead_id/);
  assert.match(unsubscribe, /email_unsubscribed:\s*true/);
  assert.match(unsubscribe, /do_not_contact:\s*true/);
  assert.match(unsubscribe, /status:\s*"unsubscribed"/);
});

test("Resend webhook events are monotonic and protect advanced CRM stages", () => {
  assert.match(webhook, /STATUS_RANK/);
  assert.match(webhook, /nextStatus/);
  assert.match(webhook, /ADVANCED_CRM_STAGES/);
  assert.match(webhook, /provider_spam_complaint/);
  assert.match(webhook, /email_unsubscribed:\s*true/);
  assert.match(webhook, /do_not_contact:\s*true/);
  assert.doesNotMatch(webhook, /pricing_interest/);
});

test("legacy unverified nurture sender is retired", () => {
  assert.match(legacyNurture, /LEGACY_NURTURE_RETIRED/);
  assert.match(legacyNurture, /disabled:\s*true/);
  assert.match(legacyNurture, /sent:\s*0/);
  assert.doesNotMatch(legacyNurture, /med spa was getting strong leads/i);
  assert.doesNotMatch(legacyNurture, /EMAIL_CONTENT/);
});

test("new and existing campaigns require preview plus typed recipient confirmation", () => {
  assert.match(composer, /preview_only:\s*true/);
  assert.match(composer, /SEND \$\{preview\.recipient_count\}/);
  assert.match(composer, /sending_ready/);
  assert.match(composer, /suppression_counts/);
  assert.match(panel, /Review Send/);
  assert.match(panel, /preview_only:\s*true/);
  assert.match(panel, /SEND \$\{draftReview\.preview\.recipient_count\}/);
  assert.doesNotMatch(panel, /window\.confirm\(`Send campaign/);
});

test("launch campaign seeder is dry-run-first and cannot send email", () => {
  assert.match(seeder, /dry_run !== false/);
  assert.match(seeder, /SEED LAUNCH EMAIL CAMPAIGNS/);
  assert.match(seeder, /sends_triggered:\s*0/);
  assert.match(seeder, /status:\s*"draft"/);
  assert.doesNotMatch(seeder, /resend\.com\/emails/);
  assert.doesNotMatch(seeder, /sendEmailCampaign/);
});
