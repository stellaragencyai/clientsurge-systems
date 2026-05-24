import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildIndustryJsonLd } from "../src/utils/industryJsonLd.js";

const industryTemplate = readFileSync(
  new URL("../src/components/landing/IndustryTemplate.jsx", import.meta.url),
  "utf8"
);

test("active industry template injects LocalBusiness JSON-LD per industry page", () => {
  assert.match(industryTemplate, /buildIndustryJsonLd/);
  assert.match(industryTemplate, /setJsonLd\(`industry-local-business-\$\{industrySlug\}`/);
  assert.match(industryTemplate, /cleanupIndustryJsonLd\?\.\(\)/);
});

test("industry JSON-LD covers active industry slugs with LocalBusiness schema", () => {
  for (const slug of ["med-spa", "dental", "chiropractic", "hvac", "roofing", "contractors"]) {
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
  const titleMatches = [...industryTemplate.matchAll(/title:\s*"([^"]+\| ClientSurge Systems)"/g)].map(
    (match) => match[1]
  );

  assert.equal(titleMatches.length, 6);
  assert.equal(new Set(titleMatches).size, 6);

  for (const title of titleMatches) {
    assert.match(title, /Phoenix & Scottsdale/);
    assert.match(title, /\| ClientSurge Systems$/);
  }

  assert.match(industryTemplate, /setPageMetadata\(\{/);
  assert.match(industryTemplate, /title: seo\?\.title/);
  assert.match(industryTemplate, /canonicalPath: `\/\$\{industrySlug\}`/);
});
