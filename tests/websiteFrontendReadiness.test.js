import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ADMIN_ROUTE_PREFIXES,
  AUTHENTICATED_ROUTE_PREFIXES,
  NOINDEX_ROUTE_PREFIXES,
  PUBLIC_ROUTE_PATHS,
  SITEMAP_STATIC_PATHS,
} from "../src/lib/publicRouteMetadata.js";
import { classifyRoute, ROUTE_ACCESS, shouldNoindexRoute } from "../src/lib/routeSecurity.js";

test("website route governance document covers expected launch routes", () => {
  const doc = readFileSync(new URL("../docs/WEBSITE_ROUTE_GOVERNANCE.md", import.meta.url), "utf8");

  for (const route of ["/", "/book", "/contact", "/store", "/automations", "/roofing", "/hvac", "/plumbing", "/dental", "/med-spa", "/privacy-policy", "/terms", "/login", "/client-portal", "/client-dashboard"]) {
    assert.ok(doc.includes(`| \`${route}\``), `governance doc should include ${route}`);
  }

  assert.match(doc, /\/plumbing` \| Plumbing industry page/);
  assert.match(doc, /\/plumbing` is now an active public industry route/);
});

test("route security classifies public, authenticated, admin, and noindex routes", () => {
  for (const route of ["/", "/book", "/pricing", "/automations", "/roofing", "/hvac", "/plumbing"]) {
    assert.equal(classifyRoute(route), ROUTE_ACCESS.PUBLIC, `${route} should be public`);
    assert.equal(shouldNoindexRoute(route), false, `${route} should be indexable`);
  }

  for (const route of ["/store", "/start", "/book-demo"]) {
    assert.equal(classifyRoute(route), ROUTE_ACCESS.PUBLIC, `${route} should remain reachable`);
    assert.equal(shouldNoindexRoute(route), true, `${route} should be noindex`);
  }

  for (const route of AUTHENTICATED_ROUTE_PREFIXES) {
    assert.equal(classifyRoute(route), ROUTE_ACCESS.AUTHENTICATED, `${route} should require auth`);
    assert.equal(shouldNoindexRoute(route), true, `${route} should be noindex`);
  }

  for (const route of ADMIN_ROUTE_PREFIXES) {
    assert.equal(classifyRoute(route), ROUTE_ACCESS.ADMIN, `${route} should be admin`);
    assert.equal(shouldNoindexRoute(route), true, `${route} should be noindex`);
  }

  for (const route of NOINDEX_ROUTE_PREFIXES) {
    assert.equal(shouldNoindexRoute(route), true, `${route} should be noindex`);
  }
});

test("public route and sitemap sources include launch-critical pages", () => {
  for (const route of ["/", "/book", "/contact", "/store", "/start", "/book-demo", "/pricing", "/automations", "/roofing", "/hvac", "/plumbing", "/dental", "/med-spa", "/privacy-policy", "/terms", "/login"]) {
    assert.ok(PUBLIC_ROUTE_PATHS.includes(route), `PUBLIC_ROUTE_PATHS should include ${route}`);
  }

  for (const route of ["/", "/book", "/contact", "/pricing", "/automations", "/roofing", "/hvac", "/plumbing", "/dental", "/med-spa", "/privacy-policy", "/terms"]) {
    assert.ok(SITEMAP_STATIC_PATHS.includes(route), `SITEMAP_STATIC_PATHS should include ${route}`);
  }

  for (const route of ["/store", "/start", "/book-demo"]) {
    assert.equal(SITEMAP_STATIC_PATHS.includes(route), false, `SITEMAP_STATIC_PATHS should exclude ${route}`);
  }
});

test("visual theme system document records required launch standards", () => {
  const doc = readFileSync(new URL("../docs/VISUAL_THEME_SYSTEM.md", import.meta.url), "utf8");

  for (const heading of [
    "Primary Colors",
    "Accent Colors",
    "Blue Glow Rules",
    "Typography Scale",
    "Button Standards",
    "Card Standards",
    "Section Standards",
    "Page Layout Rules",
    "Animation Rules",
    "Legal Page Rules",
    "Mobile Rules",
    "Accessibility Rules",
  ]) {
    assert.match(doc, new RegExp(`## ${heading}`));
  }

  assert.match(doc, /Free Automation Audit/);
});

test("live route scan script reports required audit fields without secrets", () => {
  const script = readFileSync(new URL("../scripts/audit/website-live-route-scan.mjs", import.meta.url), "utf8");

  for (const field of [
    "status_code",
    "page_title",
    "contains_free_automation_audit",
    "contains_demo",
    "contains_coming_soon",
    "bundle_hash",
    "errors",
  ]) {
    assert.match(script, new RegExp(field));
  }

  assert.doesNotMatch(script, /process\.env\.(?!CLIENTSURGE_SMOKE_BASE_URL)/);
});
