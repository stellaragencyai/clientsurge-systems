import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/lib/app-params.js", import.meta.url), "utf8");

test("app params reject null-like values before writing or using runtime app id", () => {
  assert.match(source, /const PRODUCTION_APP_ID = "69dc4a79656fdba136d413d3";/);
  assert.match(source, /const NULL_LIKE_VALUES = new Set\(\["", "null", "undefined"\]\);/);
  assert.match(source, /const normalizeParamValue = \(value\) =>/);
  assert.match(source, /const searchParam = normalizeParamValue\(urlParams\.get\(paramName\)\);/);
  assert.match(source, /const storedValue = normalizeParamValue\(readStorage\(storageKey\)\);/);
});

test("app params keep a production fallback when hosted build env is missing", () => {
  assert.match(
    source,
    /defaultValue: import\.meta\.env\.VITE_BASE44_APP_ID \|\| PRODUCTION_APP_ID/
  );
  assert.match(
    source,
    /defaultValue: import\.meta\.env\.VITE_BASE44_APP_BASE_URL \|\| PRODUCTION_APP_BASE_URL/
  );
});
