import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const launchPage = readFileSync(
  new URL("../src/components/landing/LaunchWaitlistPage.jsx", import.meta.url),
  "utf8",
);
const homePage = readFileSync(
  new URL("../src/pages/Home.jsx", import.meta.url),
  "utf8",
);
const launchStyles = readFileSync(
  new URL("../src/styles/launch-waitlist.css", import.meta.url),
  "utf8",
);
const cookieConsent = readFileSync(
  new URL("../src/components/landing/CookieConsent.jsx", import.meta.url),
  "utf8",
);

test("homepage renders the September 1 launch waitlist experience", () => {
  assert.match(homePage, /LaunchWaitlistPage/);
  assert.match(homePage, /September 1, 2026/);
  assert.doesNotMatch(homePage, /HomeHero/);
});

test("launch waitlist countdown is pinned to the September 1, 2026 Arizona launch date", () => {
  assert.match(launchPage, /2026-09-01T00:00:00-07:00/);
  assert.match(launchPage, /Launching September 1, 2026/);
  assert.match(launchPage, /Countdown to September 1, 2026/);
});

test("launch waitlist captures email-only leads through the hardened Base44 intake", () => {
  assert.match(launchPage, /base44\.functions\.invoke\("captureValidatedWebsiteLead"/);
  assert.match(launchPage, /requested_channels:\s*\["email"\]/);
  assert.match(launchPage, /consent_source:\s*"launch_waitlist_email_form"/);
  assert.match(launchPage, /Founding \{FOUNDING_LIMIT\.toLocaleString\(\)\}/);
  assert.match(launchPage, /50% off for life/);
  assert.match(launchPage, /No setup fee/);
});

test("launch waitlist styles support reduced motion and responsive countdown tiles", () => {
  assert.match(launchStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(launchStyles, /cs-launch-count-grid/);
  assert.match(launchStyles, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});

test("launch waitlist suppresses the cookie banner so email capture is not obscured", () => {
  assert.match(cookieConsent, /isLaunchWaitlistPage/);
  assert.match(cookieConsent, /querySelector\('\.cs-launch-page'\)/);
});
