import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const scheduleDemoBooking = readFileSync("base44/functions/scheduleDemoBooking/entry.ts", "utf8");
const adminNotification = readFileSync("base44/functions/sendAdminDemoNotification/entry.ts", "utf8");
const bookingModal = readFileSync("src/components/forms/DemoBookingModal.jsx", "utf8");
const bookingInline = readFileSync("src/components/forms/DemoBookingInline.jsx", "utf8");
const appSource = readFileSync("src/App.jsx", "utf8");
const industryData = readFileSync("src/lib/industryData.js", "utf8");

test("booking function enforces full launch-critical required field contract", () => {
  assert.match(scheduleDemoBooking, /Full name is required/);
  assert.match(scheduleDemoBooking, /Business name is required/);
  assert.match(scheduleDemoBooking, /Email must be valid/);
  assert.match(scheduleDemoBooking, /Phone must be valid/);
  assert.match(scheduleDemoBooking, /Industry is required/);
  assert.match(scheduleDemoBooking, /Website is required/);
  assert.match(scheduleDemoBooking, /What should we review is required/);
  assert.match(scheduleDemoBooking, /Consent is required/);
  assert.match(scheduleDemoBooking, /Scheduled date is required/);
  assert.match(scheduleDemoBooking, /Scheduled time is required/);
});

test("booking function records canonical audit CRM state and expected industry tags", () => {
  assert.match(scheduleDemoBooking, /status:\s*'Booked'/);
  assert.match(scheduleDemoBooking, /crm_stage:\s*'Audit Booked'/);
  assert.match(scheduleDemoBooking, /outreach_status:\s*'booked'/);
  assert.match(scheduleDemoBooking, /booked_at:\s*now/);

  for (const tag of ["roofing_lead", "hvac_lead", "dental_lead", "med_spa_lead", "plumbing_lead"]) {
    assert.match(scheduleDemoBooking, new RegExp(tag));
  }

  assert.match(scheduleDemoBooking, /mergeSourceHistory/);
  assert.match(scheduleDemoBooking, /source_history:\s*mergeSourceHistory\(payload, existingLead\)/);
});

test("provider side effects stay optional and report warnings instead of crashing booking", () => {
  assert.match(scheduleDemoBooking, /const warnings:\s*string\[\]\s*=\s*\[\]/);
  assert.match(scheduleDemoBooking, /warnings\.push\(`\$\{effect\.name\}:\$\{message\}`\)/);
  assert.match(scheduleDemoBooking, /success:\s*true/);
  assert.match(scheduleDemoBooking, /warnings/);
});

test("admin booking notification includes source, crm, UTM, referrer, and audit context", () => {
  for (const field of [
    "crm_tag",
    "source_page",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "referrer",
    "biggest_issue",
    "business_website_url",
  ]) {
    assert.match(adminNotification, new RegExp(field));
  }
  assert.match(adminNotification, /New \$\{auditLabel\} Booked/);
});

test("/book inline and modal schedulers both require website, industry, message, date, time, and consent", () => {
  for (const source of [bookingModal, bookingInline]) {
    assert.match(source, /business_website_url|website/);
    assert.match(source, /industry/);
    assert.match(source, /biggest_issue|message/);
    assert.match(source, /scheduled_date|scheduling\.date/);
    assert.match(source, /scheduled_time|scheduling\.time/);
    assert.match(source, /consent_given/);
  }

  assert.match(bookingModal, /crm_tag:\s*auditCopy\.crmTag/);
  assert.match(bookingInline, /crm_tag:\s*crmTagForIndustry\(industrySlug\)/);
});

test("plumbing has a real public route and industry-specific booking context", () => {
  assert.match(appSource, /"plumbing"/);
  assert.match(industryData, /"plumbing":\s*\{/);
  assert.match(industryData, /Free Plumbing Automation Audit/);
  assert.match(bookingModal, /plumbing_lead/);
});
