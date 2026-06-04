import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const homeSource = readFileSync("src/pages/Home.jsx", "utf8");

test("homepage below-fold groups mount with stable document height", () => {
  assert.match(homeSource, /function LazyHomepageSection/);
  assert.doesNotMatch(homeSource, /new IntersectionObserver/);
  assert.doesNotMatch(homeSource, /rootMargin:/);
  assert.match(homeSource, /<LazyHomepageSection fallback=\{<SectionSkeleton \/>/);
  assert.match(homeSource, /<LazyHomepageSection fallback=\{<LargeSectionSkeleton \/>/);
});

test("homepage keeps the first viewport direct and defers framer-heavy sections", () => {
  assert.match(homeSource, /<Hero \/>/);
  assert.match(homeSource, /<Hero \/>\s*<LazyHomepageSection[\s\S]*<Industries \/>/);
  assert.doesNotMatch(homeSource, /<HomepageConversionContent \/>/);
  assert.doesNotMatch(homeSource, /<SixAutomationSystems \/>/);
  assert.doesNotMatch(homeSource, /<ProofBeforeLaunch \/>/);
  assert.match(homeSource, /<LazyHomepageSection[\s\S]*<CoreOffer \/>/);
  assert.match(homeSource, /<LazyHomepageSection[\s\S]*<FAQ \/>/);
});

test("homepage keeps trust and security as the final content section before the footer", () => {
  assert.match(homeSource, /import SecurityPriority from "\.\.\/components\/landing\/SecurityPriority"/);
  assert.match(homeSource, /<SecurityPriority \/>\s*<Footer \/>/);
});
