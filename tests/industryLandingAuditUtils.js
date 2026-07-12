import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getIndustryConfig } from "../src/data/industryPageConfig.js";

const sources = {
  app: readFileSync("src/App.jsx", "utf8"),
  industryData: readFileSync("src/lib/industryData.js", "utf8"),
  industryTemplate: readFileSync("src/components/landing/IndustryTemplate.jsx", "utf8"),
  industryPageConfig: readFileSync("src/data/industryPageConfig.js", "utf8"),
  industryLandingPage: readFileSync("src/components/industry/IndustryLandingPage.jsx", "utf8"),
  immersiveIndustryHero: readFileSync("src/components/industry/ImmersiveIndustryHero.jsx", "utf8"),
  industryFinalCTA: readFileSync("src/components/industry/IndustryFinalCTA.jsx", "utf8"),
  demoBookingContext: readFileSync("src/components/landing/DemoBookingContext.jsx", "utf8"),
  demoBookingModal: readFileSync("src/components/forms/DemoBookingModal.jsx", "utf8"),
  demoBookingInline: readFileSync("src/components/forms/DemoBookingInline.jsx", "utf8"),
  submitLeadCapture: readFileSync("base44/functions/submitLeadCapture/entry.ts", "utf8"),
  scheduleDemoBooking: readFileSync("base44/functions/scheduleDemoBooking/main.ts", "utf8"),
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
  } = config;

  assert.match(sources.app, new RegExp(`"${escapeRegExp(slug)}"`));
  assert.match(sources.publicRouteMetadata, new RegExp(`"${escapeRegExp(route)}":\\s*\\{`));
  assert.match(sources.sitemap, new RegExp(escapeRegExp(`https://clientsurgesystems.com${route}`)));

  const activeConfig = getIndustryConfig(slug);
  assert.ok(activeConfig, `${slug} should have an active industry page config`);
  assert.equal(activeConfig.slug, slug);
  assert.ok(activeConfig.title && activeConfig.title !== title);
  assert.ok(activeConfig.description && activeConfig.description !== description);
  assert.ok(activeConfig.heroTitle);
  assert.ok(activeConfig.painStatement);
  assert.equal(activeConfig.cta, "Get Free Automation Audit");
  assert.ok(activeConfig.problems.length >= 3);
  assert.ok(new Set(activeConfig.problems.map((problem) => problem.title)).size >= 3);

  assertContains(sources.industryPageConfig, [
    activeConfig.title,
    activeConfig.description,
    activeConfig.heroTitle,
  ]);
  assert.doesNotMatch(sources.industryPageConfig, /Industry Template|lorem ipsum|Book Free Demo|public demo/i);
  assert.doesNotMatch(sources.industryLandingPage, /Industry Template|lorem ipsum|javascript:void|href="#"/i);

  assert.match(sources.industryLandingPage, /ogTitle/);
  assert.match(sources.industryLandingPage, /ogDescription/);
  assert.match(sources.industryLandingPage, /canonicalPath:\s*`\/\$\{industrySlug\}`/);
  assert.match(sources.industryLandingPage, /setJsonLd\(\s*`industry-local-business-\$\{industrySlug\}`/);
  assert.match(sources.industryLandingPage, /buildIndustryJsonLd\(industrySlug\)/);
  assert.match(sources.immersiveIndustryHero, /navigate\('\/book'\)/);
  assert.match(sources.industryFinalCTA, /to="\/book"/);
  assert.match(sources.industryFinalCTA, /to="\/pricing"/);

  assert.match(sources.demoBookingContext, /const industrySlug = options\.industrySlug \|\| selectedIndustry\?\.id \|\| "";/);
  assert.match(sources.demoBookingContext, /navigate\(`\/book\$\{search\}`\)/);
  assert.match(sources.demoBookingModal, /<DemoBookingInline/);
  assert.match(sources.demoBookingModal, /serviceInterest=\{context\.interest\}/);
  assert.match(sources.demoBookingModal, /preferred time, not receiving an instant calendar confirmation/i);

  for (const field of [
    "source_page",
    "industry_slug",
    "industry_tags",
    "crm_tag",
    "consent_given",
    "utm_source",
    "scheduled_date",
    "scheduled_time",
  ]) {
    assert.match(sources.demoBookingInline, new RegExp(field));
  }
  assert.match(sources.demoBookingInline, /response\?\.data\?\.success/);

  assert.match(sources.scheduleDemoBooking, /service_interest/);
  assert.match(sources.scheduleDemoBooking, /request_status:\s*"requested"/);
  assert.match(sources.scheduleDemoBooking, /calendar_created:\s*false/);
  assert.match(sources.scheduleDemoBooking, /source_page:\s*payload\.source_page/);
  assert.match(sources.scheduleDemoBooking, /utm_source:\s*payload\.utm_source/);
  assert.doesNotMatch(sources.scheduleDemoBooking, /crm_stage:\s*"Audit Booked"/);
  assert.match(sources.submitLeadCapture, /WebsiteLead\.create/);

  assert.match(sources.sendWebsiteLeadResponse, /automation audit/i);
  assert.match(sources.sendDemoConfirmationEmail, /automation audit/i);
  assert.match(sources.sendDemoPrepEmail, /prepFocusForIndustry/);
  assert.match(sources.sendAdminDemoNotification, /industry|service|audit/i);
  assert.match(sources.sendAdminLeadNotification, /lead|audit/i);
}
