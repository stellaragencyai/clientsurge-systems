import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const heroSource = readFileSync("src/components/landing/Hero.jsx", "utf8");

test("home hero exposes the cinematic hooks needed for the simplified title and iPad hero", () => {
  for (const hook of [
    "ambient-sweep",
    "headline-sheen",
    "dashboard-float-scan",
  ]) {
    assert.match(heroSource, new RegExp(`data-cinematic-animation="${hook}"`));
  }
  assert.doesNotMatch(heroSource, /checklist-cascade/);
  assert.doesNotMatch(heroSource, /cta-energy/);
});

test("home hero keeps reduced-motion guards for cinematic animations", () => {
  assert.match(heroSource, /useReducedMotion/);
  assert.match(heroSource, /prefers-reduced-motion: reduce/);
  assert.match(heroSource, /hero-dashboard-static-preview__scan/);
});
