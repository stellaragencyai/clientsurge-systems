import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildRobotsTxt, buildSitemapXml } from "../src/lib/siteDocuments.js";

const sitemapXml = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const robotsTxt = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
const normalizeEol = (value) => value.replace(/\r\n/g, "\n");

test("generated sitemap matches the checked-in public sitemap", () => {
  assert.equal(normalizeEol(buildSitemapXml()), normalizeEol(sitemapXml));
});

test("generated robots.txt matches the checked-in public robots.txt", () => {
  assert.equal(normalizeEol(buildRobotsTxt()), normalizeEol(robotsTxt));
});
