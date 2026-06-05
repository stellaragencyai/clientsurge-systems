import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const industryData = readFileSync("src/lib/industryData.js", "utf8");
const industryTemplate = readFileSync("src/components/landing/IndustryTemplate.jsx", "utf8");
const demoBookingContext = readFileSync("src/components/landing/DemoBookingContext.jsx", "utf8");
const demoBookingModal = readFileSync("src/components/forms/DemoBookingModal.jsx", "utf8");
const submitLeadCapture = readFileSync("base44/functions/submitLeadCapture/entry.ts", "utf8");
const scheduleDemoBooking = readFileSync("base44/functions/scheduleDemoBooking/entry.ts", "utf8");
const sendWebsiteLeadResponse = readFileSync("base44/functions/sendWebsiteLeadResponse/entry.ts", "utf8");
const sendAdminLeadNotification = readFileSync("base44/functions/sendAdminLeadNotification/entry.ts", "utf8");
const websiteLeadEntity = readFileSync("base44/entities/WebsiteLead.jsonc", "utf8");

test("roofing page uses roofing-specific conversion copy and CTA", () => {
  assert.match(industryData, /Get More Roofing Leads Booked Before Competitors Reply/);
  assert.match(industryTemplate, /h1: "Get More Roofing Leads Booked Before Competitors Reply"/);
  assert.match(industryData, /missed calls, answer storm and quote requests fast/);
  assert.match(industryData, /Free Roofing Automation Audit/);
});

test("industry CTA opens the audit modal with roofing context", () => {
  assert.match(industryTemplate, /openDemoBooking\?\.\(\{ prefillIndustry: industry\.name, industrySlug \}\)/);
  assert.match(demoBookingContext, /industrySlug: options\.industrySlug/);
  assert.match(demoBookingContext, /industrySlug=\{modalState\.industrySlug\}/);
});

test("audit modal books roofing audits with tags, source tracking, and consent", () => {
  assert.match(demoBookingModal, /base44\.functions\.invoke\("scheduleDemoBooking"/);
  assert.match(demoBookingModal, /industry_slug: effectiveIndustrySlug/);
  assert.match(demoBookingModal, /free_roofing_automation_audit/);
  assert.match(demoBookingModal, /source: "landing_page"/);
  assert.match(demoBookingModal, /source_page: currentPath \|\| "\/book"/);
  assert.match(demoBookingModal, /scheduled_date: form\.scheduled_date/);
  assert.match(demoBookingModal, /scheduled_time: form\.scheduled_time/);
  assert.match(demoBookingModal, /audit_modal_explicit_checkbox_v1/);
  assert.match(demoBookingModal, /type="checkbox"/);
});

test("roofing lead capture creates CRM metadata and triggers response/admin paths", () => {
  assert.match(websiteLeadEntity, /"industry_slug"/);
  assert.match(websiteLeadEntity, /"industry_tags"/);
  assert.match(submitLeadCapture, /industrySlug === "roofing"/);
  assert.match(submitLeadCapture, /industrySlug === "hvac"/);
  assert.match(submitLeadCapture, /industrySlug === "dental"/);
  assert.match(submitLeadCapture, /free_roofing_automation_audit/);
  assert.match(submitLeadCapture, /free_hvac_automation_audit/);
  assert.match(submitLeadCapture, /free_dental_automation_audit/);
  assert.match(submitLeadCapture, /const industryTags = normalizeIndustryTags/);
  assert.match(submitLeadCapture, /industry_tags: \[\.\.\.new Set/);
  assert.match(submitLeadCapture, /assigned_agent_name: industrySlug \? `sales_rep_\$\{industrySlug\}`/);
  assert.match(submitLeadCapture, /findExistingCrmLead/);
  assert.match(submitLeadCapture, /crm_stage: existing\?\.crm_stage \|\| "Not Contacted"/);
  assert.match(submitLeadCapture, /sendWebsiteLeadResponse/);
  assert.match(scheduleDemoBooking, /industry_tags: payload\.industry_tags/);
  assert.match(scheduleDemoBooking, /assigned_agent_name: payload\.industry_slug \? `sales_rep_\$\{payload\.industry_slug\}`/);
  assert.match(scheduleDemoBooking, /crm_stage: 'Audit Booked'/);
  assert.match(scheduleDemoBooking, /source_page: payload\.source_page/);
});

test("roofing confirmation and admin notification are roofing-specific", () => {
  assert.match(sendWebsiteLeadResponse, /Your roofing automation audit request is in/);
  assert.match(sendWebsiteLeadResponse, /missed calls during storms/);
  assert.match(sendAdminLeadNotification, /Industry Tags/);
  assert.match(sendAdminLeadNotification, /New Roofing Lead/);
});
