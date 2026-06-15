import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const testimonialsSource = readFileSync("src/components/landing/Testimonials.jsx", "utf8");

test("homepage testimonials are framed as launch scenarios until customer proof exists", () => {
  assert.match(testimonialsSource, /Launch Scenarios/);
  assert.match(testimonialsSource, /Illustrative examples based on the installed workflows/);
  assert.match(testimonialsSource, /Verified customer case studies can replace these after launch proof/);

  assert.doesNotMatch(testimonialsSource, /Proven Results/);
  assert.doesNotMatch(testimonialsSource, /Real Results From Businesses Using Our System/);
  assert.doesNotMatch(testimonialsSource, /5x booking increase|Close rate doubled|ROI within the first month/);
  assert.doesNotMatch(testimonialsSource, /Jessica M\.|Carlos R\.|Amanda T\./);
});

test("homepage testimonials CTA stays centered below the scenario cards", () => {
  assert.match(testimonialsSource, /data-clientsurge-testimonials-cta-align="centered"/);
  assert.match(testimonialsSource, /mx-auto mt-16 flex w-full max-w-2xl flex-col items-center justify-center/);
  assert.match(testimonialsSource, /mx-auto inline-flex h-12 items-center justify-center/);
});
