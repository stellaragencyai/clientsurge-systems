import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const schemaSource = read("base44/entities/GA4Configuration.jsonc");
const schema = JSON.parse(schemaSource);
const setupSource = read("base44/functions/setupGA4Configuration/main.ts");
const sharedSource = read("base44/functions/_shared/ga4Configuration.js");

const CANONICAL_TRACKED_EVENTS = [
  "page_view",
  "scroll",
  "scroll_depth",
  "cta_click",
  "pricing_view",
  "link_click",
  "form_submit_attempt",
  "form_submit",
  "generate_lead",
  "contact_form_submit",
  "audit_request_started",
  "audit_request_submitted",
  "begin_checkout",
  "purchase",
  "purchase_client_confirmation",
  "demo_booked",
  "onboarding_complete",
];

const CANONICAL_KEY_EVENTS = ["generate_lead", "begin_checkout", "purchase", "demo_booked"];

test("GA4Configuration schema contains no API-secret field and defaults to the canonical catalog", () => {
  assert.doesNotMatch(schemaSource, /"api_secret"\s*:/);
  assert.match(schemaSource, /"server_side_tracking_enabled"\s*:/);
  assert.deepEqual(schema.properties.tracked_events.default, CANONICAL_TRACKED_EVENTS);
  assert.deepEqual(schema.properties.conversion_events.default, CANONICAL_KEY_EVENTS);
});

test("setup rejects secrets and destroys every duplicate or legacy record", () => {
  assert.match(setupSource, /payloadContainsApiSecret\(body\)/);
  assert.match(setupSource, /GA4_SECRET_MUST_USE_SECRET_STORE/);
  assert.match(sharedSource, /payloadContainsApiSecret/);
  assert.match(sharedSource, /listGa4ConfigurationRecords/);
  assert.match(sharedSource, /recordsToDelete/);
  assert.match(sharedSource, /entity\.delete\(record\.id\)/);
  assert.match(sharedSource, /GA4_LEGACY_SECRET_SCRUB_INCOMPLETE/);
  assert.match(sharedSource, /record_count:\s*remaining\.length/);
  assert.match(sharedSource, /remaining\.length !== 1/);
});

test("migration leaves one configured record until operational verification passes", () => {
  assert.match(sharedSource, /setup_status:\s*setupStatus/);
  assert.match(sharedSource, /server_side_tracking_enabled:\s*false/);
  assert.match(sharedSource, /last_verified_at:\s*null/);
  assert.match(sharedSource, /setup_status !== "configured"/);
  assert.match(sharedSource, /server_side_tracking_enabled === true/);
});
