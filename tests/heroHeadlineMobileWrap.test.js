import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const heroSource = readFileSync("src/components/landing/Hero.jsx", "utf8");

test("home hero headline has a narrow-phone wrap guard", () => {
  const mobileMediaIndex = heroSource.indexOf("@media (max-width: 720px)");
  const narrowMediaIndex = heroSource.indexOf("@media (max-width: 390px)");

  assert.ok(mobileMediaIndex > -1, "mobile hero media query is still present");
  assert.ok(narrowMediaIndex > mobileMediaIndex, "narrow-phone hero media query is still present");

  const mobileBlock = heroSource.slice(mobileMediaIndex, narrowMediaIndex);
  const narrowBlock = heroSource.slice(narrowMediaIndex, heroSource.indexOf("@media (max-width: 360px)", narrowMediaIndex));

  assert.match(mobileBlock, /\.landing-hero__headline \{\s*font-size: clamp\(2rem, 7\.5vw, 2\.75rem\) !important;/);
  assert.match(mobileBlock, /text-wrap: balance !important;/);
  assert.match(mobileBlock, /overflow-wrap: normal !important;/);
  assert.match(mobileBlock, /max-width: 680px !important;/);
  assert.match(narrowBlock, /\.landing-hero__headline \{\s*font-size: clamp\(1\.8rem, 8vw, 2\.25rem\) !important;\s*max-width: 22rem !important;/);
  assert.match(narrowBlock, /\.landing-hero__inner \{\s*padding-left: 1rem !important;\s*padding-right: 1rem !important;/);
});
