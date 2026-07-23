import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));

const indexSource = read("index.html");
const appSource = read("src/App.jsx");
const ga4Source = read("src/lib/ga4.js");
const analyticsSource = read("src/lib/analytics.js");
const checkoutObserverSource = read("src/lib/ga4CheckoutObserver.js");
const eventHelpersSource = read("src/utils/ga4Events.js");
const autoCtaSource = read("src/components/analytics/AutoCTAAnalytics.jsx");
const cookieConsentSource = read("src/components/landing/CookieConsent.jsx");
const publicFunctionSource = read("src/lib/publicFunctionClient.js");
const orderSuccessSource = read("src/internal-pages/OrderSuccess.jsx");
const configSchemaSource = read("base44/entities/GA4Configuration.jsonc");
const setupFunctionSource = read("base44/functions/setupGA4Configuration/main.ts");
const measurementProtocolSource = read("base44/functions/_shared/ga4MeasurementProtocol.js");
const stripeWebhookSource = read("base44/functions/stripeWebhookOrders/main.ts");
const adminSettingsPanelSource = read("src/components/admin/AdminSettingsPanel.jsx");
const adminSettingsApiSource = read("src/lib/adminSettingsApi.js");

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} not found`);
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

test("GA4 private credentials cannot be persisted in GA4Configuration", () => {
  assert.doesNotMatch(configSchemaSource, /"api_secret"\s*:/);
  assert.match(configSchemaSource, /"server_side_tracking_enabled"\s*:/);
  assert.match(setupFunctionSource, /GA4_SECRET_MUST_USE_SECRET_STORE/);
  assert.match(setupFunctionSource, /Deno\.env\.get\("GA4_API_SECRET"\)/);
  assert.doesNotMatch(setupFunctionSource, /api_secret:\s*api_secret/);
  assert.match(measurementProtocolSource, /Deno\.env\.get\("GA4_API_SECRET"\)/);
  assert.doesNotMatch(measurementProtocolSource, /console\.(log|warn|error)\([^\n]*apiSecret/);
});

test("setupGA4Configuration is self-contained and verifyGA4Configuration is not required", () => {
  assert.doesNotMatch(setupFunctionSource, /from\s+["']\.\/shared\//);
  assert.doesNotMatch(setupFunctionSource, /from\s+["']\.\.\/_shared\//);
  assert.equal(exists("base44/functions/verifyGA4Configuration/function.jsonc"), false);
  assert.equal(exists("base44/functions/verifyGA4Configuration/main.ts"), false);
  assert.doesNotMatch(adminSettingsApiSource, /verifyGA4Configuration/);
});

test("GA4 setup repairs to configured state before final verification can activate", () => {
  assert.match(setupFunctionSource, /setup_status:\s*"configured"/);
  assert.match(setupFunctionSource, /server_side_tracking_enabled:\s*false/);
  assert.match(setupFunctionSource, /last_verified_at:\s*null/);
  assert.match(setupFunctionSource, /stage:\s*"entity_cleanup"/);
  assert.match(setupFunctionSource, /stage:\s*"final_activation"/);
  assert.match(setupFunctionSource, /setup_status:\s*"active"/);
  assert.match(setupFunctionSource, /server_side_tracking_enabled:\s*true/);
});

test("canonical GA4 key-event catalog is consistent", () => {
  for (const eventName of ["generate_lead", "begin_checkout", "purchase", "demo_booked"]) {
    assert.match(ga4Source, new RegExp(`\\b${eventName}\\b`));
    assert.match(configSchemaSource, new RegExp(`"${eventName}"`));
    assert.match(setupFunctionSource, new RegExp(`"${eventName}"`));
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
  assert.match(appSource, /GA4_EVENTS\.FORM_SUBMIT_ATTEMPT/);
  assert.doesNotMatch(appSource, /gtag\("event", "form_submit"/);
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

test("setupGA4Configuration performs final backend verification before activation", () => {
  assert.match(setupFunctionSource, /DEBUG_ENDPOINT/);
  assert.match(setupFunctionSource, /COLLECT_ENDPOINT/);
  assert.match(setupFunctionSource, /fetchProductionHealth/);
  assert.match(setupFunctionSource, /markConfigurationFailed/);
  assert.match(setupFunctionSource, /Verified through GA4 Measurement Protocol, production health check, and configuration integrity validation\./);
  assert.match(setupFunctionSource, /last_verified_at:\s*verifiedAt/);
});

test("GA4 cannot become active when the backend secret is missing", () => {
  assert.match(setupFunctionSource, /Deno\.env\.get\("GA4_API_SECRET"\)/);
  assert.match(setupFunctionSource, /failureBody\("secret_validation",\s*"GA4_API_SECRET missing"/);
  assert.match(setupFunctionSource, /markConfigurationFailed\(base44,\s*config,\s*"secret_validation"/);
  assert.match(setupFunctionSource, /setup_status:\s*"configured"/);
  assert.match(setupFunctionSource, /server_side_tracking_enabled:\s*false/);
});

test("failed production health check prevents activation", () => {
  assert.match(setupFunctionSource, /PRODUCTION_URL\s*=\s*"https:\/\/clientsurgesystems\.com"/);
  for (const term of ["available pages", "manages data types", "admin pages", "Base44 directory"]) {
    assert.ok(setupFunctionSource.includes(`label: "${term}"`), `${term} guard missing`);
  }
  assert.match(setupFunctionSource, /failureBody\("production_security",\s*"Production domain health check failed"/);
  assert.match(setupFunctionSource, /markConfigurationFailed\(base44,\s*config,\s*"production_security"/);
});

test("verification event cannot be confused with purchase conversion tracking", () => {
  const payloadBuilderSource = functionBody(setupFunctionSource, "buildVerificationPayload");
  assert.match(payloadBuilderSource, /client_id:\s*"clientsurge-verification"/);
  assert.match(payloadBuilderSource, /name:\s*"ga4_verification"/);
  assert.match(payloadBuilderSource, /source:\s*"clientsurge_admin_verification"/);
  assert.match(payloadBuilderSource, /environment:\s*"production"/);
  assert.doesNotMatch(payloadBuilderSource, /purchase/);
  assert.doesNotMatch(payloadBuilderSource, /email|phone|customer/i);
});

test("Analytics settings UI calls setup once with explicit progress and failure details", () => {
  assert.match(adminSettingsApiSource, /GA4_REPAIR_STAGES/);
  assert.match(adminSettingsApiSource, /setupGA4Configuration/);
  assert.doesNotMatch(adminSettingsApiSource, /runGa4FinalVerification/);
  for (const label of [
    "Repairing configuration...",
    "Checking secrets...",
    "Validating Google Analytics...",
    "Checking production...",
    "Finalizing...",
  ]) {
    assert.match(adminSettingsApiSource, new RegExp(label.replace(/[.]/g, "\\.")));
  }
  assert.match(adminSettingsPanelSource, /Repair and Verify GA4/);
  assert.match(adminSettingsPanelSource, /GA4 Fully Verified/);
  assert.match(adminSettingsPanelSource, /Failed Stage:/);
  assert.match(adminSettingsPanelSource, /Error:/);
  assert.match(adminSettingsPanelSource, /fetchGa4ConfigurationStatus/);
});
