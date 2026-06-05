import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  NOINDEX_ROUTE_PREFIXES,
  SITEMAP_STATIC_PATHS,
  STATIC_ROUTE_ALIASES,
} from "../src/lib/publicRouteMetadata.js";

const sitemapXml = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapPaths = new Set(locs.map((loc) => new URL(loc).pathname));

test("sitemap contains every required indexable static route", () => {
  for (const path of SITEMAP_STATIC_PATHS) {
    assert.ok(sitemapPaths.has(path), `sitemap is missing ${path}`);
  }
});

test("sitemap excludes noindex routes", () => {
  for (const path of NOINDEX_ROUTE_PREFIXES) {
    assert.ok(!sitemapPaths.has(path), `sitemap should not include noindex route ${path}`);
  }
});

test("sitemap excludes alias-only routes", () => {
  for (const [aliasPath, canonicalPath] of Object.entries(STATIC_ROUTE_ALIASES)) {
    if (canonicalPath === aliasPath) continue;
    assert.ok(!sitemapPaths.has(aliasPath), `sitemap should not include alias route ${aliasPath}`);
  }
});
