import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schemaSource = readFileSync(
  new URL("../base44/entities/GA4Configuration.jsonc", import.meta.url),
  "utf8",
);
const setupSource = readFileSync(
  new URL("../base44/functions/setupGA4Configuration/entry.ts", import.meta.url),
  "utf8",
);

test("GA4Configuration schema contains no API-secret field", () => {
  assert.doesNotMatch(schemaSource, /"api_secret"\s*:/);
  assert.match(schemaSource, /"server_side_tracking_enabled"\s*:/);
});

test("setup rejects secrets and destroys legacy secret-bearing records", () => {
  assert.match(setupSource, /GA4_SECRET_MUST_USE_SECRET_STORE/);
  assert.match(setupSource, /legacySecretDetected = existing\.some\(containsLegacySecret\)/);
  assert.match(setupSource, /GA4Configuration\.create\(payload\)/);
  assert.match(setupSource, /GA4Configuration\.delete\(record\.id\)/);
  assert.match(setupSource, /GA4_LEGACY_SECRET_SCRUB_INCOMPLETE/);
  assert.match(setupSource, /legacy_secret_scrubbed:/);
});

test("migration never claims active or verified status without runtime proof", () => {
  assert.match(setupSource, /setup_status:\s*"configured"/);
  assert.match(setupSource, /server_side_tracking_enabled:\s*false/);
  assert.doesNotMatch(setupSource, /last_verified_at\s*:/);
});
