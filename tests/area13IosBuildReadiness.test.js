import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { collectArea13IosBuildAudit } from "../scripts/audit-area13-ios-build.mjs";

const build = JSON.parse(readFileSync(new URL("../mobile/ios-build-readiness.json", import.meta.url), "utf8"));
const reviewNotes = readFileSync(new URL("../docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md", import.meta.url), "utf8");
const checklist = readFileSync(new URL("../docs/IOS_TESTFLIGHT_BUILD_CHECKLIST.md", import.meta.url), "utf8");
const report = collectArea13IosBuildAudit();

test("Area 13 iOS build manifest captures build identity", () => {
  assert.equal(build.platform, "ios");
  assert.equal(build.status, "pre_build_configuration");
  assert.equal(build.ios_identity.bundle_id, "com.clientsurgesystems.app");
  assert.equal(build.ios_identity.display_name, "ClientSurge Systems");
  assert.equal(build.ios_identity.sku, "clientsurge-systems-ios");
  assert.equal(build.versioning.marketing_version, "1.0.0");
});

test("Area 13 build manifest requires release proof and Base44 dependency evidence", () => {
  assert.equal(build.build_source.base44_app_id, "69dc4a79656fdba136d413d3");
  assert.equal(build.build_source.github_merge_is_not_live_proof, true);
  assert.equal(build.build_source.requires_area_12_base44_publish_proof, true);
  assert.equal(build.versioning.requires_unique_build_number_per_upload, true);
  assert.equal(build.versioning.requires_web_commit_sha_in_release_notes, true);
  assert.equal(build.versioning.requires_base44_publish_artifact_in_release_notes, true);
  assert.equal(build.release_proof.testflight_build_id_required, true);
  assert.equal(build.release_proof.base44_publish_proof_required, true);
});

test("Area 13 build manifest covers real-device TestFlight smoke paths", () => {
  assert.equal(build.testflight.internal_testing_required, true);
  assert.equal(build.testflight.real_device_smoke_required, true);
  for (const route of ["launch app", "login", "logout", "privacy policy link", "account deletion path", "client portal route", "pricing route", "product signup route", "poor connection or offline behavior"]) {
    assert.ok(build.testflight.required_smoke_paths.includes(route), `${route} should be a required smoke path`);
  }
});

test("Area 13 build manifest blocks untruthful App Store assets", () => {
  assert.equal(build.assets.app_icon.required, true);
  assert.equal(build.assets.splash_screen.required, true);
  assert.equal(build.assets.screenshots.required_for_app_store, true);
  assert.equal(build.assets.screenshots.must_match_actual_ios_experience, true);
  assert.equal(build.assets.screenshots.must_not_show_fake_metrics_or_unverified_testimonials, true);
});

test("Area 13 review notes and checklist reference build identity and proof fields", () => {
  assert.match(reviewNotes, /Build Identity/);
  assert.match(reviewNotes, /Bundle ID: `com\.clientsurgesystems\.app`/);
  assert.match(reviewNotes, /iOS build number/);
  assert.match(reviewNotes, /TestFlight build ID/);
  assert.match(reviewNotes, /mobile\/ios-build-readiness\.json/);
  assert.match(checklist, /Base44 publish proof artifact from Area 12/);
  assert.match(checklist, /unique per TestFlight upload/);
  assert.match(checklist, /No unverified metrics, fake testimonials, or guaranteed revenue claims/);
});

test("Area 13 audit reports no findings", () => {
  assert.deepEqual(report.findings, []);
});
