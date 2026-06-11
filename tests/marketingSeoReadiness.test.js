import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  NOINDEX_ROUTE_PREFIXES,
  PUBLIC_ROUTE_METADATA,
  ROBOTS_DISALLOW_PATHS,
  SITEMAP_STATIC_PATHS,
} from "../src/lib/publicRouteMetadata.js";
import { buildIndustryJsonLd } from "../src/utils/industryJsonLd.js";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const sitemapXml = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const robotsTxt = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
const schemaMarkupSource = readFileSync(
  new URL("../src/components/SEO/SchemaMarkup.jsx", import.meta.url),
  "utf8"
);
const homeSource = readFileSync(new URL("../src/pages/Home.jsx", import.meta.url), "utf8");

test("important public routes have unique launch metadata", () => {
  const importantRoutes = [
    "/",
    "/book",
    "/contact",
    "/automations",
    "/store",
    "/roofing",
    "/hvac",
    "/plumbing",
    "/dental",
    "/med-spa",
    "/privacy-policy",
    "/terms",
    "/blog",
  ];

  const titles = new Set();
  const descriptions = new Set();

  for (const route of importantRoutes) {
    const metadata = PUBLIC_ROUTE_METADATA[route];
    assert.ok(metadata, `${route} should have metadata`);
    assert.ok(metadata.title.length >= 20, `${route} should have a real title`);
    assert.ok(metadata.description.length >= 80, `${route} should have a useful description`);
    assert.doesNotMatch(metadata.title, /Industry Template|Untitled|Home Page/i);
    assert.doesNotMatch(metadata.description, /placeholder|lorem ipsum|coming soon/i);
    assert.equal(titles.has(metadata.title), false, `${route} title should be unique`);
    assert.equal(descriptions.has(metadata.description), false, `${route} description should be unique`);
    titles.add(metadata.title);
    descriptions.add(metadata.description);
  }
});

test("sitemap and robots cover crawlability rules", () => {
  for (const route of SITEMAP_STATIC_PATHS) {
    assert.match(sitemapXml, new RegExp(`<loc>https://clientsurgesystems\\.com${route}</loc>`));
  }

  for (const route of NOINDEX_ROUTE_PREFIXES) {
    assert.doesNotMatch(sitemapXml, new RegExp(`<loc>https://clientsurgesystems\\.com${route}</loc>`));
  }

  for (const route of ROBOTS_DISALLOW_PATHS) {
    assert.match(robotsTxt, new RegExp(`Disallow: ${route.replaceAll("/", "\\/")}`));
  }
});

test("static shell has crawlable social preview and plumbing fallback coverage", () => {
  assert.match(indexHtml, /<meta name="twitter:card" content="summary_large_image" \/>/);
  assert.match(indexHtml, /<meta name="twitter:title"/);
  assert.doesNotMatch(indexHtml, /<meta property="twitter:/);
  assert.match(indexHtml, /"\/plumbing": \{/);
  assert.match(indexHtml, /"\/Plumbing": "\/plumbing"/);
  assert.match(indexHtml, /static-route--plumbing/);
});

test("schema helpers and homepage hooks cover required JSON-LD types", () => {
  for (const type of ["Organization", "ProfessionalService", "Service", "WebSite", "FAQPage"]) {
    assert.match(schemaMarkupSource, new RegExp(`'@type': '${type}'|\"@type\": \"${type}\"`));
  }

  for (const hook of [
    'setJsonLd("organization"',
    'setJsonLd("local-business"',
    'setJsonLd("service"',
    'setJsonLd("website"',
    'setJsonLd("faq"',
  ]) {
    assert.ok(homeSource.includes(hook), `homepage should inject ${hook}`);
  }

  const industrySchema = buildIndustryJsonLd("plumbing");
  assert.equal(industrySchema["@context"], "https://schema.org");
  assert.deepEqual(industrySchema["@type"], ["LocalBusiness", "ProfessionalService"]);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(industrySchema)));
});

test("launch-visible proof copy avoids fake customer-result claims", () => {
  const launchVisibleFiles = [
    "src/pages/Home.jsx",
    "src/pages/About.jsx",
    "src/pages/Automations.jsx",
    "src/pages/Store.jsx",
    "src/components/landing/SecurityPriority.jsx",
    "src/components/landing/Testimonials.jsx",
  ];

  const blockedPatterns = [
    /60[–-]80%/,
    /2-5x\s+More Bookings/i,
    /trusted by local service businesses/i,
    /verified customer result/i,
    /guaranteed revenue/i,
    /Book a Live Demo/,
  ];

  for (const file of launchVisibleFiles) {
    const content = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    for (const pattern of blockedPatterns) {
      assert.doesNotMatch(content, pattern, `${file} should avoid ${pattern}`);
    }
  }

  const testimonials = readFileSync(
    new URL("../src/components/landing/Testimonials.jsx", import.meta.url),
    "utf8"
  );
  assert.match(testimonials, /Illustrative examples/);
  assert.match(testimonials, /Verified customer case studies can replace these after launch proof/);
});

test("marketing SEO launch docs cover internal links, content, trust, and proof gaps", () => {
  const internalLinks = readFileSync(
    new URL("../docs/SEO_INTERNAL_LINKING_STRATEGY.md", import.meta.url),
    "utf8"
  );
  const readiness = readFileSync(
    new URL("../docs/MARKETING_SEO_LAUNCH_READINESS.md", import.meta.url),
    "utf8"
  );

  for (const phrase of [
    "Authority Flow",
    "Plumbing",
    "Supporting Blog Clusters",
    "Exclusions",
  ]) {
    assert.match(internalLinks, new RegExp(phrase));
  }

  for (const phrase of [
    "Metadata Status By Page",
    "Schema Status",
    "Trust Asset Inventory",
    "Proof Assets Needed",
    "Topical Authority Roadmap",
    "Trust Score",
    "Remaining Blockers",
  ]) {
    assert.match(readiness, new RegExp(phrase));
  }
});
