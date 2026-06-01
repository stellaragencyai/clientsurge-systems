import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const files = [
  "src/components/medspa/MedSpaFAQ.jsx",
  "src/components/medspa/MedSpaFinalCTA.jsx",
  "src/components/medspa/MedSpaPricingPreview.jsx",
  "src/components/medspa/MedSpaROIBlock.jsx",
  "src/components/medspa/MedSpaSocialProof.jsx",
  "src/components/medspa/MedSpaTestimonials.jsx",
  "src/components/industry/IndustryResults.jsx",
];

const copy = files.map((file) => readFileSync(file, "utf8")).join("\n");

test("med spa launch copy avoids unproven setup, pricing, and ROI promises", () => {
  for (const claim of [
    /No setup fee/i,
    /pay for itself quickly/i,
    /Most med spas see ROI/i,
    /ROI within the first 2-3 weeks/i,
    /fully live within 5-7 business days/i,
    /fixes that immediately/i,
    /Real Results/i,
    /What Businesses Like Yours See/i,
    /5x booking increase/i,
    /10\+ consultations booked\/week/i,
    /Zero leads dropped/i,
    /Paid for itself/i,
    /Avg Booking Increase/i,
    /ROI Timeline/i,
    /No contracts/i,
  ]) {
    assert.doesNotMatch(copy, claim);
  }
});

test("med spa launch copy keeps pricing and guarantee expectations aligned", () => {
  assert.match(copy, /One-time setup fee/);
  assert.match(copy, /depends on your lead volume/);
  assert.match(copy, /5-7 business days after onboarding/);
  assert.match(copy, /Exact return depends on lead volume/);
});

test("med spa social proof is framed as illustrative launch scenarios", () => {
  assert.match(copy, /Launch Scenarios/);
  assert.match(copy, /Illustrative scenarios until verified customer case studies are approved/);
  assert.match(copy, /Example workflow/);
  assert.match(copy, /Launch Targets/);
  assert.match(copy, /Launch timing depends on onboarding and provider access/);
});
