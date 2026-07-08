import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { collectArea10MobileA11yAudit } from "../scripts/audit-area10-mobile-a11y.mjs";

const main = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const mobileCallBar = readFileSync(new URL("../src/components/landing/MobileCallBar.jsx", import.meta.url), "utf8");
const areaCss = readFileSync(new URL("../src/area10-mobile-a11y.css", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const report = collectArea10MobileA11yAudit();

test("Area 10 imports mobile accessibility guardrail CSS", () => {
  assert.match(main, /@\/area10-mobile-a11y\.css/);
  assert.match(areaCss, /\.cs-mobile-action/);
});

test("Area 10 fatal load screen is accessible and mobile-safe", () => {
  assert.match(main, /role', 'alert'/);
  assert.match(main, /aria-live', 'assertive'/);
  assert.match(main, /Application failed to load/);
  assert.match(main, /100svh/);
  assert.match(main, /env\(safe-area-inset-bottom/);
  assert.match(main, /Refresh Page/);
  assert.match(main, /Go Home/);
});

test("Area 10 mobile call bar has clear navigation and dialog semantics", () => {
  assert.match(mobileCallBar, /<nav/);
  assert.match(mobileCallBar, /aria-label="Mobile contact and system actions"/);
  assert.match(mobileCallBar, /aria-label=\{`Call ClientSurge Systems at \$\{phoneLabel\}`\}/);
  assert.match(mobileCallBar, /type="button"/);
  assert.match(mobileCallBar, /aria-haspopup="dialog"/);
  assert.match(mobileCallBar, /aria-expanded=\{showModal \? "true" : "false"\}/);
  assert.match(mobileCallBar, /aria-hidden="true"/);
});

test("Area 10 CSS enforces mobile tap targets safe area and reduced motion", () => {
  assert.match(areaCss, /min-height: 44px/);
  assert.match(areaCss, /min-width: 44px/);
  assert.match(areaCss, /env\(safe-area-inset-left/);
  assert.match(areaCss, /env\(safe-area-inset-right/);
  assert.match(areaCss, /prefers-reduced-motion: reduce/);
  assert.match(areaCss, /animation: none !important/);
  assert.match(areaCss, /transition: none !important/);
});

test("Area 10 preserves mobile performance browser hints", () => {
  assert.match(indexHtml, /viewport-fit=cover/);
  assert.match(indexHtml, /preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin/);
  assert.match(indexHtml, /media="print" onload="this\.media='all'"/);
});

test("Area 10 audit reports no findings", () => {
  assert.deepEqual(report.findings, []);
});
