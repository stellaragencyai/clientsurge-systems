import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const cookieConsent = readFileSync("src/components/landing/CookieConsent.jsx", "utf8");
const navbar = readFileSync("src/components/landing/Navbar.jsx", "utf8");
const industryHero = readFileSync("src/components/industry/IndustryHero.jsx", "utf8");
const heroSection = readFileSync("src/components/landing/HeroSection.jsx", "utf8");

test("cookie consent stays compact on mobile first viewport", () => {
  assert.match(cookieConsent, /left-3 right-3/);
  assert.match(cookieConsent, /sm:right-auto/);
  assert.match(cookieConsent, /max-w-\[300px\]/);
  assert.match(cookieConsent, /"max\(12px, calc\(12px \+ env\(safe-area-inset-bottom, 0px\)\)\)"/);
  assert.doesNotMatch(cookieConsent, /Cookie categories/);
  assert.doesNotMatch(cookieConsent, /hidden sm:block/);
  assert.doesNotMatch(cookieConsent, /fixed left-6 z-50 max-w-sm/);
});

test("high priority images avoid React fetchPriority console warning", () => {
  const combined = [navbar, industryHero, heroSection].join("\n");

  assert.doesNotMatch(combined, /fetchpriority=/);
  assert.doesNotMatch(combined, /fetchPriority=/);
});
