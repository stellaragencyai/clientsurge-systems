import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const homeSource = readFileSync("src/pages/Home.jsx", "utf8");

test("homepage below-fold groups wait for viewport approach before mounting lazy chunks", () => {
  assert.match(homeSource, /function LazyHomepageSection/);
  assert.match(homeSource, /new IntersectionObserver/);
  assert.match(homeSource, /rootMargin: "200px"/);
  assert.match(homeSource, /<LazyHomepageSection fallback=\{<SectionSkeleton \/>/);
  assert.match(homeSource, /<LazyHomepageSection fallback=\{<LargeSectionSkeleton \/>/);
});

test("homepage keeps the first viewport direct and defers framer-heavy sections", () => {
  assert.match(homeSource, /<Hero \/>/);
  assert.match(homeSource, /<HomepageConversionContent \/>/);
  assert.match(homeSource, /<LazyHomepageSection[\s\S]*<CoreOffer \/>/);
  assert.match(homeSource, /<LazyHomepageSection[\s\S]*<FAQ \/>/);
});
