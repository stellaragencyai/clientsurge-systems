import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildIndustryJsonLd } from "../src/utils/industryJsonLd.js";
import { getIndustryConfig } from "../src/data/industryPageConfig.js";

const industryLandingPage = readFileSync(
  new URL("../src/components/industry/IndustryLandingPage.jsx", import.meta.url),
  "utf8"
);

test("active industry renderer injects LocalBusiness JSON-LD per industry page", () => {
  assert.match(industryLandingPage, /buildIndustryJsonLd/);
  assert.match(industryLandingPage, /setJsonLd\(\s*`industry-local-business-\$\{industrySlug\}`/);
  assert.match(industryLandingPage, /cleanupIndustryJsonLd\?\.\(\)/);
});

test("industry JSON-LD covers active industry slugs with LocalBusiness schema", () => {
  for (const slug of ["med-spa", "dental", "chiropractic", "hvac", "plumbing", "roofing", "contractors"]) {
    const schema = buildIndustryJsonLd(slug);

    assert.equal(schema["@context"], "https://schema.org");
    assert.ok(schema["@type"].includes("LocalBusiness"), `${slug} should include LocalBusiness`);
    assert.ok(schema["@type"].includes("ProfessionalService"), `${slug} should include ProfessionalService`);
    assert.equal(schema.url, "https://clientsurgesystems.com");
    assert.ok(schema.name);
    assert.ok(schema.serviceType);
    assert.ok(schema.hasOfferCatalog.itemListElement.length >= 4);
  }
});

test("active industry pages set unique local SEO titles", () => {
  const titleMatches = ["med-spa", "dental", "chiropractic", "hvac", "plumbing", "roofing", "contractors"]
    .map((slug) => `${getIndustryConfig(slug).title} | ClientSurge Systems`);

  assert.equal(titleMatches.length, 7);
  assert.equal(new Set(titleMatches).size, 7);

  for (const title of titleMatches) {
    assert.match(title, /\| ClientSurge Systems$/);
  }

  assert.match(industryLandingPage, /setPageMetadata\(\{/);
  assert.match(industryLandingPage, /title: `\$\{config\.title\} \| ClientSurge Systems`/);
  assert.match(industryLandingPage, /canonicalPath: `\/\$\{industrySlug\}`/);
});
