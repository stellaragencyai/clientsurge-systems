import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const staticIndex = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const redirectsFile = readFileSync(new URL("../public/_redirects", import.meta.url), "utf8");

const redirectPairs = [
  ["/Blog", "/blog"],
  ["/IndustriesPage", "/industries"],
  ["/IndustryTemplate", "/industries"],
  ["/Roofing", "/roofing"],
  ["/HVAC", "/hvac"],
  ["/Dental", "/dental"],
  ["/MedSpa", "/med-spa"],
  ["/Chiropractic", "/chiropractic"],
  ["/Contractors", "/contractors"],
  ["/legal/privacy", "/privacy-policy"],
  ["/legal/terms", "/terms"],
];

test("legacy redirect routes have explicit canonical destinations", () => {
  for (const [from, to] of redirectPairs) {
    assert.match(redirectsFile, new RegExp(`^${from.replace(/\//g, "\\/")} ${to.replace(/\//g, "\\/")} 301$`, "m"));
    assert.match(
      staticIndex,
      new RegExp(`"${from.replace(/\//g, "\\/")}": "${to.replace(/\//g, "\\/")}"`)
    );
  }

  assert.match(staticIndex, /var canonicalPath = aliases\[path\] \|\| path;/);
  assert.match(staticIndex, /var canonicalUrl = "https:\/\/clientsurgesystems\.com" \+ canonicalPath;/);
  assert.match(staticIndex, /canonical\.setAttribute\("href", canonicalUrl\)/);
  assert.match(staticIndex, /"\/pricing": "\/"/);
  assert.match(staticIndex, /"\/faq": "\/"/);
  assert.match(staticIndex, /"\/our-system": "\/"/);
  assert.match(staticIndex, /"\/testimonials": "\/"/);
});

test("in-app section redirects preserve hash navigation without stamping duplicate metadata", () => {
  assert.match(appSource, /function HashRedirect\(\{ hash \}\)/);
  assert.doesNotMatch(appSource, /function SectionRedirect\(\{ hash \}\)/);
  assert.doesNotMatch(appSource, /canonicalPath: "\/"/);
  assert.match(appSource, /navigate\(\{ pathname: "\/", hash \}, \{ replace: true \}\)/);
});

test("static fallback noindexes private and auth routes before app hydration", () => {
  assert.match(staticIndex, /var noindexPrefixes = \[/);
  assert.match(staticIndex, /"\/login"/);
  assert.match(staticIndex, /"\/client-portal"/);
  assert.match(staticIndex, /"\/client-dashboard"/);
  assert.match(staticIndex, /"\/admin"/);
  assert.match(staticIndex, /robots\.setAttribute\("content", robotsContent\)/);
});
