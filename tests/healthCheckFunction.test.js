import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const healthCheck = readFileSync("base44/functions/healthCheck/entry.ts", "utf8");

test("healthCheck exposes a public no-auth monitoring endpoint", () => {
  assert.match(healthCheck, /Deno\.serve\(async \(_req\) =>/);
  assert.doesNotMatch(healthCheck, /createClientFromRequest/);
  assert.doesNotMatch(healthCheck, /requireAuthenticatedUser/);
  assert.doesNotMatch(healthCheck, /requireAdminUser/);
});

test("healthCheck returns the required ok timestamp version payload", () => {
  assert.match(healthCheck, /status:\s*"ok"/);
  assert.match(healthCheck, /timestamp:\s*new Date\(\)\.toISOString\(\)/);
  assert.match(healthCheck, /version:\s*"1\.0\.0"/);
  assert.match(healthCheck, /\},\s*\{\s*status:\s*200\s*\}/);
});
