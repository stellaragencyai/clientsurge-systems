import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const heroSource = readFileSync("src/components/landing/Hero.jsx", "utf8");

test("home hero does not mount the expensive dashboard before user intent", () => {
  assert.match(heroSource, /function DeferredHeroDashboard/);
  assert.match(heroSource, /HeroDashboardStaticPreview/);
  assert.match(heroSource, /onPointerEnter=\{onActivate\}/);
  assert.match(heroSource, /if \(!isInteractive\)/);
});

test("home hero keeps the heavy dashboard behind a lazy suspense boundary", () => {
  assert.match(heroSource, /lazy\(\(\) => import\("\.\/HeroDashboardScreen"\)\)/);
  assert.match(heroSource, /<Suspense fallback=\{<HeroDashboardStaticPreview/);
  assert.match(heroSource, /<HeroDashboardScreen \/>/);
});
