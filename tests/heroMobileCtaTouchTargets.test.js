import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const heroSource = readFileSync("src/components/landing/Hero.jsx", "utf8");

test("home hero removes CTA rows so the industries section follows the title and iPad hero quickly", () => {
  const visualGlowIndex = heroSource.indexOf('className="landing-hero__visualGlow"');
  const mobileMediaIndex = heroSource.indexOf("@media (max-width: 720px)");

  assert.doesNotMatch(heroSource, /landing-hero__actions/);
  assert.doesNotMatch(heroSource, /hero-checklist/);
  assert.doesNotMatch(heroSource, /landing-hero__trustRow/);
  assert.ok(visualGlowIndex > -1, "hero visual glow is still present");
  assert.ok(mobileMediaIndex > -1, "mobile hero media query is still present");

  const mobileBlock = heroSource.slice(mobileMediaIndex, heroSource.indexOf("@media (max-width: 390px)", mobileMediaIndex));
  assert.match(mobileBlock, /\.landing-hero__visualWrap \{\s*display: none !important;/);
});

