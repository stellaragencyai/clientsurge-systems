import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../src/pages/Home.jsx", import.meta.url), "utf8");

test("cookie consent is mounted once at the public app shell", () => {
  assert.match(appSource, /import CookieConsent from "@\/components\/landing\/CookieConsent"/);
  assert.match(appSource, /function PublicCookieConsent\(\)/);
  assert.match(appSource, /isPublicPath\(location\.pathname\) \? <CookieConsent \/> : null/);
  assert.match(appSource, /<PublicCookieConsent \/>/);
});

test("homepage no longer owns the cookie consent singleton", () => {
  assert.doesNotMatch(homeSource, /CookieConsent/);
});
