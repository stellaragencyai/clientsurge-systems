import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const socialProofToasts = readFileSync("src/components/landing/SocialProofToasts.jsx", "utf8");
const liveAutomationFeed = readFileSync("src/components/landing/LiveAutomationFeed.jsx", "utf8");

test("simulated social proof does not present fake customers as real activity", () => {
  assert.match(socialProofToasts, /Preview: \{current\.scenario\}/);
  assert.match(socialProofToasts, /lead follow-up preview|workflow preview|checkout path preview/);
  assert.match(socialProofToasts, />preview</);
  assert.doesNotMatch(socialProofToasts, /just booked a demo|signed up today/);
  assert.doesNotMatch(socialProofToasts, /Mike R\.|Sarah M\.|David L\.|Jessica T\.|Carlos B\.|Amy W\./);
});

test("live automation feed is clearly framed as simulated", () => {
  assert.match(liveAutomationFeed, /simulated feed shows the kinds of events/);
  assert.match(liveAutomationFeed, /Simulated demo data/);
  assert.doesNotMatch(liveAutomationFeed, /clients' businesses every single day/);
});
