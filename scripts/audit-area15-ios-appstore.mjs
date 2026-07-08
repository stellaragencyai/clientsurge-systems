import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function read(path) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function readJson(path) {
  return JSON.parse(read(path));
}

function mustInclude(findings, source, needle, label) {
  if (!source.includes(needle)) findings.push(`missing:${label}`);
}

function mustEqual(findings, actual, expected, label) {
  if (actual !== expected) findings.push(`mismatch:${label}:${String(actual)}!=${String(expected)}`);
}

function mustTruthy(findings, value, label) {
  if (!value) findings.push(`missing:${label}`);
}

export function collectArea15IosAppStoreAudit() {
  const findings = [];
  const readiness = readJson("mobile/ios-app-store-readiness.json");
  const reviewNotes = read("docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md");
  const legalPage = read("src/internal-pages/LegalPage.jsx");
  const deletionForm = read("src/components/legal/DataDeletionRequestForm.jsx");
  const publicRoutes = read("src/lib/publicRouteMetadata.js");

  mustEqual(findings, readiness.platform, "ios", "ios_platform");
  mustEqual(findings, readiness.status, "pre_testflight_readiness", "readiness_status");
  mustEqual(findings, readiness.privacy_policy_url, "https://clientsurgesystems.com/privacy", "privacy_url");
  mustEqual(findings, readiness.account_deletion_url, "https://clientsurgesystems.com/privacy#account-deletion", "account_deletion_url");
  mustEqual(findings, readiness.testflight.requires_demo_account_or_demo_mode, true, "testflight_demo_account_or_demo_mode");
  mustEqual(findings, readiness.testflight.requires_live_backend_verification, true, "testflight_live_backend");
  mustEqual(findings, readiness.app_review_notes.backend_status_proof, "requires_area_12_release_artifact", "backend_release_proof");
  mustEqual(findings, readiness.privacy_label_candidate.data_used_to_track_user, false, "tracking_default_false");
  mustTruthy(findings, readiness.privacy_label_candidate.data_linked_to_user.includes("Email Address"), "privacy_label_email");
  mustTruthy(findings, readiness.privacy_label_candidate.data_linked_to_user.includes("Phone Number"), "privacy_label_phone");
  mustTruthy(findings, readiness.security_review.requires_no_hardcoded_provider_secrets, "no_hardcoded_secrets_gate");
  mustTruthy(findings, readiness.cross_platform_release_proof.base44_publish_proof_required, "base44_publish_proof_gate");
  mustTruthy(findings, readiness.cross_platform_release_proof.testflight_build_required, "testflight_build_gate");

  for (const needle of [
    "Apple App Review Guidelines",
    "Apple App Privacy Details",
    "Apple TestFlight",
    "Apple Account Deletion Support",
    "Demo account or demo mode is active",
    "Account/data deletion path works",
    "No unverified testimonials",
  ]) {
    mustInclude(findings, reviewNotes, needle, `review_notes:${needle}`);
  }

  mustInclude(findings, legalPage, "id: \"account-deletion\"", "privacy_account_deletion_section");
  mustInclude(findings, legalPage, "Account and Data Deletion", "privacy_account_deletion_heading");
  mustInclude(findings, legalPage, "id=\"data-deletion-request\"", "privacy_data_deletion_form_anchor");
  mustInclude(findings, legalPage, "Request deletion", "privacy_toc_deletion_link");

  mustInclude(findings, deletionForm, "Request Account or Data Deletion", "deletion_form_title");
  mustInclude(findings, deletionForm, "request_type: \"account_and_data_deletion\"", "deletion_form_request_type");
  mustInclude(findings, deletionForm, "account-deletion-email", "deletion_form_email_id");
  mustInclude(findings, deletionForm, "aria-labelledby=\"account-deletion-form-title\"", "deletion_form_aria_labelledby");

  mustInclude(findings, publicRoutes, '"/account-deletion": "/privacy#account-deletion"', "account_deletion_alias");
  mustInclude(findings, publicRoutes, '"/delete-account": "/privacy#account-deletion"', "delete_account_alias");
  mustInclude(findings, publicRoutes, '"/data-deletion": "/privacy#data-deletion-request"', "data_deletion_alias");
  mustInclude(findings, publicRoutes, '"/account-deletion"', "account_deletion_noindex_or_public_marker");

  return {
    summary: {
      checked_files: 5,
      findings_count: findings.length,
    },
    findings,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = collectArea15IosAppStoreAudit();
  if (process.argv.includes("--write")) {
    const outDir = join(repoRoot, "tmp");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "area15-ios-appstore-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}
