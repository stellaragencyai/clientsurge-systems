import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const indexSource = read("index.html");
const ga4Source = read("src/lib/ga4.js");
const analyticsSource = read("src/lib/analytics.js");
const checkoutObserverSource = read("src/lib/ga4CheckoutObserver.js");
const eventHelpersSource = read("src/utils/ga4Events.js");
const autoCtaSource = read("src/components/analytics/AutoCTAAnalytics.jsx");
const cookieConsentSource = read("src/components/landing/CookieConsent.jsx");
const publicFunctionSource = read("src/lib/publicFunctionClient.js");
const orderSuccessSource = read("src/internal-pages/OrderSuccess.jsx");
const configSchemaSource = read("base44/entities/GA4Configuration.jsonc");
const setupFunctionSource = read("base44/functions/setupGA4Configuration/entry.ts");
const setupHelperSource = read("base44/functions/_shared/ga4Configuration.ts");
const measurementProtocolSource = read("base44/functions/_shared/ga4MeasurementProtocol.js");
const stripeWebhookSource = read("base44/functions/stripeWebhookOrders/main.ts");
const verifyFunctionSource = read("base44/functions/verifyGA4Configuration/main.ts");
const adminSettingsPanelSource = read("src/components/admin/AdminSettingsPanel.jsx");
const adminSettingsApiSource = read("src/lib/adminSettingsApi.js");
const setupBundleSource = `${setupFunctionSource}\n${setupHelperSource}`;

