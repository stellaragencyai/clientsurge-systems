import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { collectSeoTrustAudit } from "../scripts/audit-area9-seo-trust.mjs";
import { PUBLIC_DIRECTORY_PAGES, ROBOTS_DISALLOW_PATHS, SITEMAP_STATIC_PATHS } from "../src/lib/publicRouteMetadata.js";
import { buildRobotsTxt, buildSitemapXml } from "../src/lib/siteDocuments.js";

const legalPage = readFileSync(new URL("../src/internal-pages/LegalPage.jsx", import.meta.url), "utf8");
const testimonialsPage = readFileSync(new URL("../src/pages/TestimonialsPage.jsx", import.meta.url), "utf8");
const testimonials = readFileSync(new URL("../src/components/landing/Testimonials.jsx", import.meta.url), "utf8");
const report = collectSeoTrustAudit();

test("Area 9 public sitemap and directory routes remain in parity", () => {
  assert.deepEqual(SITEMAP_STATIC_PATHS, PUBLIC_DIRECTORY_PAGES);
  const sitemap = buildSitemapXml();
  for (const path of PUBLIC_DIRECTORY_PAGES) {
    assert.match(sitemap, new RegExp(`<loc>https://clientsurgesystems\\.com${path === "/" ? "/" : path}</loc>`));
  }
});

test("Area 9 robots blocks utility private and generated routes", () => {
  const robots = buildRobotsTxt();
  for (const path of ["/_generated", "/pages", "/admin", "/client-portal", "/setup", "/api/", "/product-signup", "/store"]) {
    assert.ok(ROBOTS_DISALLOW_PATHS.includes(path), `${path} should be disallowed`);
    assert.match(robots, new RegExp(`Disallow: ${path.replace(/\//g, "\\/")}`));
  }
});

test("Area 9 legal page uses trust labels without unverified certification claims", () => {
  assert.match(legalPage, /SMS Opt-Out Guardrails/);
  assert.match(legalPage, /Truthful Proof Labels/);
  assert.match(legalPage, /We do not sell your personal information/);
  assert.doesNotMatch(legalPage, /10DLC SMS Compliant/);
  assert.doesNotMatch(legalPage, /Registered campaign with verified sender identity/);
});

test("Area 9 workflow scenarios are not labeled as verified testimonials", () => {
  assert.match(testimonialsPage, /not verified customer testimonials/);
  assert.match(testimonials, /workflow scenarios/i);
  assert.match(testimonials, /not verified customer testimonials/);
  assert.doesNotMatch(testimonials, /Real Workflow Results/);
  assert.doesNotMatch(testimonialsPage, /Launch Scenarios & Testimonials/);
});

test("Area 9 SEO trust audit reports no findings", () => {
  assert.deepEqual(report.findings, []);
});
