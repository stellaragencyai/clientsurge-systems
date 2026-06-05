import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const industriesPageSource = readFileSync(new URL("../src/pages/Industries.jsx", import.meta.url), "utf8");
const legacyIndustriesPageSource = readFileSync(new URL("../src/legacy-pages/IndustriesPage.jsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const industryTemplateSource = readFileSync(new URL("../src/components/landing/IndustryTemplate.jsx", import.meta.url), "utf8");

test("live industries page forces a top reset before navigating to live industry routes", () => {
  assert.match(industriesPageSource, /import\s+\{\s*forceScrollToTop\s*\}\s+from\s+"@\/lib\/scroll"/);
  assert.match(industriesPageSource, /window\.location\.assign\(href\)/);
  assert.match(industriesPageSource, /forceScrollToTop\(\);/);

  for (const href of ["/med-spa", "/dental", "/chiropractic", "/hvac", "/roofing", "/contractors"]) {
    assert.match(industriesPageSource, new RegExp(`href:\\s*"${href.replace("/", "\\/")}"`));
  }
});

test("route changes and industry destination pages re-assert top position after render", () => {
  assert.match(appSource, /import\s+\{\s*forceScrollToTop\s*\}\s+from\s+"@\/lib\/scroll"/);
  assert.match(appSource, /return\s+forceScrollToTop\(\);/);
  assert.match(appSource, /\[location\.hash,\s*location\.key,\s*location\.pathname\]/);

  assert.match(industryTemplateSource, /import\s+\{\s*forceScrollToTop\s*\}\s+from\s+"@\/lib\/scroll"/);
  assert.match(industryTemplateSource, /useEffect\(\(\)\s*=>\s*forceScrollToTop\(\),\s*\[industrySlug\]\)/);
});

test("legacy industries grid uses canonical live industry routes instead of nested alias paths", () => {
  assert.match(legacyIndustriesPageSource, /import\s+\{\s*forceScrollToTop\s*\}\s+from\s+"@\/lib\/scroll"/);
  assert.match(legacyIndustriesPageSource, /handleIndustryNavigation/);
  assert.match(legacyIndustriesPageSource, /forceScrollToTop\(\);/);

  for (const route of ["/med-spa", "/dental", "/hvac", "/roofing", "/contractors"]) {
    assert.match(legacyIndustriesPageSource, new RegExp(`route:\\s*"${route.replace("/", "\\/")}"`));
  }

  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/med-spa"/);
  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/dental"/);
  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/hvac"/);
  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/roofing"/);
  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/contractors"/);
});
