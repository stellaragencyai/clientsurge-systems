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

test("production app params ignore mutable runtime config overrides on the live domain", () => {
  assert.match(source, /const PRODUCTION_HOSTNAMES = new Set\(\["clientsurgesystems.com", "www.clientsurgesystems.com"\]\);/);
  assert.match(source, /const LOCKED_PRODUCTION_CONFIG_PARAMS = new Set\(\["app_id", "functions_version", "app_base_url"\]\);/);
  assert.match(source, /isLockedProductionRuntime\(\) && LOCKED_PRODUCTION_CONFIG_PARAMS\.has\(paramName\)/);
  assert.match(source, /allowUrlOverride: false/);
  assert.match(source, /allowStorageOverride: false/);
});

test("production access tokens remain transient callback values", () => {
  assert.match(source, /tokenOptions = lockedProductionRuntime/);
  assert.match(source, /removeFromUrl: true/);
  assert.match(source, /persistUrlValue: false/);
  assert.match(source, /persistDefaultValue: false/);
});
