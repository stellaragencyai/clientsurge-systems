import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const verifierSource = read("base44/functions/verifyGA4Configuration/main.ts");
const compatibilityVerifierSource = read("base44/functions/configureGA4Analytics/entry.ts");
const setupFunctionSource = read("base44/functions/setupGA4Configuration/main.ts");
const getAdminSettingsSource = read("base44/functions/getAdminSettings/main.ts");
const adminApiSource = read("src/lib/adminSettingsApi.js");
const adminPanelSource = read("src/components/admin/AdminSettingsPanel.jsx");
const publishWorkflowSource = read(".github/workflows/base44-auto-publish.yml");
const deployAdjacentEntitySources = [
  "base44/entities/AutoOptimizationRule.jsonc",
  "base44/entities/ConversionTrackingEvent.jsonc",
  "base44/entities/GrowthOptimizationSignal.jsonc",
  "base44/entities/LandingPageAnalytics.jsonc",
  "base44/entities/OptimizationAction.jsonc",
].map((path) => [path, read(path)]);
const entitySources = readdirSync(new URL("../base44/entities", import.meta.url))
  .filter((fileName) => /\.(json|jsonc)$/i.test(fileName))
  .map((fileName) => [`base44/entities/${fileName}`, read(`base44/entities/${fileName}`)]);

test("GA4 verifier gates active status behind every required live check", () => {
  for (const checkName of [
    "entity_integrity",
    "secret_available",
    "measurement_protocol_debug",
    "measurement_protocol_delivery",
    "production_site",
    "static_code_assertions",
    "final_status_update",
  ]) {
    assert.match(verifierSource, new RegExp(checkName));
  }

  assert.match(verifierSource, /debug\/mp\/collect/);
  assert.match(verifierSource, /mp\/collect/);
  assert.match(verifierSource, /ga4_verification/);
  assert.match(verifierSource, /source:\s*"clientsurge_admin_verifier"/);
  assert.match(verifierSource, /validation_error_count/);
  assert.match(verifierSource, /setup_status:\s*"active"/);
  assert.match(verifierSource, /server_side_tracking_enabled:\s*true/);
  assert.match(verifierSource, /last_verified_at:\s*verifiedAt/);
  assert.match(verifierSource, /setup_status:\s*"configured"/);
  assert.match(verifierSource, /server_side_tracking_enabled:\s*false/);
  assert.match(verifierSource, /last_verified_at:\s*null/);
});

test("legacy GA4 function slot remains a deployable verification fallback", () => {
  for (const checkName of [
    "entity_integrity",
    "secret_available",
    "measurement_protocol_debug",
    "measurement_protocol_delivery",
    "production_site",
    "final_status_update",
  ]) {
    assert.match(compatibilityVerifierSource, new RegExp(checkName));
  }

  assert.match(compatibilityVerifierSource, /createClientFromRequest/);
  assert.match(compatibilityVerifierSource, /debug\/mp\/collect/);
  assert.match(compatibilityVerifierSource, /mp\/collect/);
  assert.match(compatibilityVerifierSource, /base44_configureGA4Analytics/);
  assert.match(compatibilityVerifierSource, /setup_status:\s*"active"/);
  assert.match(compatibilityVerifierSource, /server_side_tracking_enabled:\s*true/);
  assert.match(compatibilityVerifierSource, /last_verified_at:\s*verifiedAt/);
  assert.match(compatibilityVerifierSource, /setup_status:\s*"configured"/);
  assert.match(compatibilityVerifierSource, /server_side_tracking_enabled:\s*false/);
  assert.match(compatibilityVerifierSource, /last_verified_at:\s*null/);
});

test("Analytics tab exposes the full repair and verification workflow", () => {
  for (const label of [
    "Repairing configuration",
    "Validating secret availability",
    "Validating with Google",
    "Sending verification event",
    "Checking production site",
    "Finalizing",
    "GA4 fully verified",
    "Repair and verify GA4",
    "Verification ID",
    "MP validation",
    "MP delivery",
    "Production site",
  ]) {
    assert.match(adminPanelSource, new RegExp(label));
  }

  assert.match(adminApiSource, /repairGa4Configuration/);
  assert.match(adminApiSource, /runGa4FinalVerification/);
  assert.match(adminApiSource, /verifyGA4Configuration/);
  assert.match(adminApiSource, /configureGA4Analytics/);
  assert.match(adminApiSource, /mode:\s*"verify"/);
  assert.match(adminApiSource, /canonical_tracked_events/);
  assert.match(adminApiSource, /measurement_protocol_delivery_status/);
  assert.doesNotMatch(adminApiSource, /asServiceRole/);
});

test("Base44 auto-publish includes frontend and backend GA4 surfaces", () => {
  assert.match(publishWorkflowSource, /base44\/entities\/\*\*/);
  assert.match(publishWorkflowSource, /base44\/functions\/\*\*/);
  assert.match(publishWorkflowSource, /src\/\*\*/);
  assert.match(publishWorkflowSource, /index\.html/);
  assert.match(publishWorkflowSource, /BASE44_AUTH_JSON/);
  assert.match(publishWorkflowSource, /BASE_44_AUTH_JSON/);
});

test("existing deployed GA4 admin slots are self-contained for Base44 individual deploys", () => {
  for (const [path, source] of [
    ["base44/functions/setupGA4Configuration/main.ts", setupFunctionSource],
    ["base44/functions/getAdminSettings/main.ts", getAdminSettingsSource],
  ]) {
    assert.doesNotMatch(source, /from\s+["']\.\.\/_shared\//, `${path} must not depend on parent shared imports`);
  }

  assert.match(setupFunctionSource, /repairCanonicalGa4Configuration/);
  assert.match(getAdminSettingsSource, /summarizeGa4Records/);
});

test("GA4 deploy-adjacent entity RLS uses Base44-compatible role checks", () => {
  for (const [path, source] of deployAdjacentEntitySources) {
    assert.doesNotMatch(source, /"role"\s*:\s*\[/, `${path} must not use role arrays`);
    assert.doesNotThrow(() => JSON.parse(source), `${path} must remain valid JSON`);
  }
});

test("entity schemas avoid Base44-incompatible JSON Schema union types", () => {
  for (const [path, source] of entitySources) {
    assert.doesNotMatch(source, /"type"\s*:\s*\[/, `${path} must not use type arrays`);
  }
});
