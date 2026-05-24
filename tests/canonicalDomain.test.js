import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const CANONICAL = "https://clientsurgesystems.com";
const ALTERNATE = "https://www.clientsurgesystems.com";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public metadata uses the apex canonical domain", () => {
  for (const path of [
    "index.html",
    "src/lib/seo.js",
    "src/utils/ogMetaTags.js",
    "src/components/SEO/SchemaMarkup.jsx",
    "public/.well-known/security.txt",
  ]) {
    const source = read(path);
    assert.match(source, new RegExp(CANONICAL.replace(/\./g, "\\.")));
    assert.doesNotMatch(source, new RegExp(ALTERNATE.replace(/\./g, "\\.")));
  }
});

test("sitemap and robots publish apex canonical URLs only", () => {
  const sitemap = read("public/sitemap.xml");
  const robots = read("public/robots.txt");

  assert.match(sitemap, /<loc>https:\/\/clientsurgesystems\.com\//);
  assert.doesNotMatch(sitemap, /https:\/\/www\.clientsurgesystems\.com/);
  assert.match(robots, /Sitemap: https:\/\/clientsurgesystems\.com\/sitemap\.xml/);
  assert.doesNotMatch(robots, /Sitemap: https:\/\/www\.clientsurgesystems\.com/);
});

test("redirect rules point www traffic to the apex canonical domain", () => {
  const redirects = read("public/_redirects");

  assert.match(redirects, /http:\/\/www\.clientsurgesystems\.com\/\* https:\/\/clientsurgesystems\.com\/:splat 301!/);
  assert.match(redirects, /https:\/\/www\.clientsurgesystems\.com\/\* https:\/\/clientsurgesystems\.com\/:splat 301!/);
  assert.doesNotMatch(redirects, /https:\/\/clientsurgesystems\.com\/\* https:\/\/clientsurgesystems\.com\/:splat/);
});
