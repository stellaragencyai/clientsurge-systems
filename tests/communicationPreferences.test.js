import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dashboard = readFileSync("src/pages/ClientSaasDashboard.jsx", "utf8");
const preferences = readFileSync("src/components/saas-portal/SaasCommunicationPreferences.jsx", "utf8");
const getFn = readFileSync("base44/functions/getCommunicationPreferences/main.ts", "utf8");
const updateFn = readFileSync("base44/functions/updateCommunicationPreferences/main.ts", "utf8");
const currentSchema = readFileSync("base44/entities/CommunicationPreference.json", "utf8");
const historySchema = readFileSync("base44/entities/CommunicationPreferenceHistory.json", "utf8");

const currentEntity = JSON.parse(currentSchema);
const historyEntity = JSON.parse(historySchema);

test("client dashboard exposes a communication preferences section", () => {
  assert.match(dashboard, /SaasCommunicationPreferences/);
  assert.match(dashboard, /id:\s*['"]preferences['"]/);
  assert.match(dashboard, /label:\s*['"]Preferences['"]/);
});

test("preferences UI uses secure backend functions rather than direct entity writes", () => {
  assert.match(preferences, /getCommunicationPreferences/);
  assert.match(preferences, /updateCommunicationPreferences/);
  assert.doesNotMatch(preferences, /entities\.CommunicationPreference\.(create|update|filter)/);
});

test("preference UI keeps operational and marketing consent separate", () => {
  assert.match(preferences, /sms_enabled/);
  assert.match(preferences, /email_enabled/);
  assert.match(preferences, /marketing_enabled/);
  assert.match(preferences, /Consent-first communication/);
  assert.match(preferences, /SMS consent is optional/);
});

test("secure read and write functions require authenticated users", () => {
  assert.match(getFn, /base44\.auth\.me\(\)/);
  assert.match(updateFn, /base44\.auth\.me\(\)/);
  assert.match(getFn, /Authentication required/);
  assert.match(updateFn, /Authentication required/);
});

test("writes create a preference history record and internal audit event", () => {
  assert.match(updateFn, /CommunicationPreferenceHistory\.create/);
  assert.match(updateFn, /CommunicationEvent\.create/);
  assert.match(updateFn, /communication_preferences_updated/);
  assert.match(updateFn, /changed_fields/);
});

test("entity schemas include required preference and audit fields", () => {
  const currentFields = currentEntity.properties;
  for (const field of [
    "client_id",
    "user_email",
    "sms_enabled",
    "email_enabled",
    "marketing_enabled",
    "appointment_updates",
    "service_updates",
    "support_updates",
    "consent_source",
    "consent_version",
    "preference_updated_at",
    "sms_opt_out_at",
  ]) assert.ok(currentFields[field], `missing current preference field: ${field}`);

  const historyFields = historyEntity.properties;
  for (const field of [
    "client_id",
    "user_email",
    "source",
    "previous_preferences_json",
    "current_preferences_json",
    "changed_fields",
    "changed_at",
    "request_id",
  ]) assert.ok(historyFields[field], `missing history field: ${field}`);
});
