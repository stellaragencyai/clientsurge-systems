import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  NOINDEX_ROUTE_PREFIXES,
  PUBLIC_ROUTE_METADATA,
  ROBOTS_DISALLOW_PATHS,
  SITEMAP_STATIC_PATHS,
} from "../src/lib/publicRouteMetadata.js";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const sitemapXml = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const robotsTxt = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
const routeExposureGuard = readFileSync(
  new URL("../public/clientsurge-public-route-exposure-guard.js", import.meta.url),
  "utf8",
);

const INTENDED_PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/automations",
  "/contact",
  "/privacy",
  "/terms",
  "/sms-terms",
  "/refund-policy",
];

const PRIVATE_OR_INTERNAL_ROUTES = [
  "/admin",
  "/dashboard",
  "/client",
  "/client-portal",
  "/setup",
  "/functions",
  "/internal",
  "/private",
  "/onboarding",
  "/install",
  "/audit",
  "/observability",
  "/reconciliation",
];

test("Track A public metadata is limited to the intended public website surface", () => {
  assert.deepEqual(Object.keys(PUBLIC_ROUTE_METADATA), INTENDED_PUBLIC_ROUTES);
  assert.deepEqual(SITEMAP_STATIC_PATHS, INTENDED_PUBLIC_ROUTES);

  for (const route of INTENDED_PUBLIC_ROUTES) {
    const metadata = PUBLIC_ROUTE_METADATA[route];
    assert.ok(metadata, `${route} should have metadata`);
    assert.ok(metadata.title.length >= 20, `${route} should have a real title`);
    assert.ok(metadata.description.length >= 80, `${route} should have a useful description`);
    assert.doesNotMatch(metadata.title, /Admin|Dashboard|Setup|Internal|Base44|Pages/i);
    assert.doesNotMatch(metadata.description, /Admin|Dashboard|Setup|Internal|Base44|Pages/i);
  }
});

test("sitemap contains only intended public routes", () => {
  const locMatches = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(
    locMatches,
    INTENDED_PUBLIC_ROUTES.map((route) => `https://clientsurgesystems.com${route}`),
  );

  for (const route of PRIVATE_OR_INTERNAL_ROUTES) {
    assert.doesNotMatch(sitemapXml, new RegExp(`<loc>https://clientsurgesystems\\.com${route}`));
  }
});

test("robots blocks private/internal route families and includes sitemap", () => {
  assert.match(robotsTxt, /^User-agent: \*/m);
  assert.match(robotsTxt, /^Allow: \/$/m);
  assert.match(robotsTxt, /^Sitemap: https:\/\/clientsurgesystems\.com\/sitemap\.xml$/m);

  for (const route of PRIVATE_OR_INTERNAL_ROUTES) {
    assert.ok(
      ROBOTS_DISALLOW_PATHS.includes(route) || ROBOTS_DISALLOW_PATHS.includes(`${route}/`),
      `${route} should be represented in ROBOTS_DISALLOW_PATHS`,
    );
  }

  for (const route of ROBOTS_DISALLOW_PATHS) {
    assert.match(robotsTxt, new RegExp(`Disallow: ${route.replaceAll("/", "\\/")}`));
  }
});

test("static fallback is crawlable and does not expose app-builder route directory", () => {
  assert.match(indexHtml, /Starter System:<\/strong> \$797 setup \+ \$497\/month/);
  assert.match(indexHtml, /Growth System:<\/strong> \$1,297 setup \+ \$997\/month/);
  assert.match(indexHtml, /Pro System:<\/strong> \$2,497 setup \+ \$1,997\/month/);

  assert.doesNotMatch(indexHtml, />Pages</i);
  assert.doesNotMatch(indexHtml, /Admin Dashboard|Business Setup|Client Portal|Function Audit|System Observability/i);
  assert.doesNotMatch(indexHtml, /href="\/(admin|dashboard|client|client-portal|setup|functions|internal|private|onboarding|audit|reconciliation|observability)/i);

  for (const route of ["/privacy", "/terms", "/sms-terms", "/refund-policy"]) {
    assert.match(indexHtml, new RegExp(`href="${route}"`));
  }
});

test("public route exposure guard is loaded early and targets generated Pages directory risk", () => {
  assert.match(indexHtml, /<script src="\/clientsurge-public-route-exposure-guard\.js"><\/script>/);
  assert.doesNotMatch(indexHtml, /src="\/clientsurge-public-route-exposure-guard\.js" defer/);
  assert.match(routeExposureGuard, /looksLikeGeneratedPagesDirectory/);
  assert.match(routeExposureGuard, /removeLooseGeneratedPagesDirectory/);
  assert.match(routeExposureGuard, /GENERATED_COPY_PATTERN/);
  assert.match(routeExposureGuard, /INTERNAL_PATH_PATTERN/);
  assert.match(routeExposureGuard, /Admin Dashboard/);
  assert.match(routeExposureGuard, /Business Setup/);
  assert.match(routeExposureGuard, /Client Portal/);
});

test("private/internal routes are noindex candidates", () => {
  for (const route of PRIVATE_OR_INTERNAL_ROUTES) {
    assert.ok(
      NOINDEX_ROUTE_PREFIXES.includes(route) || NOINDEX_ROUTE_PREFIXES.includes(`${route}/`),
      `${route} should be noindexed`,
    );
  }
});
