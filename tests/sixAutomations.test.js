import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SIX_AUTOMATIONS, getAutomationRoutes, getIndustryAutomationUseCases } from "../src/lib/sixAutomations.js";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const blog = readFileSync(new URL("../src/pages/Blog.jsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/pages/Home.jsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const industryTemplate = readFileSync(
  new URL("../src/components/landing/IndustryTemplate.jsx", import.meta.url),
  "utf8"
);

test("the public offer is packaged around exactly six automation systems", () => {
  assert.equal(SIX_AUTOMATIONS.length, 6);
  assert.deepEqual(
    SIX_AUTOMATIONS.map((automation) => automation.title),
    [
      "Missed-Call Text-Back Automation",
      "Lead Capture Automation",
      "AI Lead Follow-Up Automation",
      "Appointment Booking Automation",
      "Review & Reputation Automation",
      "Reactivation / Win-Back Automation",
    ]
  );
  assert.deepEqual(getAutomationRoutes(), [
    "/missed-call-text-back",
    "/lead-capture-automation",
    "/ai-lead-follow-up",
    "/appointment-booking-automation",
    "/review-automation",
    "/customer-reactivation",
  ]);
});

test("automation routes are public and no catch-all industry route advertises templates", () => {
  for (const route of getAutomationRoutes()) {
    assert.match(app, new RegExp(`routePath\\("${route.slice(1)}"\\)`));
  }
  assert.doesNotMatch(app, /path="\/:slug"/);
});

test("blog route is public and wired for SEO", () => {
  assert.match(app, /const Blog = lazy\(\(\) => import\("\.\/pages\/Blog"\)\)/);
  assert.match(app, /"\/blog"/);
  assert.match(app, /path="\/blog\/:slug"/);
  assert.doesNotMatch(app, /path="\/:slug"/);
  assert.match(sitemap, /https:\/\/clientsurgesystems\.com\/blog/);
});

test("launch blog articles have routes, sitemap entries, and schema hooks", () => {
  for (const slug of [
    "missed-call-text-back-guide",
    "ai-lead-follow-up-automation",
    "med-spa-lead-response-automation",
    "dental-missed-call-automation",
    "contractor-lead-follow-up-system",
    "hvac-missed-call-text-back",
    "roofing-lead-response-automation",
    "ai-appointment-booking-local-business",
    "lead-response-speed-to-lead",
    "automation-package-comparison",
  ]) {
    assert.match(blog, new RegExp(`slug: "${slug}"`));
    assert.match(sitemap, new RegExp(`https://clientsurgesystems\\.com/blog/${slug}`));
  }

  assert.match(blog, /setJsonLd\(`article-\$\{post\.slug\}`/);
  assert.match(blog, /setJsonLd\(`article-faq-\$\{post\.slug\}`/);
});

test("sitemap prioritizes canonical public marketing pages", () => {
  for (const route of ["/automations", "/industries", "/roofing", "/hvac", "/dental", "/med-spa", "/chiropractic", "/contractors", "/book", "/contact", "/blog", "/privacy-policy"]) {
    assert.match(sitemap, new RegExp(`https://clientsurgesystems\\.com${route}`));
  }
  for (const route of getAutomationRoutes()) {
    assert.doesNotMatch(sitemap, new RegExp(`https://clientsurgesystems\\.com${route}`));
  }
});

test("homepage and industry pages surface the six-automation architecture", () => {
  assert.match(home, /SixAutomationSystems/);
  assert.match(home, /ProofBeforeLaunch/);
  assert.match(home, /six done-for-you automations/);
  assert.match(home, /lead capture, missed-call recovery, AI follow-up, appointment booking, review generation, and customer reactivation/);
  assert.match(industryTemplate, /IndustryAutomationUseCases/);
});

test("every active industry has six mapped automation use cases", () => {
  for (const slug of ["med-spa", "dental", "chiropractic", "hvac", "roofing", "contractors"]) {
    assert.equal(getIndustryAutomationUseCases(slug).length, 6, `${slug} should map all six automations`);
  }
});
