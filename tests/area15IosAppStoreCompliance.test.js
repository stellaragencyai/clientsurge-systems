import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { collectArea15IosAppStoreAudit } from "../scripts/audit-area15-ios-appstore.mjs";

const readiness = JSON.parse(readFileSync(new URL("../mobile/ios-app-store-readiness.json", import.meta.url), "utf8"));
const reviewNotes = readFileSync(new URL("../docs/IOS_APP_REVIEW_NOTES_TEMPLATE.md", import.meta.url), "utf8");
const legalPage = readFileSync(new URL("../src/internal-pages/LegalPage.jsx", import.meta.url), "utf8");
const deletionForm = readFileSync(new URL("../src/components/legal/DataDeletionRequestForm.jsx", import.meta.url), "utf8");
const publicRoutes = readFileSync(new URL("../src/lib/publicRouteMetadata.js", import.meta.url), "utf8");
const report = collectArea15IosAppStoreAudit();

test("Area 15 iOS readiness file captures App Store privacy review basics", () => {
  assert.equal(readiness.platform, "ios");
  assert.equal(readiness.status, "pre_testflight_readiness");
  assert.equal(readiness.privacy_policy_url, "https://clientsurgesystems.com/privacy");
  assert.equal(readiness.account_deletion_url, "https://clientsurgesystems.com/privacy#account-deletion");
  assert.equal(readiness.testflight.requires_demo_account_or_demo_mode, true);
  assert.equal(readiness.testflight.requires_live_backend_verification, true);
  assert.equal(readiness.app_review_notes.backend_status_proof, "requires_area_12_release_artifact");
});

test("Area 15 privacy label candidate does not understate linked user data", () => {
  assert.equal(readiness.privacy_label_candidate.data_used_to_track_user, false);
  for (const field of ["Name", "Email Address", "Phone Number", "Business Name", "Message Content", "App Account Identifiers"]) {
    assert.ok(readiness.privacy_label_candidate.data_linked_to_user.includes(field), `${field} should be listed as linked data`);
  }
  assert.ok(readiness.privacy_label_candidate.third_party_processors_to_review.includes("Stripe"));
  assert.ok(readiness.privacy_label_candidate.third_party_processors_to_review.includes("Twilio"));
  assert.ok(readiness.privacy_label_candidate.third_party_processors_to_review.includes("Resend"));
});

test("Area 15 account deletion is discoverable from privacy routes and form copy", () => {
  assert.match(legalPage, /id: "account-deletion"/);
  assert.match(legalPage, /Account and Data Deletion/);
  assert.match(legalPage, /id="data-deletion-request"/);
  assert.match(deletionForm, /Request Account or Data Deletion/);
  assert.match(deletionForm, /request_type: "account_and_data_deletion"/);
  assert.match(deletionForm, /aria-labelledby="account-deletion-form-title"/);
});

test("Area 15 account deletion aliases route to the privacy deletion section", () => {
  assert.match(publicRoutes, /"\/account-deletion": "\/privacy#account-deletion"/);
  assert.match(publicRoutes, /"\/delete-account": "\/privacy#account-deletion"/);
  assert.match(publicRoutes, /"\/data-deletion": "\/privacy#data-deletion-request"/);
  assert.match(publicRoutes, /"\/account-deletion"/);
  assert.match(publicRoutes, /"\/delete-account"/);
});

test("Area 15 review notes template covers Apple review blockers", () => {
  for (const phrase of [
    "Demo account or demo mode is active",
    "Backend services are live for review",
    "Account/data deletion path works",
    "No unverified testimonials",
    "Apple App Review Guidelines",
    "Apple App Privacy Details",
    "Apple TestFlight",
    "Apple Account Deletion Support",
  ]) {
    assert.match(reviewNotes, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Area 15 audit reports no findings", () => {
  assert.deepEqual(report.findings, []);
});
