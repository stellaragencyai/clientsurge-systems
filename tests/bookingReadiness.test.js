import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const scheduleDemoBooking = readFileSync("base44/functions/scheduleDemoBooking/main.ts", "utf8");
const calendarGuard = readFileSync("base44/functions/createDemoCalendarEvent/main.ts", "utf8");
const bookingModal = readFileSync("src/components/forms/DemoBookingModal.jsx", "utf8");
const bookingInline = readFileSync("src/components/forms/DemoBookingInline.jsx", "utf8");
const appSource = readFileSync("src/App.jsx", "utf8");
const industryData = readFileSync("src/lib/industryData.js", "utf8");

test("audit request handler enforces launch-critical fields and explicit consent", () => {
  for (const phrase of [
    "Full name is required",
    "Business name is required",
    "A valid email is required",
    "A valid phone number is required",
    "Industry is required",
    "What should we review is required",
    "Preferred date is required",
    "Choose an available preferred time",
    "Consent is required",
  ]) {
    assert.match(scheduleDemoBooking, new RegExp(phrase));
  }
});

test("audit time remains requested until a human confirms the appointment", () => {
  assert.match(scheduleDemoBooking, /status:\s*"requested"/);
  assert.match(scheduleDemoBooking, /request_status:\s*"requested"/);
  assert.match(scheduleDemoBooking, /calendar_created:\s*false/);
  assert.match(scheduleDemoBooking, /pending manual confirmation/i);
  assert.match(scheduleDemoBooking, /America\/Phoenix/);
  assert.doesNotMatch(scheduleDemoBooking, /crm_stage:\s*"Audit Booked"/);
  assert.doesNotMatch(scheduleDemoBooking, /booked_at:\s*now/);
  assert.doesNotMatch(scheduleDemoBooking, /functions\.invoke\("createDemoCalendarEvent"/);
});

test("calendar placeholder fails honestly and never marks a lead booked", () => {
  assert.match(calendarGuard, /CALENDAR_PROVIDER_NOT_CONFIGURED/);
  assert.match(calendarGuard, /calendar_created:\s*false/);
  assert.match(calendarGuard, /status:\s*501/);
  assert.doesNotMatch(calendarGuard, /entities\.Leads\.update/);
  assert.doesNotMatch(calendarGuard, /Calendar event created/);
});

test("inline audit form clearly describes preferred-time confirmation", () => {
  assert.match(bookingInline, /Request a preferred time/);
  assert.match(bookingInline, /Arizona time \(MST\)/);
  assert.match(bookingInline, /pending until ClientSurge confirms it/i);
  assert.match(bookingInline, /Request This Time/);
  assert.match(bookingInline, /calendar_created|appointment before it is marked booked/);
  assert.match(bookingInline, /scheduleDemoBooking/);
  assert.match(bookingInline, /crm_tag:\s*crmTagForIndustry\(industrySlug\)/);
});

test("inline and modal booking surfaces capture the required audit context", () => {
  for (const source of [bookingModal, bookingInline]) {
    assert.match(source, /business_website_url|website/);
    assert.match(source, /industry|business_type/);
    assert.match(source, /biggest_issue|message/);
    assert.match(source, /scheduled_date|preferred_date/);
    assert.match(source, /scheduled_time|preferred_time/);
    assert.match(source, /consent_given/);
  }

  assert.match(bookingModal, /crm_tag:\s*auditCopy\.crmTag/);
});

test("canonical industry tags remain available for priority outreach verticals", () => {
  for (const tag of ["roofing_lead", "hvac_lead", "dental_lead", "med_spa_lead", "plumbing_lead"]) {
    assert.match(scheduleDemoBooking, new RegExp(tag));
  }
  assert.match(scheduleDemoBooking, /mergeSourceHistory/);
});

test("plumbing keeps a real public route and industry-specific request context", () => {
  assert.match(appSource, /"plumbing"/);
  assert.match(industryData, /"plumbing":\s*\{/);
  assert.match(industryData, /Free Plumbing Automation Audit/);
  assert.match(bookingModal, /plumbing_lead/);
});
