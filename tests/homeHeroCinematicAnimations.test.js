import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const heroSource = readFileSync("src/components/landing/Hero.jsx", "utf8");

test("home hero exposes five cinematic first-page animation hooks", () => {
  for (const hook of [
    "ambient-sweep",
    "headline-sheen",
    "checklist-cascade",
    "cta-energy",
    "dashboard-float-scan",
  ]) {
    assert.match(heroSource, new RegExp(`data-cinematic-animation="${hook}"`));
  }
});

test("home hero keeps reduced-motion guards for cinematic animations", () => {
  assert.match(heroSource, /useReducedMotion/);
  assert.match(heroSource, /prefers-reduced-motion: reduce/);
  assert.match(heroSource, /landing-hero__ctaShine/);
  assert.match(heroSource, /hero-dashboard-static-preview__scan/);
});
