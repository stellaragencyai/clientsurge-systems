import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SIX_AUTOMATIONS, getAutomationRoutes, getIndustryAutomationUseCases } from "../src/lib/sixAutomations.js";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/pages/Home.jsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const industryTemplate = readFileSync(
  new URL("../src/components/landing/IndustryTemplate.jsx", import.meta.url),
  "utf8"
);

test("the public offer is packaged around exactly six automation systems", () => {
  assert.equal(SIX_AUTOMATIONS.length, 6);
  assert.deepEqual(getAutomationRoutes(), [
    "/lead-capture-automation",
    "/missed-call-text-back",
    "/ai-lead-follow-up",
    "/appointment-booking-automation",
    "/review-automation",
    "/customer-reactivation",
  ]);
});

test("automation routes are public and declared before the catch-all industry route", () => {
  for (const route of getAutomationRoutes()) {
    assert.match(app, new RegExp(`"${route}"`));
    assert.ok(app.indexOf(`path="${route}"`) < app.indexOf('path="/:slug"'));
  }
});

test("blog route is public and wired for SEO", () => {
  assert.match(app, /import Blog from "\.\/pages\/Blog"/);
  assert.match(app, /"\/blog"/);
  assert.ok(app.indexOf('path="/blog"') < app.indexOf('path="/:slug"'));
  assert.match(sitemap, /https:\/\/clientsurgesystems\.com\/blog/);
});

test("sitemap includes every public automation service page", () => {
  for (const route of getAutomationRoutes()) {
    assert.match(sitemap, new RegExp(`https://clientsurgesystems\\.com${route}`));
  }
});

test("homepage and industry pages surface the six-automation architecture", () => {
  assert.match(home, /SixAutomationSystems/);
  assert.match(home, /six done-for-you automations/);
  assert.match(industryTemplate, /IndustryAutomationUseCases/);
});

test("every active industry has six mapped automation use cases", () => {
  for (const slug of ["med-spa", "dental", "chiropractic", "hvac", "roofing", "contractors"]) {
    assert.equal(getIndustryAutomationUseCases(slug).length, 6, `${slug} should map all six automations`);
  }
});
