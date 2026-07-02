import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const industriesPageSource = readFileSync(new URL("../src/pages/Industries.jsx", import.meta.url), "utf8");
const legacyIndustriesPageSource = readFileSync(new URL("../src/legacy-pages/IndustriesPage.jsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const publicRouteMetadataSource = readFileSync(new URL("../src/lib/publicRouteMetadata.js", import.meta.url), "utf8");
const industryLandingPageSource = readFileSync(new URL("../src/components/industry/IndustryLandingPage.jsx", import.meta.url), "utf8");
const industryMarketingConfigSource = readFileSync(new URL("../src/data/industryMarketingConfig.js", import.meta.url), "utf8");
const industryQualificationFormSource = readFileSync(new URL("../src/components/forms/IndustryQualificationForm.jsx", import.meta.url), "utf8");

const canonicalIndustryRoutes = [
  "/med-spa",
  "/dental",
  "/chiropractic",
  "/hvac",
  "/plumbing",
  "/roofing",
  "/contractors",
  "/law-firms",
  "/real-estate",
  "/property-services",
  "/auto-services",
  "/cleaning-services",
  "/local-services",
];

test("live industries page forces a top reset before navigating to live industry routes", () => {
  assert.match(industriesPageSource, /import\s+\{\s*forceScrollToTop\s*\}\s+from\s+"@\/lib\/scroll"/);
  assert.match(industriesPageSource, /window\.location\.assign\(href\)/);
  assert.match(industriesPageSource, /forceScrollToTop\(\);/);

  for (const href of canonicalIndustryRoutes) {
    assert.match(industriesPageSource, new RegExp(`href:\\s*"${href.replace("/", "\\/")}"`));
  }
});

test("industry routes are registered as public app shell paths", () => {
  assert.match(publicRouteMetadataSource, /const\s+INDUSTRY_PUBLIC_PATHS\s*=\s*\[/);
  assert.match(publicRouteMetadataSource, /\.\.\.INDUSTRY_PUBLIC_PATHS/);

  for (const route of canonicalIndustryRoutes) {
    assert.match(publicRouteMetadataSource, new RegExp(`"${route.replace("/", "\\/")}"`));
  }
});

test("route changes and industry destination pages re-assert top position after render", () => {
  assert.match(appSource, /import\s+\{\s*forceScrollToTop\s*\}\s+from\s+"@\/lib\/scroll"/);
  assert.match(appSource, /return\s+forceScrollToTop\(\);/);
  assert.match(appSource, /\[location\.hash,\s*location\.key,\s*location\.pathname\]/);

  assert.match(industryLandingPageSource, /industrySlug:\s*explicitIndustrySlug/);
  assert.match(industryLandingPageSource, /const industrySlug = explicitIndustrySlug \|\| routeIndustrySlug;/);
  assert.match(industryLandingPageSource, /canonicalPath:\s*`\/\$\{industrySlug\}`/);
});

test("legacy industries grid uses canonical live industry routes instead of nested alias paths", () => {
  assert.match(legacyIndustriesPageSource, /import\s+\{\s*forceScrollToTop\s*\}\s+from\s+"@\/lib\/scroll"/);
  assert.match(legacyIndustriesPageSource, /handleIndustryNavigation/);
  assert.match(legacyIndustriesPageSource, /forceScrollToTop\(\);/);

  for (const route of ["/med-spa", "/dental", "/hvac", "/plumbing", "/roofing", "/contractors"]) {
    assert.match(legacyIndustriesPageSource, new RegExp(`route:\\s*"${route.replace("/", "\\/")}"`));
  }

  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/med-spa"/);
  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/dental"/);
  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/hvac"/);
  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/plumbing"/);
  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/roofing"/);
  assert.doesNotMatch(legacyIndustriesPageSource, /route:\s*"\/industries\/contractors"/);
});

test("industry marketing config contains all 12 target industry routes", () => {
  for (const route of canonicalIndustryRoutes) {
    const slug = route.slice(1);
    assert.match(industryMarketingConfigSource, new RegExp(`['\"]${slug}['\"]\\s*:`));
  }
});

test("new industry qualification forms have buyer-specific questions", () => {
  for (const slug of ["law-firms", "property-services", "auto-services", "cleaning-services", "local-services"]) {
    assert.match(industryQualificationFormSource, new RegExp(`['\"]${slug}['\"]\\s*:`));
  }
});
