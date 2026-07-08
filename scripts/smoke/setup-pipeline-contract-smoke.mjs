import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];

function assertContains(file, pattern, label) {
  const text = read(file);
  const ok = typeof pattern === "string" ? text.includes(pattern) : pattern.test(text);
  if (!ok) failures.push(`${label}: ${file}`);
}

const files = {
  contract: "base44/functions/_shared/setupPayloadContract.ts",
  saveEntry: "base44/functions/saveClientCredentials/entry.ts",
  saveMain: "base44/functions/saveClientCredentials/main.ts",
  orderStatusEntry: "base44/functions/getOrderStatus/entry.ts",
  orderStatusMain: "base44/functions/getOrderStatus/main.ts",
  draftEntry: "base44/functions/saveClientCredentialsDraft/entry.ts",
  draftMain: "base44/functions/saveClientCredentialsDraft/main.ts",
  brokenFlowsEntry: "base44/functions/getBrokenFlows/entry.ts",
  wizard: "src/components/onboarding/CredentialsWizardHardened.jsx",
  setupPage: "src/internal-pages/CredentialsSetup.jsx",
  brokenFlowsPage: "src/pages/admin/BrokenFlows.jsx",
  versionBeacon: "src/components/system/BuildVersionBeacon.jsx",
};

for (const [key, file] of Object.entries(files)) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing ${key}: ${file}`);
}

assertContains(files.contract, "REQUIRED_SETUP_FIELDS_BY_TIER", "shared payload contract missing required field map");
assertContains(files.contract, "normalizeInstallConfiguration", "shared payload contract missing normalizer");
assertContains(files.contract, "validateInstallConfiguration", "shared payload contract missing validator");
assertContains(files.contract, "lead_notification_email", "contract must require lead notification email");

assertContains(files.saveEntry, "normalizeInstallConfiguration", "save function must use shared normalizer");
assertContains(files.saveEntry, "validateInstallConfiguration", "save function must use shared validator");
assertContains(files.saveEntry, "ensureInstallationOS", "save function must auto-create/update ClientInstallationOS");
assertContains(files.saveEntry, "ClientInstallationOS.create", "save function must create missing ClientInstallationOS");
assertContains(files.saveEntry, "AuditLog.create", "save function must write credentials submission audit log");
assertContains(files.saveEntry, "setup_link_email_mismatch", "save function must enforce setup-link email ownership");
assertContains(files.saveEntry, "ready_to_activate", "save function must return readiness without blocking submission");
assertContains(files.saveEntry, "request_id", "save function must return request IDs");
assertContains(files.saveEntry, "credentials_draft: null", "save function must clear server draft after submit");
assertContains(files.saveEntry, "website_building", "save function must not use invalid credentials_complete workflow stage");

assertContains(files.saveMain, "normalizeInstallConfiguration", "main save function must mirror shared normalizer");
assertContains(files.saveMain, "ClientInstallationOS.create", "main save function must create missing ClientInstallationOS");

assertContains(files.orderStatusEntry, "setup_link_email_mismatch", "order status must enforce setup-link email ownership");
assertContains(files.orderStatusEntry, "credentials_draft", "order status must expose saved credential drafts");
assertContains(files.orderStatusMain, "credentials_draft", "main order status must expose saved credential drafts");

assertContains(files.draftEntry, "credentials_draft", "draft function must store server-side credentials draft");
assertContains(files.draftEntry, "setup_link_email_mismatch", "draft function must enforce setup-link email ownership");
assertContains(files.draftMain, "credentials_draft", "main draft function must store server-side credentials draft");

assertContains(files.wizard, "CredentialsWizardHardened", "hardened wizard component missing");
assertContains(files.wizard, "saveClientCredentialsDraft", "wizard must save server-side drafts");
assertContains(files.wizard, "fieldErrors", "wizard must display field-level errors");
assertContains(files.wizard, "requestId", "wizard must display request ID context");
assertContains(files.wizard, "saveClientCredentials", "wizard must submit credentials");
assertContains(files.setupPage, "CredentialsWizardHardened", "setup page must use hardened wizard");

assertContains(files.brokenFlowsEntry, "getBrokenFlows", "broken flows function missing marker");
assertContains(files.brokenFlowsEntry, "missing-install-os", "broken flows must detect missing ClientInstallationOS");
assertContains(files.brokenFlowsEntry, "missing-credentials", "broken flows must detect missing credentials");
assertContains(files.brokenFlowsPage, "Broken Flows", "broken flows admin page missing title");
assertContains(files.versionBeacon, "VITE_GIT_COMMIT", "version beacon must expose git commit env");

if (failures.length > 0) {
  console.error("Setup pipeline smoke failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Setup pipeline smoke passed: purchase → credentials → install OS → portal guardrails are present.");