test("GA4 private credentials cannot be persisted in GA4Configuration", () => {
  assert.doesNotMatch(configSchemaSource, /"api_secret"\s*:/);
  assert.match(configSchemaSource, /"server_side_tracking_enabled"\s*:/);
  assert.match(setupFunctionSource, /GA4_SECRET_MUST_USE_SECRET_STORE/);
  assert.match(setupBundleSource, /GA4_API_SECRET/);
  assert.doesNotMatch(setupBundleSource, /api_secret:\s*api_secret/);
  assert.match(measurementProtocolSource, /Deno\.env\.get\("GA4_API_SECRET"\)/);
  assert.doesNotMatch(measurementProtocolSource, /console\.(log|warn|error)\([^\n]*apiSecret/);
});

test("GA4 setup remains configured until live delivery is independently verified", () => {
  assert.match(setupBundleSource, /setup_status:\s*"configured"/);
  assert.match(setupBundleSource, /server_side_tracking_enabled:\s*false/);
  assert.match(setupBundleSource, /last_verified_at:\s*null/);
});

test("canonical GA4 key-event catalog is consistent", () => {
  for (const eventName of ["generate_lead", "begin_checkout", "purchase", "demo_booked"]) {
    assert.match(ga4Source, new RegExp(`\\b${eventName}\\b`));
    assert.match(configSchemaSource, new RegExp(`"${eventName}"`));
    assert.match(setupBundleSource, new RegExp(`"${eventName}"`));
  }

  assert.match(eventHelpersSource, /GA4_EVENTS\.GENERATE_LEAD/);
  assert.match(checkoutObserverSource, /GA4_EVENTS\.BEGIN_CHECKOUT/);
  assert.match(eventHelpersSource, /GA4_EVENTS\.PURCHASE/);
  assert.match(eventHelpersSource, /GA4_EVENTS\.DEMO_BOOKED/);
});

test("the static HTML cannot send analytics before consent is resolved", () => {
  assert.doesNotMatch(indexSource, /googletagmanager\.com\/gtag\/js\?id=/);
  assert.doesNotMatch(indexSource, /gtag\(['"]config['"]/);
  assert.match(indexSource, /GA4 is installed once by src\/lib\/ga4\.js after analytics consent state is known/);
  assert.match(ga4Source, /analytics_storage:\s*normalizedConsent\.analyticsGranted/);
  assert.match(ga4Source, /ad_storage:\s*normalizedConsent\.adsGranted/);
  assert.match(ga4Source, /send_page_view:\s*false/);
});

test("Essential + Stats grants analytics without granting advertising consent", () => {
  assert.match(cookieConsentSource, /safeSetCookieConsent\('analytics_only'\)/);
  assert.match(cookieConsentSource, /updateGa4Consent\(\{ analytics: true, ads: false \}\)/);
  assert.match(ga4Source, /storedValue === "accepted" \|\| storedValue === "analytics_only"/);
  assert.match(ga4Source, /adsGranted:\s*storedValue === "accepted"/);
  assert.match(ga4Source, /ad_user_data:/);
  assert.match(ga4Source, /ad_personalization:/);
});

test("failed or merely attempted forms cannot masquerade as successful submissions", () => {
  assert.match(ga4Source, /FORM_SUBMIT_ATTEMPT:\s*"form_submit_attempt"/);
  assert.match(ga4Source, /params\.submission_status !== "success"/);
  assert.match(eventHelpersSource, /submission_status:\s*"success"/);
});

test("React Router navigation sends explicit SPA page views", () => {
  assert.match(autoCtaSource, /trackGa4PageView\s*\(/);
  assert.match(autoCtaSource, /location\.pathname/);
  assert.match(autoCtaSource, /location\.search/);
  assert.match(autoCtaSource, /GA4_EVENTS\.PRICING_VIEW/);
  assert.match(autoCtaSource, /GA4_EVENTS\.CTA_CLICK/);
  assert.doesNotMatch(autoCtaSource, /cta_click_auto/);
});

test("GA4 initialization and event dispatch use one canonical helper", () => {
  assert.match(analyticsSource, /trackGa4Event/);
  assert.match(analyticsSource, /installGa4CheckoutObserver/);
  assert.match(ga4Source, /dataLayerConfig/);
  assert.match(ga4Source, /if \(!existingConfig\)/);
  assert.match(ga4Source, /if \(!existingScript\)/);
  assert.match(ga4Source, /EVENT_DEDUP_WINDOW_MS/);
});

test("contact outcomes emit lead events only after a successful backend response", () => {
  assert.match(publicFunctionSource, /if \(!response\.ok \|\| data\?\.success === false\)/);
  assert.match(publicFunctionSource, /trackSuccessfulPublicOutcome\(functionName, payload, data\)/);
  assert.match(publicFunctionSource, /trackSuccessfulFormSubmit/);
  assert.match(publicFunctionSource, /trackContactSubmit/);
  assert.match(publicFunctionSource, /trackLeadSubmit/);
});

test("audit requests are tracked as requests, not confirmed demo bookings", () => {
  assert.match(checkoutObserverSource, /scheduleDemoBooking/);
  assert.match(checkoutObserverSource, /data\?\.success === true/);
  assert.match(checkoutObserverSource, /GA4_EVENTS\.AUDIT_REQUEST_SUBMITTED/);
  assert.match(checkoutObserverSource, /GA4_EVENTS\.GENERATE_LEAD/);
  assert.doesNotMatch(checkoutObserverSource, /GA4_EVENTS\.DEMO_BOOKED/);
});

test("begin_checkout fires only after checkout session creation succeeds", () => {
  assert.match(checkoutObserverSource, /createCheckoutSession/);
  assert.match(checkoutObserverSource, /response\.ok/);
  assert.match(checkoutObserverSource, /checkoutUrl/);
  assert.match(checkoutObserverSource, /GA4_EVENTS\.BEGIN_CHECKOUT/);
  assert.doesNotMatch(eventHelpersSource, /trackEvent\(GA4_EVENTS\.BEGIN_CHECKOUT/);
});

test("purchase key events come from a verified, non-duplicate live Stripe webhook", () => {
  assert.match(stripeWebhookSource, /handleCanonicalStripeWebhook/);
  assert.match(stripeWebhookSource, /canonicalResult\?\.result\?\.success === true/);
  assert.match(stripeWebhookSource, /canonicalResult\?\.result\?\.duplicate !== true/);
  assert.match(stripeWebhookSource, /sendGa4PurchaseFromCheckoutSession/);
  assert.match(measurementProtocolSource, /session\?\.livemode !== true/);
  assert.match(measurementProtocolSource, /payment_status/);
  assert.match(measurementProtocolSource, /smoke_test/);
  assert.match(measurementProtocolSource, /duplicate_transaction/);
  assert.match(measurementProtocolSource, /name:\s*"purchase"/);
  assert.match(measurementProtocolSource, /transaction_id:/);
  assert.match(measurementProtocolSource, /server_verified:\s*true/);
});

test("browser purchase confirmation cannot double-count the purchase key event", () => {
  assert.match(orderSuccessSource, /if \(!orderInfo\?\.id\) return/);
  assert.match(orderSuccessSource, /clientsurge:ga4-purchase-fired:/);
  assert.match(orderSuccessSource, /trackEvent\("purchase"/);
  assert.match(orderSuccessSource, /transaction_id:/);
  assert.match(analyticsSource, /purchase_client_confirmation/);
  assert.match(configSchemaSource, /"purchase_client_confirmation"/);
});

test("final verification is the only path that can activate server-side GA4", () => {
  assert.match(verifyFunctionSource, /setup_status:\s*verified \? "active" : "configured"/);
  assert.match(verifyFunctionSource, /server_side_tracking_enabled:\s*verified/);
  assert.match(verifyFunctionSource, /last_verified_at:\s*verified \? now/);
  assert.match(verifyFunctionSource, /measurement_protocol_debug/);
  assert.match(verifyFunctionSource, /measurement_protocol_delivery/);
  assert.match(verifyFunctionSource, /production_site/);
  assert.match(verifyFunctionSource, /static_code_assertions/);
  assert.match(verifyFunctionSource, /failed_stage/);
});

test("Analytics settings UI runs repair and verification with explicit progress and retry", () => {
  assert.match(adminSettingsApiSource, /GA4_REPAIR_STAGES/);
  assert.match(adminSettingsApiSource, /setupGA4Configuration/);
  assert.match(adminSettingsApiSource, /verifyGA4Configuration/);
  assert.match(adminSettingsPanelSource, /Repair and verify GA4/);
  assert.match(adminSettingsPanelSource, /ga4Stage/);
  assert.match(adminSettingsPanelSource, /failed_checks/);
  assert.match(adminSettingsPanelSource, /Retry/);
  assert.match(adminSettingsPanelSource, /Verification ID/);
});
