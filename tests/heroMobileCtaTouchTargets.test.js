import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const heroSource = readFileSync("src/components/landing/Hero.jsx", "utf8");

test("home hero CTAs keep mobile-safe touch targets and avoid visual glow overlap", () => {
  const actionsIndex = heroSource.indexOf('className="landing-hero__actions"');
  const visualGlowIndex = heroSource.indexOf('className="landing-hero__visualGlow"');
  const mobileMediaIndex = heroSource.indexOf("@media (max-width: 720px)");

  assert.ok(actionsIndex > -1, "hero actions are still present");
  assert.ok(visualGlowIndex > -1, "hero visual glow is still present");
  assert.ok(mobileMediaIndex > -1, "mobile hero media query is still present");

  const actionsBlock = heroSource.slice(actionsIndex, heroSource.indexOf("</div>", actionsIndex));
  assert.match(actionsBlock, /minHeight: "58px"/);
  assert.match(actionsBlock, /minHeight: "58px"[\s\S]*to="\/automations"/);

  const mobileBlock = heroSource.slice(mobileMediaIndex, heroSource.indexOf("@media (max-width: 390px)", mobileMediaIndex));
  assert.match(mobileBlock, /\.landing-hero__visualWrap \{\s*display: none !important;/);
  assert.match(mobileBlock, /\.landing-hero__actions \{\s*flex-direction: column !important;/);
  assert.match(mobileBlock, /\.landing-hero__actions > \* \{\s*width: 100% !important;/);
});

