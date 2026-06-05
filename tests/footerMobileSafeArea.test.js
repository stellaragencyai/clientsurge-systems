import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const footer = readFileSync(new URL("../src/components/landing/Footer.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");

test("footer and root keep mobile content above the home indicator", () => {
  assert.match(footer, /padding-bottom: env\(safe-area-inset-bottom, 0px\);/);
  assert.match(footer, /padding: 34px 0 max\(24px, calc\(24px \+ env\(safe-area-inset-bottom, 0px\)\)\);/);
  assert.match(css, /padding-bottom: max\(80px, calc\(80px \+ env\(safe-area-inset-bottom, 0px\)\)\)/);
});

test("footer exposes explicit keyboard focus states", () => {
  assert.match(footer, /\.cs-footer a:focus-visible,\s*\.cs-footer button:focus-visible/);
  assert.match(footer, /outline: 2px solid #00AEEF;/);
  assert.match(footer, /box-shadow: 0 0 0 4px rgba\(0, 174, 239, 0\.18\);/);
});
