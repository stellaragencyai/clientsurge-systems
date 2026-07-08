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
  tokenContract: "base44/functions/_shared/setupLinkToken.ts",
  saveEntry: "base44/functions/saveClientCredentials/entry.ts",
  saveMain: "base44/functions/saveClientCredentials/main.ts",
  authEntry: "base44/functions/saveSetupAuthorization/entry.ts",
  checkAuthEntry: "base44/functions/checkSetupAuthorization/entry.ts",
  orderStatusEntry: "base44/functions/getOrderStatus/entry.ts",
  orderStatusMain: "base44/functions/getOrderStatus/main.ts",
  draftEntry: "base44/functions/saveClientCredentialsDraft/entry.ts",
  draftMain: "base44/functions/saveClientCredentialsDraft/main.ts",
  signedLinkEntry: "base44/functions/createSignedSetupLink/entry.ts",
  repairEntry: "base44/functions/repairBrokenFlow/entry.ts",
  brokenFlowsEntry: "base44/functions/getBrokenFlows/entry.ts",
  driftEntry: "base44/functions/getPublishDrift/entry.ts",
  wizard: "src/components/onboarding/CredentialsWizardHardened.jsx",
  setupAuthorizationStep: "src/components/onboarding/SetupAuthorizationStep.jsx",
  setupPage: "src/internal-pages/CredentialsSetup.jsx",
  brokenFlowsPage: "src/pages/admin/BrokenFlows.jsx",
  driftPage: "src/pages/admin/PublishDrift.jsx",
  versionBeacon: "src/components/system/BuildVersionBeacon.jsx",
  routeFallback: "src/lib/PageNotFound.jsx",
  confirmationEmailEntry: "base44/functions/sendOrderConfirmationEmail/entry.ts",
};

for (const [key, file] of Object.entries(files)) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing ${key}: ${file}`);
}

assertContains(files.contract, "REQUIRED_SETUP_FIELDS_BY_TIER", "shared payload contract missing required field map");
assertContains(files.contract, "normalizeInstallConfiguration", "shared payload contract missing normalizer");
assertContains(files.contract, "validateInstallConfiguration", "shared payload contract missing validator");
assertContains(files.contract, "lead_notification_email", "contract must require lead notification email");
assertContains(files.tokenContract, "signSetupLinkToken", "signed setup token helper missing signer");
assertContains(files.tokenContract, "validateSetupLinkToken", "signed setup token helper missing validator");
assertContains(files.tokenContract, "buildSignedSetupUrl", "signed setup token helper missing setup URL builder");

assertContains(files.saveEntry, "normalizeInstallConfiguration", "save function must use shared normalizer");
assertContains(files.saveEntry, "validateInstallConfiguration", "save function must use shared validator");
assertContains(files.saveEntry, "validateSetupLinkToken", "save function must validate signed setup tokens");
assertContains(files.saveEntry, "ensureInstallationOS", "save function must auto-create/update ClientInstallationOS");
assertContains(files.saveEntry, "ClientInstallationOS.create", "save function must create missing ClientInstallationOS");
assertContains(files.saveEntry, "AuditLog.create", "save function must write credentials submission audit log");
assertContains(files.saveEntry, "setup_link_email_mismatch", "save function must enforce setup-link email ownership");
assertContains(files.saveEntry, "setup_auth_required", "save function must block anonymous unsigned writes");
assertContains(files.saveEntry, "ready_to_activate", "save function must return readiness without blocking submission");
assertContains(files.saveEntry, "request_id", "save function must return request IDs");
assertContains(files.saveEntry, "credentials_draft: null", "save function must clear server draft after submit");
assertContains(files.saveEntry, "website_building", "save function must not use invalid credentials_complete workflow stage");
assertContains(files.saveMain, "validateSetupLinkToken", "main save function must mirror signed token validation");
assertContains(files.saveMain, "ClientInstallationOS.create", "main save function must create missing ClientInstallationOS");

assertContains(files.authEntry, "validateSetupLinkToken", "setup authorization save must validate signed tokens");
assertContains(files.authEntry, "request_id", "setup authorization save must return request IDs");
assertContains(files.checkAuthEntry, "validateSetupLinkToken", "setup authorization check must validate signed tokens");

assertContains(files.orderStatusEntry, "validateSetupLinkToken", "order status must validate signed setup tokens");
assertContains(files.orderStatusEntry, "setup_token_valid", "order status must return token validity metadata");
assertContains(files.orderStatusEntry, "credentials_draft", "order status must expose saved credential drafts");
assertContains(files.orderStatusMain, "setup_token_valid", "main order status must return token validity metadata");

assertContains(files.draftEntry, "validateSetupLinkToken", "draft function must validate signed setup tokens");
assertContains(files.draftEntry, "credentials_draft", "draft function must store server-side credentials draft");
assertContains(files.draftEntry, "setup_auth_required", "draft function must block anonymous unsigned writes");
assertContains(files.draftMain, "validateSetupLinkToken", "main draft function must validate signed setup tokens");

assertContains(files.signedLinkEntry, "buildSignedSetupUrl", "admin signed setup link generator must build signed URLs");
assertContains(files.confirmationEmailEntry, "buildSignedSetupUrl", "order confirmation email must use signed setup URL");

assertContains(files.wizard, "setupToken", "hardened wizard must accept setupToken prop");
assertContains(files.wizard, "effectiveSetupToken", "hardened wizard must pass effective setup token");
assertContains(files.wizard, "saveClientCredentialsDraft", "wizard must save server-side drafts");
assertContains(files.wizard, "fieldErrors", "wizard must display field-level errors");
assertContains(files.wizard, "requestId", "wizard must display request ID context");
assertContains(files.wizard, "saveClientCredentials", "wizard must submit credentials");
assertContains(files.setupAuthorizationStep, "setupToken", "authorization step must pass setup tokens");
assertContains(files.setupPage, "setupToken", "setup page must parse/pass signed setup token");

assertContains(files.repairEntry, "repairBrokenFlow", "repair function must exist");
assertContains(files.repairEntry, "create_install_os", "repair function must create install OS");
assertContains(files.repairEntry, "mark_draft_abandoned", "repair function must abandon stale draft");
assertContains(files.brokenFlowsEntry, "missing-install-os", "broken flows must detect missing ClientInstallationOS");
assertContains(files.brokenFlowsEntry, "missing-credentials", "broken flows must detect missing credentials");
assertContains(files.brokenFlowsPage, "repairBrokenFlow", "broken flows page must call repair function");
assertContains(files.driftEntry, "getPublishDrift", "publish drift function missing marker");
assertContains(files.driftPage, "Publish Drift", "publish drift admin page missing title");
assertContains(files.versionBeacon, "VITE_GIT_COMMIT", "version beacon must expose git commit env");
assertContains(files.routeFallback, "admin/broken-flows", "admin broken flows route fallback missing");
assertContains(files.routeFallback, "admin/publish-drift", "admin publish drift route fallback missing");

if (failures.length > 0) {
  console.error("Setup pipeline smoke failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Setup pipeline smoke passed: signed setup links, credentials, install OS, repair, drift, and portal guardrails are present.");
