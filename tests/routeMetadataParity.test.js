import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  APP_SHELL_PUBLIC_PATHS,
  PUBLIC_DIRECTORY_PAGES,
  PUBLIC_ROUTE_METADATA,
  PUBLIC_ROUTE_PATHS,
  SITEMAP_STATIC_PATHS,
  STATIC_ROUTE_ALIASES,
} from "../src/lib/publicRouteMetadata.js";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");

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

test("shared public route arrays stay aligned to the Track A whitelist", () => {
  assert.deepEqual(PUBLIC_DIRECTORY_PAGES, INTENDED_PUBLIC_ROUTES);
  assert.deepEqual(PUBLIC_ROUTE_PATHS, INTENDED_PUBLIC_ROUTES);
  assert.deepEqual(APP_SHELL_PUBLIC_PATHS, INTENDED_PUBLIC_ROUTES);
  assert.deepEqual(SITEMAP_STATIC_PATHS, INTENDED_PUBLIC_ROUTES);
  assert.deepEqual(Object.keys(PUBLIC_ROUTE_METADATA), INTENDED_PUBLIC_ROUTES);
});

test("legacy public aliases collapse into the cleaned public surface", () => {
  for (const [from, to] of Object.entries(STATIC_ROUTE_ALIASES)) {
    assert.ok(from.startsWith("/"), `${from} should be absolute`);
    assert.ok(INTENDED_PUBLIC_ROUTES.includes(to), `${from} should redirect to an intended public route`);
  }
});

test("static fallback does not contain generated route map or public Pages directory", () => {
  assert.doesNotMatch(indexHtml, /var routeMap\s*=/);
  assert.doesNotMatch(indexHtml, />Pages</i);
  assert.doesNotMatch(indexHtml, /Admin Dashboard|Business Setup|Client Portal|Internal|Function Audit/i);
});
