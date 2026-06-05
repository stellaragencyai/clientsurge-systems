import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const isDeno = typeof globalThis.Deno !== "undefined";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

if (isDeno) {
  test("outreach readiness source tests run in the Node test phase", () => {
    assert.equal(true, true);
  });
} else {

const sendEmailCampaign = read("base44/functions/sendEmailCampaign/entry.ts");
const createCampaignModal = read("src/components/admin/email-campaigns/CreateCampaignModal.jsx");
const segmentFilterBuilder = read("src/components/admin/email-campaigns/SegmentFilterBuilder.jsx");
const emailCampaignSchema = read("base44/entities/EmailCampaign.jsonc");
const recipientSchema = read("base44/entities/EmailCampaignRecipient.jsonc");
const leadsSchema = read("base44/entities/Leads.jsonc");
const seedEmailTemplates = read("base44/functions/seedEmailTemplates/entry.ts");

test("backend rejects unsegmented outreach and caps test batches", () => {
  assert.match(sendEmailCampaign, /MAX_SAFE_TEST_RECIPIENTS\s*=\s*50/);
  assert.match(sendEmailCampaign, /hasIndustrySegmentation/);
  assert.match(sendEmailCampaign, /Industry segmentation is required before previewing or sending/);
  assert.match(sendEmailCampaign, /requestedLimit\s*>\s*MAX_SAFE_TEST_RECIPIENTS/);
  assert.match(sendEmailCampaign, /\.slice\(0,\s*recipientLimit\)/);
});

test("backend excludes suppressed, incomplete, duplicate, and recently contacted leads", () => {
  assert.match(sendEmailCampaign, /do_not_contact/);
  assert.match(sendEmailCampaign, /email_unsubscribed/);
  assert.match(sendEmailCampaign, /email_bounced/);
  assert.match(sendEmailCampaign, /TERMINAL_SUPPRESSION_STATUSES\s*=\s*new Set\(\["Closed", "Won", "Lost"\]\)/);
  assert.match(sendEmailCampaign, /missing_email_count/);
  assert.match(sendEmailCampaign, /missing_website_count/);
  assert.match(sendEmailCampaign, /duplicate_excluded_count/);
  assert.match(sendEmailCampaign, /recently_contacted_count/);
});

test("backend updates CRM tracking and compliance headers", () => {
  assert.match(sendEmailCampaign, /last_contacted_date/);
  assert.match(sendEmailCampaign, /follow_up_date/);
  assert.match(sendEmailCampaign, /last_outreach_campaign_id/);
  assert.match(sendEmailCampaign, /landing_page_url/);
  assert.match(sendEmailCampaign, /List-Unsubscribe/);
  assert.doesNotMatch(sendEmailCampaign, /errors\.push\(\{\s*email:/);
});

test("schemas expose campaign and CRM tracking fields", () => {
  assert.match(emailCampaignSchema, /"max_recipients"/);
  assert.match(emailCampaignSchema, /"follow_up_days"/);
  assert.match(emailCampaignSchema, /"landing_page_url"/);
  assert.match(emailCampaignSchema, /"industry_sequence"/);
  assert.match(emailCampaignSchema, /"suppressed_recipients"/);
  assert.match(recipientSchema, /"suppression_reason"/);
  assert.match(leadsSchema, /"crm_stage"/);
  assert.match(leadsSchema, /"outreach_status"/);
  assert.match(leadsSchema, /"do_not_contact"/);
  assert.match(leadsSchema, /"email_unsubscribed"/);
  assert.match(leadsSchema, /"email_bounced"/);
});

test("admin UI requires industry-specific test batches", () => {
  assert.match(segmentFilterBuilder, /INDUSTRIES/);
  assert.match(segmentFilterBuilder, /roofing/);
  assert.match(segmentFilterBuilder, /hvac/);
  assert.match(segmentFilterBuilder, /dental/);
  assert.match(segmentFilterBuilder, /BATCH_SIZES\s*=\s*\[25,\s*50\]/);
  assert.doesNotMatch(segmentFilterBuilder, /Leave all blank to target ALL leads/);
  assert.match(createCampaignModal, /INDUSTRY_SEQUENCES/);
  assert.match(createCampaignModal, /Only a reviewed 25-lead production test/);
  assert.match(createCampaignModal, /Send 25 Test/);
});

test("roofing, HVAC, and dental sequences use industry pain and landing pages", () => {
  for (const industry of ["roofing", "hvac", "dental"]) {
    assert.match(createCampaignModal, new RegExp(`clientsurgesystems\\.com/${industry}`));
    assert.match(seedEmailTemplates, new RegExp(`clientsurgesystems\\.com/${industry}`));
  }

  assert.match(createCampaignModal, /storm-season calls/);
  assert.match(createCampaignModal, /after hours, on weekends/);
  assert.match(createCampaignModal, /new patient opportunities/);
  assert.match(seedEmailTemplates, /Roofing Lead-Response Audit Sequence/);
  assert.match(seedEmailTemplates, /HVAC Lead-Response Audit Sequence/);
  assert.match(seedEmailTemplates, /Dental New-Patient Audit Sequence/);
});
}
