import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../src/pages/Home.jsx", import.meta.url), "utf8");
const founderSection = readFileSync(
  new URL("../src/components/landing/FounderSection.jsx", import.meta.url),
  "utf8"
);

test("homepage renders the founder credibility section before testimonials", () => {
  assert.match(home, /const FounderSection = lazy/);
  assert.ok(home.indexOf("<FounderSection />") > home.indexOf("<FAQ />"));
  assert.ok(home.indexOf("<FounderSection />") < home.indexOf("<Testimonials />"));
});

test("founder section uses an honest local fallback instead of third-party placeholder media", () => {
  assert.match(founderSection, /Founder photo pending/);
  assert.match(founderSection, /Launch-safe placeholder until the approved founder image is added/);
  assert.match(founderSection, /setPhotoUnavailable\(true\)/);
  assert.doesNotMatch(founderSection, /placehold\.co|placeholder\.com|via\.placeholder/);
});
