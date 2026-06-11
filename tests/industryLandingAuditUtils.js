import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sources = {
  app: readFileSync("src/App.jsx", "utf8"),
  industryData: readFileSync("src/lib/industryData.js", "utf8"),
  industryTemplate: readFileSync("src/components/landing/IndustryTemplate.jsx", "utf8"),
  demoBookingContext: readFileSync("src/components/landing/DemoBookingContext.jsx", "utf8"),
  demoBookingModal: readFileSync("src/components/forms/DemoBookingModal.jsx", "utf8"),
  submitLeadCapture: readFileSync("base44/functions/submitLeadCapture/entry.ts", "utf8"),
  scheduleDemoBooking: readFileSync("base44/functions/scheduleDemoBooking/entry.ts", "utf8"),
  sendWebsiteLeadResponse: readFileSync("base44/functions/sendWebsiteLeadResponse/entry.ts", "utf8"),
  sendDemoConfirmationEmail: readFileSync("base44/functions/sendDemoConfirmationEmail/entry.ts", "utf8"),
  sendDemoPrepEmail: readFileSync("base44/functions/sendDemoPrepEmail/entry.ts", "utf8"),
  sendAdminDemoNotification: readFileSync("base44/functions/sendAdminDemoNotification/entry.ts", "utf8"),
  sendAdminLeadNotification: readFileSync("base44/functions/sendAdminLeadNotification/entry.ts", "utf8"),
  publicRouteMetadata: readFileSync("src/lib/publicRouteMetadata.js", "utf8"),
  sitemap: readFileSync("public/sitemap.xml", "utf8"),
};

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertContains(source, values) {
  for (const value of values) {
    assert.match(source, new RegExp(escapeRegExp(value), "i"));
  }
}

export function assertIndustryCampaignReady(config) {
  const {
    slug,
    route,
    title,
    description,
    cta,
    crmTag,
    serviceInterest,
    auditTag,
    painPoints,
    emailPhrases,
  } = config;

  assert.match(sources.app, new RegExp(`"${escapeRegExp(slug)}"`));
  assert.match(sources.industryData, new RegExp(`"${escapeRegExp(slug)}":\\s*\\{`));
  assert.match(sources.publicRouteMetadata, new RegExp(`"${escapeRegExp(route)}":\\s*\\{`));
  assert.match(sources.sitemap, new RegExp(escapeRegExp(`https://clientsurgesystems.com${route}`)));

  assertContains(sources.industryTemplate, [title, description]);
  assertContains(sources.industryData, [cta, ...painPoints]);
  assert.doesNotMatch(sources.industryData, /Industry Template|lorem ipsum|Book Free Demo|public demo/i);
  assert.doesNotMatch(sources.industryTemplate, /Industry Template|lorem ipsum|javascript:void|href="#"/i);

  assert.match(sources.industryTemplate, /ogTitle/);
  assert.match(sources.industryTemplate, /ogDescription/);
  assert.match(sources.industryTemplate, /canonicalPath:\s*`\/\$\{industrySlug\}`/);

  assertContains(sources.demoBookingModal, [cta, crmTag, serviceInterest, auditTag]);
  assert.match(sources.demoBookingContext, /industrySlug:\s*options\.industrySlug/);
  assert.match(sources.demoBookingModal, /source_page:\s*currentPath \|\| "\/book"/);
  assert.match(sources.demoBookingModal, /industry_tags:\s*industryTags/);
  assert.match(sources.demoBookingModal, /crm_tag:\s*auditCopy\.crmTag/);
  assert.match(sources.demoBookingModal, /consent_given/);
  assert.match(sources.demoBookingModal, /utm_source/);
  assert.match(sources.demoBookingModal, /setSuccess\(true\)/);

  assertContains(sources.scheduleDemoBooking, [crmTag, auditTag]);
  assert.match(sources.scheduleDemoBooking, /service_interest/);
  assert.match(sources.scheduleDemoBooking, /source_page:\s*payload\.source_page/);
  assert.match(sources.scheduleDemoBooking, /utm_source:\s*payload\.utm_source/);
  assert.match(sources.scheduleDemoBooking, /crm_stage:\s*'Audit Booked'/);
  assert.match(sources.submitLeadCapture, new RegExp(escapeRegExp(crmTag)));

  assertContains(sources.sendWebsiteLeadResponse, emailPhrases);
  assertContains(sources.sendDemoConfirmationEmail, emailPhrases.slice(0, 1));
  assert.match(sources.sendDemoPrepEmail, /prepFocusForIndustry/);
  assertContains(sources.sendAdminDemoNotification, [title.split(" ")[0]]);
  assertContains(sources.sendAdminLeadNotification, [crmTag.split("_")[0]]);
}
