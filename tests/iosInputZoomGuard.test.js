import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexCss = readFileSync("src/index.css", "utf8");

test("mobile form controls keep 16px font size to prevent iOS zoom", () => {
  assert.match(indexCss, /Input zoom prevention on iOS/);
  assert.match(indexCss, /@media\s*\(max-width:\s*768px\)/);
  assert.match(indexCss, /input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="range"\]\):not\(\[type="color"\]\):not\(\[type="file"\]\)/);
  assert.match(indexCss, /textarea,\s*\n\s*select\s*\{\s*\n\s*font-size:\s*16px\s*!important;/);
});

