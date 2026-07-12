import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const orderSuccess = readFileSync(
  new URL("../src/internal-pages/OrderSuccess.jsx", import.meta.url),
  "utf8"
);
const postPurchaseRoadmap = readFileSync(
  new URL("../src/components/portal/PostPurchaseWhatNext.jsx", import.meta.url),
  "utf8"
);
const businessSetup = readFileSync(
  new URL("../src/internal-pages/BusinessSetup.jsx", import.meta.url),
  "utf8"
);
const credentialsSetup = readFileSync(
  new URL("../src/internal-pages/CredentialsSetup.jsx", import.meta.url),
  "utf8"
);
const credentialsWizard = readFileSync(
  new URL("../src/components/onboarding/CredentialsWizardHardened.jsx", import.meta.url),
  "utf8"
);
const actionPanel = readFileSync(
  new URL("../src/components/dashboard/ClientActionRequiredPanel.jsx", import.meta.url),
  "utf8"
);

test("post-purchase handoff requires setup before configuration claims", () => {
  assert.match(orderSuccess, /Complete Your Secure Setup/);
  assert.match(orderSuccess, /Configuration begins after you submit/);
  assert.match(orderSuccess, /result\?\.data \|\| result \|\| \{\}/);
  assert.match(orderSuccess, /session_id=\$\{encodeURIComponent\(sessionId\)\}/);
  assert.doesNotMatch(orderSuccess, /Your AI Brain is Deploying/);
  assert.doesNotMatch(orderSuccess, /setup complete in 4–6 hours/i);
  assert.doesNotMatch(orderSuccess, /Limited-Time Upgrade Offer/);
});

test("post-purchase roadmap starts with client setup and proof-gated launch", () => {
  assert.match(postPurchaseRoadmap, /Right now/);
  assert.match(postPurchaseRoadmap, /Complete Secure Setup/);
  assert.match(postPurchaseRoadmap, /Verification Tests Run/);
  assert.match(postPurchaseRoadmap, /Live Status Is Confirmed/);
  assert.doesNotMatch(postPurchaseRoadmap, /Onboarding Form Sent/);
  assert.doesNotMatch(postPurchaseRoadmap, /Within 48 hours/);
});

test("paid order setup is routed to the canonical credentials wizard", () => {
  assert.match(businessSetup, /if \(setupContext\.orderId\)/);
  assert.match(businessSetup, /Navigate to=\{`\/setup\/credentials\?\$\{next\.toString\(\)\}`\}/);
  assert.match(businessSetup, /must never ask a post-purchase client to choose a package again/);
});

test("dashboard setup actions open the exact required section", () => {
  assert.match(actionPanel, /setupUrl\(order, "business"\)/);
  assert.match(actionPanel, /setupUrl\(order, "booking"\)/);
  assert.match(actionPanel, /setupUrl\(order, "business-hours"\)/);
  assert.match(actionPanel, /ClientSurge Message Template Approval/);
  assert.match(actionPanel, /Request review/);
});

test("credentials setup supports deep links and explicit save-resume", () => {
  assert.match(credentialsSetup, /requestedSection/);
  assert.match(credentialsSetup, /initialSection=\{requestedSection\}/);
  assert.match(credentialsWizard, /SECTION_TARGETS/);
  assert.match(credentialsWizard, /setup-field-business-hours/);
  assert.match(credentialsWizard, /setup-field-booking-link/);
  assert.match(credentialsWizard, /Save & finish later/);
  assert.match(credentialsWizard, /saveClientCredentialsDraft/);
  assert.match(credentialsWizard, /Opened from your dashboard/);
});
