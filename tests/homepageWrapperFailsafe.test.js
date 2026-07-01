import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const wrapperSource = readFileSync(
  new URL("../cloudflare/clientsurge-homepage-repair-wrapper.mjs", import.meta.url),
  "utf8",
);

test("legacy homepage wrapper delegates to full route exposure sanitizer", () => {
  assert.match(wrapperSource, /clientsurge-security-edge-wrapper\.mjs/);
  assert.doesNotMatch(wrapperSource, /isHomepageRequest/);
  assert.doesNotMatch(wrapperSource, /cleanHomepageResponse/);
});
