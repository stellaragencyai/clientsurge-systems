import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schemaSource = readFileSync(
  new URL("../base44/entities/GA4Configuration.jsonc", import.meta.url),
  "utf8",
);
const setupSource = readFileSync(
  new URL("../base44/functions/setupGA4Configuration/main.ts", import.meta.url),
  "utf8",
);

test("GA4Configuration schema contains no API-secret field", () => {
  assert.doesNotMatch(schemaSource, /"api_secret"\s*:/);
  assert.match(schemaSource, /"server_side_tracking_enabled"\s*:/);
});

test("setup rejects secrets and destroys legacy secret-bearing records", () => {
  assert.match(setupSource, /GA4_SECRET_MUST_USE_SECRET_STORE/);
  assert.match(setupSource, /legacySecretDetected = existing\.some\(containsLegacySecret\)/);
  assert.match(setupSource, /duplicateRecordsDetected = existing\.length > 1/);
  assert.match(setupSource, /queryAllGa4Records/);
  assert.match(setupSource, /GA4Configuration\.create\(payload\)/);
  assert.match(setupSource, /GA4Configuration\.delete\(record\.id\)/);
  assert.match(setupSource, /GA4_RECORD_DELETE_INCOMPLETE/);
  assert.match(setupSource, /legacy_secret_scrubbed:/);
  assert.match(setupSource, /duplicate_records_removed:/);
});

test("setup verifies Google and production before activating", () => {
  assert.match(setupSource, /DEBUG_ENDPOINT/);
  assert.match(setupSource, /COLLECT_ENDPOINT/);
  assert.match(setupSource, /fetchProductionHealth/);
  assert.match(setupSource, /stage:\s*"final_activation"/);
  assert.match(setupSource, /setup_status:\s*"active"/);
  assert.match(setupSource, /server_side_tracking_enabled:\s*true/);
  assert.match(setupSource, /last_verified_at:\s*verifiedAt/);
});

test("setup never claims active status when required verification fails", () => {
  assert.match(setupSource, /failureBody\("secret_validation",\s*"GA4_API_SECRET missing"/);
  assert.match(setupSource, /failureBody\("google_validation",\s*"Google Measurement Protocol validation failed"/);
  assert.match(setupSource, /failureBody\("production_security",\s*"Production domain health check failed"/);
  assert.match(setupSource, /markConfigurationFailed/);
  assert.match(setupSource, /setup_status:\s*"configured"/);
  assert.match(setupSource, /server_side_tracking_enabled:\s*false/);
  assert.match(setupSource, /last_verified_at:\s*null/);
});
