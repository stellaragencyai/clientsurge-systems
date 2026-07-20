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
const helperSource = readFileSync(
  new URL("../base44/functions/_shared/ga4Configuration.ts", import.meta.url),
  "utf8",
);

test("GA4Configuration schema contains no API-secret field", () => {
  assert.doesNotMatch(schemaSource, /"api_secret"\s*:/);
  assert.match(schemaSource, /"server_side_tracking_enabled"\s*:/);
});

test("setup rejects secrets and destroys legacy secret-bearing records", () => {
  assert.match(setupSource, /GA4_SECRET_MUST_USE_SECRET_STORE/);
  assert.match(helperSource, /legacySecretDetected = existing\.some\(containsLegacySecret\)/);
  assert.match(helperSource, /duplicateRecordsDetected = existing\.length > 1/);
  assert.match(helperSource, /GA4Configuration\.create\(payload\)/);
  assert.match(helperSource, /GA4Configuration\.delete\(record\.id\)/);
  assert.match(helperSource, /GA4_RECORD_DELETE_INCOMPLETE/);
  assert.match(helperSource, /legacy_secret_scrubbed:/);
  assert.match(helperSource, /duplicate_records_removed:/);
});

test("migration never claims active or verified status without runtime proof", () => {
  assert.match(helperSource, /setup_status:\s*"configured"/);
  assert.match(helperSource, /server_side_tracking_enabled:\s*false/);
  assert.match(helperSource, /last_verified_at:\s*null/);
});
