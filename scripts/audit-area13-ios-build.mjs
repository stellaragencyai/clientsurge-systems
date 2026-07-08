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

function mustEqual(findings, actual, expected, label) {
  if (actual !== expected) findings.push(`mismatch:${label}:${String(actual)}!=${String(expected)}`);
}

function mustTruthy(findings, value, label) {
  if (!value) findings.push(`missing:${label}`);
}

function mustInclude(findings, source, needle, label) {
  if (!source.includes(needle)) findings.push(`missing:${label}`);
}

export function collectArea13IosBuildAudit() {
  const findings = [];
  const build = readJson("mobile/ios-build-readiness.json");
  const appStore = readJson("mobile/ios-app-store-readiness.json");
  const reviewNotes = read("docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md");
  const checklist = read("docs/IOS_TESTFLIGHT_BUILD_CHECKLIST.md");

  mustEqual(findings, build.platform, "ios", "ios_platform");
  mustEqual(findings, build.status, "pre_build_configuration", "build_status");
  mustEqual(findings, build.build_source.base44_app_id, "69dc4a79656fdba136d413d3", "base44_app_id");
  mustEqual(findings, build.build_source.github_merge_is_not_live_proof, true, "github_merge_not_live_proof");
  mustEqual(findings, build.build_source.requires_area_12_base44_publish_proof, true, "area12_publish_proof_required");
  mustEqual(findings, build.ios_identity.bundle_id, "com.clientsurgesystems.app", "bundle_id");
  mustEqual(findings, build.ios_identity.display_name, "ClientSurge Systems", "display_name");
  mustEqual(findings, build.ios_identity.sku, "clientsurge-systems-ios", "sku");
  mustTruthy(findings, build.ios_identity.apple_developer_team_id, "developer_team_status");
  mustTruthy(findings, build.ios_identity.signing_certificate_status, "signing_certificate_status");
  mustTruthy(findings, build.ios_identity.provisioning_profile_status, "provisioning_profile_status");
  mustEqual(findings, build.versioning.requires_unique_build_number_per_upload, true, "unique_build_number");
  mustEqual(findings, build.versioning.requires_web_commit_sha_in_release_notes, true, "commit_sha_in_release_notes");
  mustEqual(findings, build.versioning.requires_base44_publish_artifact_in_release_notes, true, "base44_artifact_in_release_notes");
  mustEqual(findings, build.app_shell.requires_login_session_persistence_test, true, "login_session_test");
  mustEqual(findings, build.app_shell.requires_logout_test, true, "logout_test");
  mustEqual(findings, build.app_shell.requires_offline_state_review, true, "offline_review");
  mustEqual(findings, build.assets.app_icon.required, true, "app_icon_required");
  mustEqual(findings, build.assets.splash_screen.required, true, "splash_required");
  mustEqual(findings, build.assets.screenshots.must_not_show_fake_metrics_or_unverified_testimonials, true, "truthful_screenshots");
  mustEqual(findings, build.testflight.internal_testing_required, true, "internal_testflight_required");
  mustEqual(findings, build.testflight.real_device_smoke_required, true, "real_device_smoke_required");
  mustTruthy(findings, build.testflight.required_smoke_paths.includes("account deletion path"), "account_deletion_smoke_path");
  mustTruthy(findings, build.testflight.required_smoke_paths.includes("product signup route"), "product_signup_smoke_path");
  mustEqual(findings, build.release_proof.testflight_build_id_required, true, "testflight_build_id_required");
  mustEqual(findings, build.release_proof.base44_publish_proof_required, true, "base44_publish_proof_required");
  mustEqual(findings, build.release_proof.web_commit_sha_required, true, "web_commit_sha_required");

  mustEqual(findings, appStore.platform, "ios", "area15_ios_file_still_present");
  mustInclude(findings, reviewNotes, "Build Identity", "review_notes_build_identity");
  mustInclude(findings, reviewNotes, "mobile/ios-build-readiness.json", "review_notes_build_file");
  mustInclude(findings, reviewNotes, "TestFlight build ID", "review_notes_testflight_id");
  mustInclude(findings, reviewNotes, "Base44 publish proof artifact", "review_notes_base44_artifact");
  mustInclude(findings, checklist, "Bundle ID: `com.clientsurgesystems.app`", "checklist_bundle_id");
  mustInclude(findings, checklist, "unique per TestFlight upload", "checklist_unique_build_number");
  mustInclude(findings, checklist, "Base44 publish proof artifact from Area 12", "checklist_area12_artifact");
  mustInclude(findings, checklist, "No unverified metrics, fake testimonials, or guaranteed revenue claims", "checklist_truthful_assets");

  return {
    summary: {
      checked_files: 4,
      findings_count: findings.length,
    },
    findings,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = collectArea13IosBuildAudit();
  if (process.argv.includes("--write")) {
    const outDir = join(repoRoot, "tmp");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "area13-ios-build-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}
